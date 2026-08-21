# International Payments — How It Works Here, and How to Port It

Yes, this project has a full international (multi-currency) payment system on top of
Razorpay. This document describes it end to end so it can be rebuilt in another
codebase without re-deriving the design.

Everything below is real, working code in this repo. File paths are given so you can
copy the originals rather than retype them.

---

## 1. The one invariant everything else follows

> **The base currency (INR) is the only source of truth. A foreign currency is a
> *presentment* layer on top.**

Concretely:

- Every price in the catalog, every booking's `amount`, every analytics event, every
  confirmation email and every admin screen stays in INR — forever, unchanged.
- The devotee **reads** the price in their own money and their card is **charged** in
  their own money, but the record is still an INR record with the foreign figures
  stored *beside* it (`currency`, `chargedAmount`, `fxRate`, `priceMultiplier`).
- Nothing in the pricing maths ever reads the converted value back. Conversion is a
  pure function `INR -> foreign`, never the reverse.

Why this matters: it means adding international support touched **zero** downstream
consumers. Reporting, refunds, accounting, CRM, ad-platform conversion values, WhatsApp
templates — all kept seeing rupees.

If you port only one idea, port this one.

---

## 2. How a foreign price is built

```
India list price          ₹2,100
  × tier multiplier       × 3.3          ← FOREIGN_PRICE_TIERS  (pricing decision)
  = INR value of sale     ₹6,930         ← this is what the booking stores as `amount`
  ÷ exchange rate         ÷ 88   (USD)   ← EXCHANGE_RATES
  × safety buffer         × 1.03         ← FX_BUFFER            (FX-drift safety)
  = charged               $81.11         ← what the card sees
  × 100                   = 8111         ← what Razorpay's `amount` field wants
```

Two separate dials, deliberately not merged:

| Dial | What it is | Where |
|---|---|---|
| `FOREIGN_PRICE_TIERS` / multipliers | A **pricing** decision — selling abroad costs more (cross-border fees, refunds, timezone support, international courier). | `server/src/config/pricing.ts` |
| `FX_BUFFER` | An **FX safety** mechanic — margin so the settled INR can never land under the list price after the gateway's cross-currency cut. | `server/src/config/pricing.ts` |

Conflating them would mean you cannot change what you charge abroad without also
changing your tolerance for rate drift.

### The tier ladder

Markup is banded by how much **one unit** of the buyer's currency is worth in rupees:

```ts
export const FOREIGN_PRICE_TIERS = [
  { under: 100, multiplier: 3.3 },     // USD ₹88, EUR ₹96, AED ₹24, JPY ₹0.58
  { under: 150, multiplier: 2.2 },     // GBP ₹113, CHF ₹105
  { under: Infinity, multiplier: 2 },  // anything worth ₹150+ per unit
];
```

**Known weakness, handle it deliberately:** the ladder keys on how a currency is
*denominated*, not on what it can *buy*. NPR is ₹0.63/unit, so Nepal lands in the top
band by accident. That is what the per-currency escape hatch is for:

```ts
export const CURRENCY_MULTIPLIER_OVERRIDES: Record<string, number> = {
  // NPR: 1,   // neighbouring market — sell at the India price
  // ZAR: 2,
};
```

Resolution order, most specific wins:
1. `FX_MULTIPLIERS` env / `CURRENCY_MULTIPLIER_OVERRIDES` — this exact currency
2. `FX_MULTIPLIER` env — one flat number for everyone, turns the ladder off
3. the tier ladder
4. base currency is **never** marked up

### Exchange rates are fixed, not live

```ts
export const EXCHANGE_RATES: Record<string, { exp: 0 | 2; inr: number }> = {
  INR: { exp: 2, inr: 1 },
  USD: { exp: 2, inr: 88 },
  GBP: { exp: 2, inr: 113 },
  JPY: { exp: 0, inr: 0.58 },   // no subunit — exp 0
  // …24 currencies total
};
```

This is a choice, not laziness:
- a rate that moves between the price someone **read** and the price their card is
  **charged** is a support ticket;
- a rate API is one more thing that can be down between a customer and their payment.

Review a few times a year; `FX_BUFFER` absorbs drift in between; `FX_RATES` env is the
hotfix path.

`exp` is the **minor-unit exponent** and it is load-bearing — Razorpay bills in the
smallest unit. 2 for almost everything (cents), 0 for JPY. Get it wrong and you bill
100× too much or too little. Three-decimal currencies (KWD/BHD/OMR) are deliberately
absent here — those countries are priced in USD instead, so the code only ever handles
the two well-trodden cases.

