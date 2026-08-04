/**
 * Presentment currencies for international checkout.
 *
 * ── This file is the single source of truth for FX ──────────────────────────
 * The browser ships a copy of the table below purely as a first-paint default,
 * then pulls the live one from `GET /api/config/currency` and caches it. So a
 * rate changed HERE reaches every visitor without a frontend redeploy, and the
 * two copies cannot quietly disagree about what a seva costs.
 *
 * Nothing here decides the booking's price: `amount` is INR everywhere, and the
 * server re-derives the foreign charge from it. A tampered client can only ever
 * ask to be billed in a different currency, never for a different amount.
 *
 * ── TO CHANGE PRICING, EDIT `config/pricing.ts` ─────────────────────────────
 * That file holds the tier ladder, per-currency overrides, exchange rates and
 * the FX buffer, with the reasoning next to each. This module only resolves
 * them (applying any env override) and exposes the result.
 *
 * ── Env overrides, for a hotfix without a deploy ────────────────────────────
 *   FX_RATES="USD:90,GBP:118,EUR:99"   # INR per 1 unit; only the listed
 *                                      # currencies change, rest keep defaults
 *   FX_BUFFER="1.04"                   # margin over the raw rate (1.03 = 3%)
 *   FX_MULTIPLIER="2"                  # charge foreign buyers 2× the India price
 *   FX_MULTIPLIERS="USD:2.5,AED:1.5"   # per-currency override of the above
 *
 * Set any of these in the server env and restart. Unknown codes and
 * unparseable values are ignored with a warning rather than taking the
 * checkout down.
 */

import {
  CURRENCY_MULTIPLIER_OVERRIDES,
  EXCHANGE_RATES,
  FOREIGN_PRICE_TIERS,
  FX_BUFFER as CONFIGURED_BUFFER,
} from './pricing';

export const BASE_CURRENCY = 'INR';

/** The committed tables from `config/pricing.ts`, before any env override. */
const DEFAULT_RATES: Record<string, CurrencyDef> = EXCHANGE_RATES;
const DEFAULT_TIERS: Array<[under: number, multiplier: number]> =
  FOREIGN_PRICE_TIERS.map((t) => [t.under, t.multiplier]);

type CurrencyDef = {
  /** Minor-unit exponent — Razorpay bills in the smallest unit (×100, ×1 for JPY). */
  exp: 0 | 2;
  /** INR per 1 unit of this currency. */
  inr: number;
};

/**
 * Committed defaults — INR per 1 unit. Deliberately NOT live FX: a rate that
 * moves between the price a devotee read and the price their card is charged is
 * a support ticket, and a rate API is one more thing that can be down between
 * someone and their payment. Review these a few times a year, or override them
 * via FX_RATES when they drift faster than that.
 */

/**
 * `FX_RATES="USD:90,GBP:118"` → the listed currencies only.
 *
 * Every rejection is a warning, never a throw: a typo in an env var must not be
 * able to stop the site taking bookings. The currency simply keeps its default.
 */
function applyRateOverrides(base: Record<string, CurrencyDef>): Record<string, CurrencyDef> {
  const raw = process.env.FX_RATES;
  if (!raw) return base;

  const out = { ...base };
  for (const pair of raw.split(',')) {
    const [codeRaw, valueRaw] = pair.split(':');
    const code = String(codeRaw ?? '').trim().toUpperCase();
    const value = Number(String(valueRaw ?? '').trim());

    if (!out[code]) {
      console.warn(`[FX] Ignoring FX_RATES entry "${pair.trim()}": unknown currency.`);
      continue;
    }
    if (!Number.isFinite(value) || value <= 0) {
      console.warn(`[FX] Ignoring FX_RATES entry "${pair.trim()}": rate must be a positive number.`);
      continue;
    }
    if (code === BASE_CURRENCY) {
      console.warn('[FX] Ignoring FX_RATES entry for INR: the base currency is always 1.');
      continue;
    }
    out[code] = { ...out[code], inr: value };
  }
  return out;
}

/** Margin over the raw rate, absorbing drift between rate reviews. */
function resolveBuffer(): number {
  const raw = Number(process.env.FX_BUFFER);
  // Anything outside 1.00–1.25 is far likelier to be a typo (a bare "3" for 3%)
  // than an intentional 300% markup, and silently applying it would overcharge
  // real devotees.
  if (Number.isFinite(raw) && raw >= 1 && raw <= 1.25) return raw;
  if (process.env.FX_BUFFER) {
    console.warn(`[FX] Ignoring FX_BUFFER="${process.env.FX_BUFFER}": expected a number between 1 and 1.25.`);
  }
  return CONFIGURED_BUFFER;
}

