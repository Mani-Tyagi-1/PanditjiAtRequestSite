import express from "express";
import {
  addReview,
  getReviewsByBookingId,
  getReviewsByPoojaId
} from "../../controllers/userApp/reviewController";

const router = express.Router();

router.post("/reviews", addReview); // Protected (managed by authMiddleware in index.ts)
router.get("/reviews/:pooja_id", getReviewsByPoojaId); // Public
router.get("/reviews/booking/:pooja_booking_id", getReviewsByBookingId); // Public

export default router;
