"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpPandit = exports.sendOtpPandit = exports.asyncHandler = exports.getExpiry = exports.generateOtp = exports.JWT_EXPIRES = exports.JWT_SECRET = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const panditModel_1 = __importDefault(require("../../model/panditApp/panditModel"));
exports.JWT_SECRET = process.env.JWT_SECRET ?? "supersecretkey";
exports.JWT_EXPIRES = "7d";
/** Generate n-digit numeric OTP (default 4 digits) */
const generateOtp = (length = 4) => crypto_1.default.randomInt(0, 10 ** length).toString().padStart(length, "0");
exports.generateOtp = generateOtp;
/** Return a Date exactly `minutes` in the future (default 1 min) */
const getExpiry = (minutes = 1) => new Date(Date.now() + minutes * 60 * 1000);
exports.getExpiry = getExpiry;
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);
exports.asyncHandler = asyncHandler;
exports.sendOtpPandit = (0, exports.asyncHandler)(async (req, res) => {
    const { phone } = req.body;
    /* basic validation */
    if (!phone || phone.length !== 10) {
        return res.status(400).json({ message: "Invalid phone number." });
    }
    /* find pandit */
    const pandit = await panditModel_1.default.findOne({ mobile: phone });
    if (!pandit) {
        return res.status(404).json({ message: "Pandit not found." });
    }
    /* must be verified & active */
    if (!pandit.isVerified || !pandit.isActive) {
        return res
            .status(403)
            .json({ message: "Pandit-ji not verified / inactive yet." });
    }
    /* generate + store OTP */
    const otp = (0, exports.generateOtp)();
    pandit.otp = await bcryptjs_1.default.hash(otp, 10);
    pandit.otpExpiry = (0, exports.getExpiry)(1); // 1-minute validity
    await pandit.save();
    /* Send via Fast2SMS */
    const { FAST2SMS_API_KEY, FAST2SMS_SENDER_ID, FAST2SMS_TEMPLATE_ID } = process.env;
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}` +
        `&route=dlt&sender_id=${FAST2SMS_SENDER_ID}&message=${FAST2SMS_TEMPLATE_ID}` +
        `&variables_values=${otp}|1&flash=0&numbers=${phone}`;
    await axios_1.default.get(url); // ignore response body
    return res.status(200).json({ message: "OTP sent successfully." });
});
exports.verifyOtpPandit = (0, exports.asyncHandler)(async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        return res.status(400).json({ message: "Phone and OTP are required." });
    }
    const pandit = await panditModel_1.default.findOne({ mobile: phone });
    if (!pandit || !pandit.otp || !pandit.otpExpiry) {
        return res.status(400).json({ message: "OTP not requested." });
    }
    /* expiry check */
    if (pandit.otpExpiry < new Date()) {
        return res.status(400).json({ message: "OTP expired." });
    }
    /* compare */
    const ok = await bcryptjs_1.default.compare(otp, pandit.otp);
    if (!ok) {
        return res.status(400).json({ message: "Incorrect OTP." });
    }
    /* clear OTP fields */
    pandit.otp = undefined;
    pandit.otpExpiry = undefined;
    await pandit.save();
    /* issue JWT */
    const token = jsonwebtoken_1.default.sign({ id: pandit._id, role: "pandit" }, exports.JWT_SECRET, {
        expiresIn: exports.JWT_EXPIRES,
    });
    return res.status(200).json({ token, pandit });
});
