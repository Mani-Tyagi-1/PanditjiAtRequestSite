import axios from "axios";
import crypto from "crypto";

import AnalyticsAttribution from "../model/analytics/analyticsAttribution.model";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ANALYTICS — GA4 Measurement Protocol
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The Google counterpart to `utils/metaCapiServices.ts`. Same job, same shape:
 * report a conversion from the server, where it cannot be lost.
 *
 * WHY THE SERVER REPORTS PURCHASES AT ALL
 * ---------------------------------------
 * The browser fires its `purchase` from the Razorpay success handler. That
 * handler does not always run — the tab gets closed on the payment-success
 * screen, the phone locks, mobile data drops between the bank and us. The money
 * is captured either way, so a browser-only purchase silently under-reports
 * revenue, and Smart Bidding then optimises against a number that is wrong.
 *
 * The Razorpay webhook always arrives (Razorpay retries until we 2xx), so it is
 * the honest signal. This module is what turns it into a GA4 conversion.
 *
 * DOUBLE COUNTING
 * ---------------
 * Two things prevent it, belt and braces:
 *
 *   1. `transaction_id` is the Razorpay order id in BOTH the browser event and
 *      this one. GA4 deduplicates purchases on that key.
 *   2. `claimPurchaseReport()` below hands out an exactly-once claim per order
 *      via an atomic upsert, so normally only one of the two paths even sends.
 *
 * GOOGLE ADS
 * ----------
 * There is no separate Ads call here by design. Link the GA4 property to the
 * Ads account and import `purchase` as a conversion — the Ads conversion then
 * inherits this server-side accuracy for free, and there is one number to
 * reconcile instead of two that will always disagree slightly.
 *
 * REQUIRED ENV
 * ------------
 *   GA4_MEASUREMENT_ID   e.g. G-GLFX9MEX7V
 *   GA4_API_SECRET       Admin → Data Streams → your stream →
 *                        Measurement Protocol API secrets → Create
 *   GA4_DEBUG            optional; "1" routes to the validation endpoint, which
 *                        returns why an event was rejected instead of silently
 *                        accepting it. Never leave this on in production — the
 *                        debug endpoint does not record anything.
 */

const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const GA4_DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";

/** Purchases only report for real money. Mirrors the Meta CAPI guard. */
const isProduction = process.env.PAYMENT_MODE === "production";

export interface Ga4Item {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
  item_brand?: string;
}

interface Ga4Payload {
  client_id: string;
  user_id?: string;
  timestamp_micros?: string;
  non_personalized_ads?: boolean;
  consent?: {
    ad_user_data?: "GRANTED" | "DENIED";
    ad_personalization?: "GRANTED" | "DENIED";
  };
  events: Array<{ name: string; params: Record<string, unknown> }>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSPORT
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * POST a payload to the Measurement Protocol.
 *
 * The MP endpoint answers 204 to almost everything, valid or not — a malformed
 * event is accepted and then quietly discarded. That is why failures here are
 * logged rather than thrown, and why GA4_DEBUG exists: it is the only way to
 * find out that an event was wrong.
 */
async function sendToGa4(payload: Ga4Payload): Promise<boolean> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.warn(
      "[GA4] Skipped: GA4_MEASUREMENT_ID or GA4_API_SECRET is not set. " +
        "Server-side conversions are OFF until both exist in the environment.",
    );
    return false;
  }

  const debug = process.env.GA4_DEBUG === "1";
  const url = `${debug ? GA4_DEBUG_ENDPOINT : GA4_ENDPOINT}?measurement_id=${encodeURIComponent(
    measurementId,
  )}&api_secret=${encodeURIComponent(apiSecret)}`;

  const resp = await axios.post(url, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
    validateStatus: () => true,
  });

  if (debug) {
    // The validation endpoint returns validationMessages describing what it
    // disliked. An empty array means the event would have been accepted.
    console.log("[GA4][debug]", JSON.stringify(resp.data));
  }

  if (resp.status < 200 || resp.status >= 300) {
    console.error(`[GA4] HTTP ${resp.status}:`, resp.data);
    return false;
  }

  return true;
}

/* ═══════════════════════════════════════════════════════════════════════════
   IDENTITY
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * A last-resort client id, derived from the order id.
 *
 * Used only when the browser never managed to stash its real `_ga` id. The
 * purchase and its revenue are still recorded — losing the sale entirely would
 * be worse — but it lands as a new, sessionless user, so the traffic source
 * that earned it gets no credit. A rising share of these in the logs means the
 * `stashOrderAttribution` call is not running on some checkout path.
 *
 * Deterministic on purpose: a webhook retry must not mint a second user.
 */
function fallbackClientId(razorpayOrderId: string): string {
  const digest = crypto.createHash("sha256").update(String(razorpayOrderId)).digest("hex");
  // GA4 wants the "<random>.<timestamp>" shape; both halves derived from the
  // hash so the same order always yields the same id.
  return `${parseInt(digest.slice(0, 8), 16)}.${parseInt(digest.slice(8, 16), 16)}`;
}

