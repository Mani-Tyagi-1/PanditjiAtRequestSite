import { Request, Response } from "express";
import User from "../../model/userApp/userModel";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import axios from "axios";

const normalizePhone = (phone: string): string =>
  phone.replace(/[^\d]/g, "");

const generateOtp = (): string =>
  crypto.randomInt(100000, 999999).toString();

const getExpiry = (minutes: number): Date =>
  new Date(Date.now() + minutes * 60000);

export const sendUserOtp = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number format." });
    }

    const normalizedPhone = normalizePhone(phone);
    const user = await User.findOne({ phone: normalizedPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with the provided phone number.",
      });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = getExpiry(5);

    user.otp = otpHash;
    user.otpExpiry = otpExpiry;
    await user.save();

    const authKey = process.env.FAST2SMS_API_KEY;
    const senderId = process.env.FAST2SMS_SENDER_ID;
    const templateId = process.env.FAST2SMS_TEMPLATE_ID;

    const url =
      `https://www.fast2sms.com/dev/bulkV2?authorization=${authKey}` +
      `&route=dlt&sender_id=${senderId}&message=${templateId}` +
      `&variables_values=${otp}|1&flash=0&numbers=${normalizedPhone}`;

    await axios.get(url);

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (err: any) {
    console.error("Error sending OTP:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyOtpAndDeleteUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { phone, otp } = req.body;

  try {
    const normalizedPhone = normalizePhone(phone);
    const user = await User.findOne({ phone: normalizedPhone });

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

    const isOtpValid = await bcrypt.compare(otp, user.otp);

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (new Date() > new Date(user.otpExpiry!)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    await User.deleteOne({ _id: user._id });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error verifying OTP and deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
