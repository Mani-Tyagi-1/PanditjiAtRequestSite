"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completePaidConsultationPayment = exports.createPaidConsultationOrder = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const paidConsultationModel_1 = __importDefault(require("../../model/userApp/paidConsultationModel"));
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
const razorpay = new razorpay_1.default({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
});
const getConsultationAmount = () => {
    const amount = Number(process.env.PAID_CONSULTATION_AMOUNT || DEFAULT_CONSULTATION_AMOUNT);
    return Number.isFinite(amount) && amount > 0 ? amount : DEFAULT_CONSULTATION_AMOUNT;
};
const verifyPaymentSignature = (orderId, paymentId, signature) => {
    const hmac = crypto_1.default.createHmac("sha256", razorpayKeySecret);
    hmac.update(`${orderId}|${paymentId}`);
    return hmac.digest("hex") === signature;
};
const createPaidConsultationOrder = async (req, res) => {
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
        const orderOptions = {
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
        const order = await razorpay.orders.create(orderOptions);
        const consultation = await paidConsultationModel_1.default.create({
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
    }
    catch (error) {
        console.error("Failed to create paid consultation order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create paid consultation order",
        });
    }
};
exports.createPaidConsultationOrder = createPaidConsultationOrder;
const completePaidConsultationPayment = async (req, res) => {
    try {
        const { consultationId, razorpayPaymentId, razorpayOrderId, razorpaySignature, } = req.body;
        if (!consultationId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            res.status(400).json({
                success: false,
                message: "Payment verification fields are required",
            });
            return;
        }
        const consultation = await paidConsultationModel_1.default.findById(consultationId);
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
        const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
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
    }
    catch (error) {
        console.error("Failed to complete paid consultation payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to verify paid consultation payment",
        });
    }
};
exports.completePaidConsultationPayment = completePaidConsultationPayment;