/**
 * How much more (or less) a foreign buyer pays than the India list price.
 *
 * A seva costs what it costs to perform, but selling abroad does not cost the
 * same as selling at home — cross-border card fees, refunds, support across
 * timezones and international courier all land on the same booking. This is the
 * one dial for that: 1 = same price as India, 2 = double, 0.5 = half.
 *
 * It is a PRICING decision, deliberately separate from `FX_BUFFER`, which is an
 * FX-safety mechanic. Conflating them would mean you could not change what you
 * charge abroad without also changing your tolerance for rate drift.
 *
 * INR is never multiplied: the home market always pays the list price.
 */
/**
 * Default markup by how strong the currency is against the rupee.
 *
 * Read as "1 unit of their money is worth less than N rupees → charge M×".
 * The weaker a unit is against INR, the larger the number on their price tag
 * for the same seva, and the more headroom there is before it reads as
 * expensive locally.
 *
 * Override the whole ladder with FX_TIERS="100:4,150:3,*:2", a single currency
 * with FX_MULTIPLIERS="NPR:1", or drop back to one flat number for everyone
 * with FX_MULTIPLIER.
 */

function resolveTiers(): Array<[number, number]> {
  const raw = process.env.FX_TIERS;
  if (!raw) return DEFAULT_TIERS;

  const out: Array<[number, number]> = [];
  for (const pair of raw.split(',')) {
    const [boundRaw, multRaw] = pair.split(':');
    const bound = boundRaw?.trim() === '*' ? Infinity : Number(boundRaw);
    const mult = Number(multRaw);
    if (!Number.isFinite(mult) || mult <= 0 || mult > 20 || (!Number.isFinite(bound) && boundRaw?.trim() !== '*')) {
      console.warn(`[FX] Ignoring FX_TIERS entry "${pair.trim()}": expected "<inr>:<multiplier>" or "*:<multiplier>".`);
      continue;
    }
    out.push([bound, mult]);
  }
  if (!out.length) return DEFAULT_TIERS;
  // Ascending, so the first bound a rate falls under is the narrowest match.
  return out.sort((a, b) => a[0] - b[0]);
}

const FX_TIERS = resolveTiers();

/** The tier a currency lands in, from what one unit of it is worth in rupees. */
function tierMultiplier(inrPerUnit: number): number {
  for (const [under, mult] of FX_TIERS) {
    if (inrPerUnit < under) return mult;
  }
  return 1;
}

function resolveMultipliers(known: Record<string, CurrencyDef>): {
  multiplier: number | null;
  multipliers: Record<string, number>;
} {
  const parse = (raw: string | undefined, label: string): number | null => {
    if (!raw) return null;
    const n = Number(raw);
    // 0 would make every foreign seva free and a negative is meaningless; the
    // upper bound is a typo guard ("200" meaning 200%, not 200×).
    if (Number.isFinite(n) && n > 0 && n <= 20) return n;
    console.warn(`[FX] Ignoring ${label}="${raw}": expected a number between 0 and 20.`);
    return null;
  };

  // null, not 1: absent means "fall through to the tier ladder".
  const multiplier = parse(process.env.FX_MULTIPLIER, 'FX_MULTIPLIER');

  // Seeded from config/pricing.ts; FX_MULTIPLIERS can still override per code.
  const multipliers: Record<string, number> = { ...CURRENCY_MULTIPLIER_OVERRIDES };
  for (const pair of String(process.env.FX_MULTIPLIERS || '').split(',')) {
    if (!pair.trim()) continue;
    const [codeRaw, valueRaw] = pair.split(':');
    const code = String(codeRaw ?? '').trim().toUpperCase();
    if (!known[code]) {
      console.warn(`[FX] Ignoring FX_MULTIPLIERS entry "${pair.trim()}": unknown currency.`);
      continue;
    }
    if (code === BASE_CURRENCY) {
      console.warn('[FX] Ignoring FX_MULTIPLIERS entry for INR: the home market always pays list price.');
      continue;
    }
    const value = parse(valueRaw?.trim(), `FX_MULTIPLIERS ${code}`);
    if (value !== null) multipliers[code] = value;
  }

  return { multiplier, multipliers };
}

const CURRENCIES = applyRateOverrides(DEFAULT_RATES);
const FX_BUFFER = resolveBuffer();
const { multiplier: FX_MULTIPLIER, multipliers: FX_MULTIPLIERS } = resolveMultipliers(CURRENCIES);

