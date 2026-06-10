"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestReferralPayout = exports.applyUserReferral = exports.getReferralBookings = exports.getMyReferralData = exports.setreferralSourcePJAROnce = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userModel_1 = __importDefault(require("../../model/userApp/userModel"));
const userReferralBooking_model_1 = __importDefault(require("../../model/userApp/userReferralBooking.model"));
const referralPayoutRequest_model_1 = __importDefault(require("../../model/userApp/referralPayoutRequest.model"));
const encryption_1 = require("../../utils/encryption");
const referralUtils_1 = require("../../utils/referralUtils");
/* ─────────────────────────────────────────────────────────────
   ✅ Referral Source (Save referral code once)
   POST /users/:id/referral-source
   Body decrypted already: { referralSourcePJAR: "IQSDLQ7IK4" | "organic" }

   RULE:
   - Only set referralSourcePJAR if current value is missing OR "organic"
   - Never overwrite an existing non-organic referral code
   - If incoming is "organic" => do not change anything
   ───────────────────────────────────────────────────────────── */
const normalizeReferralSourcePJAR = (input) => {
    const raw = String(input ?? "").trim();
    if (!raw || raw.toLowerCase() === "organic")
        return "organic";
    const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();
    return cleaned || "organic";
};
const setreferralSourcePJAROnce = async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        (0, encryption_1.sendEncryptedResponse)(res, 400, { success: false, message: "Invalid user id." });
        return;
    }
    try {
        const incoming = (req.body || {})?.referralSourcePJAR;
        const source = normalizeReferralSourcePJAR(incoming);
        const before = await userModel_1.default.findById(id).select("_id referralSourcePJAR");
        if (source === "organic") {
            if (!before) {
                (0, encryption_1.sendEncryptedResponse)(res, 404, { success: false, message: "User not found." });
                return;
            }
            (0, encryption_1.sendEncryptedResponse)(res, 200, {
                success: true,
                message: "Referral source unchanged (organic).",
                referralSourcePJAR: before.referralSourcePJAR ?? "organic",
                alreadySet: (before.referralSourcePJAR ?? "organic") !== "organic",
            });
            return;
        }
        const updated = await userModel_1.default.findOneAndUpdate({
            _id: id,
            $or: [
                { referralSourcePJAR: { $exists: false } },
                { referralSourcePJAR: "organic" },
            ],
        }, { $set: { referralSourcePJAR: source } }, { new: true }).select("_id referralSourcePJAR");
        if (updated) {
            (0, encryption_1.sendEncryptedResponse)(res, 200, {
                success: true,
                message: "Referral source saved.",
                referralSourcePJAR: updated.referralSourcePJAR,
                alreadySet: false,
            });
            return;
        }
        const existing = before || (await userModel_1.default.findById(id).select("_id referralSourcePJAR"));
        if (!existing) {
            (0, encryption_1.sendEncryptedResponse)(res, 404, { success: false, message: "User not found." });
            return;
        }
        (0, encryption_1.sendEncryptedResponse)(res, 200, {
            success: true,
            message: "Referral source already set.",
            referralSourcePJAR: existing.referralSourcePJAR ?? "organic",
            alreadySet: true,
        });
    }
    catch (error) {
        console.error("[REFERRAL] setreferralSourcePJAROnce error:", error);
        (0, encryption_1.sendEncryptedResponse)(res, 500, {
            success: false,
            message: "Failed to save referral source.",
            error: error?.message || error,
        });
    }
};
exports.setreferralSourcePJAROnce = setreferralSourcePJAROnce;
/* ─────────────────────────────────────────────────────────────
   GET /users/:id/my-referral
   Returns the user's own referral code, earnings, and referrer info.
   ───────────────────────────────────────────────────────────── */
const getMyReferralData = async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        (0, encryption_1.sendEncryptedResponse)(res, 400, { success: false, message: "Invalid user id." });
        return;
    }
    try {
        let user = await userModel_1.default.findById(id);
        if (!user) {
            (0, encryption_1.sendEncryptedResponse)(res, 404, { success: false, message: "User not found." });
            return;
        }
        if (!user.userReferralCode) {
            user.userReferralCode = await (0, referralUtils_1.generateUniqueReferralCode)(String(user._id), user.phone || "");
            await user.save();
        }
        const rewardPct = parseFloat(process.env.INTERNAL_REFERRAL_PCT ?? "5");
        (0, encryption_1.sendEncryptedResponse)(res, 200, {
            success: true,
            userReferralCode: user.userReferralCode,
            referralEarnings: user.referralEarnings || 0,
            totalReferredPujas: user.totalReferredPujas || 0,
            referralPercentage: rewardPct,
            myReferrerInfo: user.userReferral || null,
        });
    }
    catch (error) {
        console.error("Error fetching my referral data:", error);
        (0, encryption_1.sendEncryptedResponse)(res, 500, { success: false, message: "Failed to fetch referral data." });
    }
};
exports.getMyReferralData = getMyReferralData;
/* ─────────────────────────────────────────────────────────────
   GET /users/:id/referral-bookings
   Returns bookings that came via this user's referral code.
   ───────────────────────────────────────────────────────────── */
