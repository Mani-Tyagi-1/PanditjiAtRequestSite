import { RequestHandler } from "express";
import ShopProduct from "../../model/userApp/shopProductModel";
import ShopOrder, { IShopOrderItem } from "../../model/userApp/shopOrderModel";
import { SHOP_SEED, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "../../data/shopSeed";

// Shape a DB doc to the frontend `ShopProduct` interface (id = slug).
const toClientShape = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj.slug };
};

const calcShipping = (subtotal: number) =>
  subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;

// GET /shop-products — active catalog
export const getShopProducts: RequestHandler = async (_req, res) => {
  try {
    const products = await ShopProduct.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: 1,
    });
    res.status(200).json({ success: true, data: products.map(toClientShape) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

// GET /shop-products/:slug — fetch single product details
export const getShopProductBySlug: RequestHandler = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await ShopProduct.findOne({ slug, isActive: true });
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    res.status(200).json({ success: true, data: toClientShape(product) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch product details" });
  }
};

// POST /shop-orders — create an order (totals computed server-side)
export const createShopOrder: RequestHandler = async (req, res) => {
  try {
    const { items, customerName, phone, addressLine, city, pincode } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "Cart is empty" });
      return;
    }
    if (!customerName || !phone || !addressLine || !city || !pincode) {
      res.status(400).json({
        success: false,
        message: "customerName, phone, addressLine, city and pincode are required",
      });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      res.status(400).json({ success: false, message: "A valid 10-digit phone number is required" });
      return;
    }

    // Resolve every item against the catalog so prices can't be tampered with.
    // Falls back to the client-sent price if the catalog isn't seeded yet.
    const slugs = items.map((i: any) => i.productSlug);
    const dbProducts = await ShopProduct.find({ slug: { $in: slugs } });
    const bySlug = new Map(dbProducts.map((p) => [p.slug, p]));

    const orderItems: IShopOrderItem[] = items.map((i: any) => {
      const dbp = bySlug.get(i.productSlug);
      const price = dbp ? dbp.price : Number(i.price) || 0;
      const qty = Math.max(1, Number(i.qty) || 1);
      return {
        productSlug: i.productSlug,
        name: dbp ? dbp.name : i.name || "",
        price,
        qty,
        lineTotal: price * qty,
      };
    });

    const subtotal = orderItems.reduce((s, i) => s + i.lineTotal, 0);
    const shipping = calcShipping(subtotal);
    const totalAmount = subtotal + shipping;

    const order = await ShopOrder.create({
      items: orderItems,
      subtotal,
      shipping,
      totalAmount,
      customerName: String(customerName).trim(),
      phone: cleanPhone,
      addressLine: String(addressLine).trim(),
      city: String(city).trim(),
      pincode: String(pincode).replace(/\D/g, ""),
      isFromSite: true,
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

// GET /shop-orders — admin list
export const getShopOrders: RequestHandler = async (_req, res) => {
  try {
    const orders = await ShopOrder.find().sort({ addedOn: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// POST /shop-products/seed — idempotent upsert of the catalog
export const seedShopProducts: RequestHandler = async (_req, res) => {
  try {
    await Promise.all(
      SHOP_SEED.map((p) =>
        ShopProduct.updateOne({ slug: p.slug }, { $set: p }, { upsert: true })
      )
    );
    const count = await ShopProduct.countDocuments();
    res.status(200).json({ success: true, message: `Seeded shop products. Total: ${count}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to seed products" });
  }
};