/** Hashed account id — GA4 must never receive a raw phone number or user id. */
function hashUserId(userId?: string | null): string | undefined {
  const raw = String(userId || "").trim();
  if (!raw) return undefined;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXACTLY-ONCE CLAIM
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Claim the right to report this order's purchase.
 *
 * Returns the stored attribution row on success, or null when another path
 * already reported it. The atomic upsert is what makes it safe for the browser
 * verify call and the Razorpay webhook to race: exactly one wins.
 *
 * A duplicate-key error is the losing side of that race, not a failure — the
 * unique index on razorpayOrderId is doing precisely its job.
 */
async function claimPurchaseReport(razorpayOrderId: string) {
  try {
    return await AnalyticsAttribution.findOneAndUpdate(
      { razorpayOrderId, purchaseReportedAt: { $in: [null, undefined] } },
      { $set: { purchaseReportedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (e: any) {
    if (e?.code === 11000) return null;
    throw e;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Report a completed purchase to GA4.
 *
 * Safe to call from every payment path — the claim above makes repeat calls
 * for one order into no-ops. Never throws: analytics must not be able to fail a
 * booking, so every error is caught and logged.
 *
 * Call it with `void` from controllers; there is nothing useful to await.
 */
export async function reportServerPurchase(args: {
  razorpayOrderId: string;
  value: number;
  currency?: string;
  items: Ga4Item[];
  /** Raw account id — hashed here before it leaves the process. */
  userId?: string | null;
  /** Free-text label used only in logs, e.g. "Puja" or "Chadhava". */
  service?: string;
  /** Set when the caller already knows the coupon/affiliate code. */
  coupon?: string;
}): Promise<void> {
  const { razorpayOrderId, value, items, service = "Order" } = args;

  try {
    if (!razorpayOrderId) return;

    if (!isProduction) {
      console.log(
        `[GA4][${service}] Skipped (PAYMENT_MODE != production) for order=${razorpayOrderId}`,
      );
      return;
    }

    const attribution = await claimPurchaseReport(razorpayOrderId);
    if (!attribution) {
      console.log(
        `[GA4][${service}] Purchase for order=${razorpayOrderId} already reported — skipped.`,
      );
      return;
    }

    const clientId = attribution.clientId || fallbackClientId(razorpayOrderId);
    if (!attribution.clientId) {
      console.warn(
        `[GA4][${service}] No stashed client id for order=${razorpayOrderId}; ` +
          "reporting with a synthetic id — this purchase will show as (direct).",
      );
    }

    const payload: Ga4Payload = {
      client_id: clientId,
      ...(hashUserId(args.userId) && { user_id: hashUserId(args.userId) }),
      timestamp_micros: String(Date.now() * 1000),
      non_personalized_ads: false,
      consent: { ad_user_data: "GRANTED", ad_personalization: "GRANTED" },
      events: [
        {
          name: "purchase",
          params: {
            transaction_id: razorpayOrderId,
            value: Math.round((Number(value) || 0) * 100) / 100,
            currency: args.currency || "INR",
            ...(args.coupon && { coupon: args.coupon }),
            // Without session_id the event starts its own session and never
            // joins the browsing that led to it, breaking every path report.
            ...(attribution.sessionId && { session_id: attribution.sessionId }),
            // GA4 discards events from a session with no engagement time. 1ms
            // is the documented minimum for server-sent events.
            engagement_time_msec: 1,
            items: items.map((item) => ({
              ...item,
              quantity: item.quantity ?? 1,
            })),
          },
        },
      ],
    };

    const ok = await sendToGa4(payload);
    console.log(
      `[GA4][${service}] Purchase ${ok ? "sent" : "FAILED"} for order=${razorpayOrderId} ` +
        `value=${payload.events[0].params.value} ${args.currency || "INR"}`,
    );
  } catch (e: any) {
    console.error(
      `[GA4][${service}] Purchase reporting failed for order=${args.razorpayOrderId}:`,
      e?.response?.data || e?.message || e,
    );
  }
}

/**
 * Report any other GA4 event from the server — a lead qualified by an operator,
 * a refund, a booking cancelled in the admin panel.
 *
 * Unlike purchases this has no exactly-once guard, because these events have no
 * natural dedup key. Call it from one place per event.
 */
export async function reportServerEvent(args: {
  name: string;
  params?: Record<string, unknown>;
  clientId?: string | null;
  /** Falls back to deriving a stable id from this when no client id is known. */
  fallbackKey?: string;
  userId?: string | null;
}): Promise<void> {
  try {
    const clientId =
      args.clientId || (args.fallbackKey ? fallbackClientId(args.fallbackKey) : "");
    if (!clientId) {
      console.warn(`[GA4] Event "${args.name}" skipped: no client id and no fallback key.`);
      return;
    }

    await sendToGa4({
      client_id: clientId,
      ...(hashUserId(args.userId) && { user_id: hashUserId(args.userId) }),
      timestamp_micros: String(Date.now() * 1000),
      events: [
        {
          name: args.name,
          params: { engagement_time_msec: 1, ...(args.params || {}) },
        },
      ],
    });
  } catch (e: any) {
    console.error(`[GA4] Event "${args.name}" failed:`, e?.message || e);
  }
}

/**
 * Look up a stashed attribution row.
 *
 * Exposed so the Meta CAPI calls in the webhook path can reuse the same fbp/fbc
 * the browser parked, instead of sending no match signals at all.
 */
export async function getStoredAttribution(razorpayOrderId: string) {
  if (!razorpayOrderId) return null;
  return AnalyticsAttribution.findOne({ razorpayOrderId }).lean();
}
