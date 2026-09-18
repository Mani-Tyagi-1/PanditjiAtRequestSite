  import express, { Request, Response, NextFunction } from "express";
import {
  getChadhavas,
  getChadhavaBySlug,
  getChadhavaQuote,
  createChadhavaOrder,
  completeChadhavaPayment,
  getChadhavaBookings,
  getUserChadhavaBookings,
} from "../../controller/userApp/chadhavaController";
import { razorpayWebhook } from "../../controller/payments/razorpayWebhookController";

const router = express.Router();

const wrap =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };

// Catalog
router.get("/chadhavas", wrap(getChadhavas));
router.post("/chadhavas/:slug/quote", wrap(getChadhavaQuote));
router.get("/chadhavas/:slug", wrap(getChadhavaBySlug));

// Payment flow
router.post("/chadhava-bookings/create-order", wrap(createChadhavaOrder));
router.post("/chadhava-bookings/complete-payment", wrap(completeChadhavaPayment));
// Legacy webhook URL — kept alive in case it's still the one configured in the
// Razorpay dashboard. It now runs the SHARED dispatcher, so a puja/shop/
// consultation payment arriving here still gets reconciled instead of silently
// falling through. New setups should use /api/payments/razorpay/webhook.
router.post("/chadhava-bookings/webhook", wrap(razorpayWebhook));

// Bookings
router.get("/chadhava-bookings", wrap(getChadhavaBookings));
router.get("/chadhava-bookings/user/:phone", wrap(getUserChadhavaBookings));

export default router;
