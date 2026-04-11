import { Router } from "express";
import { sendOtpPandit, verifyOtpPandit } from "../../controllers/panditApp/panditAuthController";
import { asyncHandler } from "../../utils/helpers";

const router = Router();

router.post("/pandit/send-otp", asyncHandler(sendOtpPandit));
router.post("/pandit/verify-otp", asyncHandler(verifyOtpPandit));

export default router;
