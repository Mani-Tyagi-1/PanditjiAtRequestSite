import { RequestHandler } from "express";
import AbandonedCart from "../../model/userApp/abandonedCartModel";
import { readAttribution } from "../../utils/marketingAttribution";

// Fields the client may patch onto its own cart row. Anything else in the body
// (status, addedOn, …) is ignored, so a stray key can never overwrite bookkeeping.
const STRING_FIELDS = [
  "pujaId",
  "pujaSlug",
  "pujaName",
  "templeName",
  "packageId",
  "packageName",
  "name",
  "gotra",
  "email",
  "wish",
  "userId",
  "pageUrl",
] as const;

const normalizePhone = (value: unknown) =>
  String(value ?? "").replace(/\D/g, "").slice(-10);

/**
 * POST /api/abandoned-carts
 *
 * Upsert one booking attempt. Called the moment a valid mobile number is typed
 * on a booking page, then again on every subsequent detail the devotee fills.
 *
 * Only keys actually present in the body are written, so a later call carrying
 * just `{ sessionId, phone, address }` cannot blank out the name captured
 * earlier. Sent as fire-and-forget (fetch keepalive / sendBeacon) by the
 * client, so failures here must never be noisy.
 */
export const upsertAbandonedCart: RequestHandler = async (req, res) => {
  try {
    const body = req.body || {};
    const phone = normalizePhone(body.phone);

    // The phone number is the whole point of the record — without a complete
    // one there is nobody to follow up with, so there is nothing worth storing.
    if (phone.length !== 10) {
      res.status(400).json({ success: false, message: "A valid 10-digit phone is required" });
      return;
    }

    const source = String(body.source || "").trim() || "unknown";
    // Fall back to a deterministic key so a client that forgot to send a
    // sessionId still updates one row instead of inserting on every keystroke.
    const sessionId = String(body.sessionId || "").trim() || `${source}:${phone}`;

    const set: Record<string, any> = { phone, source, lastUpdatedOn: new Date() };

    for (const field of STRING_FIELDS) {
      const value = body[field];
      if (value === undefined || value === null) continue;
      const trimmed = String(value).trim();
      if (trimmed) set[field] = trimmed;
    }

    if (body.amount !== undefined && body.amount !== null && !isNaN(Number(body.amount))) {
      set.amount = Number(body.amount);
    }
    if (Array.isArray(body.familyMembers)) set.familyMembers = body.familyMembers;
    if (Array.isArray(body.items)) set.items = body.items;
    if (body.address && typeof body.address === "object") set.address = body.address;
    if (body.extra && typeof body.extra === "object") set.extra = body.extra;

    // Written on every update rather than on insert only, so the rows that
    // already exist pick the campaign up on their next patch instead of
    // staying blank forever. Absent from the body leaves the stored value
    // alone, like every other field here.
    const attribution = readAttribution(req);
    if (attribution) set.attribution = attribution;

    // "converted" is the only status the client may set, and it is one-way:
    // `status` is otherwise seeded as "active" on insert only, so a late
    // in-flight update can never drag a paid booking back into the lead list.
    if (body.status === "converted") {
      set.status = "converted";
      if (body.bookingId) set.bookingId = String(body.bookingId).trim();
    }

    const onInsert: Record<string, any> = {
      sessionId,
      isFromSite: true,
      addedOn: new Date(),
    };
    // `status` may appear in $set OR $setOnInsert, never both: MongoDB rejects
    // an update that writes the same path twice ("would create a conflict at
    // 'status'") and the whole call fails. That is exactly what happened on the
    // conversion call — the one update that matters — so every paid booking
    // stayed in the abandoned-lead list and got chased with a "you didn't
    // finish" nudge. When the client is converting the cart $set owns the
    // field; otherwise it seeds as "active" on insert as before.
    if (set.status === undefined) onInsert.status = "active";

    const cart = await AbandonedCart.findOneAndUpdate(
      { sessionId },
      { $set: set, $setOnInsert: onInsert },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, id: cart?._id, sessionId });
  } catch (error: any) {
    // Two rapid-fire updates for a brand-new sessionId can race on the unique
    // index; the loser's data is already in the winner's row, so this is a
    // no-op rather than a failure the devotee should ever see.
    if (error?.code === 11000) {
      res.status(200).json({ success: true, deduped: true });
      return;
    }
    console.error("[AbandonedCart] upsert failed:", error?.message || error);
    res.status(500).json({ success: false, message: "Failed to save cart" });
  }
};

/**
 * GET /api/abandoned-carts
 *
 * Admin listing. Defaults to un-paid leads, newest first.
 * Query: ?status=active|converted|all &source= &phone= &limit=
 */
export const getAbandonedCarts: RequestHandler = async (req, res) => {
  try {
    const { status = "active", source, phone } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(String(req.query.limit || "200"), 10) || 200, 1000);

    const filter: Record<string, any> = {};
    if (status && status !== "all") filter.status = status;
    if (source) filter.source = source;
    if (phone) filter.phone = normalizePhone(phone);

    const carts = await AbandonedCart.find(filter).sort({ lastUpdatedOn: -1 }).limit(limit);

    res.status(200).json({ success: true, count: carts.length, data: carts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch abandoned carts" });
  }
};
