import { Router } from "express";
import { razorpayWebhook } from "../../controller/payments/razorpayWebhookController";

const router = Router();

// POST /api/payments/razorpay/webhook
// NOTE: no decryptRequest / auth middleware here — Razorpay signs the raw body
// with RAZORPAY_WEBHOOK_SECRET and that HMAC is the authentication.
router.post("/razorpay/webhook", razorpayWebhook);

export default router;
