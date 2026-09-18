import express, { Request, Response, NextFunction } from "express";
import { upsertAnalyticsAttribution } from "../../controller/analytics/analyticsAttributionController";

const router = express.Router();

// POST /api/analytics/attribution
// No auth and no decryptRequest middleware: this is called with `keepalive`
// from the checkout page as the Razorpay sheet opens, and it stores nothing
// the caller's own browser does not already hold.
router.post(
  "/attribution",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await upsertAnalyticsAttribution(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
