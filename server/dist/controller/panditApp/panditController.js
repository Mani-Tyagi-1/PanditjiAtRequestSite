"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPanditLocation = exports.getLocationSuggestions = exports.fetchPanditById = exports.fetchAllPandit = exports.createPandit = exports.verifyOtpAndDeleteAccount = exports.sendOtp = exports.getAllPandits = void 0;
const panditModel_1 = __importDefault(require("../../model/panditApp/panditModel"));
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const axios_1 = __importDefault(require("axios"));
// Controller to fetch all pandits
const getAllPandits = async (req, res) => {
    try {
        // Fetch all pandits from the database
        const pandits = await panditModel_1.default.find();
        // Return the response with the list of pandits
        return res.status(200).json({
            success: true,
            data: pandits,
        });
    }
    catch (error) {
        // Handle any error that occurs while fetching
        return res.status(500).json({
            success: false,
            message: "Error fetching pandits",
            //   error: error.message,
        });
    }
};
exports.getAllPandits = getAllPandits;
const normalizePhone = (phone) => {
    return phone.replace(/[^\d]/g, ""); // Remove non-digit characters
};
// OTP generation
const generateOtp = () => {
    return crypto_1.default.randomInt(100000, 999999).toString(); // 6 digit OTP
};
// Expiry time for OTP (5 minutes)
const getExpiry = (minutes) => {
    return new Date(Date.now() + minutes * 60000); // Add the specified minutes
};
// Main function to send OTP for Pandit account deletion
const sendOtp = async (req, res) => {
    try {
        // Get the phone number from the request body
        const { phone } = req.body;
        if (!phone || phone.length !== 10) {
            return res.status(400).json({ message: "Invalid phone number format." });
        }
        // Normalize the phone number (remove any non-digit characters)
        const normalizedPhone = normalizePhone(phone);
        // Find the Pandit by the phone number
        const pandit = await panditModel_1.default.findOne({ mobile: normalizedPhone });
        if (!pandit) {
            return res.status(404).json({
                success: false,
                message: "Pandit not found with the provided phone number.",
            });
        }
        // Generate OTP and hash it
        const otp = generateOtp();
        const otpHash = await bcryptjs_1.default.hash(otp, 10);
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
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${authKey}` +
            `&route=dlt&sender_id=${senderId}&message=${templateId}` +
            `&variables_values=${otp}|1&flash=0&numbers=${normalizedPhone}`;
        // Sending OTP via Fast2SMS API
        await axios_1.default.get(url);
        // Return a success message
        return res.status(200).json({ message: "OTP sent successfully" });
    }
    catch (err) {
        console.error("Error sending OTP:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.sendOtp = sendOtp;
const verifyOtpAndDeleteAccount = async (req, res) => {
    const { phone, otp } = req.body; // Get phone and OTP from the request body
    try {
        const normalizedPhone = normalizePhone(phone);
        const pandit = await panditModel_1.default.findOne({ mobile: normalizedPhone });
        if (!pandit) {
            return res.status(404).json({
                success: false,
                message: "Pandit not found with the provided phone number.",
            });
        }
        if (!pandit.otp) {
            return res.status(400).json({
                success: false,
                message: "OTP not requested. Please request an OTP first.",
            });
        }
        // Compare the received OTP with the stored (hashed) OTP
        const isOtpValid = await bcryptjs_1.default.compare(otp, pandit.otp);
        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }
        // Check if OTP has expired
        if (!pandit.otpExpiry || new Date() > new Date(pandit.otpExpiry)) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }
        // Delete the Pandit account after OTP validation
        await panditModel_1.default.deleteOne({ _id: pandit._id });
        return res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });
    }
    catch (error) {
        console.error("Error verifying OTP and deleting account:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.verifyOtpAndDeleteAccount = verifyOtpAndDeleteAccount;
const createPandit = async (req, res) => {
    try {
        const { prefix, firstName, lastName, age, gender, dateOfBirth, languages, introduction, skills, systemKnown, pujaCategory, pujaGods, experience, email, mobile, city, state, country, profileImage, degreeCard, aadharCard, panCard, isVerified, } = req.body;
        // Validate required fields
        if (!firstName ||
            !lastName ||
            !email ||
            !mobile ||
            !city ||
            !state ||
            !country) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }
        // Create a new Pandit document
        const newPandit = new panditModel_1.default({
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
    }
    catch (error) {
        console.error("Error creating pandit:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating Pandit",
        });
    }
};
exports.createPandit = createPandit;
// Main function to fetch all pandits
const fetchAllPandit = async (req, res) => {
    try {
        const pandits = await panditModel_1.default.find();
        return res.status(200).json({
            success: true,
            data: pandits,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching pandits",
        });
    }
};
exports.fetchAllPandit = fetchAllPandit;
// Fetch a single pandit by ID
const fetchPanditById = async (req, res) => {
    try {
        const { id } = req.params;
        const pandit = await panditModel_1.default.findById(id);
        if (!pandit) {
            return res.status(404).json({
                success: false,
                message: "Pandit not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: pandit,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching pandit",
        });
    }
};
exports.fetchPanditById = fetchPanditById;
// Get location suggestions (placeholder implementation)
const getLocationSuggestions = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            data: [],
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching location suggestions",
        });
    }
};
exports.getLocationSuggestions = getLocationSuggestions;
// Get a pandit's current location
const getPanditLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const pandit = await panditModel_1.default.findById(id).select("location");
        if (!pandit) {
            return res.status(404).json({
                success: false,
                message: "Pandit not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: pandit.location,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching pandit location",
        });
    }
};
exports.getPanditLocation = getPanditLocation;
