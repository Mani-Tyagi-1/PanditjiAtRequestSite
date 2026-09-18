import express, { Request, Response, NextFunction } from "express";
import {
  getVivahCatalog,
  getVivahSeo,
  createVedicVivahLead,
  createVedicVivahOrder,
  completeVedicVivahPayment,
  createVedicVivahConsultation,
  trackVivahNudge,
  getUserVedicVivahBookings,
  uploadVedicVivahKundali,
  createVedicVivahBalanceOrder,
  completeVedicVivahBalancePayment,
  cancelVedicVivahBooking,
} from "../../controller/userApp/vedicVivahBookingController";
import { authMiddleware } from "../../middlewares/jwtMiddleware";
import { createAnyFileUpload } from "../../utils/createAnyFileUpload";

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

/* VEDIC VIVAH — guided marriage booking (website).
   Paths are IDENTICAL to the app server's so the two clients speak the same
   API and SuperAdmin/analytics need no per-channel special-casing. */

// PUBLIC — catalog render, SEO payload, frictionless free callback, nudges.
router.get("/bookings/vedic-vivah/catalog", wrap(getVivahCatalog));
router.get("/bookings/vedic-vivah/seo", wrap(getVivahSeo));
router.post("/bookings/vedic-vivah/consultation", wrap(createVedicVivahConsultation));
router.post("/bookings/vedic-vivah/nudge", wrap(trackVivahNudge));

// PROTECTED — anything that creates/reads/mutates a family's booking.
// userId is derived from the verified token inside these controllers.
router.post("/bookings/vedic-vivah/create-lead", authMiddleware, wrap(createVedicVivahLead));
router.post("/bookings/vedic-vivah/create-order", authMiddleware, wrap(createVedicVivahOrder));
router.post(
  "/bookings/vedic-vivah/complete-payment",
  authMiddleware,
  wrap(completeVedicVivahPayment)
);
router.post(
  "/bookings/vedic-vivah/balance-order",
  authMiddleware,
  wrap(createVedicVivahBalanceOrder)
);
router.post(
  "/bookings/vedic-vivah/complete-balance-payment",
  authMiddleware,
  wrap(completeVedicVivahBalancePayment)
);
router.post("/bookings/vedic-vivah/:bookingId/cancel", authMiddleware, wrap(cancelVedicVivahBooking));
router.get("/bookings/vedic-vivah/user/:userId", authMiddleware, wrap(getUserVedicVivahBookings));
router.post(
  "/bookings/vedic-vivah/upload-kundali",
  authMiddleware,
  createAnyFileUpload("PAR_Vivah_Kundali", 25),
  wrap(uploadVedicVivahKundali)
);

export default router;