---

## 3. File map

### Server

| File | Role |
|---|---|
| `server/src/config/pricing.ts` | **The one file you edit to change pricing.** Tiers, per-currency overrides, exchange rates, FX buffer. Pure data + comments. |
| `server/src/config/currency.ts` | Resolves that config (applying env overrides), exposes `resolveCurrency`, `convertFromInr`, `toMinorUnits`, `markUpInr`, `multiplierFor`, `inrPerUnit`, `currencyConfig`, `normalizePhone`. Single source of truth for FX. |
| `server/src/utils/internationalOrder.ts` | The shared order-creation contract: `resolveOrderPricing`, `createOrderWithFallback`, `internationalFields`, `paymentCoversOrder`. Written once so six checkout controllers cannot drift. |
| `server/src/utils/geoip.ts` | Resolves the caller's country from the IP — edge headers → your provider → keyless fallbacks. Cached, de-duplicated, never throws. |
| `server/src/controller/userApp/configController.ts` | `GET /api/config/currency` — live FX table **plus** the caller's country, one round trip. |
| `server/src/controller/payments/razorpayWebhookController.ts` | Signature-verified webhook; fans out to per-service reconcilers that do the currency-correct amount check. |

### Frontend

| File | Role |
|---|---|
| `frontend/src/utils/currency.ts` | The whole client side in one module: currency table, country table, detection, live-rate sync, conversion, formatting, the `useMoney()` hook, phone helpers. ~840 lines, no dependencies beyond React. |
| `frontend/src/components/checkout/CountryPicker.tsx` | "Paying from 🇺🇸 United States · USD" pill. A native `<select>` layered invisibly over it. |
| `frontend/src/components/checkout/PhoneField.tsx` | Dial-code-aware phone input. |

---

## 4. Server implementation

### 4.1 The config module (`config/currency.ts`)

Key exports, each a one-liner you will reuse constantly:

```ts
export const BASE_CURRENCY = 'INR';

/** Unrecognised code → base currency. NEVER throws — an unknown currency must
 *  not be the reason someone cannot pay. A foreign card can pay an INR order. */
export function resolveCurrency(code?: unknown): string {
  const c = String(code ?? '').toUpperCase();
  return CURRENCIES[c] ? c : BASE_CURRENCY;
}

/** INR → charge amount, rounded UP to the minor unit so the settled INR can
 *  never come in under the list price. Does NOT apply the multiplier. */
export function convertFromInr(inr: number, currency: string): number {
  const c = CURRENCIES[currency];
  if (!c || currency === BASE_CURRENCY) return inr;
  const f = 10 ** c.exp;
  return Math.ceil((inr / c.inr) * FX_BUFFER * f) / f;
}

/** The smallest unit — what the gateway bills. */
export function toMinorUnits(amount: number, currency: string): number {
  const c = CURRENCIES[currency] ?? CURRENCIES.INR;
  return Math.round(amount * 10 ** c.exp);
}

/** List price → the INR a sale in this market is worth. For SERVER-priced flows. */
export function markUpInr(listInr: number, currency: string): number {
  return Math.round(Number(listInr) * multiplierFor(currency));
}
```

**Where the markup is applied depends on who owns the price** — and getting this wrong
double-charges:

- **Client-priced flows** (the browser computes the total and sends it): the browser
  applies the multiplier via `inrEquivalent()`. The server must **not** apply it again.
- **Server-priced flows** (the catalog is authoritative, the client only names items —
  here: chadhava, vivah): the server applies it via `markUpInr()`.

Both read the same resolved multiplier, so there is still one number to change.

Every env override is parsed defensively — a bad value logs a warning and keeps the
default. A typo in an env var must never be able to stop the site taking payments:

```ts
if (Number.isFinite(raw) && raw >= 1 && raw <= 1.25) return raw;   // FX_BUFFER
if (Number.isFinite(n) && n > 0 && n <= 20) return n;              // multipliers
```

The bounds are typo guards: a bare `3` meaning "3%" would otherwise apply a 300% markup
to real customers.

### 4.2 The shared order helper (`utils/internationalOrder.ts`)

Six controllers take payments in this codebase. International support written six times
would drift six ways — and the two things that must not drift are *the amount billed*
and *the amount verified later against the webhook*. Hence one narrow contract:

