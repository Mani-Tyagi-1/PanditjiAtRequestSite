"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const panditAuthController_1 = require("../../controller/panditApp/panditAuthController");
const helpers_1 = require("../../utils/helpers");
const router = (0, express_1.Router)();
router.post("/pandit/send-otp", (0, helpers_1.asyncHandler)(panditAuthController_1.sendOtpPandit));
router.post("/pandit/verify-otp", (0, helpers_1.asyncHandler)(panditAuthController_1.verifyOtpPandit));
exports.default = router;
