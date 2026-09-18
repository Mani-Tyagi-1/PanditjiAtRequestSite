// routes/Vedic-Vaibhav/userRoute.ts
import { Router } from "express";
import {
  updateUserProfile,
  getUserByUserId,
  lookupUserByPhone,
  findOrRegisterGuest,
} from "../../controller/userApp/userController"; // ⬅️ update path if needed
import { decryptRequest } from "../../utils/encryption";

const router = Router();

/**
 * @route   PUT /users/profile/:id
 * @desc    Update a user's profile
 * @body    { phone, gender, firstname, lastname, dob, email? }
 */
router.put("/updateProfile/:id", decryptRequest ,updateUserProfile);

/**
 * @route   GET /users/:userId
 * @desc    Get user by Mongo _id
 */
router.get("/profile/:userId", getUserByUserId);

/**
 * @route   GET /users/lookup-by-phone/:phone
 * @desc    Read-only lookup — returns user data + booking count (no user creation)
 */
router.get("/lookup-by-phone/:phone", lookupUserByPhone);

/**
 * @route   POST /users/find-or-register-guest
 * @desc    Find existing user or create a guest record
 */
router.post("/find-or-register-guest", findOrRegisterGuest);

export default router;
