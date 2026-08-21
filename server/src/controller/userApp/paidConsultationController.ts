import { RequestHandler } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import PaidConsultation from "../../model/userApp/paidConsultationModel";
import { sendWhatsappMessage, sendOrderConfirmationTemplate, ORDER_TEMPLATE_HEADER_IMAGE } from "../../utils/whatsapp";
import { sendMetaPurchaseEvent } from "../../utils/metaCapiServices";
import { reportServerPurchase } from "../../utils/serverAnalytics";
import { sendBookingEmailFor } from "../../utils/sendBookingEmail";
import { readAttribution } from "../../utils/marketingAttribution";

const TIME_SLOTS = new Set(["9-11", "11-1", "3-5", "5-7"]);
const TIME_SLOT_LABELS: Record<string, string> = {
  "9-11": "9 AM - 11 AM",
  "11-1": "11 AM - 1 PM",
  "3-5": "3 PM - 5 PM",
  "5-7": "5 PM - 7 PM",
};
const DEFAULT_CONSULTATION_AMOUNT = 101;

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

const getConsultationAmount = () => {
  const amount = Number(process.env.PAID_CONSULTATION_AMOUNT || DEFAULT_CONSULTATION_AMOUNT);
  return Number.isFinite(amount) && amount > 0 ? amount : DEFAULT_CONSULTATION_AMOUNT;
};

const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  const hmac = crypto.createHmac("sha256", razorpayKeySecret as string);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest("hex") === signature;
};

const sendPaidConsultationConfirmationWhatsapp = async (consultation: any) => {
  // Email confirmation rides alongside WhatsApp, not instead of it.
  // Optional in India (WhatsApp is the primary channel); abroad it is the
  // devotee's ONLY record, since there is no international OTP to log in with.
  // Fire-and-forget: it must never delay or fail a paid booking.
  void sendBookingEmailFor(consultation, {
    serviceName: "Personalised Consultation with Pandit Ji",
    mode: "online",
    label: "PaidConsultation",
  });

  try {
    const rawPhone = String(consultation?.mobileNumber || "");
    const cleanedPhone = rawPhone.replace(/\D/g, "");
    if (cleanedPhone.length < 10) return;
    const phone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

    const devoteeName = consultation?.fullName || "Devotee";
    const consultationType = consultation?.consultationType === "video" ? "Video Call" : "Audio Call";
    const consultationText = consultation?.consultationType === "video" ? "video consultation" : "audio consultation";
    const slot = TIME_SLOT_LABELS[String(consultation?.timeSlot || consultation?.callbackTime || "")] || consultation?.timeSlot || consultation?.callbackTime || "our next available slot";
    const amount = Number(consultation?.amount || 0);
    const bookingId = consultation?.razorpayOrderId || String(consultation?._id || "");

    const param2 = `Thank you for booking your *${consultationType}* with experienced Pandit ji. Your ${consultationText} request is confirmed and our team will connect with you shortly.`;
    const param3 = `Preferred Slot: ${slot} - Amount Paid: Rs.${amount.toLocaleString("en-IN")}`;
    const param4 = `Booking ID: ${bookingId} - please keep your phone available during the selected time slot.`;
    const buttonParam = "apps/details?id=com.panditJiAtReqapp";

    let sent = false;
    try {
      await sendOrderConfirmationTemplate({
        to: phone,
        parameters: [devoteeName, param2, param3, param4],
        headerImageUrl: ORDER_TEMPLATE_HEADER_IMAGE,
        buttonUrlParam: buttonParam,
      });
      console.log(`[PaidConsultation] WhatsApp confirmation accepted by API for ${phone} (delivery not guaranteed)`);
      sent = true;
    } catch (err: any) {
      console.warn("[PaidConsultation] Template send failed:", err?.response?.data || err.message);
    }

    if (!sent) {
      try {
        const fallbackMsg = `Namaste ${devoteeName} ji\n\n${param2}\n${param3}\n\n${param4}\n\nFor further assistance, visit Pandit Ji At Request: https://play.google.com/store/${buttonParam}`;
        await sendWhatsappMessage({ to: phone, message: fallbackMsg });
        console.log(`[PaidConsultation] WhatsApp plain text confirmation sent to ${phone}`);
      } catch (textErr: any) {
        console.error("[PaidConsultation] WhatsApp fallback text failed:", textErr?.response?.data || textErr.message);
      }
    }
  } catch (e: any) {
    console.error("[PaidConsultation] WhatsApp confirmation flow failed entirely:", e?.response?.data || e?.message || e);
  }
};

