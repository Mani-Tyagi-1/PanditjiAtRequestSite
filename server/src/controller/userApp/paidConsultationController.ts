import { RequestHandler } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import PaidConsultation from "../../model/userApp/paidConsultationModel";

const TIME_SLOTS = new Set(["9-11", "11-1", "3-5", "5-7"]);
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

export const createPaidConsultationOrder: RequestHandler = async (req, res) => {
  try {
    const { fullName, mobileNumber, city, concern, preferredTimeSlot } = req.body;

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

    const amount = getConsultationAmount();
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
      helpWith: "Personalised Consultation",
      city,
      concern,
      poojaType: "Personalised Consultation",
      callbackTime: preferredTimeSlot,
      timeSlot: preferredTimeSlot,
      amount,
      isPaymentDone: false,
      razorpayOrderId: order.id,
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
