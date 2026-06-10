"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserDeleteController_1 = require("../../controller/userApp/UserDeleteController");
const router = (0, express_1.Router)();
router.post("/delete-account", UserDeleteController_1.sendUserOtp);
router.post("/verify-otp-and-delete", UserDeleteController_1.verifyOtpAndDeleteUser);
exports.default = router;
