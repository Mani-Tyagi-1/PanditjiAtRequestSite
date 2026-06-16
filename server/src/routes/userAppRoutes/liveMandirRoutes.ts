import express, { Request, Response, NextFunction } from "express";
import {
  getLivePujas,
  getLivePujaBySlug,
  getLiveBookings,
  getUserLiveBookings,
} from "../../controller/userApp/liveMandirController";

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

// Catalog (still needed for the Live Mandir listing UI)
router.get("/live-mandir-pujas", wrap(getLivePujas));
router.get("/live-mandir-pujas/:slug", wrap(getLivePujaBySlug));

// Legacy admin / read routes (kept for backward compat)
router.get("/live-mandir-bookings", wrap(getLiveBookings));
router.get("/live-mandir-bookings/user/:phone", wrap(getUserLiveBookings));

// NOTE: POST /live-mandir-bookings and POST /live-mandir-bookings/complete-payment
// have been removed. All new Live Mandir bookings now go through:
//   POST /api/bookings/create-pending  (with isLiveMandir: true)
//   POST /api/bookings/complete-booking

export default router;
