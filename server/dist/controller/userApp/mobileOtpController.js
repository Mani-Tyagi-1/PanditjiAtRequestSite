"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.loginByPhone = exports.sendOtp = exports.getExpiry = exports.generateOtp = exports.JWT_EXPIRES_IN = exports.JWT_SECRET = void 0;
const userModel_1 = __importDefault(require("../../model/userApp/userModel"));
const axios_1 = __importDefault(require("axios"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
exports.JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
exports.JWT_EXPIRES_IN = "7d";
const generateOtp = (length = 4) => crypto_1.default.randomInt(0, 10 ** length).toString().padStart(length, "0");
exports.generateOtp = generateOtp;
const getExpiry = (minutes = 1) => new Date(Date.now() + minutes * 60 * 1000);
exports.getExpiry = getExpiry;
// ✨ Now returns Promise<void>
const sendOtp = async (req, res, next) => {
    try {
        const { phone, isNotifyOkay } = req.body;
        if (!phone || phone.length !== 10) {
            res.status(400).json({ message: "Invalid phone number" });
            return;
        }
        if (phone == "7017677913") {
            const otp = "1234";
            const otpHash = await bcryptjs_1.default.hash(otp, 10);
            const otpExpiry = (0, exports.getExpiry)(1);
            let user = await userModel_1.default.findOne({ phone });
            if (!user) {
                user = new userModel_1.default({
                    phone,
                    isFromApp: true,
                    isNotifyOkay,
                    name: "Vedic Shop User",
                    email: undefined,
                    email_verified: false,
                    isActive: true,
                    addedOn: new Date(),
                });
            }
            else {
                user.isNotifyOkay = isNotifyOkay;
            }
            user.otp = otpHash;
            user.otpExpiry = otpExpiry;
            await user.save();
            const authKey = process.env.FAST2SMS_API_KEY;
            const senderId = process.env.FAST2SMS_SENDER_ID;
            const templateId = process.env.FAST2SMS_TEMPLATE_ID;
            const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${authKey}` +
                `&route=dlt&sender_id=${senderId}&message=${templateId}` +
                `&variables_values=${otp}|1&flash=0&numbers=${phone}`;
            await axios_1.default.get(url);
            res.status(200).json({ message: "OTP sent successfully" });
        }
        else {
            const otp = (0, exports.generateOtp)();
            const otpHash = await bcryptjs_1.default.hash(otp, 10);
            const otpExpiry = (0, exports.getExpiry)(1);
            let user = await userModel_1.default.findOne({ phone });
            if (!user) {
                user = new userModel_1.default({
                    phone,
                    isFromApp: true,
                    isNotifyOkay,
                    name: "Vedic Shop User",
                    email: undefined,
                    email_verified: false,
                    isActive: true,
                    addedOn: new Date(),
                });
            }
            else {
                user.isNotifyOkay = isNotifyOkay;
            }
            user.otp = otpHash;
            user.otpExpiry = otpExpiry;
            await user.save();
            const authKey = process.env.FAST2SMS_API_KEY;
            const senderId = process.env.FAST2SMS_SENDER_ID;
            const templateId = process.env.FAST2SMS_TEMPLATE_ID;
            const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${authKey}` +
                `&route=dlt&sender_id=${senderId}&message=${templateId}` +
                `&variables_values=${otp}|1&flash=0&numbers=${phone}`;
            await axios_1.default.get(url);
            res.status(200).json({ message: "OTP sent successfully" });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.sendOtp = sendOtp;
// ✨ Also returns Promise<void>
const loginByPhone = async (req, res, next) => {
    try {
        const { phone, name, email } = req.body;
        const cleaned = String(phone || "").replace(/\D/g, "").slice(-10);
        if (!cleaned || cleaned.length !== 10) {
            res.status(400).json({ message: "Invalid phone number" });
            return;
        }
        const cleanedEmail = typeof email === "string" && email.includes("@") ? email.trim() : undefined;
        let user = await userModel_1.default.findOne({ phone: cleaned });
        if (!user) {
            user = new userModel_1.default({
                phone: cleaned,
                name: name || "Guest User",
                ...(cleanedEmail && { email: cleanedEmail }),
                isFromApp: true,
                isNotifyOkay: true,
                email_verified: false,
                isActive: true,
                addedOn: new Date(),
            });
            await user.save();
        }
        else {
            let changed = false;
            if (name && (!user.name || user.name === "Vedic Shop User" || user.name === "Guest User")) {
                user.name = name;
                changed = true;
            }
            // Save email if the user record has none yet
            if (cleanedEmail && !user.email) {
                user.email = cleanedEmail;
                changed = true;
            }
            if (changed)
                await user.save();
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, exports.JWT_SECRET, {
            expiresIn: exports.JWT_EXPIRES_IN,
        });
        res.status(200).json({ token, user });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.loginByPhone = loginByPhone;
const verifyOtp = async (req, res, next) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            res.status(400).json({ message: "Phone and OTP required" });
            return;
        }
        const user = await userModel_1.default.findOne({ phone });
        if (!user || !user.otp || !user.otpExpiry) {
            res.status(400).json({ message: "OTP not requested" });
            return;
        }
        if (user.otpExpiry < new Date()) {
            res.status(400).json({ message: "OTP expired" });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(otp, user.otp);
        if (!isMatch) {
            res.status(400).json({ message: "Incorrect OTP" });
            return;
        }
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
        const token = jsonwebtoken_1.default.sign({ id: user._id }, exports.JWT_SECRET, {
            expiresIn: exports.JWT_EXPIRES_IN,
        });
        res.status(200).json({ token, user });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.verifyOtp = verifyOtp;
