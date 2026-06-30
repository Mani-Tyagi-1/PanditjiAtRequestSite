import { RequestHandler } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import ShopifyOrder from "../../model/userApp/shopifyOrderModel";
import ShopifyProduct from "../../model/userApp/shopifyProductModel";
import { sendWhatsappTemplateMessage, sendWhatsappMessage } from "../../utils/whatsapp";

const isProduction = process.env.PAYMENT_MODE === "production";
const razorpayKeyId = isProduction
  ? process.env.RAZORPAY_KEY_ID_LIVE
  : process.env.RAZORPAY_KEY_ID_TEST;
const razorpayKeySecret = isProduction
  ? process.env.RAZORPAY_KEY_SECRET_LIVE
  : process.env.RAZORPAY_KEY_SECRET_TEST;

let razorpay: Razorpay;
if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
}

const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  if (!razorpayKeySecret) return false;
  const hmac = crypto.createHmac("sha256", razorpayKeySecret);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest("hex") === signature;
};

// Promotional config
const GIFT_WRAP_CHARGE = 49; // flat ₹49 add-on
const FIRST_ORDER_DISCOUNT_PERCENT = 10; // 10% off the items subtotal
const PREPAID_DISCOUNT_PERCENT = 5; // extra 5% reward for paying online (vs COD)

// COD config — read fresh per request so it can be toggled without redeploy.
// COD is ON unless COD_AVAILABLE is explicitly "false".
const isCodAvailable = () => process.env.COD_AVAILABLE !== "false";
const getCodMinimum = () => Math.max(0, Number(process.env.MINIMUM_COD_AMOUNT) || 0);

// Fire-and-forget WhatsApp confirmation for both prepaid & COD shop orders.
// Mirrors the chadhava/pooja flow: `pjar_order` template with a plain-text fallback.
const sendShopifyOrderConfirmationWhatsapp = async (order: any) => {
  try {
    const rawPhone = String(order?.phone || "");
    const cleanedPhone = rawPhone.replace(/\D/g, "");
    if (cleanedPhone.length < 10) return;
    const phone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

    const customerName = order?.customerName || "Customer";
    const isCod = order?.paymentMethod === "cod";
    const amount = Number(order?.totalAmount || 0);

    // Summarise the items ordered, e.g. "5-Mukhi Rudraksha x2, Tulsi Mala x1"
    const items: any[] = Array.isArray(order?.items) ? order.items : [];
    const itemSummary = items
      .map((i) => `${i.title}${Number(i.qty) > 1 ? ` x${i.qty}` : ""}`)
      .join(", ");

    const orderId = order?.razorpayOrderId || String(order?._id || "");

    // Explicit payment status: prepaid is settled ("Paid"), COD is collected on
    // delivery ("Pending"). This is what differentiates the two confirmations.
    const paymentStatusText = isCod ? "Pending (Cash on Delivery)" : "Paid";

    // Params kept short & single-line so WhatsApp shows the full message inline
    // (long bodies get collapsed behind a "Read more" toggle).
    // {{2}} — status (varies by payment method)
    const param2 = isCod
      ? `Order placed! 🛍️ Keep cash ready — pay on delivery. 🚚`
      : `Payment received — your order is confirmed! 🛍️🙏`;
    // {{3}} — items + amount + payment status (single line; no "\n"/tab — WhatsApp rule #132018)
    const amountStr = `₹${amount.toLocaleString("en-IN")}`;
    const param3 = itemSummary
      ? `${itemSummary} · Amount: ${amountStr} · Payment: ${paymentStatusText}`
      : `Amount: ${amountStr} · Payment: ${paymentStatusText}`;
    // {{4}} — order reference
    const param4 = `Order ID: ${orderId}`;

    // "Check Now" button → https://play.google.com/store/apps/details?id=com.panditJiAtReqapp
    const buttonParam = "apps/details?id=com.panditJiAtReqapp";

    let sent = false;
    try {
      await sendWhatsappTemplateMessage({
        to: phone,
        templateName: "pjar_order",
        parameters: [customerName, param2, param3, param4],
        buttonUrlParam: buttonParam,
        languageCode: "en",
      });
      console.log(`✅ [ShopifyOrder] WhatsApp pjar_order sent to ${phone}`);
      sent = true;
    } catch (err: any) {
      console.warn(`[ShopifyOrder] Template send failed:`, err?.response?.data || err.message);
    }

    // Plain-text fallback if the template send fails
    if (!sent) {
      try {
        const fallbackMsg = `Namaste ${customerName} ji 🙏 ${param2} ${param3}. ${param4}.`;
        await sendWhatsappMessage({ to: phone, message: fallbackMsg });
        console.log(`✅ [ShopifyOrder] WhatsApp plain text confirmation sent to ${phone}`);
      } catch (textErr: any) {
        console.error(`❌ [ShopifyOrder] WhatsApp fallback text failed:`, textErr?.response?.data || textErr.message);
      }
    }
  } catch (e: any) {
    console.error("❌ [ShopifyOrder] WhatsApp confirmation flow failed entirely:", e?.response?.data || e?.message || e);
  }
};