```ts
export type OrderPricing = {
  currency: string;         // ISO-4217 actually used (base currency when unusable)
  chargedAmount: number;    // `amountInr` expressed in `currency`
  amountMinor: number;      // what the gateway's `amount` field wants
  fxRate: number;           // INR per 1 unit, so a charge reconciles months later
  priceMultiplier: number;  // the foreign markup that produced `amountInr`
};

export function resolveOrderPricing(amountInr: number, requested?: unknown): OrderPricing;
```

The contract's two rules:
- `amountInr` is the INR the sale is worth, **already marked up**. It becomes the
  booking's stored amount, so downstream keeps working in rupees.
- `currency` is only ever a **request**. The charge is re-derived from the INR, so a
  tampered client can change *which currency* it is billed in but never *how much*.

#### Fallback on an unsupported currency

```ts
export async function createOrderWithFallback(
  razorpay, amountInr, requestedCurrency, baseOptions, label = 'Order',
): Promise<{ order: any; pricing: OrderPricing }> {
  let pricing = resolveOrderPricing(amountInr, requestedCurrency);
  const build = (p) => ({
    ...baseOptions,
    amount: p.amountMinor,
    currency: p.currency,
    notes: {
      ...(baseOptions.notes || {}),
      ...(p.currency !== BASE_CURRENCY && {
        currency: p.currency,
        chargedAmount: String(p.chargedAmount),
        amountInr: String(amountInr),
      }),
    },
  });

  try {
    return { order: await razorpay.orders.create(build(pricing)), pricing };
  } catch (err) {
    if (pricing.currency === BASE_CURRENCY) throw err;
    console.error(`[${label}] Gateway rejected a ${pricing.currency} order; retrying in ${BASE_CURRENCY}.`);
    pricing = resolveOrderPricing(amountInr, BASE_CURRENCY);
    return { order: await razorpay.orders.create(build(pricing)), pricing };
  }
}
```

A currency the gateway account is not enabled for is the **one failure with a good
answer**: international cards can pay an INR order perfectly well, so bill in rupees
rather than showing "could not start payment" and losing the sale.

⚠️ **Callers must persist the returned `pricing`, not what they asked for** — otherwise
the webhook's amount check compares a rupee payment against a dollar expectation.

#### The fields to store on every record

```ts
export function internationalFields(pricing, geo?) {
  return {
    currency: pricing.currency,
    chargedAmount: pricing.chargedAmount,
    fxRate: pricing.fxRate,
    priceMultiplier: pricing.priceMultiplier,
    ...(geo?.countryCode ? { countryCode: String(geo.countryCode).toUpperCase().slice(0, 2) } : {}),
    ...(geo?.country ? { country: String(geo.country).slice(0, 64) } : {}),
  };
}
```

Stored even for the home market, so a record always states its own market rather than
leaving it to be inferred from a phone number. Country is optional because some flows
(COD, admin-created records) have no browser to ask.

#### The amount check — the bug this exists to prevent

```ts
export function paymentCoversOrder(paidMinor, doc): boolean {
  if (typeof paidMinor !== 'number' || !Number.isFinite(paidMinor)) return true;
  const currency = doc.currency || BASE_CURRENCY;
  const expectedMajor =
    currency === BASE_CURRENCY
      ? Number(doc.amount ?? 0)
      : Number(doc.chargedAmount ?? convertFromInr(Number(doc.amount ?? 0), currency));
  return paidMinor >= toMinorUnits(expectedMajor, currency);
}
```

**The gateway reports the amount in the ORDER's currency, in its smallest unit** — cents
for a USD order, not paise. Comparing that against `amountInr * 100` makes every foreign
payment look underpaid and strands an order the customer has already paid for.

*(Note: `paymentCoversOrder` is the extracted helper; the pooja reconciler at
`poojaBookingController.ts:1077` still carries the same logic inline. Port the helper
and use it everywhere.)*

### 4.3 Usage in a controller

Server-priced flow (`chadhavaController.ts:529`):

```ts
const orderCurrency = resolveCurrency(req.body.currency);
const amountInr = markUpInr(pricing.grandTotal, orderCurrency);   // catalog owns price

const { order, pricing: fx } = await createOrderWithFallback(
  razorpay, amountInr, orderCurrency, orderOptions, "Chadhava",
);

const booking = await ChadhavaBooking.create({
  totalAmount: amountInr,          // INR value of the sale
  listAmount: pricing.grandTotal,  // India list price, kept for reporting
  ...internationalFields(fx, req.body),
  razorpayOrderId: order.id,
  // …
});

res.status(201).json({
  // The checkout must open on the SAME currency + amount the order carries.
  currency: fx.currency,
  chargedAmount: fx.chargedAmount,
  amountMinor: fx.amountMinor,
  razorpayOrderId: order.id,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
});
```

