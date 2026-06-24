import express, { Request, Response, NextFunction } from "express";
import {
  getShopifyProducts,
  getShopifyProductByHandle,
  getShopifyProductById,
  createShopifyProduct,
  updateShopifyProduct,
  deleteShopifyProduct,
} from "../../controller/userApp/shopifyProductController";

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

// Retrieve products with filtering & pagination
router.get("/shopify-products", wrap(getShopifyProducts));

// Retrieve single product details by handle
router.get("/shopify-products/handle/:handle", wrap(getShopifyProductByHandle));

// Retrieve single product details by ID or shopifyProductId
router.get("/shopify-products/:id", wrap(getShopifyProductById));

// Create a new shopify product
router.post("/shopify-products", wrap(createShopifyProduct));

// Update shopify product details
router.put("/shopify-products/:id", wrap(updateShopifyProduct));

// Delete a shopify product
router.delete("/shopify-products/:id", wrap(deleteShopifyProduct));

export default router;
