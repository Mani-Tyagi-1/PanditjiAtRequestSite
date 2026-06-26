import express, { Request, Response, NextFunction } from "express";
import { prerenderPooja } from "../controller/seo/poojaPrerenderController";

// Server-rendered, crawlable HTML for SPA data pages. nginx routes crawler
// user-agents here (e.g. /puja/:id -> /api/seo/puja/:id); humans get the SPA.
const router = express.Router();

router.get(
  "/puja/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prerenderPooja(req, res);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
