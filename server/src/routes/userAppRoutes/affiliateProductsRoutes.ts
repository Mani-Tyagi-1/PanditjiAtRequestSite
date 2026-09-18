import { Router, type Request, type Response } from "express";
import axios from "axios";
import Pooja from "../../model/userApp/poojaModel";
import LiveMandirPuja from "../../model/userApp/liveMandirPujaModel";
import ShopifyProduct from "../../model/userApp/shopifyProductModel";

/**
 * Active shareable products + unified search for the partner/affiliate dashboard
 * (Pandit Ji at Request).
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
 * Normalized shape `{ id, name, image, category, department, price?, path }`; `path` is
 * site-relative so the dashboard prefixes the correct website origin and appends the sharer's
 * `?ref=`. Read-only, lean.
 *
 * Routes (mounted at /api/affiliate):
 *   GET /active-products        → the full shareable listing
 *   GET /search?q=<term>        → ranked suggestions across the same four sources
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
        department: "CHADHAVAS",
        // Kept for search matching only; stripped before the response so the payload shape
        // is byte-for-byte what the dashboard already consumes.
        _searchText: [c.chadhavaName, c.descriptionName, c.description].filter(Boolean).join(" "),
        path: c._id ? `/chadhava/${c._id}` : "",
      }))
      .filter((it: any) => it.name && it.path);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Chadhava is the only source behind a network hop (proxied from Vedic Vaibhav). Caching it
// stale-while-revalidate keeps /search usable for type-ahead — otherwise every keystroke would
// pay a cross-site round trip. A COLD start still awaits the fetch, so first-call behaviour is
// unchanged; only warm calls are served from memory. A failed refresh keeps the previous list
// rather than blanking the section.
// ─────────────────────────────────────────────────────────────────────────────
const CHADHAVA_CACHE_TTL_MS = Number(process.env.AFFILIATE_CHADHAVA_CACHE_TTL_MS || 120000);
let chadhavaCache: { at: number; items: any[] } | null = null;
let chadhavaRefreshing = false;

async function getChadhavas(): Promise<any[]> {
  const now = Date.now();
  if (chadhavaCache && now - chadhavaCache.at < CHADHAVA_CACHE_TTL_MS) return chadhavaCache.items;

  if (chadhavaCache) {
    if (!chadhavaRefreshing) {
      chadhavaRefreshing = true;
      fetchProxiedChadhavas()
        .then((items) => {
          if (items.length) chadhavaCache = { at: Date.now(), items };
        })
        .catch(() => {
          /* keep the previous list */
        })
        .finally(() => {
          chadhavaRefreshing = false;
        });
    }
    return chadhavaCache.items;
  }

  const items = await fetchProxiedChadhavas();
  // Only cache a non-empty result, so a transient upstream failure isn't pinned for the whole TTL.
  if (items.length) chadhavaCache = { at: Date.now(), items };
  return items;
}

/** Local escapeRegExp — avoids pulling in lodash just for one call. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Ranks already-matched results so the "best" suggestions surface first: an exact or starts-with
 * match on the name outranks one that only occurs mid-string or in a secondary field (description,
 * temple, tags). Array.prototype.sort is stable, so relative DB order is preserved within a tier.
 * Deliberately run on a wider candidate pool than what's returned (fetchLimit vs limitPerCategory)
 * — ranking a Mongo `.limit(5)` result would do nothing.
 */
function rankByRelevance<T extends { name?: string }>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  const rank = (item: T): number => {
    const name = (item.name || "").toLowerCase();
    if (name === q) return 0;
    if (name.startsWith(q)) return 1;
    if (name.includes(q)) return 2;
    return 3;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}

