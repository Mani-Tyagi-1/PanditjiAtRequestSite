import { RequestHandler } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Chadhava, { IChadhava } from "../../model/userApp/chadhavaModel";
import ChadhavaBooking, { IChadhavaSelection } from "../../model/userApp/chadhavaBookingModel";

// Shape a DB doc to the frontend `Chadhava` interface (id = slug).
const toClientShape = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj.slug };
};

// ── Razorpay setup (mirrors paidConsultationController) ──
const isProduction = process.env.PAYMENT_MODE === "production";
const razorpayKeyId = isProduction
  ? process.env.RAZORPAY_KEY_ID_LIVE
  : process.env.RAZORPAY_KEY_ID_TEST;
const razorpayKeySecret = isProduction
  ? process.env.RAZORPAY_KEY_SECRET_LIVE
  : process.env.RAZORPAY_KEY_SECRET_TEST;

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error("Razorpay credentials are missing. Check env vars.");
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  const hmac = crypto.createHmac("sha256", razorpayKeySecret as string);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest("hex") === signature;
};

type SelectionInput = { code?: string; quantity?: number };
type QuoteInput = {
  items?: SelectionInput[];
  addPrasadBox?: boolean;
};

type ResolvedPricing = {
  selections: IChadhavaSelection[];
  prasadBoxPrice: number;
  itemsTotal: number;
  prasadTotal: number;
  grandTotal: number;
};

// Resolve prices from the DB document — never trust client-sent amounts.
const resolvePricing = (
  chadhava: IChadhava,
  { items, addPrasadBox }: QuoteInput
): ResolvedPricing | { error: string } => {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Please select at least one seva" };
  }

  // Flatten all active items for code lookup.
  const catalog = new Map<string, IChadhava["sections"][number]["items"][number]>();
  for (const section of chadhava.sections) {
    for (const item of section.items) {
      if (item.isActive) catalog.set(item.code, item);
    }
  }

  const selections: IChadhavaSelection[] = [];
  for (const sel of items) {
    const item = sel.code ? catalog.get(sel.code) : undefined;
    if (!item) return { error: `Seva "${sel.code}" is not available` };

    const qty = Math.floor(Number(sel.quantity) || 0);
    if (qty < 1) continue;
    if (qty > item.maxQuantity) {
      return { error: `Maximum ${item.maxQuantity} allowed for ${item.itemName}` };
    }

    selections.push({
      code: item.code,
      name: item.itemName,
      unitPrice: item.itemPrice,
      quantity: qty,
      lineTotal: item.itemPrice * qty,
    });
  }

  if (selections.length === 0) return { error: "Please select at least one seva" };

  const itemsTotal = selections.reduce((sum, s) => sum + s.lineTotal, 0);
  const prasadBoxPrice = addPrasadBox && chadhava.prasad?.enabled ? chadhava.prasad.price : 0;

  return {
    selections,
    prasadBoxPrice,
    itemsTotal,
    prasadTotal: prasadBoxPrice,
    grandTotal: itemsTotal + prasadBoxPrice,
  };
};

// GET /chadhavas — active catalog for the cards
export const getChadhavas: RequestHandler = async (_req, res) => {
  try {
    const list = await Chadhava.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: 1,
    });
    res.status(200).json({ success: true, data: list.map(toClientShape) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch chadhavas" });
  }
};

