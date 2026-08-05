import { RequestHandler } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import LiveMandirPuja from "../../model/userApp/liveMandirPujaModel";
import LiveMandirBooking from "../../model/userApp/liveMandirBookingModel";
import User from "../../model/userApp/userModel";
import pendingPoojaBookingModel from "../../model/poojaBooking/pendingPoojaBooking.model";
import poojaBookingModel from "../../model/poojaBooking/poojaBooking.model";
import Pooja from "../../model/userApp/poojaModel";
import { sendMetaPurchaseEvent } from "../../utils/metaCapiServices";
import { sendPjarOrderToPartnerAffiliate } from "../../utils/partnerAffiliateCommission";
import { sendBookingEmailFor } from "../../utils/sendBookingEmail";
import { resolveUser } from "../../utils/resolveUser";

// ── Razorpay setup ──
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
  const generatedSignature = hmac.digest("hex");
  return generatedSignature === signature;
};

// Shape a DB doc to the frontend `LiveMandirPuja` interface (id = slug).
const toClientShape = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj.slug };
};

// GET /live-mandir-pujas — active catalog for the cards
export const getLivePujas: RequestHandler = async (_req, res) => {
  try {
    const pujas = await LiveMandirPuja.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: 1,
    });
    res.status(200).json({ success: true, data: pujas.map(toClientShape) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch live pujas" });
  }
};

