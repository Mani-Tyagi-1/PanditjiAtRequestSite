import express, { Request, Response, NextFunction } from "express";
import {
  getShopProducts,
  getShopProductBySlug,
  createShopOrder,
  getShopOrders,
  seedShopProducts,
} from "../../controller/userApp/shopController";

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
router.get("/shop-products", wrap(getShopProducts));
router.get("/shop-products/:slug", wrap(getShopProductBySlug));
router.post("/shop-products/seed", wrap(seedShopProducts));

// Orders
router.post("/shop-orders", wrap(createShopOrder));
router.get("/shop-orders", wrap(getShopOrders));

export default router;