// GET /chadhavas/:slug — fetch single chadhava details
export const getChadhavaBySlug: RequestHandler = async (req, res) => {
  try {
    const { slug } = req.params;
    const chadhava = await Chadhava.findOne({ slug, isActive: true });
    if (!chadhava) {
      res.status(404).json({ success: false, message: "Chadhava not found" });
      return;
    }
    res.status(200).json({ success: true, data: toClientShape(chadhava) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch chadhava details" });
  }
};

// POST /chadhavas/:slug/quote — authoritative total computed from the DB
export const getChadhavaQuote: RequestHandler = async (req, res) => {
  try {
    const { slug } = req.params;
    const chadhava = await Chadhava.findOne({ slug, isActive: true });
    if (!chadhava) {
      res.status(404).json({ success: false, message: "Chadhava not found" });
      return;
    }

    const pricing = resolvePricing(chadhava, req.body || {});
    if ("error" in pricing) {
      res.status(400).json({ success: false, message: pricing.error });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        selections: pricing.selections,
        itemsTotal: pricing.itemsTotal,
        prasadTotal: pricing.prasadTotal,
        grandTotal: pricing.grandTotal,
        currency: "INR",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to calculate quote" });
  }
};

// POST /chadhava-bookings/create-order — pending booking + Razorpay order
export const createChadhavaOrder: RequestHandler = async (req, res) => {
  try {
    const { chadhavaSlug, items, addPrasadBox, devoteeName, gotra, phone, wish } = req.body;

    if (!chadhavaSlug || !devoteeName || !phone) {
      res.status(400).json({
        success: false,
        message: "chadhavaSlug, devoteeName and phone are required",
      });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      res.status(400).json({ success: false, message: "A valid 10-digit phone number is required" });
      return;
    }

    const chadhava = await Chadhava.findOne({ slug: chadhavaSlug, isActive: true });
    if (!chadhava) {
      res.status(404).json({ success: false, message: "Chadhava not found" });
      return;
    }

    const pricing = resolvePricing(chadhava, { items, addPrasadBox });
    if ("error" in pricing) {
      res.status(400).json({ success: false, message: pricing.error });
      return;
    }

    const orderOptions: any = {
      amount: pricing.grandTotal * 100,
      currency: "INR",
      receipt: `chadhava_${Date.now()}`,
      payment_capture: 1,
      notes: {
        chadhavaSlug,
        deity: chadhava.deity,
        devoteeName,
        service: "Chadhava",
      },
    };

    const order: any = await razorpay.orders.create(orderOptions);

    const booking = await ChadhavaBooking.create({
      chadhavaSlug,
      deity: chadhava.deity,
      templeName: chadhava.templeName,
      selections: pricing.selections,
      addPrasadBox: !!addPrasadBox && !!chadhava.prasad?.enabled,
      prasadBoxPrice: pricing.prasadBoxPrice,
      itemsTotal: pricing.itemsTotal,
      totalAmount: pricing.grandTotal,
      devoteeName,
      gotra,
      phone: cleanPhone,
      wish,
      status: "pending",
      paymentStatus: "pending",
      razorpayOrderId: order.id,
      isFromSite: true,
    });

    res.status(201).json({
      success: true,
      message: "Chadhava order created",
      bookingId: booking._id,
      razorpayOrderId: order.id,
      razorpayKeyId,
      amount: pricing.grandTotal,
      currency: "INR",
    });
  } catch (error) {
    console.error("Failed to create chadhava order:", error);
    res.status(500).json({ success: false, message: "Failed to create chadhava order" });
  }
};

// POST /chadhava-bookings/complete-payment — verify signature & confirm
export const completeChadhavaPayment: RequestHandler = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({
        success: false,
        message: "Payment verification fields are required",
      });
      return;
    }

    const booking = await ChadhavaBooking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    // Idempotent: a verified booking returns success without re-charging state.
    if (booking.paymentStatus === "paid") {
      res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: booking,
      });
      return;
    }

    if (booking.razorpayOrderId !== razorpayOrderId) {
      res.status(400).json({ success: false, message: "Razorpay order mismatch" });
      return;
    }

    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      booking.paymentStatus = "failed";
      await booking.save();
      res.status(400).json({ success: false, message: "Invalid payment signature" });
      return;
    }

    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    booking.razorpayPaymentId = razorpayPaymentId;
    booking.razorpaySignature = razorpaySignature;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Chadhava payment verified",
      data: booking,
    });
  } catch (error) {
    console.error("Failed to complete chadhava payment:", error);
    res.status(500).json({ success: false, message: "Failed to verify chadhava payment" });
  }
};

// POST /chadhava-bookings/webhook — Razorpay reconciliation (raw body)
export const chadhavaWebhook: RequestHandler = async (req, res) => {
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
      const booking = await ChadhavaBooking.findOne({ razorpayOrderId: orderId });
      // Only reconcile if the client never verified (idempotent).
      if (booking && booking.paymentStatus !== "paid") {
        if (event.event === "payment.captured") {
          booking.paymentStatus = "paid";
          booking.status = "confirmed";
          booking.razorpayPaymentId = paymentEntity.id;
          await booking.save();
        } else if (event.event === "payment.failed") {
          booking.paymentStatus = "failed";
          await booking.save();
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Chadhava webhook error:", error);
    res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};

// GET /chadhava-bookings — admin list
export const getChadhavaBookings: RequestHandler = async (_req, res) => {
  try {
    const bookings = await ChadhavaBooking.find().sort({ addedOn: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch chadhava bookings" });
  }
};