// GET /live-mandir-pujas/:slug — fetch single live puja details
export const getLivePujaBySlug: RequestHandler = async (req, res) => {
  try {
    const { slug } = req.params;
    const puja = await LiveMandirPuja.findOne({ slug, isActive: true });
    if (!puja) {
      res.status(404).json({ success: false, message: "Live puja not found" });
      return;
    }
    res.status(200).json({ success: true, data: toClientShape(puja) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch live puja details" });
  }
};

// POST /live-mandir-bookings — create a booking
export const createLiveBooking: RequestHandler = async (req, res) => {
  try {
    const {
      pujaSlug,
      pujaName,
      templeName,
      packageId,
      packageName,
      amount,
      devoteeName,
      gotra,
      members,
      phone,
      wish,
    } = req.body;

    if (!pujaSlug || !devoteeName || !phone || amount == null) {
      res.status(400).json({
        success: false,
        message: "pujaSlug, devoteeName, phone and amount are required",
      });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, "");

    // Find or create the devotee.
    //
    // Was: reject anything that is not exactly 10 digits, then 404 if no such
    // user exists. Both failed a first-time devotee abroad — their number is
    // not ten digits, and they have no account yet because there is no
    // international OTP to have made one with. The shared resolver searches the
    // whole collection by phone AND email before creating, so a returning
    // devotee is matched rather than duplicated.
    const resolved = await resolveUser({
      phone: cleanPhone,
      dialCode: (req.body as any).dialCode,
      email: (req.body as any).emailId || (req.body as any).email,
      name: devoteeName,
      gotra: (req.body as any).gotra,
      countryCode: (req.body as any).countryCode,
      country: (req.body as any).country,
    });
    if (!resolved) {
      res.status(400).json({
        success: false,
        message: "A valid phone number or email address is required",
      });
      return;
    }
    const user = resolved.user;

    // Find Pooja
    let pooja = await Pooja.findOne({ poojaID: pujaSlug });
    if (!pooja) {
      pooja = await Pooja.findOne({ poojaNameEng: pujaName });
    }
    if (!pooja) {
      pooja = await Pooja.findOne();
    }
    if (!pooja) {
      res.status(404).json({ success: false, message: "Pooja not found." });
      return;
    }

    const orderOptions: any = {
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: `live_mandir_${Date.now()}`,
      payment_capture: 1,
      notes: {
        pujaSlug,
        pujaName,
        devoteeName,
        service: "LiveMandirPuja",
      },
    };

    const order: any = await razorpay.orders.create(orderOptions);

    const pendingBooking = await pendingPoojaBookingModel.create({
      userId: user._id,
      userName: user.name,
      userPhone: user.phone,
      userEmail: user.email,
      poojaId: pooja._id,
      poojaNameEng: pooja.poojaNameEng || pujaName,
      poojaMode: "online",
      poojaPrice: amount,
      bookingDate: new Date(),
      amount: amount,
      isPaymentDone: false,
      razorpayOrderId: order.id,
      bhaktName: devoteeName,
      gotra,
      contactNumber: cleanPhone,
      emailId: user.email,
    });

    const booking = await LiveMandirBooking.create({
      pujaSlug,
      pujaName,
      templeName,
      packageId,
      packageName,
      amount,
      devoteeName,
      gotra,
      members,
      phone: cleanPhone,
      wish,
      status: "pending",
      paymentStatus: "pending",
      razorpayOrderId: order.id,
      isFromSite: true,
      userId: user._id,
      normalBookingId: String(pendingBooking._id),
    });

    res.status(201).json({
      success: true,
      message: "Live puja order created",
      bookingId: booking._id,
      razorpayOrderId: order.id,
      razorpayKeyId,
      amount: amount,
      currency: "INR",
    });
  } catch (error) {
    console.error("Failed to create live booking order:", error);
    res.status(500).json({ success: false, message: "Failed to create booking" });
  }
};

// POST /live-mandir-bookings/complete-payment — verify signature & confirm
export const completeLiveBookingPayment: RequestHandler = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({
        success: false,
        message: "Payment verification fields are required",
      });
      return;
    }

    const booking = await LiveMandirBooking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    // Verify signature
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      res.status(400).json({ success: false, message: "Invalid payment signature" });
      return;
    }

    // Complete PoojaBooking
    if (booking.normalBookingId) {
      const pendingDoc = await pendingPoojaBookingModel.findById(booking.normalBookingId);
      if (pendingDoc) {
        const pendingObject = pendingDoc.toObject();
        const finalBooking = await poojaBookingModel.create({
          ...pendingObject,
          _id: undefined, // new id
          callID: (pendingObject as any).callID || `PARCALL_${String((pendingDoc as any)._id).slice(-16).toUpperCase()}`,
          isPaymentDone: true,
          isConfirmed: false,
          isReview: false,
          razorpayPaymentId,
          razorpayOrderId,
          razorpaySignature,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Update booking reference to the final pooja booking ID
        booking.normalBookingId = String(finalBooking._id);

        // Delete pending pooja booking doc
        await pendingPoojaBookingModel.findByIdAndDelete(pendingDoc._id);
      }
    }

    // Update booking
    const liveWasUnpaid = booking.paymentStatus !== "paid";
    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    booking.razorpayPaymentId = razorpayPaymentId;
    booking.razorpaySignature = razorpaySignature;
    await booking.save();

    // Email confirmation, once, on the transition to paid — guarded by
    // `liveWasUnpaid` so a replayed verify or a webhook arriving second cannot
    // send a devotee the same receipt twice. Optional in India, and abroad the
    // only record they get (no international OTP means no login).
    if (liveWasUnpaid) {
      void sendBookingEmailFor(booking, {
        serviceName: (booking as any).pujaName || (booking as any).packageName || "Live Mandir Puja",
        templeName: (booking as any).templeName,
        mode: "online",
        label: "LiveMandir",
      });
    }

    // Partner-affiliate: credit the customer's referrer once, on the first successful payment.
    if (liveWasUnpaid) {
      void sendPjarOrderToPartnerAffiliate({
        userId: (booking as any).userId,
        phone: (booking as any).phone,
        orderId: booking.razorpayOrderId,
        orderPrice: Number((booking as any).amount),
        productName: (booking as any).pujaName || "LIVE_MANDIR",
      });
    }

    // META CAPI Purchase (fire-and-forget) — dedup with browser pixel via eventId.
    void (async () => {
      if (!isProduction) {
        console.log(`[MetaCAPI][LiveMandir] Skipped (PAYMENT_MODE != production) for orderID=${razorpayOrderId}`);
        return;
      }
      try {
        const forwardedFor = req.headers["x-forwarded-for"];
        const clientIp = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0]) || req.ip || null;

        await sendMetaPurchaseEvent({
          orderID: String(razorpayOrderId),
          eventId: `live_mandir_purchase_${razorpayOrderId}`,
          value: Number((booking as any).amount || 0),
          currency: "INR",
          contentId: String((booking as any).pujaName || "LIVE_MANDIR_PUJA").trim(),
          actionSource: "website",
          phone: String((booking as any).phone || ""),
          externalId: String((booking as any).userId || ""),
          clientIp,
          userAgent: String(req.headers["user-agent"] || ""),
          fbp: String(req.headers["x-fbp"] || (req as any).cookies?._fbp || ""),
          fbc: String(req.headers["x-fbc"] || (req as any).cookies?._fbc || ""),
          eventSourceUrl:
            String(req.headers["x-event-source-url"] || "") ||
            process.env.META_DEFAULT_EVENT_SOURCE_URL ||
            null,
        });
        console.log(`[MetaCAPI][LiveMandir] Purchase sent for orderID=${razorpayOrderId}`);
      } catch (e: any) {
        console.error(`[MetaCAPI][LiveMandir] Purchase failed for orderID=${razorpayOrderId}:`, e?.response?.data || e?.message || e);
      }
    })();

    res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed",
      data: booking,
    });
  } catch (error) {
    console.error("Failed to complete live booking payment:", error);
    res.status(500).json({ success: false, message: "Failed to complete payment" });
  }
};

