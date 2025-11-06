import { Router } from "express";
import {
  createPandit,
  getAllPandits,
  sendOtp,
  verifyOtpAndDeleteAccount,
} from "../controllers/PanditController";

const router = Router();

// Define the route to get all pandits
router.get("/pandits", getAllPandits);

// Route to request account deletion (OTP sent)
router.post("/delete-account/:id", sendOtp);

// Route to verify OTP and delete account
router.post('/verify-otp-and-delete/:id', verifyOtpAndDeleteAccount);

router.post("/create", createPandit);

export default router;
