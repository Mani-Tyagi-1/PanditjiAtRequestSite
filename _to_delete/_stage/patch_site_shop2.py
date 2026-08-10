#!/usr/bin/env python3
"""
Two more storefront fixes:
  1. `?view=list` is honoured — the app has been asking for a trimmed payload
     that the server never implemented, so the shop grid was downloading every
     product's full HTML description, media and metafields.
  2. Both frontends prefer the API's `description` (which falls back to SEO
     copy) over the raw `descriptionHtml`, so products with an empty Shopify
     body still show something.
Idempotent.
"""
import io, os

done = []


def read(p):
    return io.open(p, encoding="utf-8").read()


def write(p, s):
    io.open(p, "w", encoding="utf-8").write(s)


def sub(s, old, new, label):
    if old not in s:
        raise SystemExit("ANCHOR MISSING (%s):\n---\n%s\n---" % (label, old[:260]))
    if s.count(old) != 1:
        raise SystemExit("ANCHOR AMBIGUOUS (%dx) for %s" % (s.count(old), label))
    return s.replace(old, new, 1)


# ═══════════════════════════════════════════ 1. server: honour ?view=list
CP = "server/src/controller/userApp/shopifyProductController.ts"
c = read(CP)
if "LIST_PROJECTION" not in c:
    c = sub(
        c,
        "const SYNCED_FIELDS = [",
        '''/**
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

const SYNCED_FIELDS = [''',
        "list projection const",
    )

    c = sub(
        c,
        """    const total = await ShopifyProduct.countDocuments(query);
    const products = await ShopifyProduct.find(query)
      .sort({ [sortField]: sortDir })
      .skip(skipNum)
      .limit(limitNum)
      .lean();""",
        """    const listView = String((req.query as any).view || "") === "list";

    const total = await ShopifyProduct.countDocuments(query);
    const cursor = ShopifyProduct.find(query)
      .sort({ [sortField]: sortDir })
      .skip(skipNum)
      .limit(limitNum);
    if (listView) cursor.select(LIST_PROJECTION);
    const products = await cursor.lean();""",
        "list projection use",
    )

    # A card has no description; adding an empty one would only cost bytes.
    c = sub(
        c,
        "      data: products.map(withDescription),",
        "      data: listView ? products : products.map(withDescription),",
        "list response projection",
    )
    write(CP, c)
    done.append("server: ?view=list projection")

# ═══════════════════════════════════════════ 2. website detail page
WP = "frontend/src/pages/ShopifyProductDetailPage.tsx"
if os.path.exists(WP):
    w = read(WP)
    if "product.description ||" not in w:
        w = sub(
            w,
            "                {product.descriptionHtml && (",
            "                {(product.description || product.descriptionHtml) && (",
            "site detail guard",
        )
        w = sub(
            w,
            'dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}',
            # `description` is the API's resolved value (Shopify body, else
            # the SEO description); `descriptionHtml` stays as a fallback so an
            # older cached response still renders.
            'dangerouslySetInnerHTML={{ __html: product.description || product.descriptionHtml }}',
            "site detail render",
        )
        write(WP, w)
        done.append("website: description fallback")

print("APPLIED:", "; ".join(done) if done else "nothing (already patched)")
