import { Router } from "express";
import { sendOtp, verifyOtp, loginByPhone } from "../../controller/userApp/mobileOtpController";
import { sendEmailOtp, verifyEmailOtp } from "../../controller/userApp/emailOtpController";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login-by-phone", loginByPhone);

// ── Email sign-in, for devotees the SMS gateway cannot reach ──
// Our OTP provider only delivers to Indian numbers, so anyone abroad has no
// way to prove who they are and no way to see the booking they just paid for.
// Same handshake, carried over SMTP. India's phone flow is unaffected.
router.post("/email-otp/send", sendEmailOtp);
router.post("/email-otp/verify", verifyEmailOtp);
export default router;