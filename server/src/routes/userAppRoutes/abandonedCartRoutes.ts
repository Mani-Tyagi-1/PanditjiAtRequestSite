import express, { Request, Response, NextFunction } from "express";
import {
  upsertAbandonedCart,
  getAbandonedCarts,
} from "../../controller/userApp/abandonedCartController";

const router = express.Router();

router.post(
  "/abandoned-carts",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await upsertAbandonedCart(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/abandoned-carts",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getAbandonedCarts(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
