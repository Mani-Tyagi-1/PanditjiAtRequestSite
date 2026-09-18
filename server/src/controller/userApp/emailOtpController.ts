import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../model/userApp/userModel";
import { resolveUser, normalizeEmail } from "../../utils/resolveUser";
import { sendOtpEmail } from "../../utils/emailService";
import { JWT_SECRET, JWT_EXPIRES_IN } from "./mobileOtpController";

/**
 * Sign-in by email, for devotees the SMS gateway cannot reach.
 *
 * Our OTP provider only delivers to Indian numbers, so a devotee abroad has no
 * way to prove who they are and therefore no way to see the booking they just
 * paid for. Email is the one channel that works everywhere, so this is the
 * same OTP handshake with the message carried over SMTP instead.
 *
 * Deliberately a MIRROR of `mobileOtpController`, not a replacement:
 *   • the same `otp` / `otpExpiry` fields on the user
 *   • the same bcrypt-hashed code, never stored in the clear
 *   • the same `{ token, user }` response, so the frontend's existing
 *     `login(token, user)` works unchanged
 * India's phone flow is untouched — both can be live at once, and a devotee
 * with a number AND an email can use whichever reaches them.
 */

/** Six digits, not the phone flow's four: an inbox is a likelier brute-force target. */
const OTP_LENGTH = 6;

/**
 * Ten minutes, against the SMS flow's one.
 *
 * Mail is not instant — greylisting, spam filtering and a slow client can each
 * add minutes — and a code that expires before it is read is worse than no code
 * at all. Long enough to be usable, short enough to be worth little if leaked.
 */
const OTP_TTL_MINUTES = 10;

/**
 * Minimum gap between sends to one address.
 *
 * Without it this endpoint is an open relay pointed at anyone's inbox, and our
 * sending reputation is the thing that pays for it.
 */
const RESEND_COOLDOWN_MS = 60 * 1000;

const genOtp = (): string =>
  String(Math.floor(Math.random() * 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

/** In-memory, per-address. Resets on deploy, which is an acceptable trade. */
const lastSentAt = new Map<string, number>();

/**
 * POST /email-otp/send
 *
 * Creates the account if this is a first-time devotee, because abroad there is
 * no other way for one to exist — they cannot have signed up by SMS.
 */
export const sendEmailOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      res.status(400).json({ success: false, message: "A valid email address is required" });
      return;
    }

    const since = Date.now() - (lastSentAt.get(email) ?? 0);
    if (since < RESEND_COOLDOWN_MS) {
      res.status(429).json({
        success: false,
        message: `Please wait ${Math.ceil((RESEND_COOLDOWN_MS - since) / 1000)}s before requesting another code`,
      });
      return;
    }

    // Shared resolver: matches an existing devotee by email before creating,
    // so signing in here never mints a second account for someone who already
    // booked with this address.
    const resolved = await resolveUser({
      email,
      name: req.body?.name,
      countryCode: req.body?.countryCode,
      country: req.body?.country,
    });
    if (!resolved) {
      res.status(400).json({ success: false, message: "A valid email address is required" });
      return;
    }

    const otp = genOtp();
    await User.updateOne(
      { _id: resolved.user._id },
      {
        $set: {
          otp: await bcrypt.hash(otp, 10),
          otpExpiry: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
        },
      },
    );

    const sent = await sendOtpEmail({ to: email, otp, minutes: OTP_TTL_MINUTES });
    if (!sent) {
      // The code is stored but undeliverable. Say so rather than leaving the
      // devotee waiting for mail that is never coming.
      res.status(502).json({
        success: false,
        message: "We could not send the code right now. Please try again in a moment.",
      });
      return;
    }

    lastSentAt.set(email, Date.now());
    res.status(200).json({
      success: true,
      message: `Code sent to ${email}`,
      isNewUser: !resolved.existed,
    });
  } catch (err: any) {
    console.error("[emailOtp] send failed:", err?.message || err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * POST /email-otp/verify
 *
 * Returns the same `{ token, user }` shape as `verifyOtp`, so the frontend's
 * existing `login()` needs no special case for email sign-in.
 */
export const verifyEmailOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp ?? "").trim();

    if (!email || !otp) {
      res.status(400).json({ success: false, message: "Email and code are required" });
      return;
    }

    // Case-insensitive, matching how the resolver looks accounts up.
    const user = await User.findOne({
      email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    }).sort({ addedOn: 1, _id: 1 });

    if (!user || !user.otp || !user.otpExpiry) {
      res.status(400).json({ success: false, message: "No code was requested for this email" });
      return;
    }
    if (user.otpExpiry < new Date()) {
      res.status(400).json({ success: false, message: "That code has expired — please request a new one" });
      return;
    }
    if (!(await bcrypt.compare(otp, user.otp))) {
      res.status(400).json({ success: false, message: "Incorrect code" });
      return;
    }

    // Single-use: clear before issuing the token, so a replayed request cannot
    // mint a second session. `updateOne` skips document validation, which would
    // otherwise reject older accounts missing a now-required field.
    await User.updateOne(
      { _id: user._id },
      { $unset: { otp: "", otpExpiry: "" }, $set: { email_verified: true } },
    );
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.email_verified = true;

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(200).json({ success: true, token, user });
  } catch (err: any) {
    console.error("[emailOtp] verify failed:", err?.message || err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
