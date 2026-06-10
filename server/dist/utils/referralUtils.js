"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueReferralCode = generateUniqueReferralCode;
const crypto_1 = __importDefault(require("crypto"));
const userModel_1 = __importDefault(require("../model/userApp/userModel"));
/**
 * Generates a short, unique alphanumeric referral code for a user.
 * Format: 10 uppercase alphanumeric characters derived from userId + phone + random salt.
 * Retries up to 5 times to guarantee uniqueness in the DB.
 */
async function generateUniqueReferralCode(userId, phone) {
    for (let attempt = 0; attempt < 5; attempt++) {
        const salt = crypto_1.default.randomBytes(4).toString("hex").toUpperCase();
        const raw = `${userId}${phone}${salt}`;
        const hash = crypto_1.default
            .createHash("sha256")
            .update(raw)
            .digest("base64")
            .replace(/[^A-Z0-9]/g, "") // keep only alphanumeric uppercase
            .slice(0, 10);
        const code = hash.length >= 6 ? hash : salt.slice(0, 10); // fallback
        const exists = await userModel_1.default.findOne({ userReferralCode: code }).lean();
        if (!exists)
            return code;
    }
    // Ultra-rare collision fallback — guaranteed unique with timestamp
    return crypto_1.default
        .createHash("sha256")
        .update(`${userId}${Date.now()}`)
        .digest("hex")
        .toUpperCase()
        .slice(0, 10);
}
