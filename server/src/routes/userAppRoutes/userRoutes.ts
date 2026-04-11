// routes/Vedic-Vaibhav/userRoute.ts
import { Router } from "express";
import {
  updateUserProfile,
  getUserByUserId,
} from "../../controllers/userApp/userController"; // ⬅️ update path if needed
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

export default router;
