#!/usr/bin/env python3
"""
Storefront shop fixes:
  1. vivah cross-sell products no longer appear in the shop
  2. every product leaves the API with a usable description
  3. admin edits are recorded so a Shopify re-sync cannot undo them
Idempotent.
"""
import io, re

done = []


def read(p):
    return io.open(p, encoding="utf-8").read()


def write(p, s):
    io.open(p, "w", encoding="utf-8").write(s)


def sub(s, old, new, label):
    if old not in s:
        raise SystemExit("ANCHOR MISSING (%s):\n---\n%s\n---" % (label, old[:280]))
    if s.count(old) != 1:
        raise SystemExit("ANCHOR AMBIGUOUS (%dx) for %s" % (s.count(old), label))
    return s.replace(old, new, 1)


# ═══════════════════════════════════════════════════════════ 1. MODEL
MP = "src/model/userApp/shopifyProductModel.ts"
m = read(MP)
if "vivahOnly" not in m:
    m = sub(
        m,
        "  variants?: IShopifyVariant[];\n  createdAt?: Date;\n  updatedAt?: Date;\n}",
        """  variants?: IShopifyVariant[];

  /**
   * Cross-sell-only product: shown on the Vedic Vivah page, hidden from the
   * shop. These were added for the marriage flow and have no business in a
   * general product grid — but they are ordinary Shopify products, so nothing
   * else tells them apart. The admin sets this; every shop surface honours it.
   */
  vivahOnly?: boolean;

  /**
   * Field names the admin has edited in our own Mongo, e.g. ["descriptionHtml"].
   *
   * A Shopify sync writes every field it owns. Without this list one sync
   * silently reverts every correction made here — precisely the damage a
   * manual "Sync now" button would otherwise do. Listed fields are skipped by
   * the sync and stay ours.
   */
  manualOverrides?: string[];

  /** `updatedAt` as Shopify reports it — lets a sync skip untouched products. */
  shopifyUpdatedAt?: Date | null;
  /** When our copy was last refreshed from Shopify. */
  lastSyncedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}""",
        "model interface",
    )
    m = sub(
        m,
        "    variants: [VariantSchema],\n  },\n  {\n    timestamps: true,\n  }\n);",
        """    variants: [VariantSchema],

    // Channel visibility — see the interface above.
    vivahOnly: { type: Boolean, default: false, index: true },

    // Sync bookkeeping.
    manualOverrides: { type: [String], default: [] },
    shopifyUpdatedAt: { type: Date, default: null },
    lastSyncedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

/* The shop's default query: active, not vivah-only, newest first. */
shopifyProductSchema.index({ vivahOnly: 1, status: 1, createdAt: -1 });""",
        "model schema",
    )
    write(MP, m)
    done.append("model: vivahOnly + manualOverrides")

# ═══════════════════════════════════════════════════════════ 2. CONTROLLER
CP = "src/controller/userApp/shopifyProductController.ts"
c = read(CP)
if "withDescription" not in c:
    c = sub(
        c,
        'import { RequestHandler } from "express";\nimport ShopifyProduct from "../../model/userApp/shopifyProductModel";\n',
        '''import { RequestHandler } from "express";
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
const withDescription = <T extends Record<string, any>>(p: T) => {
  const html = String((p as any)?.descriptionHtml || "").trim();
  const seo = String((p as any)?.seo?.description || "").trim();
  return { ...p, description: html || seo || "" };
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
''',
        "controller header",
    )

    c = sub(
        c,
        "    const query: any = {};\n\n    if (rashi) {",
        """    const query: any = {};

    // Shop surfaces never see the marriage-only cross-sell products.
    applyChannel(query, req.query as Record<string, any>);

    if (rashi) {""",
        "list query",
    )

    c = sub(
        c,
        "      success: true,\n      data: products,\n      pagination: {",
        "      success: true,\n      data: products.map(withDescription),\n      pagination: {",
        "list response",
    )

    # Both single-product endpoints.
    n = c.count("data: product })")
    c = c.replace("data: product })", "data: withDescription(product) })")

    # The source has trailing spaces on its blank lines, so this one is matched
    # by regex rather than by an exact string.
    OLD_RE = re.compile(
        r"    const \{ id \} = req\.params;\s*\n\s*let product;\s*\n"
        r"\s*\n?\s*if \(id\.match\(/\^\[0-9a-fA-F\]\{24\}\$/\)\) \{\s*\n"
        r"\s*product = await ShopifyProduct\.findByIdAndUpdate\(id, req\.body, \{ new: true, runValidators: true \}\);\s*\n"
        r"\s*\}\s*\n"
        r"\s*\n?\s*if \(!product\) \{\s*\n"
        r"\s*product = await ShopifyProduct\.findOneAndUpdate\(\{ shopifyProductId: id \}, req\.body, \{ new: true, runValidators: true \}\);\s*\n"
        r"\s*\}\s*\n"
    )
    NEW_BODY = """    const { id } = req.params;
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
"""
    hits = OLD_RE.findall(c)
    if len(hits) != 1:
        raise SystemExit("update body: expected 1 match, found %d" % len(hits))
    c = OLD_RE.sub(lambda _m: NEW_BODY, c, count=1)

    write(CP, c)
    done.append("controller: channel filter, description fallback, override tracking (%d detail routes)" % n)

print("APPLIED:", "; ".join(done) if done else "nothing (already patched)")
