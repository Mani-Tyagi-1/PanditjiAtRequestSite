"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/Vedic-Vaibhav/userRoute.ts
const express_1 = require("express");
const userController_1 = require("../../controller/userApp/userController"); // ⬅️ update path if needed
const encryption_1 = require("../../utils/encryption");
const router = (0, express_1.Router)();
/**
 * @route   PUT /users/profile/:id
 * @desc    Update a user's profile
 * @body    { phone, gender, firstname, lastname, dob, email? }
 */
router.put("/updateProfile/:id", encryption_1.decryptRequest, userController_1.updateUserProfile);
/**
 * @route   GET /users/:userId
 * @desc    Get user by Mongo _id
 */
router.get("/profile/:userId", userController_1.getUserByUserId);
/**
 * @route   GET /users/lookup-by-phone/:phone
 * @desc    Read-only lookup — returns user data + booking count (no user creation)
 */
router.get("/lookup-by-phone/:phone", userController_1.lookupUserByPhone);
exports.default = router;
