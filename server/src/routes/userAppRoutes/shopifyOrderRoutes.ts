import express, { Request, Response, NextFunction } from "express";
import {
  createShopifyOrder,
  createCodShopifyOrder,
  getShopifyCodConfig,
  completeShopifyOrderPayment,
  shopifyOrderWebhook,
  getUserShopifyOrders,
  checkFirstOrderEligibility,
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

// Place a Cash-on-Delivery order (no online payment step)
router.post("/shopify-orders/cod", wrap(createCodShopifyOrder));

// COD availability + minimum-order config (server source of truth)
router.get("/shopify-orders/cod-config", wrap(getShopifyCodConfig));

// Verify Razorpay payment signature and capture order
router.post("/shopify-orders/complete-payment", wrap(completeShopifyOrderPayment));

// Razorpay webhook — server-side reconciliation for prepaid orders
router.post("/shopify-orders/webhook", wrap(shopifyOrderWebhook));

// Check whether the user qualifies for the first-order discount
router.get("/shopify-orders/first-order-eligibility/:phone", wrap(checkFirstOrderEligibility));

// Fetch all shopify orders for a specific user phone
router.get("/shopify-orders/user/:phone", wrap(getUserShopifyOrders));

export default router;
