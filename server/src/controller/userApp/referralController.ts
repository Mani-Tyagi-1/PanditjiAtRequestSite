import { RequestHandler } from "express";
import mongoose from "mongoose";
import User from "../../model/userApp/userModel";
import UserReferralBooking from "../../model/userApp/userReferralBooking.model";
import ReferralPayoutRequest from "../../model/userApp/referralPayoutRequest.model";
import { sendEncryptedResponse } from "../../utils/encryption";
import { generateUniqueReferralCode } from "../../utils/referralUtils";

/* ─────────────────────────────────────────────────────────────
   ✅ Referral Source (Save referral code once)
   POST /users/:id/referral-source
   Body decrypted already: { referralSourcePJAR: "IQSDLQ7IK4" | "organic" }

   RULE:
   - Only set referralSourcePJAR if current value is missing OR "organic"
   - Never overwrite an existing non-organic referral code
   - If incoming is "organic" => do not change anything
   ───────────────────────────────────────────────────────────── */

const normalizeReferralSourcePJAR = (input: any): string => {
  const raw = String(input ?? "").trim();
  if (!raw || raw.toLowerCase() === "organic") return "organic";
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();
  return cleaned || "organic";
};

export const setreferralSourcePJAROnce: RequestHandler = async (req, res): Promise<void> => {
  const { id } = req.params as { id?: string };

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    sendEncryptedResponse(res, 400, { success: false, message: "Invalid user id." });
    return;
  }

  try {
    const incoming = (req.body || {})?.referralSourcePJAR;
    const source = normalizeReferralSourcePJAR(incoming);

    const before = await User.findById(id).select("_id referralSourcePJAR");

    if (source === "organic") {
      if (!before) {
        sendEncryptedResponse(res, 404, { success: false, message: "User not found." });
        return;
      }
      sendEncryptedResponse(res, 200, {
        success: true,
        message: "Referral source unchanged (organic).",
        referralSourcePJAR: before.referralSourcePJAR ?? "organic",
        alreadySet: (before.referralSourcePJAR ?? "organic") !== "organic",
      });
      return;
    }

    const updated = await User.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { referralSourcePJAR: { $exists: false } },
          { referralSourcePJAR: "organic" },
        ],
      },
      { $set: { referralSourcePJAR: source } },
      { new: true }
    ).select("_id referralSourcePJAR");

    if (updated) {
      sendEncryptedResponse(res, 200, {
        success: true,
        message: "Referral source saved.",
        referralSourcePJAR: updated.referralSourcePJAR,
        alreadySet: false,
      });
      return;
    }

    const existing = before || (await User.findById(id).select("_id referralSourcePJAR"));
    if (!existing) {
      sendEncryptedResponse(res, 404, { success: false, message: "User not found." });
      return;
    }

    sendEncryptedResponse(res, 200, {
      success: true,
      message: "Referral source already set.",
      referralSourcePJAR: existing.referralSourcePJAR ?? "organic",
      alreadySet: true,
    });
  } catch (error: any) {
    console.error("[REFERRAL] setreferralSourcePJAROnce error:", error);
    sendEncryptedResponse(res, 500, {
      success: false,
      message: "Failed to save referral source.",
      error: error?.message || error,
    });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /users/:id/my-referral
   Returns the user's own referral code, earnings, and referrer info.
   ───────────────────────────────────────────────────────────── */
export const getMyReferralData: RequestHandler = async (req, res): Promise<void> => {
  const { id } = req.params as { id?: string };

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    sendEncryptedResponse(res, 400, { success: false, message: "Invalid user id." });
    return;
  }

  try {
    let user = await User.findById(id);
    if (!user) {
      sendEncryptedResponse(res, 404, { success: false, message: "User not found." });
      return;
    }

    if (!user.userReferralCode) {
      user.userReferralCode = await generateUniqueReferralCode(String(user._id), user.phone || "");
      await user.save();
    }

    const rewardPct = parseFloat(process.env.INTERNAL_REFERRAL_PCT ?? "5");

    sendEncryptedResponse(res, 200, {
      success: true,
      userReferralCode: user.userReferralCode,
      referralEarnings: user.referralEarnings || 0,
      totalReferredPujas: user.totalReferredPujas || 0,
      referralPercentage: rewardPct,
      myReferrerInfo: user.userReferral || null,
    });
  } catch (error: any) {
    console.error("Error fetching my referral data:", error);
    sendEncryptedResponse(res, 500, { success: false, message: "Failed to fetch referral data." });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /users/:id/referral-bookings
   Returns bookings that came via this user's referral code.
   ───────────────────────────────────────────────────────────── */
export const getReferralBookings: RequestHandler = async (req, res): Promise<void> => {
  const { id } = req.params as { id?: string };

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    sendEncryptedResponse(res, 400, { success: false, message: "Invalid user id." });
    return;
  }

  try {
    const referrerId = new mongoose.Types.ObjectId(id);

    const bookings = await UserReferralBooking.find({ referrerId })
      .sort({ createdAt: -1 })
      .lean();

    sendEncryptedResponse(res, 200, {
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
  } catch (error: any) {
    console.error("Error fetching referral bookings:", error);
    sendEncryptedResponse(res, 500, { success: false, message: "Failed to fetch referral bookings." });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /users/:id/apply-referral
   Body (decrypted): { code: "ABCDE12345" }
   Saves the referrer to the user's profile for 24 hours.
   ───────────────────────────────────────────────────────────── */
export const applyUserReferral: RequestHandler = async (req, res): Promise<void> => {
  const { id } = req.params as { id?: string };
  const { code } = req.body || {};

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    sendEncryptedResponse(res, 400, { success: false, message: "Invalid user id." });
    return;
  }
  if (!code || typeof code !== "string" || code.length < 3) {
    sendEncryptedResponse(res, 400, { success: false, message: "Invalid referral code." });
    return;
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      sendEncryptedResponse(res, 404, { success: false, message: "User not found." });
      return;
    }

    if (user.userReferralCode === code.toUpperCase()) {
      sendEncryptedResponse(res, 400, { success: false, message: "You cannot apply your own referral code." });
      return;
    }

    // Idempotency: if a valid (non-expired) referral already exists, skip overwrite
    if (
      user.userReferral?.referrerId &&
      user.userReferral.expiresAt &&
      new Date() < new Date(user.userReferral.expiresAt)
    ) {
      sendEncryptedResponse(res, 200, {
        success: true,
        message: "Referral already active.",
        expiresAt: user.userReferral.expiresAt,
      });
      return;
    }

    const referrer = await User.findOne({ userReferralCode: code.toUpperCase() });
    if (!referrer) {
      sendEncryptedResponse(res, 404, { success: false, message: "Invalid referral code. Referrer not found." });
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

    sendEncryptedResponse(res, 200, {
      success: true,
      message: "Referral code applied successfully. Valid for 24 hours.",
      expiresAt,
    });
  } catch (error: any) {
    console.error("Error applying referral code:", error);
    sendEncryptedResponse(res, 500, { success: false, message: "Failed to apply referral code." });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /users/:id/payout-request
   Allows a user to request a payout of their referral earnings.
   Only allowed between 1st and 6th of the month.
   ───────────────────────────────────────────────────────────── */
export const requestReferralPayout: RequestHandler = async (req, res): Promise<void> => {
  const { id } = req.params as { id?: string };

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    sendEncryptedResponse(res, 400, { success: false, message: "Invalid user id." });
    return;
  }

  try {
    const date = new Date().getDate();
    if (date < 1 || date > 17) {
      sendEncryptedResponse(res, 400, {
        success: false,
        message: "Payout requests are only allowed between the 1st and 6th of the month.",
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      sendEncryptedResponse(res, 404, { success: false, message: "User not found." });
      return;
    }

    const earnings = user.referralEarnings || 0;
    if (earnings <= 0) {
      sendEncryptedResponse(res, 400, { success: false, message: "No earnings available for payout." });
      return;
    }

    const requestDoc = await ReferralPayoutRequest.create({
      userId: user._id,
      userName: `${user.given_name || ""} ${user.family_name || ""}`.trim() || "User",
      userPhone: user.phone || "Unknown",
      amountRequested: earnings,
      status: "Pending",
    });

    sendEncryptedResponse(res, 200, {
      success: true,
      message: "Payout request recorded successfully.",
      requestDetails: {
        amount: earnings,
        userName: requestDoc.userName,
        userPhone: requestDoc.userPhone,
        userId: String(user._id),
      },
    });
  } catch (error: any) {
    console.error("Error creating payout request:", error);
    sendEncryptedResponse(res, 500, { success: false, message: "Failed to create payout request." });
  }
};
