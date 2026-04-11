import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import axios from "axios";
import jwt from "jsonwebtoken";
import panditModel, { IPandit } from "../../models/panditApp/panditModel";



export const JWT_SECRET = process.env.JWT_SECRET ?? "supersecretkey";
export const JWT_EXPIRES = "7d";

/** Generate n-digit numeric OTP (default 4 digits) */
export const generateOtp = (length = 4): string =>
  crypto.randomInt(0, 10 ** length).toString().padStart(length, "0");

/** Return a Date exactly `minutes` in the future (default 1 min) */
export const getExpiry = (minutes = 1): Date =>
  new Date(Date.now() + minutes * 60 * 1000);

export const asyncHandler =
  <T>(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
  ) =>
    (req: Request, res: Response, next: NextFunction) =>
      fn(req, res, next).catch(next);



  
export const sendOtpPandit = asyncHandler(async (req, res) => {
  const { phone } = req.body as { phone?: string };

  /* basic validation */
  if (!phone || phone.length !== 10) {
    return res.status(400).json({ message: "Invalid phone number." });
  }

  /* find pandit */
  const pandit: IPandit | null = await panditModel.findOne({ mobile: phone });
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
  const otp = generateOtp();
  pandit.otp = await bcrypt.hash(otp, 10);
  pandit.otpExpiry = getExpiry(1);          // 1-minute validity
  await pandit.save();

  /* Send via Fast2SMS */
  const { FAST2SMS_API_KEY, FAST2SMS_SENDER_ID, FAST2SMS_TEMPLATE_ID } =
    process.env;

  const url =
    `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}` +
    `&route=dlt&sender_id=${FAST2SMS_SENDER_ID}&message=${FAST2SMS_TEMPLATE_ID}` +
    `&variables_values=${otp}|1&flash=0&numbers=${phone}`;

  await axios.get(url); // ignore response body

  return res.status(200).json({ message: "OTP sent successfully." });
});





export const verifyOtpPandit = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body as { phone?: string; otp?: string };

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone and OTP are required." });
  }

  const pandit = await panditModel.findOne({ mobile: phone });
  if (!pandit || !pandit.otp || !pandit.otpExpiry) {
    return res.status(400).json({ message: "OTP not requested." });
  }

  /* expiry check */
  if (pandit.otpExpiry < new Date()) {
    return res.status(400).json({ message: "OTP expired." });
  }

  /* compare */
  const ok = await bcrypt.compare(otp, pandit.otp);
  if (!ok) {
    return res.status(400).json({ message: "Incorrect OTP." });
  }

  /* clear OTP fields */
  pandit.otp = undefined;
  pandit.otpExpiry = undefined;
  await pandit.save();

  /* issue JWT */
  const token = jwt.sign({ id: pandit._id, role: "pandit" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });

  return res.status(200).json({ token, pandit });
});
