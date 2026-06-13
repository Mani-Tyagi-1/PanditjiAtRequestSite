// controller/Vedic-Vaibhav/userController.ts
import { RequestHandler } from "express";
import User from "../../model/userApp/userModel";
import poojaBookingModel from "../../model/poojaBooking/poojaBooking.model";
import { sendEncryptedResponse } from "../../utils/encryption"; // ⬅️ encrypt GET responses

/**
 * Update a user's profile
 * NOTE: Body is expected to be decrypted already by decryptRequest middleware.
 */
export const updateUserProfile: RequestHandler = async (req, res) => {
  const { id } = req.params as { id: string };
  const { phone, gender, firstname, lastname, email, dob, birthTime, birthPlace, gotra } = (req.body || {}) as {
    phone?: string;
    gender?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    dob?: string;
    birthTime?: string;
    birthPlace?: string;
    gotra?: string;
  };

  if (!phone || !gender || !firstname || !lastname || !dob) {
    res.status(400).json({ message: "Please fill all fields !" });
    return;
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.phone = phone;
    user.gender = gender;
    user.given_name = firstname;
    user.family_name = lastname;
    user.dob = dob;
    if (birthTime !== undefined) user.birthTime = birthTime;
    if (birthPlace !== undefined) user.birthPlace = birthPlace;
    if (gotra !== undefined) user.gotra = gotra;
    if (email !== undefined) user.email = email;

    

    try {
      await user.save();
      // Per your rule, update (PUT) responses remain plaintext
      res.status(200).json({ message: "Profile updated successfully", user });
      return;
    } catch (err: any) {
      if (err?.code === 11000 && (err?.keyPattern?.phone || err?.keyValue?.phone)) {
        res.status(409).json({ message: "This phone number is already in use." });
        return;
      }
      console.error("Error saving updated profile:", err);
      res.status(500).json({ message: "Error updating profile", error: err });
      return;
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error });
  }
};

/**
 * Get user by userId (Mongo _id)
 * NOTE: All GET responses are encrypted using sendEncryptedResponse.
 */
// FILE: controller/user.ts (or wherever getUserByUserId is defined)

// Still use RequestHandler, but the body must not return a Response object.

export const getUserByUserId: RequestHandler = async (req, res) => {
  const { userId } = req.params as { userId?: string };
  console.log("kuchbhi",userId);
  
  if (!userId) {
    // ❌ OLD: return sendEncryptedResponse(res, 400, { message: "userId is required" });
    sendEncryptedResponse(res, 400, { message: "userId is required" });
    return; // Optionally add a bare return to exit the function early
  }

  try {
    // ...
    const user = await User.findById(userId);
    
    if (!user) {
      // ❌ OLD: return sendEncryptedResponse(res, 404, { message: "User not found" });
      sendEncryptedResponse(res, 404, { message: "User not found" });
      return;
    }
    
    // ❌ OLD: return sendEncryptedResponse(res, 200, { user });
    sendEncryptedResponse(res, 200, { user });
    
  } catch (error) {
    console.error("Error fetching user by userId:", error);
    
    // ❌ OLD: return sendEncryptedResponse(res, 500, { message: "..." });
    sendEncryptedResponse(res, 500, { message: "Error fetching user details", error });
  }
  // The function implicitly returns Promise<void> here.
};

/**
 * Read-only lookup of a user by phone number.
 * Does NOT create users. Returns user data + completed booking count.
 * GET /users/lookup-by-phone/:phone
 */
export const lookupUserByPhone: RequestHandler = async (req, res) => {
  const { phone } = req.params as { phone: string };
  const cleaned = String(phone || "").replace(/\D/g, "").slice(-10);

  if (!cleaned || cleaned.length !== 10) {
    res.status(400).json({ exists: false, user: null, bookingCount: 0 });
    return;
  }

  try {
    const user = await User.findOne({ phone: cleaned }).select(
      "name email phone gotra given_name family_name addedOn"
    );

    if (!user) {
      res.status(200).json({ exists: false, user: null, bookingCount: 0 });
      return;
    }

    const bookingCount = await poojaBookingModel.countDocuments({ userId: user._id });

    res.status(200).json({ exists: true, user, bookingCount });
  } catch (error) {
    console.error("Error looking up user by phone:", error);
    res.status(500).json({ exists: false, user: null, bookingCount: 0 });
  }
};