/**
 * An India list price → the INR a sale in this market is worth.
 *
 * For flows where the SERVER owns the price (chadhava, vivah — the catalog is
 * authoritative and the browser only names the items), the markup has to be
 * applied here. For flows where the browser computes the total and sends it,
 * it has already been applied there. Both read `multiplierFor`, so there is
 * still one number to change — but calling this on an amount the client
 * already marked up would double it.
 */
export function markUpInr(listInr: number, currency: string): number {
  return Math.round(Number(listInr) * multiplierFor(currency));
}

/**
 * What this currency's buyers pay relative to the India list price.
 *
 * Most specific wins:
 *   1. FX_MULTIPLIERS — this exact currency, set by hand.
 *   2. FX_MULTIPLIER  — one flat number for everyone, which turns the ladder off.
 *   3. the tier ladder, from how strong the currency is against the rupee.
 * The home market is never marked up.
 */
export function multiplierFor(currency: string): number {
  if (currency === BASE_CURRENCY) return 1;
  const explicit = FX_MULTIPLIERS[currency];
  if (explicit !== undefined) return explicit;
  if (FX_MULTIPLIER !== null) return FX_MULTIPLIER;
  return tierMultiplier(CURRENCIES[currency]?.inr ?? 1);
}

/**
 * The multiplier for every currency, already resolved.
 *
 * Sent to the browser so the tier rule exists in exactly ONE place. The client
 * looks the answer up rather than re-deriving it, which is what stops the two
 * from ever disagreeing about a price.
 */
function resolvedMultipliers(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const code of Object.keys(CURRENCIES)) out[code] = multiplierFor(code);
  return out;
}

/**
 * The table the browser downloads at `GET /api/config/currency`.
 *
 * Shipping the exponent alongside the rate is what lets the frontend format and
 * pre-compute the charge identically without a second copy of these rules.
 */
export function currencyConfig() {
  return {
    buffer: FX_BUFFER,
    rates: CURRENCIES,
    // Every currency's final multiplier, tiers already applied — the browser
    // never re-derives the rule.
    multipliers: resolvedMultipliers(),
  };
}

/**
 * The currency to bill in, or INR for anything unrecognised.
 *
 * Falling back rather than rejecting is deliberate: an unknown currency code
 * must never be the reason a devotee cannot pay. Razorpay's international
 * support accepts a foreign card against an INR order, so the fallback is a
 * working checkout, not a failed one.
 */
export function resolveCurrency(code?: unknown): string {
  const c = String(code ?? '').toUpperCase();
  return CURRENCIES[c] ? c : BASE_CURRENCY;
}

/**
 * INR → the amount to charge, rounded UP to the currency's minor unit so the
 * settled INR can never come in under the seva price.
 *
 * DOES NOT apply the multiplier, and must not: the `amount` reaching this
 * server has already been marked up by the browser, because that INR figure is
 * the booking's real revenue and everything downstream depends on it being so —
 * the paid-amount check, the Meta CAPI value, the confirmation email, the admin
 * list. Multiplying again here would charge 2× twice and leave every INR number
 * in the system disagreeing with the card statement.
 *
 * Both sides read the multiplier from `currencyConfig()`, so there is still one
 * place to change it.
 */
export function convertFromInr(inr: number, currency: string): number {
  const c = CURRENCIES[currency];
  if (!c || currency === BASE_CURRENCY) return inr;
  const f = 10 ** c.exp;
  return Math.ceil((inr / c.inr) * FX_BUFFER * f) / f;
}

/** The amount in the smallest unit of the currency, which is what Razorpay bills. */
export function toMinorUnits(amount: number, currency: string): number {
  const c = CURRENCIES[currency] ?? CURRENCIES.INR;
  return Math.round(amount * 10 ** c.exp);
}

/** INR per 1 unit — stored on the booking so a charge can be reconciled later. */
export function inrPerUnit(currency: string): number {
  return CURRENCIES[currency]?.inr ?? 1;
}

/**
 * The phone number as it should be stored.
 *
 * India keeps the bare 10 digits every existing booking, OneSignal alias and
 * WhatsApp template already assumes. Everyone else keeps their country code, so
 * the WhatsApp confirmation reaches the right number — `sendBookingConfirmation`
 * only prefixes "91" when it sees exactly 10 digits, so a longer international
 * number passes through untouched.
 */
export function normalizePhone(raw: unknown, dialCode?: unknown): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  const dial = String(dialCode ?? '').replace(/\D/g, '');

  // No dial code, or India's: the historic 10-digit alias.
  if (!dial || dial === '91') return digits.slice(-10);

  // Already carries its country code (the client sends it prefixed).
  if (digits.startsWith(dial)) return digits;
  return `${dial}${digits}`;
}
