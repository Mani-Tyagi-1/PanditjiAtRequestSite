import { RequestHandler } from "express";
import ShopifyProduct from "../../model/userApp/shopifyProductModel";

/**
 * A product always leaves this API with a `description`.
 *
 * `descriptionHtml` is Shopify's field, and it is empty on every product that
 * was created here by hand or synced before the sync bothered to ask Shopify
 * for it — which is why some products show no description at all. Falling back
 * to the SEO description (Shopify fills it from the body copy) turns a blank
 * panel into the short version. Added ALONGSIDE `descriptionHtml`, never in
 * place of it, so existing consumers keep working untouched.
 */
const withDescription = (p: any) => {
  if (!p) return p;
  // The list path hands us lean objects; create/update hand us live Mongoose
  // documents. Spreading a document would leak `$__`, `_doc` and friends into
  // the JSON, so anything hydrated is converted first.
  const plain = typeof p.toObject === "function" ? p.toObject() : p;
  const html = String(plain?.descriptionHtml || "").trim();
  const seo = String(plain?.seo?.description || "").trim();
  return { ...plain, description: html || seo || "" };
};

/**
 * Vivah cross-sell products are hidden from every shop surface unless the
 * caller asks for them explicitly — `?channel=vivah` (the marriage page) or
 * `?includeVivahOnly=true` (admin tooling).
 *
 * `$ne: true` rather than `false`: products that predate the flag have no
 * `vivahOnly` field at all, and an equality match would drop the entire
 * existing catalogue from the shop.
 */
const applyChannel = (query: Record<string, any>, q: Record<string, any>) => {
  const channel = String(q.channel || "").toLowerCase();
  const includeAll = String(q.includeVivahOnly || "") === "true";
  if (channel === "vivah") query.vivahOnly = true;
  else if (!includeAll) query.vivahOnly = { $ne: true };
};

/**
 * Fields the Shopify sync owns. Any of these that the admin edits gets
 * recorded in `manualOverrides`, and the sync then leaves it alone.
 */
/**
 * Card-level fields for the shop grid.
 *
 * The app already requests `?view=list` expecting a trimmed payload; until now
 * the server ignored it and sent every product's full description HTML, media
 * array and metafields — about an order of magnitude more bytes than a grid of
 * cards can use, on the one screen most likely to be opened on a weak
 * connection.
 */
const LIST_PROJECTION =
  "shopifyProductId handle title status tags productType totalInventory " +
  "featuredImage priceRangeV2 compareAtPriceRange vivahOnly createdAt updatedAt";

const SYNCED_FIELDS = [
  "title",
  "handle",
  "descriptionHtml",
  "featuredImage",
  "media",
  "metafields",
  "priceRangeV2",
  "compareAtPriceRange",
  "productType",
  "seo",
  "status",
  "tags",
  "totalInventory",
  "variants",
];

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

    // Shop surfaces never see the marriage-only cross-sell products.
    applyChannel(query, req.query as Record<string, any>);

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

    const listView = String((req.query as any).view || "") === "list";

    const total = await ShopifyProduct.countDocuments(query);
    const cursor = ShopifyProduct.find(query)
      .sort({ [sortField]: sortDir })
      .skip(skipNum)
      .limit(limitNum);
    if (listView) cursor.select(LIST_PROJECTION);
    const products = await cursor.lean();

    res.status(200).json({
      success: true,
      data: listView ? products : products.map(withDescription),
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
    res.status(200).json({ success: true, data: withDescription(product) });
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
    res.status(200).json({ success: true, data: withDescription(product) });
  } catch (error) {
    console.error("Error in getShopifyProductById:", error);
    res.status(500).json({ success: false, message: "Failed to fetch Shopify product details" });
  }
};

// POST /shopify-products — create new Shopify product
export const createShopifyProduct: RequestHandler = async (req, res) => {
  try {
    const product = await ShopifyProduct.create(req.body);
    res.status(201).json({ success: true, message: "Shopify product created successfully", data: withDescription(product) });
  } catch (error: any) {
    console.error("Error in createShopifyProduct:", error);
    res.status(400).json({ success: false, message: "Failed to create Shopify product", error: error.message });
  }
};

// PUT /shopify-products/:id — update Shopify product by MongoDB ID or shopifyProductId
export const updateShopifyProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const body = { ...(req.body || {}) } as Record<string, any>;

    // Every synced field in this request becomes admin-owned from now on.
    // Recorded with $addToSet rather than by replacing the array, so editing
    // the title today does not un-protect the description fixed last week.
    const touched = SYNCED_FIELDS.filter((f) => f in body);
    delete body.manualOverrides; // never settable straight from the request

    const update: Record<string, any> = { $set: body };
    if (touched.length) update.$addToSet = { manualOverrides: { $each: touched } };

    const opts = { new: true, runValidators: true };
    let product;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await ShopifyProduct.findByIdAndUpdate(id, update, opts);
    }

    if (!product) {
      product = await ShopifyProduct.findOneAndUpdate({ shopifyProductId: id }, update, opts);
    }
    if (!product) {
      res.status(404).json({ success: false, message: "Shopify product not found for update" });
      return;
    }
    res.status(200).json({ success: true, message: "Shopify product updated successfully", data: withDescription(product) });
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
