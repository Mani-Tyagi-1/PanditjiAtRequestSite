import { RequestHandler } from "express";
import ShopifyProduct from "../../model/userApp/shopifyProductModel";

// GET /shopify-products — fetch products with pagination, sorting & filters
export const getShopifyProducts: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      rashi,
      status,
      productType,
      tag,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query: any = {};

    if (rashi) {
      query.rashi = { $regex: new RegExp(String(rashi), "i") };
    }
    if (status) {
      query.status = String(status);
    }
    if (productType) {
      query.productType = { $regex: new RegExp(String(productType), "i") };
    }
    if (tag) {
      query.tags = { $in: [String(tag)] };
    }
    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      query.$or = [
        { title: { $regex: searchRegex } },
        { handle: { $regex: searchRegex } },
        { shopifyProductId: { $regex: searchRegex } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skipNum = (pageNum - 1) * limitNum;

    const sortDir = sortOrder === "asc" ? 1 : -1;
    const sortField = String(sortBy);

    const total = await ShopifyProduct.countDocuments(query);
    const products = await ShopifyProduct.find(query)
      .sort({ [sortField]: sortDir })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error in getShopifyProducts:", error);
    res.status(500).json({ success: false, message: "Failed to fetch Shopify products", error });
  }
};

// GET /shopify-products/handle/:handle — fetch single product details by handle
export const getShopifyProductByHandle: RequestHandler = async (req, res) => {
  try {
    const { handle } = req.params;
    const product = await ShopifyProduct.findOne({ handle }).lean();
    if (!product) {
      res.status(404).json({ success: false, message: "Shopify product not found by handle" });
      return;
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Error in getShopifyProductByHandle:", error);
    res.status(500).json({ success: false, message: "Failed to fetch Shopify product details" });
  }
};

// GET /shopify-products/:id — fetch single product details by MongoDB ID or shopifyProductId
export const getShopifyProductById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    let product;
    
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await ShopifyProduct.findById(id).lean();
    }
    
    if (!product) {
      product = await ShopifyProduct.findOne({ shopifyProductId: id }).lean();
    }

    if (!product) {
      res.status(404).json({ success: false, message: "Shopify product not found" });
      return;
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Error in getShopifyProductById:", error);
    res.status(500).json({ success: false, message: "Failed to fetch Shopify product details" });
  }
};

// POST /shopify-products — create new Shopify product
export const createShopifyProduct: RequestHandler = async (req, res) => {
  try {
    const product = await ShopifyProduct.create(req.body);
    res.status(201).json({ success: true, message: "Shopify product created successfully", data: product });
  } catch (error: any) {
    console.error("Error in createShopifyProduct:", error);
    res.status(400).json({ success: false, message: "Failed to create Shopify product", error: error.message });
  }
};

// PUT /shopify-products/:id — update Shopify product by MongoDB ID or shopifyProductId
export const updateShopifyProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    let product;
    
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await ShopifyProduct.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    }
    
    if (!product) {
      product = await ShopifyProduct.findOneAndUpdate({ shopifyProductId: id }, req.body, { new: true, runValidators: true });
    }

    if (!product) {
      res.status(404).json({ success: false, message: "Shopify product not found for update" });
      return;
    }
    res.status(200).json({ success: true, message: "Shopify product updated successfully", data: product });
  } catch (error: any) {
    console.error("Error in updateShopifyProduct:", error);
    res.status(400).json({ success: false, message: "Failed to update Shopify product", error: error.message });
  }
};

// DELETE /shopify-products/:id — delete Shopify product by MongoDB ID or shopifyProductId
export const deleteShopifyProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    let product;
    
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await ShopifyProduct.findByIdAndDelete(id);
    }
    
    if (!product) {
      product = await ShopifyProduct.findOneAndDelete({ shopifyProductId: id });
    }

    if (!product) {
      res.status(404).json({ success: false, message: "Shopify product not found for deletion" });
      return;
    }
    res.status(200).json({ success: true, message: "Shopify product deleted successfully" });
  } catch (error) {
    console.error("Error in deleteShopifyProduct:", error);
    res.status(500).json({ success: false, message: "Failed to delete Shopify product" });
  }
};