// Sends the confirmation WhatsApp exactly once for an order, no matter which
// path reaches it first (client verify / Razorpay webhook / COD create). Without
// this guard, whichever path flips the order to "paid" second silently skips the
// message — the bug behind "no prepaid confirmation".
const sendOrderConfirmationOnce = async (order: any) => {
  try {
    if (!order || order.confirmationSent) return;
    await sendShopifyOrderConfirmationWhatsapp(order);
    order.confirmationSent = true;
    await order.save();
  } catch (e: any) {
    console.error("❌ [ShopifyOrder] confirmation-once failed:", e?.message || e);
  }
};

// GET /shopify-orders/cod-config — server source of truth for the COD button
export const getShopifyCodConfig: RequestHandler = async (_req, res) => {
  res.status(200).json({
    success: true,
    available: isCodAvailable(),
    minimum: getCodMinimum(),
  });
};

// A user is "first order" eligible if they have no previously PAID shopify order.
// Matched by phone (last 10 digits) and, when available, by userId.
const hasPaidOrder = async (phone: string, userId?: string) => {
  const cleanPhone = String(phone).replace(/\D/g, "");
  const alias10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
  const or: any[] = [
    { phone: cleanPhone },
    { phone: alias10 },
    { phone: { $regex: alias10 + "$" } },
  ];
  if (userId) or.push({ user: userId });

  const count = await ShopifyOrder.countDocuments({
    paymentStatus: "paid",
    $or: or,
  });
  return count > 0;
};

// GET /shopify-orders/first-order-eligibility/:phone — UI hint for the 10% first-order offer
export const checkFirstOrderEligibility: RequestHandler = async (req, res) => {
  try {
    const { phone } = req.params;
    const { userId } = req.query;
    if (!phone) {
      res.status(400).json({ success: false, message: "Phone number is required" });
      return;
    }

    const paid = await hasPaidOrder(String(phone), userId ? String(userId) : undefined);
    res.status(200).json({
      success: true,
      eligible: !paid,
      discountPercent: FIRST_ORDER_DISCOUNT_PERCENT,
    });
  } catch (error) {
    console.error("Failed to check first-order eligibility:", error);
    res.status(500).json({ success: false, message: "Failed to check eligibility" });
  }
};

