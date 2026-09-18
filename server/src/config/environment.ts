// config/environment.ts
// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SWITCH for local vs production partner-affiliate URLs (PJAR WEBSITE server).
// Mirrors Vedic-Vaibhav/server/config/environment.ts exactly.
//
//   In .env:  APP_ENV=local        -> push commissions to http://localhost:9001 (local engine)
//             APP_ENV=production   -> push to the live partner-affiliate engine
//   (If APP_ENV is unset we fall back to NODE_ENV, defaulting to PRODUCTION.)
//
// WHY THIS EXISTS: this repo's committed .env pointed PARTNER_AFFILIATE_ORDER_API at
// http://localhost:9001 — meaning in production every website commission push silently went
// nowhere. With this switch, production IGNORES a stale localhost value (localhost is only
// honored when APP_ENV=local is set explicitly), and local dev in turn ignores a stale
// production URL. Loaded via require() right after dotenv.config() in src/index.ts (a plain
// import would hoist above dotenv and read an empty env).
// ─────────────────────────────────────────────────────────────────────────────

const APP_ENV = (process.env.APP_ENV || process.env.NODE_ENV || "production").toLowerCase();

export const IS_LOCAL = ["local", "development", "dev"].includes(APP_ENV);
export const IS_PRODUCTION = !IS_LOCAL;

const PARTNER_AFFILIATE_LOCAL = "http://localhost:9001";
const PARTNER_AFFILIATE_PROD = "https://partner.vedicvaibhav.in";

/** Full endpoint the payment controllers POST orders to. */
export const PARTNER_AFFILIATE_ORDER_API = IS_LOCAL
  ? `${PARTNER_AFFILIATE_LOCAL}/api/external/orders`
  : (() => {
      const fromEnv = (process.env.PARTNER_AFFILIATE_ORDER_API || "").trim();
      // In production, refuse a localhost value (stale committed .env) — use the live engine.
      if (!fromEnv || /localhost|127\.0\.0\.1/i.test(fromEnv)) {
        return `${PARTNER_AFFILIATE_PROD}/api/external/orders`;
      }
      return fromEnv;
    })();

// Back-compat: keep process.env in sync so EVERY existing reader of
// `process.env.PARTNER_AFFILIATE_ORDER_API` (utils/partnerAffiliateCommission.ts and any other
// call site) automatically uses the switched URL — no per-file changes needed.
process.env.PARTNER_AFFILIATE_ORDER_API = PARTNER_AFFILIATE_ORDER_API;

// One-time visibility so it's obvious at boot which environment the commission integration uses.
console.log(
  `[environment] APP_ENV=${APP_ENV} -> partner-affiliate: ${PARTNER_AFFILIATE_ORDER_API}`,
);