export const createPaidConsultationOrder: RequestHandler = async (req, res) => {
  try {
    const { fullName, mobileNumber, city, concern, preferredTimeSlot, type, email} = req.body;

    // Which campaign brought this devotee in, whitelisted and clipped.
    const attribution = readAttribution(req);

    if (!fullName || !mobileNumber || !city || !preferredTimeSlot) {
      res.status(400).json({
        success: false,
        message: "fullName, mobileNumber, city, and preferredTimeSlot are required",
      });
      return;
    }

    if (!/^\d{10}$/.test(String(mobileNumber).trim())) {
      res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number",
      });
      return;
    }

    if (!TIME_SLOTS.has(String(preferredTimeSlot))) {
      res.status(400).json({
        success: false,
        message: "Invalid preferred time slot",
      });
      return;
    }

    const consultationType = type === "video" ? "video" : "voice";
    const amount = consultationType === "video" ? 201 : 101;
    const orderOptions: any = {
      amount: amount * 100,
      currency: "INR",
      receipt: `paid_consult_${Date.now()}`,
      payment_capture: 1,
      notes: {
        fullName,
        mobileNumber,
        city,
        preferredTimeSlot,
        service: "Paid Consultation",
      },
    };

    const order: any = await razorpay.orders.create(orderOptions);

    const consultation = await PaidConsultation.create({
      fullName,
      mobileNumber,
      // Stored so the confirmation email has somewhere to go. Optional in
      // India; required abroad, where it is the devotee's only record.
      ...(email ? { email: String(email).trim().toLowerCase() } : {}),
      helpWith: "Personalised Consultation",
      city,
      concern,
      poojaType: "Personalised Consultation",
      callbackTime: preferredTimeSlot,
      timeSlot: preferredTimeSlot,
      amount,
      consultationType,
      isPaymentDone: false,
      razorpayOrderId: order.id,
      ...(attribution && { attribution }),
    });

    res.status(201).json({
      success: true,
      message: "Paid consultation order created",
      consultationId: consultation._id,
      razorpayOrderId: order.id,
      razorpayKeyId,
      amount,
      currency: "INR",
    });
  } catch (error) {
    console.error("Failed to create paid consultation order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create paid consultation order",
    });
  }
};

/**
 * Razorpay reconciliation for a paid consultation. Called by the shared webhook
 * dispatcher when the browser never reached /complete-payment.
 *
 * Returns true when the order belonged to a paid consultation.
 */
/**
 * Report a paid consultation to GA4 / Google Ads.
 *
 * Called from both payment paths — the browser's verify call and the Razorpay
 * webhook — so a devotee who closes the tab on the success screen is still
 * counted. reportServerPurchase claims exactly once per order id, so reaching
 * it twice costs nothing.
 */
async function reportConsultationPurchase(consultation: any): Promise<void> {
  const razorpayOrderId = String(consultation?.razorpayOrderId || "");
  if (!razorpayOrderId) return;

  const isVideo = consultation?.consultationType === "video";
  const name = isVideo ? "Video Call Consultation" : "Audio Call Consultation";

  await reportServerPurchase({
    razorpayOrderId,
    value: Number(consultation?.amount || 0),
    currency: "INR",
    userId: String(consultation?._id || ""),
    service: "Consultation",
    items: [
      {
        item_id: isVideo ? "consultation_video" : "consultation_audio",
        item_name: name,
        item_category: "Consultation",
        item_variant: isVideo ? "video" : "audio",
        quantity: 1,
        price: Number(consultation?.amount || 0),
      },
    ],
  });
}

