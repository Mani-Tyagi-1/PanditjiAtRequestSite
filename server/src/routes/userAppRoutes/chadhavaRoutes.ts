import express, { Request, Response, NextFunction } from "express";
import {
  getChadhavas,
  getChadhavaBySlug,
  createChadhavaBooking,
  getChadhavaBookings,
  seedChadhavas,
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
router.get("/chadhavas/:slug", wrap(getChadhavaBySlug));
router.post("/chadhavas/seed", wrap(seedChadhavas));

// Bookings
router.post("/chadhava-bookings", wrap(createChadhavaBooking));
router.get("/chadhava-bookings", wrap(getChadhavaBookings));

export default router;
