import express, { Request, Response, NextFunction } from "express";
import { createPujaEnquiry, getAllPujaEnquiries } from "../../controller/userApp/pujaEnquiryController";

const router = express.Router();

router.post(
  "/puja-enquiries",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await createPujaEnquiry(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/puja-enquiries",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getAllPujaEnquiries(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