/**
 * Razorpay reconciliation for a legacy LiveMandirBooking row.
 *
 * New Live Mandir bookings go through the pooja pending → final pipeline (see
 * reconcilePoojaBookingPayment), which is what actually confirms the puja. This
 * only flips the companion LiveMandirBooking record, which still exists for
 * bookings created before that migration and for the admin list view. Both
 * reconcilers run for the same order id — they touch different collections.
 *
 * Returns true when the order matched a LiveMandirBooking.
 */
export async function reconcileLiveMandirPayment(opts: {
  orderId: string;
  paymentId?: string;
  event: string;
}): Promise<boolean> {
  const { orderId, paymentId, event } = opts;

  const booking = await LiveMandirBooking.findOne({ razorpayOrderId: orderId });
  if (!booking) return false;

  if (booking.paymentStatus === "paid") return true; // already reconciled

  if (event === "payment.captured" || event === "order.paid") {
    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    if (paymentId) booking.razorpayPaymentId = paymentId;

    // Keep normalBookingId pointing at the FINAL pooja booking once the pooja
    // reconciler has promoted it, so the admin view doesn't hold a dead id.
    const finalPooja = await poojaBookingModel
      .findOne({ razorpayOrderId: orderId })
      .select("_id")
      .lean();
    if (finalPooja) booking.normalBookingId = String((finalPooja as any)._id);

    await booking.save();

    void sendPjarOrderToPartnerAffiliate({
      userId: (booking as any).userId,
      phone: (booking as any).phone,
      orderId: booking.razorpayOrderId,
      orderPrice: Number((booking as any).amount),
      productName: (booking as any).pujaName || "LIVE_MANDIR",
    });

    console.log(`[RazorpayWebhook][LiveMandir] order=${orderId} → confirmed`);
  } else if (event === "payment.failed") {
    booking.paymentStatus = "failed";
    await booking.save();
  }

  return true;
}

// GET /live-mandir-bookings — admin list
export const getLiveBookings: RequestHandler = async (_req, res) => {
  try {
    const bookings = await LiveMandirBooking.find().sort({ addedOn: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};

// GET /live-mandir-bookings/user/:phone
export const getUserLiveBookings: RequestHandler = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      res.status(400).json({ success: false, message: "Phone number or user ID is required" });
      return;
    }

    const queryConditions: any[] = [];

    // If it's a valid mongoose ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(phone)) {
      queryConditions.push({ userId: phone });
    }

    // Clean phone numbers
    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone) {
      const alias10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
      queryConditions.push({ phone: cleanPhone });
      queryConditions.push({ phone: alias10 });
      queryConditions.push({ phone: { $regex: alias10 + "$" } });

      // Look up user by phone to find user ID and query user-associated bookings
      try {
        const user = await User.findOne({
          $or: [
            { phone: cleanPhone },
            { phone: alias10 },
            { phone: { $regex: alias10 + "$" } }
          ]
        });
        if (user) {
          queryConditions.push({ userId: user._id });
          queryConditions.push({ userId: String(user._id) });
        }
      } catch (err) {
        console.error("Error finding user by phone in live booking query:", err);
      }
    }

    if (queryConditions.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const bookings = await LiveMandirBooking.find({
      $or: queryConditions
    }).sort({ addedOn: -1, createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Failed to fetch user live bookings:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user live bookings" });
  }
};