### 4.4 Geo-IP (`utils/geoip.ts`)

The browser guesses from the timezone — instant and free, but a property of the
**device**: a phone on a US VPN still reports `Asia/Kolkata`. The IP is a property of the
**connection** and only the server can see it. So the browser paints on its guess and
this corrects it.

Resolution order:
1. **Edge header** — `cf-ipcountry`, `x-vercel-ip-country`, `x-appengine-country`,
   `fastly-client-country`. Free, instant, exact. One property read to check.
   (Cloudflare sends `XX` for anonymising proxies — treat that as unknown.)
2. **`GEOIP_URL`** if set — your own provider, e.g.
   `https://ipinfo.io/{ip}/json?token=…`. Country read from any of
   `country_code` / `countryCode` / `country`.
3. **Keyless fallbacks** — `https://ipwho.is/{ip}`, `https://api.country.is/{ip}`.

Every step may fail; `null` is not an error, it means "keep the browser's guess".

Details worth copying:

```ts
/** The client's own IP, not your proxy's. nginx APPENDS to X-Forwarded-For, so
 *  the chain reads `client, proxy1, proxy2` — the FIRST entry is the browser.
 *  Taking the last (or req.ip) resolves every visitor to your own datacentre. */
export function clientIp(req: Request): string | null {
  const fwd = req.headers['x-forwarded-for'];
  const chain = Array.isArray(fwd) ? fwd[0] : fwd;
  const first = String(chain || req.ip || '').split(',')[0].trim();
  return first.replace(/^::ffff:/, '') || null;   // IPv4 wearing an IPv6 costume
}
```

