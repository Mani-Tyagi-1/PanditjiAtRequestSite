import { Request, Response } from "express";
import Pandit from "../models/PanditModel";
import crypto from "crypto";
import bcrypt from "bcrypt";
import axios from "axios";
import { isConditionalExpression } from "typescript";

// Controller to fetch all pandits
export const getAllPandits = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Fetch all pandits from the database
    const pandits = await Pandit.find();

    // Return the response with the list of pandits
    return res.status(200).json({
      success: true,
      data: pandits,
    });
  } catch (error) {
    // Handle any error that occurs while fetching
    return res.status(500).json({
      success: false,
      message: "Error fetching pandits",
    //   error: error.message,
    });
  }
};



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
    // Get the Pandit ID from the URL
    const panditId = req.params.id;

    // Find the Pandit by the provided ID
    let pandit = await Pandit.findById(panditId);

    if (!pandit) {
      return res.status(404).json({
        success: false,
        message: "Pandit not found with the provided ID.",
      });
    }

    // Get the phone number from the found Pandit document
    const rawPhone = String(pandit.mobile || "");
    const digits = (rawPhone.match(/\d/g) || []).join("");
    if (digits.length !== 10) {
      return res
        .status(400)
        .json({ message: "Invalid phone number in Pandit document" });
    }

    // Normalize phone number
    const normalized = normalizePhone(digits);

    // Generate OTP and hash it
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    // Set OTP expiry time (5 minutes from now)
    const otpExpiry = getExpiry(5);

    // Store OTP and OTP expiry time in the Pandit document
    pandit.otp = otpHash;
    pandit.otpExpiry = otpExpiry;

    // Save the updated Pandit document
    await pandit.save();

    // Prepare Fast2SMS parameters
    const authKey = process.env.FAST2SMS_API_KEY;
    const senderId = process.env.FAST2SMS_SENDER_ID;
    const templateId = process.env.FAST2SMS_TEMPLATE_ID;

    // Constructing the URL for Fast2SMS API
    const url =
      `https://www.fast2sms.com/dev/bulkV2?authorization=${authKey}` +
      `&route=dlt&sender_id=${senderId}&message=${templateId}` +
      `&variables_values=${otp}|1&flash=0&numbers=${normalized}`;

    // Sending OTP via Fast2SMS API
    await axios.get(url);

    // Return a success message
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (err: any) {
    console.error("Error sending OTP:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyOtpAndDeleteAccount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const { otp } = req.body;

  try {
    const pandit = await Pandit.findById(id);

    if (!pandit) {
      return res.status(404).json({
        success: false,
        message: "Pandit not found",
      });
    }

    console.log("Stored OTP:", pandit.otp);
    console.log("Received OTP:", otp);

    // Compare the received OTP with the stored (hashed) OTP
    const isOtpValid = await bcrypt.compare(otp, pandit.otp);

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check if OTP has expired
    if (new Date() > new Date(pandit.otpExpiry)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Delete the Pandit account after OTP validation
    await Pandit.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error verifying OTP and deleting account:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


export const createPandit = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      prefix,
      firstName,
      lastName,
      age,
      gender,
      dateOfBirth,
      languages,
      introduction,
      skills,
      systemKnown,
      pujaCategory,
      pujaGods,
      experience,
      email,
      mobile,
      city,
      state,
      country,
      profileImage,
      degreeCard,
      aadharCard,
      panCard,
      isVerified,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !mobile ||
      !city ||
      !state ||
      !country
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Create a new Pandit document
    const newPandit = new Pandit({
      prefix,
      firstName,
      lastName,
      age,
      gender,
      dateOfBirth,
      languages,
      introduction,
      skills,
      systemKnown,
      selectedSystemKnown: "",
      pujaCategory,
      pujaGods,
      astroCategory: [],
      experience,
      email,
      mobile,
      city,
      state,
      country,
      profileImage,
      degreeCard,
      aadharCard,
      panCard,
      isVerified,
    });

    // Save the new Pandit to the database
    await newPandit.save();

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Pandit created successfully",
      data: newPandit,
    });
  } catch (error) {
    console.error("Error creating pandit:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating Pandit",
    });
  }
};