const getReferralBookings = async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        (0, encryption_1.sendEncryptedResponse)(res, 400, { success: false, message: "Invalid user id." });
        return;
    }
    try {
        const referrerId = new mongoose_1.default.Types.ObjectId(id);
        const bookings = await userReferralBooking_model_1.default.find({ referrerId })
            .sort({ createdAt: -1 })
            .lean();
        (0, encryption_1.sendEncryptedResponse)(res, 200, {
            success: true,
            totalReferredOrders: bookings.length,
            referralBookings: bookings.map((b) => ({
                bookingId: String(b.bookingId),
                referredUserName: b.referredUserName,
                poojaName: b.poojaName,
                amountEarned: b.amountEarned,
                totalBookingAmount: b.totalBookingAmount,
                rewardPercentage: b.rewardPercentage,
                bookedAt: b.createdAt,
            })),
        });
    }
    catch (error) {
        console.error("Error fetching referral bookings:", error);
        (0, encryption_1.sendEncryptedResponse)(res, 500, { success: false, message: "Failed to fetch referral bookings." });
    }
};
exports.getReferralBookings = getReferralBookings;
/* ─────────────────────────────────────────────────────────────
   POST /users/:id/apply-referral
   Body (decrypted): { code: "ABCDE12345" }
   Saves the referrer to the user's profile for 24 hours.
   ───────────────────────────────────────────────────────────── */
const applyUserReferral = async (req, res) => {
    const { id } = req.params;
    const { code } = req.body || {};
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        (0, encryption_1.sendEncryptedResponse)(res, 400, { success: false, message: "Invalid user id." });
        return;
    }
    if (!code || typeof code !== "string" || code.length < 3) {
        (0, encryption_1.sendEncryptedResponse)(res, 400, { success: false, message: "Invalid referral code." });
        return;
    }
    try {
        const user = await userModel_1.default.findById(id);
        if (!user) {
            (0, encryption_1.sendEncryptedResponse)(res, 404, { success: false, message: "User not found." });
            return;
        }
        if (user.userReferralCode === code.toUpperCase()) {
            (0, encryption_1.sendEncryptedResponse)(res, 400, { success: false, message: "You cannot apply your own referral code." });
            return;
        }
        // Idempotency: if a valid (non-expired) referral already exists, skip overwrite
        if (user.userReferral?.referrerId &&
            user.userReferral.expiresAt &&
            new Date() < new Date(user.userReferral.expiresAt)) {
            (0, encryption_1.sendEncryptedResponse)(res, 200, {
                success: true,
                message: "Referral already active.",
                expiresAt: user.userReferral.expiresAt,
            });
            return;
        }
        const referrer = await userModel_1.default.findOne({ userReferralCode: code.toUpperCase() });
        if (!referrer) {
            (0, encryption_1.sendEncryptedResponse)(res, 404, { success: false, message: "Invalid referral code. Referrer not found." });
            return;
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours
        user.userReferral = {
            referrerId: referrer._id,
            code: code.toUpperCase(),
            appliedAt: new Date(),
            expiresAt,
        };
        await user.save();
        (0, encryption_1.sendEncryptedResponse)(res, 200, {
            success: true,
            message: "Referral code applied successfully. Valid for 24 hours.",
            expiresAt,
        });
    }
    catch (error) {
        console.error("Error applying referral code:", error);
        (0, encryption_1.sendEncryptedResponse)(res, 500, { success: false, message: "Failed to apply referral code." });
    }
};
exports.applyUserReferral = applyUserReferral;
/* ─────────────────────────────────────────────────────────────
   POST /users/:id/payout-request
   Allows a user to request a payout of their referral earnings.
   Only allowed between 1st and 6th of the month.
   ───────────────────────────────────────────────────────────── */
const requestReferralPayout = async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        (0, encryption_1.sendEncryptedResponse)(res, 400, { success: false, message: "Invalid user id." });
        return;
    }
    try {
        const date = new Date().getDate();
        if (date < 1 || date > 17) {
            (0, encryption_1.sendEncryptedResponse)(res, 400, {
                success: false,
                message: "Payout requests are only allowed between the 1st and 6th of the month.",
            });
            return;
        }
        const user = await userModel_1.default.findById(id);
        if (!user) {
            (0, encryption_1.sendEncryptedResponse)(res, 404, { success: false, message: "User not found." });
            return;
        }
        const earnings = user.referralEarnings || 0;
        if (earnings <= 0) {
            (0, encryption_1.sendEncryptedResponse)(res, 400, { success: false, message: "No earnings available for payout." });
            return;
        }
        const requestDoc = await referralPayoutRequest_model_1.default.create({
            userId: user._id,
            userName: `${user.given_name || ""} ${user.family_name || ""}`.trim() || "User",
            userPhone: user.phone || "Unknown",
            amountRequested: earnings,
            status: "Pending",
        });
        (0, encryption_1.sendEncryptedResponse)(res, 200, {
            success: true,
            message: "Payout request recorded successfully.",
            requestDetails: {
                amount: earnings,
                userName: requestDoc.userName,
                userPhone: requestDoc.userPhone,
                userId: String(user._id),
            },
        });
    }
    catch (error) {
        console.error("Error creating payout request:", error);
        (0, encryption_1.sendEncryptedResponse)(res, 500, { success: false, message: "Failed to create payout request." });
    }
};
exports.requestReferralPayout = requestReferralPayout;