- **Cache**: 12h TTL for a hit (an IP's country effectively never changes), 5min for a
  failure (so an upstream blip doesn't blind you for half a day), bounded at 20 000
  entries with FIFO eviction (a `Map` preserves insertion order, so no bookkeeping).
- **In-flight de-duplication**: a burst from one IP makes exactly one upstream call.
- **1.5s timeout**: this sits in front of a config response the page is waiting on. A
  provider slower than that is worse than no provider.
- **Localhost**: `::1` cannot be geolocated, so the whole flow is untestable in dev.
  `GEOIP_DEV_COUNTRY=DE` forces a country; `GEOIP_DEV_COUNTRY=auto` geolocates the
  *server machine's* own egress, which on a box behind a system-wide VPN follows the
  VPN. Only ever consulted for a **private** client IP, so it cannot affect a real
  visitor.

### 4.5 The config endpoint

```ts
// GET /api/config/currency
export const getCurrencyConfig = async (req, res) => {
  const country = await countryFromRequest(req).catch(() => null);
  res.set('Cache-Control', 'private, no-store');
  res.status(200).json({
    ...currencyConfig(),                                        // buffer, rates, multipliers
    country,
    ...(req.query.debug === '1' && { debugIp: clientIp(req) }),
  });
};
```

Two jobs in one request on purpose — the browser needs both before it can price the
page, and a second round trip in front of a checkout buys nothing.

🔒 **`no-store` is load-bearing.** A rates-only response could be `public, max-age=300`;
once the caller's country is in the payload that becomes a privacy bug — a shared or CDN
cache would hand one visitor's country to the next. The payload is a few hundred bytes,
so not caching costs nothing measurable, and a rate change takes effect on the very next
page load.

`?debug=1` echoes the resolved IP — the one thing you cannot otherwise see, and the
first thing to check when detection "doesn't work". If it comes back as the server's own
address or null, the proxy in front is not passing `X-Forwarded-For`.

The `multipliers` map is sent **already resolved per currency**, so the tier rule exists
in exactly one place and the client looks the answer up instead of re-deriving it.

---

## 5. Frontend implementation (`utils/currency.ts`)

### 5.1 Two tables

```ts
type CurrencyDef = { code: string; symbol: string; exp: 0 | 2; inr: number };

export const CURRENCIES: Record<string, CurrencyDef> = {
  INR: { code: "INR", symbol: "₹",  exp: 2, inr: 1 },
  USD: { code: "USD", symbol: "$",  exp: 2, inr: 88 },
  JPY: { code: "JPY", symbol: "¥",  exp: 0, inr: 0.58 },
  // …
};

export type Country = {
  iso2: string; name: string; flag: string;
  dial: string;                    // calling code, no "+"
  currency: string;
  phone: [min: number, max: number];   // national-significant-number length
  postal: string;                      // what the last address line is called locally
};

export const COUNTRIES: Country[] = [
  { iso2: "IN", name: "India",         flag: "🇮🇳", dial: "91",  currency: "INR", phone: [10,10], postal: "Pincode" },
  { iso2: "US", name: "United States", flag: "🇺🇸", dial: "1",   currency: "USD", phone: [10,10], postal: "ZIP code" },
  { iso2: "KW", name: "Kuwait",        flag: "🇰🇼", dial: "965", currency: "USD", phone: [8,8],   postal: "PO Box" },
  // …37 countries
];
```

Note Kuwait/Oman/Bahrain map to **USD** — that is how three-decimal currencies are
dodged entirely. A country not on the list falls back to the home market, which is safe
rather than broken (a foreign card can pay a home-currency order).

The frontend table is a **bootstrap default only**, so the first paint never waits on a
network call. Symbols and the country mapping stay a frontend concern; only `exp` and
`inr` are taken from the server.

### 5.2 Country detection, best signal first

1. **`?country=US`** — an explicit instruction. Session only, deliberately **not**
   persisted: a saved test override would silently outrank the IP on every later visit,
   which is exactly the confusion you don't want while checking whether detection works.
2. **A saved manual pick** (`localStorage`) — auto-detection never overwrites it.
3. **The IP-resolved country from last visit** (cached) — the most accurate signal.
4. **Timezone**, via a packed `IANA zone → ISO2` map. Then **`navigator.language`**
   (`en-GB` → `GB`) as a weaker fallback — an NRI in Dubai often still runs `en-IN`,
   which is exactly why it is the fallback and not the primary.

All four are synchronous, because the sticky price bar is the first thing read on these
pages and must never paint empty. `syncConfig()` then confirms against the live IP,
which is what makes a VPN take effect.

The pin has an escape hatch (`clearCountryPin()`, surfaced as "🌐 Detect automatically"
in the picker). Without it, one mis-tap locks a country in for good.

### 5.3 The store — deliberately not React context

```ts
let country = initial();
const listeners = new Set<() => void>();
let ratesRevision = 0;
let snapshot = country;          // "IN" → "IN#1" once rates land

function publish() {
  snapshot = `${country}#${ratesRevision}`;
  listeners.forEach((l) => l());
}
```

A module-level store subscribed via `useSyncExternalStore`, because the checkout needs
the country **before the first paint** and this way no provider has to be threaded
through `App.tsx`.

The snapshot covers the country **and** a rate revision, so a fresh rate table repaints
every price the same way switching country does. Without the revision, rates landing
after paint would leave stale prices until an unrelated re-render.

`useCurrencyRoot()` is mounted **once at the app root** and holds the only subscription.
That is what makes ~50 files able to call a plain `money(price)` function instead of
threading a hook through every component scope — the root re-render cascades to
everything (nothing in the tree is `React.memo`'d).

### 5.4 Live rate sync

```ts
function syncConfig() {
  fetch(`${API_URL}/config/currency`)
    .then((r) => {
      if (!r.ok) { console.warn(`[currency] → HTTP ${r.status}. Keeping bootstrap rates.`); return null; }
      return r.json();
    })
    .then((payload) => {
      if (!payload) return;
      localStorage.setItem(RATES_KEY, JSON.stringify({
        buffer: payload.buffer, rates: payload.rates, multipliers: payload.multipliers,
      }));
      if (applyRates(payload)) { ratesRevision += 1; publish(); }
      if (!import.meta.env.DEV) applyGeoCountry(payload.country);
    })
    .catch((err) => console.warn("[currency] config fetch failed:", err?.message || err));
}
```

- **Fire-and-forget.** The page is already painted and priced from cached/bootstrap
  values. A checkout that *blocks* on a config call is a lost sale.
- **Cached rates are read synchronously at module load**, so a repeat visitor is priced
  correctly with zero latency.
- **The country is cached under its own key**, never folded into the rates blob —
  otherwise reading the rates cache would resurrect a stale country.
- **`applyRates` degrades safely**: only `exp`/`inr` are taken, a currency the server
  dropped keeps its bootstrap values rather than vanishing mid-checkout, and malformed
  values are skipped. A bad payload means "prices unchanged", never "prices wrong".
- **Bounds mirror the server's**, so a value the server would have rejected cannot slip
  in through a stale cached payload either.
- **Failures are logged, never silent.** A 404 here looks exactly like broken geo
  detection with no way to tell them apart from the outside.

**Dev-only browser-side geo** (`syncDevGeo`): on localhost the server sees a loopback
address. Asking it to geolocate its own egress only works if the VPN is system-wide —
a browser-extension or split-tunnel VPN moves the *browser* and leaves Node connecting
from your real location. So in dev the browser asks a third party directly. Guarded by
`import.meta.env.DEV`, a compile-time constant, so the function and its providers vanish
from the production bundle — a real visitor's browser never makes that request.

### 5.5 Conversion and the public API

```ts
/** INR → presentment amount, rounded UP. Costs the buyer at most one cent and
 *  guarantees the settled INR never lands under the list price. */
export function convert(inr: number, currencyCode: string): number {
  const c = CURRENCIES[currencyCode];
  if (!c || c.code === "INR") return inr;
  const f = 10 ** c.exp;
  return Math.ceil((inrEquivalent(inr, currencyCode) / c.inr) * FX_BUFFER * f) / f;
}

/** List price → the INR this sale is actually worth. THIS is what a booking
 *  sends as `amount`. Send the unmultiplied price and a ₹2,100 seva sold for
 *  the equivalent of ₹6,930 is recorded as a ₹2,100 sale. */
export function inrEquivalent(inr: number, currencyCode: string): number {
  return Math.round(inr * multiplierFor(currencyCode));
}

/** The one call almost every price on the site needs. */
export function money(inr: number): string { return formatMoney(inr, currentCountry().currency); }
export function toInr(listPrice: number): number { return inrEquivalent(listPrice, currentCountry().currency); }
export const isIndia = (): boolean => currentCountry().iso2 === "IN";
```

`Intl.NumberFormat` instances are **built once per currency and cached** — this runs on
every price on the page.

The home market keeps its exact original formatting (`₹1,100`, Indian grouping, no
decimals) so nothing about it changes visually.

#### Showing an amount that was already paid

```ts
export function paidMoney(booking: { amount?: number; currency?: string; chargedAmount?: number }): string {
  const inr = Number(booking?.amount ?? 0);
  const code = booking?.currency;
  const charged = Number(booking?.chargedAmount ?? NaN);
  if (!code || code === "INR" || !CURRENCIES[code] || !Number.isFinite(charged))
    return `₹${Math.round(inr).toLocaleString("en-IN")}`;
  return `${CURRENCIES[code].symbol}${formatterFor(code).format(charged)}`;
}
```

**Past orders must not be re-priced by today's picker.** Someone who paid ₹2,100 from
Delhi did not pay $24, and showing them $24 because they are travelling misrepresents a
receipt. Read the currency stored **on the record**, and fall back to the home currency
for historic rows that predate the feature.

### 5.6 The hook

```ts
export function useMoney(): Money {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const c = BY_ISO2[snap.split("#")[0]] ?? INDIA;
  return {
    country: c,
    currency: c.currency,
    isIndia: c.iso2 === "IN",
    money:   useCallback((inr) => formatMoney(inr, c.currency), [c.currency]),
    convert: useCallback((inr) => convert(inr, c.currency),     [c.currency]),
    inr:     useCallback((list) => inrEquivalent(list, c.currency), [c.currency]),
    multiplier: multiplierFor(c.currency),
    setCountry,
  };
}
```

### 5.7 Phone and shipping helpers

```ts
export const shipsPrasad = (c: Country): boolean => c.iso2 === "IN";   // physical goods, home only
export function sanitizePhone(value: string, c: Country): string;      // digits, capped at c.phone[1]
export function isValidPhone(value: string, c: Country): boolean;      // within c.phone range
export function toStoredPhone(value: string, c: Country): string;      // "IN" → bare 10 digits, else dial-prefixed
```

The asymmetry is deliberate: the home market keeps the **bare 10 digits** every existing
record, push-notification alias and messaging template already assumes. Everyone else
keeps their country code so the confirmation actually reaches them. The server mirrors
this in `normalizePhone(raw, dialCode)`.

Also worth copying: **any physical-goods add-on must be gated on country.** Perishable
goods either get refused at customs or cost more than the order itself — so don't offer
the box abroad rather than selling it and apologising afterwards.

### 5.8 Checkout call site

```tsx
const { country, currency, isIndia, money } = useMoney();

const orderRes = await fetch(`${API_URL}/chadhava-bookings/create-order`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    currency,                     // a REQUEST — the server re-derives the amount
    countryCode: country.iso2,
    country: country.name,
    // …the rest of the order
  }),
});
const orderData = await orderRes.json();

