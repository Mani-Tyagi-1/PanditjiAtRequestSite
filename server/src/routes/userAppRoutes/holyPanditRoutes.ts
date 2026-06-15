import express, { Request, Response, NextFunction } from "express";
import {
  getHolyPandits,
  getHolyPanditBySlug,
  createHolyPanditBooking,
  getHolyPanditBookings,
} from "../../controller/userApp/holyPanditController";

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
router.get("/holy-pandits", wrap(getHolyPandits));
router.get("/holy-pandits/:slug", wrap(getHolyPanditBySlug));

// Bookings
router.post("/holy-pandit-bookings", wrap(createHolyPanditBooking));
router.get("/holy-pandit-bookings", wrap(getHolyPanditBookings));

export default router;
