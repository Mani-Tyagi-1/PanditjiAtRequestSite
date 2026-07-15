import { Router, type Request, type Response } from "express";
import axios from "axios";
import Pooja from "../../model/userApp/poojaModel";
import LiveMandirPuja from "../../model/userApp/liveMandirPujaModel";
import ShopifyProduct from "../../model/userApp/shopifyProductModel";

/**
 * Active shareable products for the partner/affiliate dashboard (Pandit Ji at Request).
 *
 * Sources are matched EXACTLY to what the live PJAR website fetches so the dashboard never shows a
 * product the site can't sell:
 *   - Pooja       → poojaModel.find({ isActive: true })                 (same as /fetch-all-poojas)
 *   - Live Mandir → LiveMandirPuja.find({ isActive: true })             (same as /live-mandir-pujas)
 *   - Shop        → ShopifyProduct (createdAt desc)                     (same as /shopify-products)
 *   - Chadhava    → PROXIED from Vedic Vaibhav's newChadhava API, then filtered isActive + first
 *                   availableDate today-or-future (exactly like the site's /chadhava page, which
 *                   proxies https://vedicvaibhav.com/api/newChadhava/get-all-new-chadhava).
 *
 * Normalized shape `{ id, name, image, category, price?, path }`; `path` is site-relative so the
 * dashboard prefixes the correct website origin and appends the sharer's `?ref=`. Read-only, lean.
 */
const router: Router = Router();

const VV_NEW_CHADHAVA_URL =
  process.env.VV_NEW_CHADHAVA_URL || "https://vedicvaibhav.com/api/newChadhava/get-all-new-chadhava";

// Mirrors ChadhavaPage.tsx: keep if isActive !== false AND (no availableDates OR some date is today
// or later). Returns [] on any failure so chadhava simply drops out (the rest still render).
async function fetchProxiedChadhavas(): Promise<any[]> {
  try {
    const resp = await axios.get(VV_NEW_CHADHAVA_URL, { timeout: 4000, validateStatus: () => true });
    if (resp.status < 200 || resp.status >= 300) return [];
    const raw = Array.isArray(resp.data)
      ? resp.data
      : Array.isArray(resp.data?.items)
        ? resp.data.items
        : Array.isArray(resp.data?.data)
          ? resp.data.data
          : [];

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const isTodayOrFuture = (v: any) => {
      const d = new Date(v);
      return !isNaN(d.getTime()) && d.getTime() >= start.getTime();
    };

    return raw
      .filter(
        (item: any) =>
          item?.isActive !== false &&
          (Array.isArray(item?.availableDates) ? item.availableDates.some(isTodayOrFuture) : true),
      )
      .map((c: any) => ({
        id: String(c._id || c.id || ""),
        name: c.chadhavaName,
        image:
          (c.chadhavaWebCardImage && c.chadhavaWebCardImage.location) ||
          (Array.isArray(c.chadhavaInnerImages) && c.chadhavaInnerImages[0] && c.chadhavaInnerImages[0].location) ||
          "",
        category: "Chadhava",
        path: c._id ? `/chadhava/${c._id}` : "",
      }))
      .filter((it: any) => it.name && it.path);
  } catch {
    return [];
  }
}

router.get("/active-products", async (_req: Request, res: Response) => {
  try {
    const [poojas, shop, liveMandir, chadhavaItems] = await Promise.all([
      Pooja.find({ isActive: true })
        .select("poojaNameEng poojaNameHindi poojaCardImage poojaMainImage poojaPriceOnline")
        .limit(120)
        .lean(),
      // Shop = Shopify products (what the website's ShopPage lists via /shopify-products).
      ShopifyProduct.find({})
        .select("title handle featuredImage media priceRangeV2 createdAt")
        .sort({ createdAt: -1 })
        .limit(120)
        .lean(),
      LiveMandirPuja.find({ isActive: true })
        .select("pujaName pujaNameHindi templeName image price originalPrice slug sortOrder createdAt")
        .sort({ sortOrder: 1, createdAt: 1 })
        .limit(80)
        .lean(),
      fetchProxiedChadhavas(),
    ]);

    const items = [
      ...chadhavaItems,
      ...poojas.map((p: any) => ({
        id: String(p._id),
        name: p.poojaNameEng,
        image: p.poojaCardImage || (Array.isArray(p.poojaMainImage) && p.poojaMainImage[0]) || "",
        category: "Pooja",
        price: typeof p.poojaPriceOnline === "number" ? p.poojaPriceOnline : undefined,
        path: `/puja/${p._id}`,
      })),
      ...liveMandir.map((m: any) => ({
        id: String(m._id),
        name: m.pujaName || m.name,
        image: m.image || "",
        category: "Live Mandir",
        price: typeof m.price === "number" ? m.price : undefined,
        path: m.slug ? `/live-mandir-puja/${m.slug}` : "",
      })),
      ...shop.map((s: any) => {
        const amountRaw = s?.priceRangeV2?.minVariantPrice?.amount;
        const amount = amountRaw != null && !Number.isNaN(Number(amountRaw)) ? Number(amountRaw) : undefined;
        const image =
          s?.featuredImage?.url ||
          (Array.isArray(s?.media) && s.media[0]?.image?.url) ||
          "";
        return {
          id: String(s._id),
          name: s.title,
          image,
          category: "Shop",
          price: amount,
          path: s.handle ? `/shop/product/${s.handle}` : "",
        };
      }),
    ].filter((it) => it.name && it.path);

    res.status(200).json({ platform: "PANDIT_JI_AT_REQUEST", count: items.length, items });
  } catch (error) {
    console.error("[affiliate/active-products][PJAR] error:", error);
    res.status(500).json({ platform: "PANDIT_JI_AT_REQUEST", count: 0, items: [] });
  }
});

export default router;
