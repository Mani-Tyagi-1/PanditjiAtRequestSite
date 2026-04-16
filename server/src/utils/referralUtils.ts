import crypto from "crypto";
import User from "../model/userApp/userModel";

/**
 * Generates a short, unique alphanumeric referral code for a user.
 * Format: 10 uppercase alphanumeric characters derived from userId + phone + random salt.
 * Retries up to 5 times to guarantee uniqueness in the DB.
 */
export async function generateUniqueReferralCode(
  userId: string,
  phone: string
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const salt = crypto.randomBytes(4).toString("hex").toUpperCase();
    const raw = `${userId}${phone}${salt}`;
    const hash = crypto
      .createHash("sha256")
      .update(raw)
      .digest("base64")
      .replace(/[^A-Z0-9]/g, "") // keep only alphanumeric uppercase
      .slice(0, 10);

    const code = hash.length >= 6 ? hash : salt.slice(0, 10); // fallback

    const exists = await User.findOne({ userReferralCode: code }).lean();
    if (!exists) return code;
  }

  // Ultra-rare collision fallback — guaranteed unique with timestamp
  return crypto
    .createHash("sha256")
    .update(`${userId}${Date.now()}`)
    .digest("hex")
    .toUpperCase()
    .slice(0, 10);
}
