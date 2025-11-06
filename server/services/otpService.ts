import axios from "axios";
import { Request, Response } from "express";
import Pandit from "../models/PanditModel"; // Import your Pandit model
import bcrypt from "bcrypt";
import crypto from "crypto";

// Function to normalize phone numbers (same logic as before)
const normalizePhone = (phone: string): string => {
  return phone.replace(/[^\d]/g, ""); // Remove non-digit characters
};

// OTP generation
const generateOtp = (): string => {
  return crypto.randomInt(100000, 999999).toString(); // 6 digit OTP
};

// Expiry time for OTP (5 minutes)
const getExpiry = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60000); // Add the specified minutes
};

// Main function to send OTP for Pandit account deletion
export const sendOtp = async (req: Request, res: Response) => {
  try {
    const rawPhone = String(req.body.phone || "");
    const digits = (rawPhone.match(/\d/g) || []).join("");
    if (digits.length !== 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }
    const normalized = normalizePhone(digits);

    const { isNotifyOkay } = req.body;
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10); // Hash the OTP
    const otpExpiry = getExpiry(5); // OTP expires in 5 minutes

    let pandit = await Pandit.findOne({ mobile: normalized });

    if (!pandit) {
      return res.status(404).json({
        success: false,
        message: "Pandit not found with the provided phone number.",
      });
    }

    // Store OTP and its expiry time in the Pandit document
    pandit.otp = otpHash;
    pandit.otpExpiry = otpExpiry;

    // Save the updated Pandit document with OTP info
    await pandit.save();

    const authKey = process.env.FAST2SMS_API_KEY;
    const senderId = process.env.FAST2SMS_SENDER_ID;
    const templateId = process.env.FAST2SMS_TEMPLATE_ID;

    // Constructing the URL for Fast2SMS API to send OTP
    const url =
      `https://www.fast2sms.com/dev/bulkV2?authorization=${authKey}` +
      `&route=dlt&sender_id=${senderId}&message=${templateId}` +
      `&variables_values=${otp}|1&flash=0&numbers=${digits}`;

    // Sending OTP via Fast2SMS API
    await axios.get(url);

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (err: any) {
    console.error("Error sending OTP:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
