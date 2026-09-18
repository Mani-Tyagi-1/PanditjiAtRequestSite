/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  INTERNATIONAL PRICING — EDIT THIS FILE                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Everything that decides what a devotee outside India pays lives here, and
 * nowhere else. Change a number below, restart the server, and it takes effect
 * across the entire site — every puja, chadhava, product, package and checkout,
 * on the web app and in the booking flows — with NO frontend deploy.
 *
 * How a foreign price is built, in order:
 *
 *     India list price          ₹2,100
 *       × tier multiplier       × 3            ← FOREIGN_PRICE_TIERS
 *       = INR value of sale     ₹6,300         ← this is what the booking stores
 *       ÷ exchange rate         ÷ 88  (USD)    ← EXCHANGE_RATES
 *       × safety buffer         × 1.03         ← FX_BUFFER
 *       = charged               $73.74
 *
 * India itself is never marked up. The home market always pays the list price.
 *
 * ── Decimals are fine everywhere ────────────────────────────────────────────
 * Multipliers and rates both accept fractions: 2.5, 1.75, 0.9, 88.35 all work.
 *
 * ── Env overrides (for a hotfix without a deploy) ───────────────────────────
 * Anything here can be overridden at runtime; the env always wins.
 *     FX_TIERS="100:3,150:2.5,*:2"
 *     FX_MULTIPLIERS="NPR:1,ZAR:2"
 *     FX_MULTIPLIER="2"            # one flat number, ignores the tiers
 *     FX_RATES="USD:90,GBP:118"
 *     FX_BUFFER="1.04"
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. FOREIGN PRICE TIERS  —  how much more a foreign devotee pays
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Banded by how much ONE UNIT of the devotee's currency is worth in rupees.
 *
 *   "1 US dollar is worth ₹88, which is under 100, so Americans pay 3×."
 *
 * `under` is the upper bound of the band, exclusive. Keep them ascending; the
 * first band a rate falls under is the one that applies. The last entry must be
 * `Infinity` so every currency lands somewhere.
 *
 * Decimals are allowed in BOTH columns — `{ under: 120.5, multiplier: 2.75 }`
 * is valid.
 */
export const FOREIGN_PRICE_TIERS: Array<{ under: number; multiplier: number }> = [
  { under: 100, multiplier: 3.3 },     // e.g. USD ₹88, EUR ₹96, AED ₹24, JPY ₹0.58
  { under: 150, multiplier: 2.2 },   // e.g. GBP ₹113, CHF ₹105
  { under: Infinity, multiplier: 2 }, // anything worth ₹150+ per unit
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. PER-CURRENCY OVERRIDES  —  exceptions to the tiers above
// ─────────────────────────────────────────────────────────────────────────────
/**
 * A currency listed here ignores the tier ladder entirely.
 *
 * Use it where the banding gives the wrong answer. The tiers key on how a
 * currency is DENOMINATED, not on what it can buy, so a small-unit currency in
 * a lower-income market lands in the top band by accident. Nepal is the clearest
 * case: NPR is ₹0.63 per unit, which would otherwise charge a Nepali devotee
 * the same multiple as an American one.
 *
 * Set `1` to charge a market the plain India price.
 */
export const CURRENCY_MULTIPLIER_OVERRIDES: Record<string, number> = {
  // NPR: 1,   // Nepal — neighbouring market, uncomment to sell at India price
  // ZAR: 2,   // South Africa
  // THB: 2,   // Thailand
  // MUR: 2,   // Mauritius
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXCHANGE RATES  —  INR per 1 unit of the currency
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Deliberately fixed, not live FX:
 *   • a rate that moves between the price a devotee read and the price their
 *     card is charged is a support ticket, and
 *   • a rate API is one more thing that can be down between someone and their
 *     payment.
 *
 * Review a few times a year. `FX_BUFFER` absorbs the drift in between.
 *
 * `exp` is the currency's minor-unit exponent, which Razorpay bills in: 2 for
 * almost everything (cents), 0 for JPY (yen have no subunit). Do not guess it —
 * getting it wrong bills 100× too much or too little.
 */
export const EXCHANGE_RATES: Record<string, { exp: 0 | 2; inr: number }> = {
  INR: { exp: 2, inr: 1 },
  USD: { exp: 2, inr: 88 },
  EUR: { exp: 2, inr: 96 },
  GBP: { exp: 2, inr: 113 },
  AUD: { exp: 2, inr: 57 },
  CAD: { exp: 2, inr: 63 },
  SGD: { exp: 2, inr: 66 },
  AED: { exp: 2, inr: 24 },
  NZD: { exp: 2, inr: 52 },
  CHF: { exp: 2, inr: 105 },
  MYR: { exp: 2, inr: 20 },
  HKD: { exp: 2, inr: 11.3 },
  ZAR: { exp: 2, inr: 4.8 },
  SAR: { exp: 2, inr: 23.5 },
  QAR: { exp: 2, inr: 24.2 },
  THB: { exp: 2, inr: 2.6 },
  MUR: { exp: 2, inr: 1.9 },
  FJD: { exp: 2, inr: 39 },
  TTD: { exp: 2, inr: 13 },
  SEK: { exp: 2, inr: 8.6 },
  NOK: { exp: 2, inr: 8.3 },
  DKK: { exp: 2, inr: 12.9 },
  NPR: { exp: 2, inr: 0.63 },
  JPY: { exp: 0, inr: 0.58 },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. FX SAFETY BUFFER
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Margin over the raw rate, so the rupees that actually settle can never come
 * in under the seva price after the gateway's cross-currency fee. 1.03 = 3%.
 *
 * Separate from the tier multipliers on purpose: this is FX safety, those are a
 * pricing decision. Conflating them would mean you could not change what you
 * charge abroad without also changing your tolerance for rate drift.
 */
export const FX_BUFFER = 1.03;
