import express, { Request, Response, NextFunction } from "express";
import { fetchAllTestimonials } from "../../controllers/userApp/testimonialController";

const router = express.Router();

// GET - Fetch all active testimonials
router.get(
  "/fetch-all-testimonials",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fetchAllTestimonials(req, res);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
