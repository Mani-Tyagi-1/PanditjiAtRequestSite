import { Router } from "express";
import { sendUserOtp, verifyOtpAndDeleteUser } from "../../controller/userApp/UserDeleteController";

const router = Router();

router.post("/delete-account", sendUserOtp);
router.post("/verify-otp-and-delete", verifyOtpAndDeleteUser);
router.get("/quota", (req, res) => {
  res.json({
    success: true,
    quota: {
      total: 1000,
      used: 0,
      remaining: 1000,
      unlimited: true,
    },
  });
});

export default router;
