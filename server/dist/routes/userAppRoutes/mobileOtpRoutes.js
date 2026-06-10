"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mobileOtpController_1 = require("../../controller/userApp/mobileOtpController");
const router = (0, express_1.Router)();
router.post("/send-otp", mobileOtpController_1.sendOtp);
router.post("/verify-otp", mobileOtpController_1.verifyOtp);
router.post("/login-by-phone", mobileOtpController_1.loginByPhone);
exports.default = router;
