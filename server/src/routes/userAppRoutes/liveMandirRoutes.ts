import express, { Request, Response, NextFunction } from "express";
import {
  getLivePujas,
  getLivePujaBySlug,
  createLiveBooking,
  getLiveBookings,
  seedLivePujas,
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

// Catalog
router.get("/live-mandir-pujas", wrap(getLivePujas));
router.get("/live-mandir-pujas/:slug", wrap(getLivePujaBySlug));
router.post("/live-mandir-pujas/seed", wrap(seedLivePujas));

// Bookings
router.post("/live-mandir-bookings", wrap(createLiveBooking));
router.get("/live-mandir-bookings", wrap(getLiveBookings));

export default router;