export async function reconcilePaidConsultationPayment(opts: {
  orderId: string;
  paymentId?: string;
  event: string;
}): Promise<boolean> {
  const { orderId, paymentId, event } = opts;

  const consultation = await PaidConsultation.findOne({ razorpayOrderId: orderId });
  if (!consultation) return false;

  if (consultation.isPaymentDone) return true; // already reconciled

  if (event === "payment.captured" || event === "order.paid") {
    consultation.isPaymentDone = true;
    if (paymentId) consultation.razorpayPaymentId = paymentId;
    await consultation.save();

    void sendPaidConsultationConfirmationWhatsapp(consultation);

    // The conversion the browser could not report because the tab was gone.
    void reportConsultationPurchase(consultation);

    console.log(`[RazorpayWebhook][Consultation] order=${orderId} → confirmed`);
  }
  // payment.failed: nothing to flip — isPaymentDone simply stays false.

  return true;
}

export const completePaidConsultationPayment: RequestHandler = async (req, res) => {
  try {
    const {
      consultationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;

    if (!consultationId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      res.status(400).json({
        success: false,
        message: "Payment verification fields are required",
      });
      return;
    }

    const consultation = await PaidConsultation.findById(consultationId);
    if (!consultation) {
      res.status(404).json({
        success: false,
        message: "Paid consultation request not found",
      });
      return;
    }

    if (consultation.isPaymentDone) {
      res.json({
        success: true,
        message: "Paid consultation payment already verified",
        data: consultation,
      });
      return;
    }

    if (consultation.razorpayOrderId !== razorpayOrderId) {
      res.status(400).json({
        success: false,
        message: "Razorpay order mismatch",
      });
      return;
    }

    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      await consultation.save();
      res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
      return;
    }

    consultation.isPaymentDone = true;
    consultation.razorpayPaymentId = razorpayPaymentId;
    consultation.razorpaySignature = razorpaySignature;
    await consultation.save();

    void sendPaidConsultationConfirmationWhatsapp(consultation);

    // META CAPI Purchase (fire-and-forget) — dedup with browser pixel via eventId.
    void (async () => {
      if (!isProduction) {
        console.log(`[MetaCAPI][Consultation] Skipped (PAYMENT_MODE != production) for orderID=${razorpayOrderId}`);
        return;
      }
      try {
        const forwardedFor = req.headers["x-forwarded-for"];
        const clientIp = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0]) || req.ip || null;

        const isVideo = (consultation as any).consultationType === "video";

        await sendMetaPurchaseEvent({
          orderID: String(razorpayOrderId),
          eventId: `consultation_purchase_${razorpayOrderId}`,
          value: Number((consultation as any).amount || 0),
          currency: "INR",
          contentId: isVideo ? "Video Call Consultation" : "Audio Call Consultation",
          actionSource: "website",
          phone: String((consultation as any).mobileNumber || ""),
          externalId: String((consultation as any)._id || ""),
          clientIp,
          userAgent: String(req.headers["user-agent"] || ""),
          fbp: String(req.headers["x-fbp"] || (req as any).cookies?._fbp || ""),
          fbc: String(req.headers["x-fbc"] || (req as any).cookies?._fbc || ""),
          eventSourceUrl:
            String(req.headers["x-event-source-url"] || "") ||
            process.env.META_DEFAULT_EVENT_SOURCE_URL ||
            null,
        });
        console.log(`[MetaCAPI][Consultation] Purchase sent for orderID=${razorpayOrderId}`);
      } catch (e: any) {
        console.error(`[MetaCAPI][Consultation] Purchase failed for orderID=${razorpayOrderId}:`, e?.response?.data || e?.message || e);
      }
    })();

    void reportConsultationPurchase(consultation);

    res.json({
      success: true,
      message: "Paid consultation payment verified",
      data: consultation,
    });
  } catch (error) {
    console.error("Failed to complete paid consultation payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify paid consultation payment",
    });
  }
};
