"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpAndDeleteUser = exports.sendUserOtp = void 0;
const userModel_1 = __importDefault(require("../../model/userApp/userModel"));
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const axios_1 = __importDefault(require("axios"));
const normalizePhone = (phone) => phone.replace(/[^\d]/g, "");
const generateOtp = () => crypto_1.default.randomInt(100000, 999999).toString();
const getExpiry = (minutes) => new Date(Date.now() + minutes * 60000);
const sendUserOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone || phone.length !== 10) {
            return res.status(400).json({ message: "Invalid phone number format." });
        }
        const normalizedPhone = normalizePhone(phone);
        const user = await userModel_1.default.findOne({ phone: normalizedPhone });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with the provided phone number.",
            });
        }
        const otp = generateOtp();
        const otpHash = await bcryptjs_1.default.hash(otp, 10);
        const otpExpiry = getExpiry(5);
        user.otp = otpHash;
        user.otpExpiry = otpExpiry;
        await user.save();
        const authKey = process.env.FAST2SMS_API_KEY;
        const senderId = process.env.FAST2SMS_SENDER_ID;
        const templateId = process.env.FAST2SMS_TEMPLATE_ID;
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${authKey}` +
            `&route=dlt&sender_id=${senderId}&message=${templateId}` +
            `&variables_values=${otp}|1&flash=0&numbers=${normalizedPhone}`;
        await axios_1.default.get(url);
        return res.status(200).json({ message: "OTP sent successfully" });
    }
    catch (err) {
        console.error("Error sending OTP:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.sendUserOtp = sendUserOtp;
const verifyOtpAndDeleteUser = async (req, res) => {
    const { phone, otp } = req.body;
    try {
        const normalizedPhone = normalizePhone(phone);
        const user = await userModel_1.default.findOne({ phone: normalizedPhone });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with the provided phone number.",
            });
        }
        if (!user.otp) {
            return res.status(400).json({
                success: false,
                message: "OTP not requested. Please request an OTP first.",
            });
        }
        const isOtpValid = await bcryptjs_1.default.compare(otp, user.otp);
        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }
        if (new Date() > new Date(user.otpExpiry)) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }
        await userModel_1.default.deleteOne({ _id: user._id });
        return res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });
    }
    catch (error) {
        console.error("Error verifying OTP and deleting user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.verifyOtpAndDeleteUser = verifyOtpAndDeleteUser;
