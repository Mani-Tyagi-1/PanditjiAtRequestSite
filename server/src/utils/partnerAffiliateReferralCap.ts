// Shared helper for the Pandit Ji At Request <-> Partner Affiliate commission integration.
//
// The "first N app orders only" rule (admin-editable via the super admin's Commission
// Structure page, default 15) is enforced HERE, on Pandit Ji At Request's own server, against
// its own local User record — NOT on the partner-affiliate side. This mirrors the exact same
// pattern already shipped for Vedic Vaibhav's server: a single atomic DB operation, no
// cross-service round trip, no race condition between two near-simultaneous orders from the
// same customer. Website-sourced orders have NO cap — this only ever applies to
// isFromApp === true orders.
import User from "../model/userApp/userModel";

const DEFAULT_APP_REFERRAL_ORDER_CAP = 15;
const CAP_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — the cap rarely changes; short staleness is fine

let cachedCap: number | null = null;
let cachedAt = 0;

/**
 * Reads the admin-configured appReferralOrderCap for the PANDIT_JI_AT_REQUEST platform from the
 * partner-affiliate platform's public commission-config endpoint (see apps/api
 * routes/externalApi.ts GET /commission-config/:platform). Derived from
 * PARTNER_AFFILIATE_ORDER_API (…/api/external/orders -> …/api/external), so no new env var is
 * required. Falls back to the default cap on any failure — this must never block a booking
 * from completing.
 */
export async function getAppReferralOrderCap(): Promise<number> {
  const now = Date.now();
  if (cachedCap != null && now - cachedAt < CAP_CACHE_TTL_MS) {
    return cachedCap;
  }

  try {
    const ordersApiUrl = process.env.PARTNER_AFFILIATE_ORDER_API;
    if (!ordersApiUrl) {
      return DEFAULT_APP_REFERRAL_ORDER_CAP;
    }
    const base = ordersApiUrl.replace(/\/orders\/?$/, "");
    const configUrl = `${base}/commission-config/PANDIT_JI_AT_REQUEST`;

    // Lazy require so this file has no hard axios dependency at module-load time in contexts
    // that don't need it (keeps this util cheap to import).
    const axios = (await import("axios")).default;
    const headers: Record<string, string> = {};
    if (process.env.EXTERNAL_API_KEY) {
      headers["X-API-KEY"] = process.env.EXTERNAL_API_KEY;
    }
    const res = await axios.get(configUrl, { headers, timeout: 5000 });
    const cap = res.data?.data?.appReferralOrderCap;
    if (typeof cap === "number" && cap >= 0) {
      cachedCap = cap;
      cachedAt = now;
      return cap;
    }
    return DEFAULT_APP_REFERRAL_ORDER_CAP;
  } catch (error: any) {
    console.warn(
      "[partnerAffiliateReferralCap] Failed to fetch appReferralOrderCap, using default:",
      error?.message || error
    );
    return DEFAULT_APP_REFERRAL_ORDER_CAP;
  }
}

/**
 * Normalizes an Indian mobile number so the User lookup matches reliably regardless of how the
 * digits were formatted at checkout (with/without +91, spaces, dashes, etc.).
 */
export function normalizeIndianPhone(mobile: string | undefined | null): string | null {
  if (!mobile) return null;
  const digits = String(mobile).replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

/**
 * Atomically checks-and-increments the referred customer's app-order counter. Returns true iff
 * this order is within their first-N-orders window (and should therefore be pushed to the
 * partner-affiliate commission API); false if the cap has already been reached (the order
 * still completes normally — it just doesn't earn anyone a commission).
 *
 * Uses a single findOneAndUpdate with a $expr cap condition so two near-simultaneous orders
 * from the same customer can never both slip in under the cap.
 */
export async function tryConsumeAppReferralOrder(mobile: string | undefined | null): Promise<boolean> {
  const phone = normalizeIndianPhone(mobile);
  if (!phone) {
    // Can't identify the customer reliably — err on the side of NOT counting/crediting rather
    // than risking an uncapped/unbounded commission stream.
    return false;
  }

  const cap = await getAppReferralOrderCap();
  if (cap <= 0) return false;

  try {
    const updated = await User.findOneAndUpdate(
      {
        phone,
        $expr: { $lt: [{ $ifNull: ["$referralOrdersCounted", 0] }, cap] },
      },
      { $inc: { referralOrdersCounted: 1 } },
      { new: true }
    );
    return !!updated;
  } catch (error) {
    console.error("[partnerAffiliateReferralCap] tryConsumeAppReferralOrder failed:", error);
    return false;
  }
}
