import {
  BASE_CURRENCY,
  convertFromInr,
  inrPerUnit,
  multiplierFor,
  resolveCurrency,
  toMinorUnits,
} from '../config/currency';

/**
 * One way to raise a Razorpay order in a devotee's own currency.
 *
 * Six controllers take payments in this codebase (puja, chadhava, live mandir,
 * shop, vivah, consultation). Each grew its own order-creation block, so
 * international support written six times would drift six ways — and the two
 * things that must not drift are the amount billed and the amount verified
 * later against a webhook.
 *
 * The contract is narrow on purpose:
 *   • `amountInr` is the INR the sale is worth, ALREADY marked up by the
 *     browser (see the frontend's `inrEquivalent`). It becomes the booking's
 *     stored amount, so every downstream consumer keeps working in rupees.
 *   • `currency` is only ever a REQUEST. The charge is re-derived here from the
 *     INR, so a tampered client can change which currency it is billed in but
 *     never how much.
 */

export type OrderPricing = {
  /** ISO-4217 actually used — INR when the request was unusable. */
  currency: string;
  /** `amountInr` expressed in `currency`; equals `amountInr` for INR. */
  chargedAmount: number;
  /** What Razorpay's `amount` field wants: the smallest unit of `currency`. */
  amountMinor: number;
  /** INR per 1 unit, recorded so a charge can be reconciled months later. */
  fxRate: number;
  /** Foreign markup that produced `amountInr` (1 = none). */
  priceMultiplier: number;
};

export function resolveOrderPricing(amountInr: number, requested?: unknown): OrderPricing {
  const currency = resolveCurrency(requested);
  const chargedAmount = convertFromInr(Number(amountInr), currency);
  return {
    currency,
    chargedAmount,
    amountMinor: toMinorUnits(chargedAmount, currency),
    fxRate: inrPerUnit(currency),
    priceMultiplier: multiplierFor(currency),
  };
}

/**
 * The fields every booking document should carry so a sale can be read back
 * without decoding a phone number: where it was made, what the card saw, and
 * the rate that connects that to the INR figure beside it.
 *
 * Spread into a `create()` call. Country is optional because some flows (the
 * shop's COD path, an admin-created booking) have no browser to ask.
 */
export function internationalFields(
  pricing: OrderPricing,
  geo?: { countryCode?: unknown; country?: unknown },
) {
  return {
    currency: pricing.currency,
    chargedAmount: pricing.chargedAmount,
    fxRate: pricing.fxRate,
    priceMultiplier: pricing.priceMultiplier,
    // Ternaries, not `&&`: the inputs are `unknown`, and `unknown && {...}`
    // is not a spreadable type.
    ...(geo?.countryCode
      ? { countryCode: String(geo.countryCode).toUpperCase().slice(0, 2) }
      : {}),
    ...(geo?.country ? { country: String(geo.country).slice(0, 64) } : {}),
  };
}

/**
 * Create the order, falling back to INR if the account cannot bill that currency.
 *
 * A currency Razorpay has not enabled is the one failure here with a good
 * answer: international cards can pay an INR order perfectly well, so the
 * devotee is billed in rupees instead of being shown "could not start payment"
 * and lost. Returns the pricing that was actually used, which may differ from
 * what was asked for — callers must persist THAT, or the webhook's amount check
 * will later compare a rupee payment against a dollar expectation.
 */
export async function createOrderWithFallback(
  razorpay: { orders: { create: (opts: any) => Promise<any> } },
  amountInr: number,
  requestedCurrency: unknown,
  baseOptions: Record<string, any>,
  label = 'Order',
): Promise<{ order: any; pricing: OrderPricing }> {
  let pricing = resolveOrderPricing(amountInr, requestedCurrency);
  const build = (p: OrderPricing): Record<string, any> => ({
    ...baseOptions,
    amount: p.amountMinor,
    currency: p.currency,
    notes: {
      ...((baseOptions.notes as Record<string, any>) || {}),
      ...(p.currency !== BASE_CURRENCY && {
        currency: p.currency,
        chargedAmount: String(p.chargedAmount),
        amountInr: String(amountInr),
      }),
    },
  });

  try {
    return { order: await razorpay.orders.create(build(pricing)), pricing };
  } catch (err: any) {
    if (pricing.currency === BASE_CURRENCY) throw err;
    console.error(
      `[${label}] Razorpay rejected a ${pricing.currency} order ` +
      `(${err?.error?.description || err?.message}); retrying in ${BASE_CURRENCY}.`,
    );
    pricing = resolveOrderPricing(amountInr, BASE_CURRENCY);
    return { order: await razorpay.orders.create(build(pricing)), pricing };
  }
}

/**
 * Whether a captured payment covers what was owed.
 *
 * Razorpay reports the amount in the ORDER's currency, in its smallest unit —
 * cents for a USD order, not paise. Comparing that against `amountInr * 100`
 * makes every foreign payment look underpaid and strands a booking the devotee
 * has already paid for, so the comparison has to happen in the currency the
 * order was raised in.
 */
export function paymentCoversOrder(
  paidMinor: number | undefined,
  doc: { amount?: number; currency?: string; chargedAmount?: number },
): boolean {
  if (typeof paidMinor !== 'number' || !Number.isFinite(paidMinor)) return true;
  const currency = doc.currency || BASE_CURRENCY;
  const expectedMajor =
    currency === BASE_CURRENCY
      ? Number(doc.amount ?? 0)
      : Number(doc.chargedAmount ?? convertFromInr(Number(doc.amount ?? 0), currency));
  return paidMinor >= toMinorUnits(expectedMajor, currency);
}
