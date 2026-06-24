import { RequestHandler } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import ShopifyOrder from "../../model/userApp/shopifyOrderModel";
import ShopifyProduct from "../../model/userApp/shopifyProductModel";

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
    const giftWrapCharge = wantsGiftWrap ? GIFT_WRAP_CHARGE : 0;
    const finalTotal = Math.max(1, subtotal - discountAmount + giftWrapCharge);

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