const rzp = new window.Razorpay({
  key: orderData.razorpayKeyId,
  // From the order the server just created — re-deriving these is the one
  // place display and charge could drift apart.
  amount: orderData.amountMinor ?? Number(orderData.amount) * 100,
  currency: orderData.currency || "INR",
  order_id: orderData.razorpayOrderId,
  // …
});
```

⚠️ **Never re-compute `amount`/`currency` in the checkout options.** Take them from the
create-order response. The server may have fallen back to the base currency, and if the
checkout opens on a different currency than the order carries, the payment fails or
verifies against the wrong expectation.

---

## 6. Data model additions

Added to every payable document (example: `poojaBooking.model.ts:82`):

```ts
currency:        { type: String, default: 'INR' },   // ISO-4217 the card actually saw
chargedAmount:   { type: Number },                   // the amount in that currency
fxRate:          { type: Number },                   // INR per 1 unit, at time of sale
country:         { type: String },                   // display name
countryCode:     { type: String, index: true },      // ISO-3166 alpha-2, indexed for reporting
priceMultiplier: { type: Number },                   // the foreign markup applied
```

`amount` stays exactly what it always was: INR. Reading a record:

```
amount          ₹6,930   ← INR value of the sale (already marked up)
chargedAmount   $81.11   ← what the card saw
currency        USD
country         United States  /  countryCode  US
fxRate          88       ← lets you reconcile the charge months later
priceMultiplier 3.3
```

Storing `fxRate` and `priceMultiplier` is what makes a charge readable a year later,
after both tables have been revised.

---

## 7. Webhook / verification

```ts
const signature = req.headers["x-razorpay-signature"];
const rawBody   = (req as any).rawBody;      // from express.json({ verify }) in index.ts
const expected  = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
if (!signatureMatches(expected, signature)) return res.status(400)…   // timing-safe compare
```

Raw-body capture, mounted before routes (`server/src/index.ts:71`):

```ts
express.json({ verify: (req, _res, buf) => { (req as any).rawBody = buf; } })
```

Then the amount check, **in the order's currency**:

```ts
const currency = doc.currency || BASE_CURRENCY;
const expectedMajor = currency === BASE_CURRENCY
  ? Number(doc.amount)
  : Number(doc.chargedAmount ?? convertFromInr(Number(doc.amount), currency));

