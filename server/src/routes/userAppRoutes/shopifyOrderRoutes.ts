import express, { Request, Response, NextFunction } from "express";
import {
  createShopifyOrder,
  completeShopifyOrderPayment,
  getUserShopifyOrders,
} from "../../controller/userApp/shopifyOrderController";

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

// Initialize order and create Razorpay payment intent
router.post("/shopify-orders/create-order", wrap(createShopifyOrder));

// Verify Razorpay payment signature and capture order
router.post("/shopify-orders/complete-payment", wrap(completeShopifyOrderPayment));

// Fetch all shopify orders for a specific user phone
router.get("/shopify-orders/user/:phone", wrap(getUserShopifyOrders));

export default router;