router.get("/active-products", async (_req: Request, res: Response) => {
  try {
    const [poojas, shop, liveMandir, chadhavaRaw] = await Promise.all([
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
      getChadhavas(),
    ]);

    // Strip the internal match-only field so the payload is exactly what it always was.
    const chadhavaItems = chadhavaRaw.map(({ _searchText, ...rest }: any) => rest);

    const items = [
      ...chadhavaItems,
      ...poojas.map((p: any) => ({
        id: String(p._id),
        name: p.poojaNameEng,
        image: p.poojaCardImage || (Array.isArray(p.poojaMainImage) && p.poojaMainImage[0]) || "",
        category: "Pooja",
        department: "POOJAS",
        price: typeof p.poojaPriceOnline === "number" ? p.poojaPriceOnline : undefined,
        path: `/puja/${p._id}`,
      })),
      ...liveMandir.map((m: any) => ({
        id: String(m._id),
        name: m.pujaName || m.name,
        image: m.image || "",
        category: "Live Mandir",
        department: "LIVE_MANDIR",
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
          department: "PRODUCTS",
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

/**
 * GET /api/affiliate/search?q=<term>[&limit=<n>]
 *
 * Same contract as Vedic Vaibhav's /search (mirrored so the hub aggregator can fan out to all
 * three sites uniformly): a query shorter than 2 chars returns an empty list rather than dumping
 * the catalogue, each source is queried in parallel and over-fetched, then ranked by relevance and
 * trimmed to `limit` per category. Never 5xxs on a partial failure — a source that errors simply
 * contributes nothing.
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    if (!query || query.trim().length < 2) {
      res.status(200).json({ platform: "PANDIT_JI_AT_REQUEST", count: 0, items: [] });
      return;
    }

    const requested = Number(req.query.limit);
    const limitPerCategory = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 20) : 5;
    const fetchLimit = 20; // wider candidate pool so ranking has something to reorder
    const rx = new RegExp(escapeRegExp(query.trim()), "i");

    const [poojas, liveMandir, shop, chadhavaAll] = await Promise.all([
      Pooja.find({
        isActive: true,
        $or: [
          { poojaNameEng: rx },
          { poojaNameHindi: rx },
          { poojaDescriptionMain: rx },
          { poojaSubDescription: rx },
          { poojaGods: rx },
          { tags: rx },
        ],
      })
        .select("poojaNameEng poojaNameHindi poojaCardImage poojaMainImage poojaPriceOnline")
        .limit(fetchLimit)
        .lean()
        .catch(() => [] as any[]),

      LiveMandirPuja.find({
        isActive: true,
        $or: [
          { pujaName: rx },
          { pujaNameHindi: rx },
          { templeName: rx },
          { templeLocation: rx },
          { deity: rx },
          { tags: rx },
        ],
      })
        .select("pujaName pujaNameHindi templeName image price slug")
        .limit(fetchLimit)
        .lean()
        .catch(() => [] as any[]),

      ShopifyProduct.find({
        $or: [{ title: rx }, { productType: rx }, { tags: rx }, { handle: rx }, { keywords: rx }],
      })
        .select("title handle featuredImage media priceRangeV2 createdAt")
        .sort({ createdAt: -1 })
        .limit(fetchLimit)
        .lean()
        .catch(() => [] as any[]),

      getChadhavas().catch(() => [] as any[]),
    ]);

    const mappedPoojas = poojas.map((p: any) => ({
      id: String(p._id),
      name: p.poojaNameEng,
      image: p.poojaCardImage || (Array.isArray(p.poojaMainImage) && p.poojaMainImage[0]) || "",
      category: "Pooja",
      department: "POOJAS",
      price: typeof p.poojaPriceOnline === "number" ? p.poojaPriceOnline : undefined,
      path: `/puja/${p._id}`,
    }));

    const mappedMandir = liveMandir.map((m: any) => ({
      id: String(m._id),
      name: m.pujaName || m.name,
      image: m.image || "",
      category: "Live Mandir",
      department: "LIVE_MANDIR",
      price: typeof m.price === "number" ? m.price : undefined,
      path: m.slug ? `/live-mandir-puja/${m.slug}` : "",
    }));

    const mappedShop = shop.map((s: any) => {
      const amountRaw = s?.priceRangeV2?.minVariantPrice?.amount;
      const amount = amountRaw != null && !Number.isNaN(Number(amountRaw)) ? Number(amountRaw) : undefined;
      return {
        id: String(s._id),
        name: s.title,
        image: s?.featuredImage?.url || (Array.isArray(s?.media) && s.media[0]?.image?.url) || "",
        category: "Shop",
        department: "PRODUCTS",
        price: amount,
        path: s.handle ? `/shop/product/${s.handle}` : "",
      };
    });

    // Chadhava is proxied (already fetched+filtered in memory), so it is matched in JS rather
    // than at the DB — same regex, over the name and the description text.
    const mappedChadhava = chadhavaAll
      .filter((c: any) => rx.test(String(c.name || "")) || rx.test(String(c._searchText || "")))
      .slice(0, fetchLimit)
      .map(({ _searchText, ...rest }: any) => rest);

    const items = [
      ...rankByRelevance(mappedPoojas, query).slice(0, limitPerCategory),
      ...rankByRelevance(mappedChadhava, query).slice(0, limitPerCategory),
      ...rankByRelevance(mappedMandir, query).slice(0, limitPerCategory),
      ...rankByRelevance(mappedShop, query).slice(0, limitPerCategory),
    ].filter((it: any) => it.name && it.path);

    res.status(200).json({ platform: "PANDIT_JI_AT_REQUEST", count: items.length, items });
  } catch (error) {
    console.error("[affiliate/search][PJAR] error:", error);
    // Degrade to "no matches" rather than a 5xx — the aggregator would otherwise flag the whole
    // platform as unreachable for a single bad query.
    res.status(200).json({ platform: "PANDIT_JI_AT_REQUEST", count: 0, items: [] });
  }
});

export default router;