// POST /shopify-orders/create-order — Creates pending shopify order and Razorpay order
export const createShopifyOrder: RequestHandler = async (req, res) => {
  try {
    const {
      items,
      customerName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      userId,
      giftWrap,
      giftRecipientName,
      giftMessage,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "No items provided" });
      return;
    }
    if (!customerName || !phone || !addressLine || !city || !state || !pincode) {
      res.status(400).json({
        success: false,
        message: "customerName, phone, addressLine, city, state and pincode are required",
      });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      res.status(400).json({ success: false, message: "A valid 10-digit phone number is required" });
      return;
    }

    const wantsGiftWrap = Boolean(giftWrap);
    const cleanRecipient = String(giftRecipientName || "").trim();
    if (wantsGiftWrap && !cleanRecipient) {
      res.status(400).json({
        success: false,
        message: "Recipient name is required for gift wrapping",
      });
      return;
    }

    // Resolve items against DB catalog to prevent client tampering
    const productIds = items.map((i: any) => i.shopifyProductId);
    const dbProducts = await ShopifyProduct.find({ shopifyProductId: { $in: productIds } });
    const productMap = new Map(dbProducts.map((p) => [p.shopifyProductId, p]));

    let calculatedTotal = 0;
    const resolvedItems = items.map((i: any) => {
      const dbProduct = productMap.get(i.shopifyProductId);
      if (!dbProduct) {
        throw new Error(`Product ${i.title} is no longer available`);
      }

      const price = Number(dbProduct.priceRangeV2?.minVariantPrice?.amount || 0);
      const qty = Math.max(1, Number(i.qty) || 1);
      calculatedTotal += price * qty;

      return {
        shopifyProductId: dbProduct.shopifyProductId,
        variantId: i.variantId || "",
        title: dbProduct.title,
        handle: dbProduct.handle,
        price,
        qty,
        image: dbProduct.featuredImage?.url || "",
      };
    });

    if (calculatedTotal <= 0) {
      res.status(400).json({ success: false, message: "Invalid order amount" });
      return;
    }

    if (!razorpay) {
      res.status(500).json({ success: false, message: "Razorpay credentials not configured" });
      return;
    }

    // Re-validate the first-order discount server-side to prevent tampering.
    const subtotal = calculatedTotal;
    const eligibleForFirstOrder = !(await hasPaidOrder(cleanPhone, userId));
    const discountAmount = eligibleForFirstOrder
      ? Math.round((subtotal * FIRST_ORDER_DISCOUNT_PERCENT) / 100)
      : 0;
    // Online payments get an extra prepaid reward (COD does not — see createCodShopifyOrder)
    const prepaidDiscount = Math.round((subtotal * PREPAID_DISCOUNT_PERCENT) / 100);
    const giftWrapCharge = wantsGiftWrap ? GIFT_WRAP_CHARGE : 0;
    const finalTotal = Math.max(1, subtotal - discountAmount - prepaidDiscount + giftWrapCharge);

    const orderOptions = {
      amount: finalTotal * 100, // amount in paisa
      currency: "INR",
      receipt: `shopify_${Date.now()}`,
      payment_capture: 1,
      notes: {
        customerName,
        phone: cleanPhone,
        service: "ShopifyProduct",
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    const orderObj = await ShopifyOrder.create({
      user: userId || undefined,
      items: resolvedItems,
      subtotal,
      discountAmount,
      prepaidDiscount,
      giftWrap: wantsGiftWrap,
      giftWrapCharge,
      giftRecipientName: wantsGiftWrap ? cleanRecipient : undefined,
      giftMessage: wantsGiftWrap ? String(giftMessage || "").trim() : undefined,
      totalAmount: finalTotal,
      customerName: String(customerName).trim(),
      phone: cleanPhone,
      addressLine: String(addressLine).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: String(pincode).trim(),
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      status: "pending",
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(201).json({
      success: true,
      message: "Order initialized successfully",
      bookingId: orderObj._id,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId,
      amount: finalTotal,
      breakdown: {
        subtotal,
        discountAmount,
        prepaidDiscount,
        giftWrapCharge,
        total: finalTotal,
        firstOrderDiscountApplied: discountAmount > 0,
      },
      currency: "INR",
    });
  } catch (error: any) {
    console.error("Failed to create Shopify order:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create order" });
  }
};

// POST /shopify-orders/cod — Places a Cash-on-Delivery order (no Razorpay, no prepaid reward)
export const createCodShopifyOrder: RequestHandler = async (req, res) => {
  try {
    if (!isCodAvailable()) {
      res.status(403).json({
        success: false,
        code: "COD_UNAVAILABLE",
        message: "Cash on Delivery is currently unavailable. Please pay online.",
      });
      return;
    }

    const {
      items,
      customerName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      userId,
      giftWrap,
      giftRecipientName,
      giftMessage,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "No items provided" });
      return;
    }
    // COD has no online fallback, so a complete delivery address is mandatory
    if (!customerName || !phone || !addressLine || !city || !state || !pincode) {
      res.status(400).json({
        success: false,
        message: "customerName, phone, addressLine, city, state and pincode are required",
      });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      res.status(400).json({ success: false, message: "A valid 10-digit phone number is required" });
      return;
    }

    const wantsGiftWrap = Boolean(giftWrap);
    const cleanRecipient = String(giftRecipientName || "").trim();
    if (wantsGiftWrap && !cleanRecipient) {
      res.status(400).json({
        success: false,
        message: "Recipient name is required for gift wrapping",
      });
      return;
    }

    // Resolve items against DB catalog to prevent client tampering
    const productIds = items.map((i: any) => i.shopifyProductId);
    const dbProducts = await ShopifyProduct.find({ shopifyProductId: { $in: productIds } });
    const productMap = new Map(dbProducts.map((p) => [p.shopifyProductId, p]));

    let calculatedTotal = 0;
    const resolvedItems = items.map((i: any) => {
      const dbProduct = productMap.get(i.shopifyProductId);
      if (!dbProduct) {
        throw new Error(`Product ${i.title} is no longer available`);
      }
      const price = Number(dbProduct.priceRangeV2?.minVariantPrice?.amount || 0);
      const qty = Math.max(1, Number(i.qty) || 1);
      calculatedTotal += price * qty;
      return {
        shopifyProductId: dbProduct.shopifyProductId,
        variantId: i.variantId || "",
        title: dbProduct.title,
        handle: dbProduct.handle,
        price,
        qty,
        image: dbProduct.featuredImage?.url || "",
      };
    });

    if (calculatedTotal <= 0) {
      res.status(400).json({ success: false, message: "Invalid order amount" });
      return;
    }

    // Server-authoritative money math. COD keeps the first-order discount but
    // forgoes the prepaid reward (that's the incentive to pay online).
    const subtotal = calculatedTotal;
    const eligibleForFirstOrder = !(await hasPaidOrder(cleanPhone, userId));
    const discountAmount = eligibleForFirstOrder
      ? Math.round((subtotal * FIRST_ORDER_DISCOUNT_PERCENT) / 100)
      : 0;
    const giftWrapCharge = wantsGiftWrap ? GIFT_WRAP_CHARGE : 0;
    const finalTotal = Math.max(1, subtotal - discountAmount + giftWrapCharge);

    const minimum = getCodMinimum();
    if (finalTotal < minimum) {
      res.status(400).json({
        success: false,
        code: "BELOW_COD_MINIMUM",
        message: `Cash on Delivery is available on orders of ₹${minimum} or more.`,
        minimum,
      });
      return;
    }

    const orderObj = await ShopifyOrder.create({
      user: userId || undefined,
      items: resolvedItems,
      subtotal,
      discountAmount,
      prepaidDiscount: 0,
      giftWrap: wantsGiftWrap,
      giftWrapCharge,
      giftRecipientName: wantsGiftWrap ? cleanRecipient : undefined,
      giftMessage: wantsGiftWrap ? String(giftMessage || "").trim() : undefined,
      totalAmount: finalTotal,
      customerName: String(customerName).trim(),
      phone: cleanPhone,
      addressLine: String(addressLine).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: String(pincode).trim(),
      paymentMethod: "cod",
      paymentStatus: "pending",
      status: "confirmed",
    });

    // Fire-and-forget order confirmation on WhatsApp (exactly once)
    void sendOrderConfirmationOnce(orderObj);

    res.status(201).json({
      success: true,
      message: "Order placed successfully. Pay in cash on delivery.",
      bookingId: orderObj._id,
      amount: finalTotal,
      breakdown: {
        subtotal,
        discountAmount,
        prepaidDiscount: 0,
        giftWrapCharge,
        total: finalTotal,
        firstOrderDiscountApplied: discountAmount > 0,
      },
    });
  } catch (error: any) {
    console.error("Failed to create COD shopify order:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to place order" });
  }
};

