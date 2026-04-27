import { Router } from "express";
import { sendUserOtp, verifyOtpAndDeleteUser } from "../controllers/UserController";

const router = Router();

router.post("/delete-account", sendUserOtp);
router.post("/verify-otp-and-delete", verifyOtpAndDeleteUser);

export default router;
