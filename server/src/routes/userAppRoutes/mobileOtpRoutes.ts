import { Router } from "express";
import { sendOtp, verifyOtp, loginByPhone } from "../../controller/userApp/mobileOtpController";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login-by-phone", loginByPhone);
export default router;