// POST /shopify-orders/complete-payment — Verifies Razorpay payment signature
export const completeShopifyOrderPayment: RequestHandler = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({
        success: false,
        message: "All payment validation parameters are required",
      });
      return;
    }

    const order = await ShopifyOrder.findById(bookingId);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (order.paymentStatus === "paid") {
      // Already paid (e.g. the webhook won the race) — still ensure the
      // confirmation went out. sendOrderConfirmationOnce is idempotent.
      void sendOrderConfirmationOnce(order);
      res.status(200).json({ success: true, message: "Payment already verified", data: order });
      return;
    }

    if (order.razorpayOrderId !== razorpayOrderId) {
      res.status(400).json({ success: false, message: "Razorpay order ID mismatch" });
      return;
    }

    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      order.paymentStatus = "failed";
      await order.save();
      res.status(400).json({ success: false, message: "Invalid payment signature" });
      return;
    }

    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    await order.save();

    // Fire-and-forget order confirmation on WhatsApp (exactly once)
    void sendOrderConfirmationOnce(order);

    res.status(200).json({
      success: true,
      message: "Payment verified and order confirmed successfully",
      data: order,
    });
  } catch (error) {
    console.error("Failed to verify payment:", error);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};

// POST /shopify-orders/webhook — Razorpay reconciliation (raw body).
// Safety net for prepaid orders: if the browser never completes the verify call
// (popup closed / network drop after payment), this server-side path still marks
// the order paid and sends the confirmation WhatsApp.
export const shopifyOrderWebhook: RequestHandler = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      // Not configured — acknowledge so Razorpay stops retrying.
      res.status(200).json({ success: true, message: "Webhook not configured" });
      return;
    }

    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!signature || !rawBody) {
      res.status(400).json({ success: false, message: "Missing webhook signature/body" });
      return;
    }

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expected !== signature) {
      res.status(400).json({ success: false, message: "Invalid webhook signature" });
      return;
    }

    const event = JSON.parse(rawBody.toString());
    const paymentEntity = event?.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;

    if (orderId) {
      const order = await ShopifyOrder.findOne({ razorpayOrderId: orderId });
      // Only reconcile if the client never verified (idempotent).
      if (order && order.paymentStatus !== "paid") {
        if (event.event === "payment.captured") {
          order.paymentStatus = "paid";
          order.status = "confirmed";
          order.razorpayPaymentId = paymentEntity.id;
          await order.save();
          // Confirmation WhatsApp via reconciliation path (exactly once).
          void sendOrderConfirmationOnce(order);
        } else if (event.event === "payment.failed") {
          order.paymentStatus = "failed";
          await order.save();
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Shopify order webhook error:", error);
    res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};

// GET /shopify-orders/user/:phone — Fetches shopify orders for a specific user phone number
export const getUserShopifyOrders: RequestHandler = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      res.status(400).json({ success: false, message: "Phone number is required" });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    const alias10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    const orders = await ShopifyOrder.find({
      $or: [
        { phone: cleanPhone },
        { phone: alias10 },
        { phone: { $regex: alias10 + "$" } },
      ],
    }).sort({ addedOn: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Failed to fetch user shopify orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user shopify orders" });
  }
};
