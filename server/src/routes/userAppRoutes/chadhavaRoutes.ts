import express, { Request, Response, NextFunction } from "express";
import {
  getChadhavas,
  getChadhavaBySlug,
  getChadhavaQuote,
  createChadhavaOrder,
  completeChadhavaPayment,
  chadhavaWebhook,
  getChadhavaBookings,
} from "../../controller/userApp/chadhavaController";

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
router.post("/chadhava-bookings/webhook", wrap(chadhavaWebhook));

// Bookings
router.get("/chadhava-bookings", wrap(getChadhavaBookings));

export default router;
