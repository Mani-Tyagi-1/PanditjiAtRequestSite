"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const panditController_1 = require("../../controller/panditApp/panditController");
const router = (0, express_1.Router)();
// Define the route to get all pandits
router.get("/pandits", panditController_1.getAllPandits);
// Route to request account deletion (OTP sent)
router.post("/delete-account", panditController_1.sendOtp);
// Route to verify OTP and delete account
router.post('/verify-otp-and-delete', panditController_1.verifyOtpAndDeleteAccount);
router.post("/create", panditController_1.createPandit);
exports.default = router;