if (Number.isFinite(amountPaise) && amountPaise < toMinorUnits(expectedMajor, currency)) {
  console.error(`Amount mismatch order=${orderId}: paid=${amountPaise} expected=… ${currency}. Not confirming.`);
  return true;                     // ack, but don't confirm
}
```

Other webhook properties worth porting:
- **Acknowledge only after processing**, so a crash mid-way makes the gateway retry.
- **Every service reconciler runs, each isolated** in its own try/catch — one order can
  legitimately match two of them, and one failing must not stop the others.
- **Non-2xx on an unexpected error** so the gateway retries with backoff; **200 on an
  unmatched order** so it stops.
- **Downstream reporting (ad-platform conversion values, emails) uses the record's own
  INR total** — the foreign minor units are not comparable to it.
- There is also `server/src/scripts/reconcileStrandedPayments.ts` for sweeping up
  payments whose webhook never landed.

---

## 8. Environment variables

All optional — every one has a committed default. They exist so a rate or a price can be
hotfixed without a deploy.

| Var | Example | Effect |
|---|---|---|
| `FX_RATES` | `"USD:90,GBP:118"` | Override INR-per-unit for the listed currencies only. |
| `FX_BUFFER` | `"1.04"` | Margin over the raw rate. Accepted range 1.00–1.25. |
| `FX_MULTIPLIER` | `"2"` | One flat foreign markup for everyone; turns the tier ladder off. |
| `FX_MULTIPLIERS` | `"USD:2.5,NPR:1"` | Per-currency override, beats both the flat value and the ladder. |
| `FX_TIERS` | `"100:4,150:3,*:2"` | Replace the whole ladder. `*` = Infinity. |
| `GEOIP_URL` | `"https://ipinfo.io/{ip}/json?token=…"` | Your own geo provider, tried before the keyless ones. |
| `GEOIP_DEV_COUNTRY` | `DE` or `auto` | Only consulted for a private/loopback client IP. |

Accepted ranges are typo guards, not policy. Rejections warn and keep the default —
never throw.

---

## 9. Porting checklist

Work in this order; each step is independently shippable.

**Server**
1. [ ] Create `config/pricing.ts` — tiers, per-currency overrides, exchange rates
       (with correct `exp`!), FX buffer. Set your own base currency.
2. [ ] Create `config/currency.ts` — resolution + env overrides + `currencyConfig()`.
       Copy the defensive parsing wholesale.
3. [ ] Create `utils/geoip.ts` — edge headers, provider chain, cache, in-flight dedup.
4. [ ] Add `GET /api/config/currency` returning `{ buffer, rates, multipliers, country }`
       with `Cache-Control: private, no-store`.
5. [ ] Create `utils/internationalOrder.ts` — the four helpers.
6. [ ] Add the six schema fields to every payable model. Index `countryCode`.
7. [ ] Convert each checkout controller: `resolveCurrency` → (`markUpInr` if the
       **server** owns the price) → `createOrderWithFallback` → persist
       `internationalFields(fx, req.body)` → return `currency`/`chargedAmount`/`amountMinor`.
8. [ ] Fix every verification path to compare in the **order's** currency via
       `paymentCoversOrder`.
9. [ ] Confirm your proxy passes `X-Forwarded-For` and `app.set('trust proxy', …)` is
       right for your topology.

**Frontend**
10. [ ] Port `utils/currency.ts`. Trim `COUNTRIES` to the markets you actually serve.
11. [ ] Mount `useCurrencyRoot()` once at the app root.
12. [ ] Replace every hardcoded price render with `money(price)`.
13. [ ] Send `currency` + `countryCode` + `country` from every create-order call, and
        send `inrEquivalent(total)` — not the list price — as `amount` in
        **client-priced** flows.
14. [ ] Take `amount`/`currency` for the checkout SDK **from the create-order response**.
15. [ ] Add `CountryPicker` (with the "detect automatically" row) and `PhoneField`.
16. [ ] Gate physical-goods add-ons on `shipsPrasad(country)` (rename to suit).
17. [ ] Use `paidMoney(record)` on every historic/receipt screen, never `money()`.

**Gateway account**
18. [ ] Enable international payments and the specific presentment currencies on the
        gateway account. The fallback covers a missing one, but silently — check the
        logs for `retrying in INR`.

---

## 10. Testing

| What | How |
|---|---|
| A specific country, no VPN | `?country=US` on any page. Session only, not persisted. |
| Which IP the server saw | `GET /api/config/currency?debug=1` → `debugIp`. Null or your own server address means the proxy isn't passing `X-Forwarded-For`. |
| Localhost, fixed country | `GEOIP_DEV_COUNTRY=DE` |
| Localhost, following a system VPN | `GEOIP_DEV_COUNTRY=auto` |
| Localhost, following a browser-only VPN | Automatic in dev — `syncDevGeo()` asks from the browser. |
| A rate change with no deploy | `FX_RATES="USD:95"`, restart, reload. |
| The unsupported-currency fallback | Disable a currency on the gateway account; the log line is `Razorpay rejected a <CCY> order … retrying in INR`. |
| JPY (exp 0) | Always test one zero-decimal currency — it is where minor-unit bugs surface. |

---

## 11. Pitfalls, collected

1. **Double markup.** Decide per flow whether the client or the server applies the
   multiplier. Applying it in both charges 2× twice and leaves every stored figure
   disagreeing with the card statement.
2. **Comparing minor units across currencies.** Cents are not paise. This strands paid
   orders.
3. **Persisting the *requested* currency instead of the *used* one** after a fallback.
4. **Re-deriving checkout `amount`/`currency` on the client** instead of using the
   create-order response.
5. **Caching a response that contains the caller's country** in a shared/CDN cache.
6. **Taking the last `X-Forwarded-For` entry** — resolves everyone to your datacentre.
7. **Guessing `exp`.** Three-decimal currencies (KWD/BHD/OMR) are why those countries
   are priced in USD here.
8. **Re-pricing historic records** with today's picker.
9. **Throwing on a bad env value or an unknown currency code.** Nothing in this path
   should ever be the reason someone cannot pay — degrade to the base currency.
10. **A tier ladder keyed on denomination**, not purchasing power. Use per-currency
    overrides for lower-income markets with small units.
11. **Blocking the first paint on the config fetch.** Ship a bootstrap table and sync
    in the background.
12. **Offering physical shipping abroad** without checking it can actually be couriered.
