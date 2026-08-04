import { useCallback, useSyncExternalStore } from "react";
import API_URL from "./apiConfig";

/**
 * International presentment currency + country detection for the puja funnels.
 *
 * ── The one rule that keeps this safe ────────────────────────────────────────
 * INR is the ONLY source of truth. Every package price, add-on and total in the
 * app stays in INR end to end: the abandoned-cart row, the booking document, the
 * WhatsApp copy, the admin panel and the Meta pixel all keep seeing the same
 * rupee numbers they saw before this file existed.
 *
 * A foreign currency is a *presentment* layer on top: the devotee READS the
 * price in their own money and their card is CHARGED in it, but the booking is
 * still an INR booking. That is why `convert()` is a pure function of the INR
 * amount and never feeds back into the app's pricing maths.
 *
 * ── How the country is decided ──────────────────────────────────────────────
 * Two signals, in that order, because they answer different questions:
 *
 *   • TIMEZONE / LANGUAGE — a property of the DEVICE. Free and instant, so it
 *     paints the first frame. But it does not move when a VPN does: a phone on
 *     a US VPN still reports Asia/Kolkata.
 *   • THE IP — a property of the CONNECTION, and the honest answer to "where is
 *     this site being loaded". Only the server can see it, so it arrives one
 *     round trip later (`syncConfig`) and corrects the guess. Cached, so the
 *     next visit opens on it directly.
 *
 * A manual pick outranks both, permanently, until it is changed or cleared.
 *
 * ── Where the rates come from ───────────────────────────────────────────────
 * `server/src/config/currency.ts` owns them. The table below is a BOOTSTRAP
 * DEFAULT so the first paint never waits on a network call; `syncRates()` then
 * pulls the live table and caches it in localStorage, so a rate updated on the
 * server reaches every visitor without a frontend deploy. To change a price,
 * change it there — not here.
 */

// ── Currencies ──────────────────────────────────────────────────────────────

type CurrencyDef = {
    /** ISO-4217 code, sent verbatim to Razorpay. */
    code: string;
    /** Symbol drawn in the UI. */
    symbol: string;
    /**
     * Minor-unit exponent. Razorpay wants the order amount in the smallest unit
     * of the currency, which is ×100 for most of the world and ×1 for JPY.
     * Three-decimal currencies (KWD/BHD/OMR) are deliberately absent — those
     * countries are priced in USD instead, so this only ever has to handle the
     * two well-trodden cases.
     */
    exp: 0 | 2;
    /** INR per 1 unit of this currency. */
    inr: number;
};

/**
 * Margin over the raw rate, absorbing FX drift between rate reviews. Together
 * with the `Math.ceil` rounding in `convert()` it guarantees the settled INR
 * can never land under the seva price after cross-currency fees.
 *
 * Overwritten by the server's value once `syncRates()` lands.
 */
let FX_BUFFER = 1.03;

/**
 * How much more a foreign buyer pays than the India list price — 1 = same,
 * 2 = double, 0.5 = half. Set on the server (`FX_MULTIPLIER` /
 * `FX_MULTIPLIERS`) and synced down with the rates, so there is one place to
 * change it and no deploy needed.
 *
 * Applied HERE rather than on the server, and that is load-bearing: the INR
 * total the browser sends becomes the booking's `amount`, which is the number
 * every downstream system treats as the sale's value. Marking up here keeps
 * that figure equal to what the card was actually charged. Marking up on the
 * server instead would leave every booking recording the India price for a sale
 * made at twice it.
 *
 * The home market is never multiplied.
 */
let FX_MULTIPLIER = 1;
let FX_MULTIPLIERS: Record<string, number> = {};

function multiplierFor(currencyCode: string): number {
    if (currencyCode === "INR") return 1;
    return FX_MULTIPLIERS[currencyCode] ?? FX_MULTIPLIER;
}

/**
 * Bootstrap rates — INR per 1 unit. A snapshot of the server's table, used only
 * until `syncRates()` replaces it (instantly, from cache, on a repeat visit).
 * Editing these does NOT change what anyone is charged; see the file header.
 */
export const CURRENCIES: Record<string, CurrencyDef> = {
    INR: { code: "INR", symbol: "₹", exp: 2, inr: 1 },
    USD: { code: "USD", symbol: "$", exp: 2, inr: 88 },
    EUR: { code: "EUR", symbol: "€", exp: 2, inr: 96 },
    GBP: { code: "GBP", symbol: "£", exp: 2, inr: 113 },
    AUD: { code: "AUD", symbol: "A$", exp: 2, inr: 57 },
    CAD: { code: "CAD", symbol: "C$", exp: 2, inr: 63 },
    SGD: { code: "SGD", symbol: "S$", exp: 2, inr: 66 },
    AED: { code: "AED", symbol: "AED ", exp: 2, inr: 24 },
    NZD: { code: "NZD", symbol: "NZ$", exp: 2, inr: 52 },
    CHF: { code: "CHF", symbol: "CHF ", exp: 2, inr: 105 },
    MYR: { code: "MYR", symbol: "RM", exp: 2, inr: 20 },
    HKD: { code: "HKD", symbol: "HK$", exp: 2, inr: 11.3 },
    ZAR: { code: "ZAR", symbol: "R", exp: 2, inr: 4.8 },
    SAR: { code: "SAR", symbol: "SAR ", exp: 2, inr: 23.5 },
    QAR: { code: "QAR", symbol: "QAR ", exp: 2, inr: 24.2 },
    THB: { code: "THB", symbol: "฿", exp: 2, inr: 2.6 },
    MUR: { code: "MUR", symbol: "Rs ", exp: 2, inr: 1.9 },
    FJD: { code: "FJD", symbol: "FJ$", exp: 2, inr: 39 },
    TTD: { code: "TTD", symbol: "TT$", exp: 2, inr: 13 },
    SEK: { code: "SEK", symbol: "SEK ", exp: 2, inr: 8.6 },
    NOK: { code: "NOK", symbol: "NOK ", exp: 2, inr: 8.3 },
    DKK: { code: "DKK", symbol: "DKK ", exp: 2, inr: 12.9 },
    NPR: { code: "NPR", symbol: "NPR ", exp: 2, inr: 0.63 },
    JPY: { code: "JPY", symbol: "¥", exp: 0, inr: 0.58 },
};

// ── Countries ───────────────────────────────────────────────────────────────

export type Country = {
    /** ISO-3166-1 alpha-2. */
    iso2: string;
    name: string;
    flag: string;
    /** Country calling code, no "+". */
    dial: string;
    currency: string;
    /** National-significant-number length range, used to validate the input. */
    phone: [min: number, max: number];
    /** What the last address line is called locally. */
    postal: string;
};

/**
 * Every country the checkout can be opened from, in picker order: India first
 * (the home market), then the diaspora markets by volume.
 *
 * A country that is not on this list falls back to India — see `resolve()`.
 * That fallback is safe rather than broken: Razorpay's international support
 * lets a foreign card pay an INR order, and the picker is one tap away.
 */
export const COUNTRIES: Country[] = [
    { iso2: "IN", name: "India", flag: "🇮🇳", dial: "91", currency: "INR", phone: [10, 10], postal: "Pincode" },
    { iso2: "US", name: "United States", flag: "🇺🇸", dial: "1", currency: "USD", phone: [10, 10], postal: "ZIP code" },
    { iso2: "GB", name: "United Kingdom", flag: "🇬🇧", dial: "44", currency: "GBP", phone: [9, 10], postal: "Postcode" },
    { iso2: "CA", name: "Canada", flag: "🇨🇦", dial: "1", currency: "CAD", phone: [10, 10], postal: "Postal code" },
    { iso2: "AU", name: "Australia", flag: "🇦🇺", dial: "61", currency: "AUD", phone: [9, 9], postal: "Postcode" },
    { iso2: "AE", name: "United Arab Emirates", flag: "🇦🇪", dial: "971", currency: "AED", phone: [8, 9], postal: "PO Box" },
    { iso2: "SG", name: "Singapore", flag: "🇸🇬", dial: "65", currency: "SGD", phone: [8, 8], postal: "Postal code" },
    { iso2: "NZ", name: "New Zealand", flag: "🇳🇿", dial: "64", currency: "NZD", phone: [8, 10], postal: "Postcode" },
    { iso2: "SA", name: "Saudi Arabia", flag: "🇸🇦", dial: "966", currency: "SAR", phone: [9, 9], postal: "Postal code" },
    { iso2: "QA", name: "Qatar", flag: "🇶🇦", dial: "974", currency: "QAR", phone: [8, 8], postal: "PO Box" },
    { iso2: "KW", name: "Kuwait", flag: "🇰🇼", dial: "965", currency: "USD", phone: [8, 8], postal: "PO Box" },
    { iso2: "OM", name: "Oman", flag: "🇴🇲", dial: "968", currency: "USD", phone: [8, 8], postal: "PO Box" },
    { iso2: "BH", name: "Bahrain", flag: "🇧🇭", dial: "973", currency: "USD", phone: [8, 8], postal: "PO Box" },
    { iso2: "MY", name: "Malaysia", flag: "🇲🇾", dial: "60", currency: "MYR", phone: [9, 10], postal: "Postcode" },
    { iso2: "HK", name: "Hong Kong", flag: "🇭🇰", dial: "852", currency: "HKD", phone: [8, 8], postal: "Postal code" },
    { iso2: "ZA", name: "South Africa", flag: "🇿🇦", dial: "27", currency: "ZAR", phone: [9, 9], postal: "Postal code" },
    { iso2: "DE", name: "Germany", flag: "🇩🇪", dial: "49", currency: "EUR", phone: [10, 11], postal: "Postcode" },
    { iso2: "IE", name: "Ireland", flag: "🇮🇪", dial: "353", currency: "EUR", phone: [9, 9], postal: "Eircode" },
    { iso2: "NL", name: "Netherlands", flag: "🇳🇱", dial: "31", currency: "EUR", phone: [9, 9], postal: "Postcode" },
    { iso2: "FR", name: "France", flag: "🇫🇷", dial: "33", currency: "EUR", phone: [9, 9], postal: "Postcode" },
    { iso2: "IT", name: "Italy", flag: "🇮🇹", dial: "39", currency: "EUR", phone: [9, 10], postal: "CAP" },
    { iso2: "ES", name: "Spain", flag: "🇪🇸", dial: "34", currency: "EUR", phone: [9, 9], postal: "Postcode" },
    { iso2: "PT", name: "Portugal", flag: "🇵🇹", dial: "351", currency: "EUR", phone: [9, 9], postal: "Postcode" },
    { iso2: "BE", name: "Belgium", flag: "🇧🇪", dial: "32", currency: "EUR", phone: [9, 9], postal: "Postcode" },
    { iso2: "AT", name: "Austria", flag: "🇦🇹", dial: "43", currency: "EUR", phone: [10, 11], postal: "Postcode" },
    { iso2: "FI", name: "Finland", flag: "🇫🇮", dial: "358", currency: "EUR", phone: [9, 10], postal: "Postcode" },
    { iso2: "GR", name: "Greece", flag: "🇬🇷", dial: "30", currency: "EUR", phone: [10, 10], postal: "Postcode" },
    { iso2: "CH", name: "Switzerland", flag: "🇨🇭", dial: "41", currency: "CHF", phone: [9, 9], postal: "Postcode" },
    { iso2: "SE", name: "Sweden", flag: "🇸🇪", dial: "46", currency: "SEK", phone: [9, 9], postal: "Postcode" },
    { iso2: "NO", name: "Norway", flag: "🇳🇴", dial: "47", currency: "NOK", phone: [8, 8], postal: "Postcode" },
    { iso2: "DK", name: "Denmark", flag: "🇩🇰", dial: "45", currency: "DKK", phone: [8, 8], postal: "Postcode" },
    { iso2: "JP", name: "Japan", flag: "🇯🇵", dial: "81", currency: "JPY", phone: [10, 10], postal: "Postal code" },
    { iso2: "TH", name: "Thailand", flag: "🇹🇭", dial: "66", currency: "THB", phone: [9, 9], postal: "Postcode" },
    { iso2: "MU", name: "Mauritius", flag: "🇲🇺", dial: "230", currency: "MUR", phone: [8, 8], postal: "Postal code" },
    { iso2: "FJ", name: "Fiji", flag: "🇫🇯", dial: "679", currency: "FJD", phone: [7, 7], postal: "Postal code" },
    { iso2: "TT", name: "Trinidad & Tobago", flag: "🇹🇹", dial: "1", currency: "TTD", phone: [10, 10], postal: "Postal code" },
    { iso2: "NP", name: "Nepal", flag: "🇳🇵", dial: "977", currency: "NPR", phone: [10, 10], postal: "Postal code" },
];

const BY_ISO2: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.iso2, c]));

export const INDIA = BY_ISO2.IN;

export const getCountryByIso2 = (iso2: string): Country => BY_ISO2[iso2] ?? INDIA;

// ── Detection ───────────────────────────────────────────────────────────────

/**
 * IANA timezone → ISO-3166 country, packed as "CC:zone,zone|CC:zone".
 *
 * The timezone is the fastest honest signal there is: it is already resolved by
 * the time the first component renders, costs no network round trip, and unlike
 * an IP lookup it cannot stall the page. `navigator.language` backs it up for
 * the zones not listed here.
 *
 * Only zones for countries in `COUNTRIES` are listed — anything else resolves
 * to India, which is the correct default for this business.
 */
const TZ_MAP =
    "IN:Asia/Kolkata,Asia/Calcutta" +
    "|US:America/New_York,America/Detroit,America/Chicago,America/Denver,America/Phoenix,America/Los_Angeles,America/Anchorage,America/Indiana/Indianapolis,America/Kentucky/Louisville,America/Boise,Pacific/Honolulu" +
    "|GB:Europe/London" +
    "|CA:America/Toronto,America/Vancouver,America/Edmonton,America/Winnipeg,America/Halifax,America/St_Johns,America/Regina,America/Montreal" +
    "|AU:Australia/Sydney,Australia/Melbourne,Australia/Brisbane,Australia/Perth,Australia/Adelaide,Australia/Hobart,Australia/Darwin,Australia/Canberra" +
    "|AE:Asia/Dubai" +
    "|SG:Asia/Singapore" +
    "|NZ:Pacific/Auckland" +
    "|SA:Asia/Riyadh" +
    "|QA:Asia/Qatar" +
    "|KW:Asia/Kuwait" +
    "|OM:Asia/Muscat" +
    "|BH:Asia/Bahrain" +
    "|MY:Asia/Kuala_Lumpur,Asia/Kuching" +
    "|HK:Asia/Hong_Kong" +
    "|ZA:Africa/Johannesburg" +
    "|DE:Europe/Berlin,Europe/Busingen" +
    "|IE:Europe/Dublin" +
    "|NL:Europe/Amsterdam" +
    "|FR:Europe/Paris" +
    "|IT:Europe/Rome" +
    "|ES:Europe/Madrid,Atlantic/Canary" +
    "|PT:Europe/Lisbon" +
    "|BE:Europe/Brussels" +
    "|AT:Europe/Vienna" +
    "|FI:Europe/Helsinki" +
    "|GR:Europe/Athens" +
    "|CH:Europe/Zurich" +
    "|SE:Europe/Stockholm" +
    "|NO:Europe/Oslo" +
    "|DK:Europe/Copenhagen" +
    "|JP:Asia/Tokyo" +
    "|TH:Asia/Bangkok" +
    "|MU:Indian/Mauritius" +
    "|FJ:Pacific/Fiji" +
    "|TT:America/Port_of_Spain" +
    "|NP:Asia/Kathmandu";

const TZ_TO_ISO2: Record<string, string> = {};
for (const group of TZ_MAP.split("|")) {
    const [iso2, zones] = group.split(":");
    for (const zone of zones.split(",")) TZ_TO_ISO2[zone] = iso2;
}

/** Where the devotee is, decided without a single network request. */
function detect(): string {
    try {
        const iso2 = TZ_TO_ISO2[Intl.DateTimeFormat().resolvedOptions().timeZone];
        if (iso2) return iso2;
    } catch {
        /* Intl unavailable — fall through to the language signal. */
    }
    try {
        // "en-GB" → GB. Weaker than the timezone (an NRI in Dubai often still
        // runs en-IN), which is exactly why it is the fallback and not the
        // primary signal.
        const region = navigator.language?.split("-")[1]?.toUpperCase();
        if (region && BY_ISO2[region]) return region;
    } catch {
        /* no navigator — fall through to India. */
    }
    return "IN";
}

// ── Store ───────────────────────────────────────────────────────────────────
//
// A module-level store rather than a React context: the checkout needs the
// country before the first paint (the price in the sticky bar is the first
// thing read), and this way no provider has to be threaded through App.tsx and
// no tree re-renders on mount.

const STORAGE_KEY = "pjar_country";
const GEO_KEY = "pjar_geo";

/**
 * A deliberate choice — the picker, or a `?country=` in the URL. Locked, so the
 * IP lookup landing a moment later cannot overrule someone who has just told us
 * where they are.
 */
let pinned = false;

/**
 * `?country=US` — forces a country for this session without a VPN, and without
 * writing anything to storage.
 *
 * Not persisted on purpose: a saved test override would silently outrank the IP
 * on every later visit, which is exactly the confusion you do not want while
 * checking whether geo detection works. Close the tab and it is gone.
 */
function fromUrl(): string | null {
    try {
        const q = new URLSearchParams(window.location.search).get("country");
        const iso2 = q?.trim().toUpperCase();
        return iso2 && BY_ISO2[iso2] ? iso2 : null;
    } catch {
        return null;
    }
}

/**
 * The country to paint the FIRST frame with, best signal first:
 *
 *   1. `?country=` — an explicit instruction, session only.
 *   2. A saved manual pick. Auto-detection never overwrites this; a devotee who
 *      chose their country keeps it until they change it.
 *   3. The country the IP resolved to last visit. Cached because it is the most
 *      accurate signal we have and re-confirming it costs a round trip.
 *   4. Timezone, then browser language.
 *
 * All four are synchronous — the sticky price bar is the first thing read on
 * these pages and must never paint empty. `syncConfig()` then confirms 3 and 4
 * against the live IP, which is what makes a VPN take effect.
 */
function initial(): string {
    const forced = fromUrl();
    if (forced) {
        pinned = true;
        return forced;
    }
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && BY_ISO2[saved]) {
            pinned = true;
            return saved;
        }
    } catch {
        /* storage blocked (private mode) — detection still works. */
    }
    try {
        const geo = localStorage.getItem(GEO_KEY);
        if (geo && BY_ISO2[geo]) return geo;
    } catch {
        /* no cached geo — fall through to the device signals. */
    }
    return detect();
}

let country = initial();
const listeners = new Set<() => void>();

/**
 * The subscription snapshot covers the country AND the rate revision, so a
 * fresh rate table repaints every price on screen the same way switching
 * country does. Without the revision, rates could land after paint and leave
 * stale prices sitting there until an unrelated re-render.
 */
let ratesRevision = 0;
let snapshot = country;

const getSnapshot = () => snapshot;

function publish() {
    snapshot = `${country}#${ratesRevision}`;
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function setCountry(iso2: string) {
    if (!BY_ISO2[iso2]) return;
    // Pinned AND saved even when the country is unchanged: confirming the
    // detected country through the picker is still a decision. Returning early
    // on `iso2 === country` before writing would mean "I chose India" survived
    // only until the next reload, after which the IP could move them again.
    pinned = true;
    try {
        localStorage.setItem(STORAGE_KEY, iso2);
    } catch {
        /* storage blocked — the choice still holds for this page. */
    }
    if (iso2 === country) return;
    country = iso2;
    publish();
}

/**
 * Hand the country back to automatic detection.
 *
 * The escape hatch from a pin. Without it, one tap on the picker — including a
 * mis-tap, or a devotee opening it just to look — locks that country in for
 * good and no amount of travelling, or switching VPN, would ever move it again.
 */
export function clearCountryPin() {
    pinned = false;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* storage blocked — unpinning still holds for this page. */
    }

    // Best guess we can make right now, then re-confirm against the live IP.
    let next: string | null = null;
    try {
        const geo = localStorage.getItem(GEO_KEY);
        if (geo && BY_ISO2[geo]) next = geo;
    } catch {
        /* no cached geo — the device signals will do. */
    }
    const resolved = next ?? detect();
    if (resolved !== country) {
        country = resolved;
        publish();
    }
    syncConfig();
}

/**
 * Apply the country the server resolved from the IP.
 *
 * This is the signal that survives a VPN — the timezone belongs to the device,
 * the IP belongs to the connection — so it outranks whatever `detect()` guessed
 * and is cached as the next visit's opening frame. It never overrules a pinned
 * choice: a devotee who picked India while abroad meant it.
 */
function applyGeoCountry(iso2: unknown) {
    if (typeof iso2 !== "string" || !BY_ISO2[iso2]) return;
    try {
        localStorage.setItem(GEO_KEY, iso2);
    } catch {
        /* storage blocked — this visit is still corrected, just not the next. */
    }
    if (iso2 === country) return;
    if (pinned) {
        // Correct — a chosen country outranks the IP — but indistinguishable
        // from broken detection unless it says so. This is the single most
        // confusing state the picker can leave you in: one tap, months ago,
        // and the site never follows you anywhere again.
        console.info(
            `[currency] IP resolved to ${iso2}, keeping ${country} — you picked it. ` +
            `Choose "Detect automatically" in the country picker to undo.`,
        );
        return;
    }
    country = iso2;
    publish();
}

// ── Live rates ──────────────────────────────────────────────────────────────
//
// The server owns the rate table. This keeps a cached copy so prices are right
// on the very first paint, and refreshes it in the background.

const RATES_KEY = "pjar_fx";

type RatesPayload = {
    buffer: number;
    rates: Record<string, { exp: 0 | 2; inr: number }>;
    /** Foreign price multiplier — global, and per-currency overrides. */
    multiplier?: number;
    multipliers?: Record<string, number>;
};

/**
 * Merge a server table into the local one.
 *
 * Only `exp` and `inr` are taken — symbols and the country mapping stay a
 * frontend concern. A currency the server has dropped keeps its bootstrap
 * values rather than vanishing mid-checkout, and anything malformed is skipped,
 * so a bad payload degrades to "prices unchanged" instead of "prices wrong".
 */
function applyRates(payload: unknown): boolean {
    const p = payload as RatesPayload | null;
    if (!p || typeof p !== "object" || !p.rates || typeof p.rates !== "object") return false;

    let changed = false;
    if (typeof p.buffer === "number" && p.buffer >= 1 && p.buffer <= 1.25 && p.buffer !== FX_BUFFER) {
        FX_BUFFER = p.buffer;
        changed = true;
    }
    // Foreign pricing. Bounds mirror the server's, so a value it would have
    // rejected cannot slip in through a stale cached payload either.
    if (typeof p.multiplier === "number" && p.multiplier > 0 && p.multiplier <= 20 && p.multiplier !== FX_MULTIPLIER) {
        FX_MULTIPLIER = p.multiplier;
        changed = true;
    }
    if (p.multipliers && typeof p.multipliers === "object") {
        const next: Record<string, number> = {};
        for (const [code, value] of Object.entries(p.multipliers)) {
            const n = Number(value);
            if (CURRENCIES[code] && Number.isFinite(n) && n > 0 && n <= 20) next[code] = n;
        }
        if (JSON.stringify(next) !== JSON.stringify(FX_MULTIPLIERS)) {
            FX_MULTIPLIERS = next;
            changed = true;
        }
    }
    for (const [code, def] of Object.entries(p.rates)) {
        const local = CURRENCIES[code];
        const inr = Number(def?.inr);
        if (!local || !Number.isFinite(inr) || inr <= 0 || local.inr === inr) continue;
        local.inr = inr;
        changed = true;
    }
    return changed;
}

// Cached table first — a repeat visitor is priced correctly with zero latency.
try {
    const cached = localStorage.getItem(RATES_KEY);
    if (cached) applyRates(JSON.parse(cached));
} catch {
    /* no storage or corrupt cache — the bootstrap table is still valid. */
}

/**
 * Pull the live rates AND the IP-resolved country in one request.
 *
 * Fire-and-forget on purpose: the page is already painted and priced from the
 * cached/bootstrap values, and a checkout that BLOCKS on a config call is a lost
 * booking. What comes back either confirms what is on screen (the common case,
 * nothing repaints) or corrects it — which is what makes a VPN, or a devotee who
 * has actually moved, take effect.
 */
function syncConfig() {
    if (typeof fetch !== "function") return;
    fetch(`${API_URL}/config/currency`)
        .then((r) => {
            // Say so, once, instead of degrading in silence. A 404 here (server
            // not yet carrying /api/config/currency) leaves the page on its
            // timezone guess and looks exactly like "geo detection is broken" —
            // with no way to tell the two apart from the outside.
            if (!r.ok) {
                console.warn(
                    `[currency] ${API_URL}/config/currency → HTTP ${r.status}. ` +
                    `Keeping timezone-detected country and bootstrap rates. ` +
                    `If this is a 404, the server needs deploying.`,
                );
                return null;
            }
            return r.json();
        })
        .then((payload) => {
            if (!payload) return;
            try {
                // Rates only. The country is per-visitor and lives under its own
                // key — folding it into the rates blob would resurrect a stale
                // country every time the rates cache was read.
                localStorage.setItem(
                    RATES_KEY,
                    JSON.stringify({
                        buffer: payload.buffer,
                        rates: payload.rates,
                        multiplier: payload.multiplier,
                        multipliers: payload.multipliers,
                    }),
                );
            } catch {
                /* storage blocked — the rates still apply for this page. */
            }
            if (applyRates(payload)) {
                ratesRevision += 1;
                publish();
            }
            // In dev the server sees a loopback client, so the country it
            // returns is at best its OWN egress — which is not necessarily
            // where the browser is. `syncDevGeo()` below is authoritative there
            // and applying this too would race it.
            if (!import.meta.env.DEV) applyGeoCountry(payload.country);
        })
        .catch((err) => {
            // Offline, CORS, or server down. Cached/bootstrap values carry the
            // page, so this is survivable — but it is never silent.
            console.warn("[currency] config fetch failed:", err?.message || err);
        });
}

/**
 * DEV ONLY — resolve the country from the BROWSER's own public IP.
 *
 * On localhost the server is handed a loopback address and can tell nothing
 * about where you are. Asking it to geolocate its own egress instead
 * (`GEOIP_DEV_COUNTRY=auto`) only works if the VPN is system-wide — and most
 * are not: a browser-extension or split-tunnel VPN moves the BROWSER and
 * leaves Node connecting from your real location, so the server honestly
 * reports the wrong country.
 *
 * The browser is the thing behind the VPN, so in dev the browser asks. That is
 * also why this call goes straight to a third party rather than through our own
 * API: routing it through the server would put it back on the wrong side of the
 * tunnel, which is the entire problem.
 *
 * `import.meta.env.DEV` is a compile-time constant, so this function and its
 * providers vanish from the production bundle — a devotee's browser never makes
 * a third-party request.
 */
function syncDevGeo() {
    const providers = ["https://ipwho.is/", "https://api.country.is/"];

    const attempt = (i: number): Promise<void> => {
        if (i >= providers.length) return Promise.resolve();
        return fetch(providers[i])
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                const raw = d?.country_code ?? d?.country;
                if (typeof raw !== "string" || !/^[A-Za-z]{2}$/.test(raw)) return attempt(i + 1);
                const iso2 = raw.toUpperCase();
                console.info(
                    `[currency] dev geo: your browser's IP resolves to ${iso2}` +
                    (BY_ISO2[iso2] ? "" : " (not a supported country — ignored)"),
                );
                applyGeoCountry(iso2);
            })
            .catch(() => attempt(i + 1));
    };

    void attempt(0);
}

syncConfig();
// Dev only; stripped from production builds. See syncDevGeo.
if (import.meta.env.DEV) syncDevGeo();

// ── Conversion + formatting ─────────────────────────────────────────────────

/**
 * INR → presentment amount, rounded UP to the currency's minor unit.
 *
 * Rounding up rather than to nearest is what guarantees the settled INR can
 * never come in under the seva price once Razorpay's cross-currency conversion
 * has taken its cut. The most it costs the devotee is one cent.
 */
export function convert(inr: number, currencyCode: string): number {
    const c = CURRENCIES[currencyCode];
    if (!c || c.code === "INR") return inr;
    const f = 10 ** c.exp;
    return Math.ceil((inrEquivalent(inr, currencyCode) / c.inr) * FX_BUFFER * f) / f;
}

/**
 * The INR figure this sale is actually worth — the list price with the foreign
 * multiplier applied.
 *
 * This is what a booking must send as its `amount`, NOT the India price: it is
 * the number the server verifies the payment against, stores on the booking,
 * reports to Meta and prints on the receipt. Send the unmultiplied price and a
 * ₹2,100 seva sold for the equivalent of ₹4,200 is recorded as a ₹2,100 sale.
 *
 * Rounded to whole rupees — a booking amount with paise in it is not a price
 * anyone quotes, and Razorpay bills the foreign figure anyway.
 */
export function inrEquivalent(inr: number, currencyCode: string): number {
    return Math.round(inr * multiplierFor(currencyCode));
}

/** Presentment amount → the minor units (paise / cents) Razorpay bills in. */
export function toMinorUnits(amount: number, currencyCode: string): number {
    const c = CURRENCIES[currencyCode] ?? CURRENCIES.INR;
    return Math.round(amount * 10 ** c.exp);
}

// Intl formatters are expensive to build and this runs on every price on the
// page, so each currency's formatter is built once and kept.
const formatters: Record<string, Intl.NumberFormat> = {};

function formatterFor(currencyCode: string): Intl.NumberFormat {
    let f = formatters[currencyCode];
    if (!f) {
        const c = CURRENCIES[currencyCode] ?? CURRENCIES.INR;
        f = formatters[currencyCode] = new Intl.NumberFormat("en-US", {
            minimumFractionDigits: c.exp,
            maximumFractionDigits: c.exp,
        });
    }
    return f;
}

/**
 * An INR amount, written in the devotee's currency.
 *
 * INR keeps the exact `₹1,100` shape the pages already used (grouped Indian
 * style, no decimals) so nothing about the home market changes visually.
 */
export function formatMoney(inr: number, currencyCode: string): string {
    if (currencyCode === "INR") return `₹${Math.round(inr).toLocaleString("en-IN")}`;
    const c = CURRENCIES[currencyCode] ?? CURRENCIES.INR;
    return `${c.symbol}${formatterFor(currencyCode).format(convert(inr, currencyCode))}`;
}

// ── Site-wide API ───────────────────────────────────────────────────────────
//
// Most of the site prices things without caring where the devotee is — a card,
// a list row, a cart line. Those call `money()` directly instead of taking the
// hook, which keeps a price render a one-word change in ~50 files rather than a
// hook threaded through ~50 component scopes.
//
// What makes that safe is `useCurrencyRoot()`, mounted once in App: it holds the
// only subscription, so switching country re-renders the tree and every plain
// `money()` call is re-evaluated. Nothing in this codebase is React.memo'd, so
// that cascade reaches everything.

/** The current country, for non-React callers. */
export const currentCountry = (): Country => BY_ISO2[country] ?? INDIA;

/**
 * An INR list price, written in the devotee's currency — the one call almost
 * every price on the site needs. Includes the foreign markup.
 */
export function money(inr: number): string {
    return formatMoney(inr, currentCountry().currency);
}

/**
 * An INR list price → the INR this sale is worth in the current market.
 * What a booking must send as its `amount`. See `inrEquivalent`.
 */
export function toInr(listPrice: number): number {
    return inrEquivalent(listPrice, currentCountry().currency);
}

/** True in the home market — the flow the site has always had. */
export const isIndia = (): boolean => currentCountry().iso2 === "IN";

/**
 * Mount ONCE, at the app root. The single subscription that makes every plain
 * `money()` call on the site reactive to the country picker.
 */
export function useCurrencyRoot(): void {
    useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * A price that was already PAID, shown in the currency it was paid in.
 *
 * Past bookings must not be re-priced by today's picker: someone who paid
 * ₹2,100 from Delhi did not pay $24, and showing them $24 because they are
 * travelling misrepresents a receipt. So this reads the currency stored ON the
 * booking and falls back to rupees for every historic row that predates it.
 */
export function paidMoney(booking: {
    amount?: number;
    currency?: string;
    chargedAmount?: number;
} | null | undefined): string {
    const inr = Number(booking?.amount ?? 0);
    const code = booking?.currency;
    const charged = Number(booking?.chargedAmount ?? NaN);
    if (!code || code === "INR" || !CURRENCIES[code] || !Number.isFinite(charged)) {
        return `₹${Math.round(inr).toLocaleString("en-IN")}`;
    }
    return `${CURRENCIES[code].symbol}${formatterFor(code).format(charged)}`;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export type Money = {
    country: Country;
    currency: string;
    /** True for the home market — the flow it has always been. */
    isIndia: boolean;
    /** An INR amount rendered in the devotee's currency, e.g. "₹1,100" / "$12.87". */
    money: (inr: number) => string;
    /** The numeric charge in the presentment currency, for the Razorpay order. */
    convert: (inr: number) => number;
    /**
     * An India list price → the INR this sale is actually worth, once the
     * foreign multiplier is applied. THIS is what a booking sends as `amount`
     * and `amountPaid`; sending the list price would record a ₹2,100 sale for a
     * booking the card was charged ₹4,200 for.
     */
    inr: (listPrice: number) => number;
    /** What foreign buyers pay relative to India — 1 when there is no markup. */
    multiplier: number;
    setCountry: (iso2: string) => void;
};

/**
 * The single entry point for the pages: one hook that gives a component the
 * detected country, the currency to price in, and a formatter.
 */
export function useMoney(): Money {
    // "IN" on first paint, "IN#1" once a rate refresh has landed — the suffix
    // exists only to make the snapshot change when rates do.
    const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    const c = BY_ISO2[snap.split("#")[0]] ?? INDIA;

    return {
        country: c,
        currency: c.currency,
        isIndia: c.iso2 === "IN",
        money: useCallback((inr: number) => formatMoney(inr, c.currency), [c.currency]),
        convert: useCallback((inr: number) => convert(inr, c.currency), [c.currency]),
        inr: useCallback((listPrice: number) => inrEquivalent(listPrice, c.currency), [c.currency]),
        multiplier: multiplierFor(c.currency),
        setCountry,
    };
}

// ── Phone ───────────────────────────────────────────────────────────────────

/**
 * Whether a physical prasad parcel can be couriered to this country.
 *
 * India only. Blessed prasad is perishable food, and every route out of the
 * country either refuses it at customs or costs more than the seva itself — so
 * the box is not offered abroad rather than being sold and then apologised for.
 * The seva itself (the puja, the Sankalp, the video) is unaffected.
 */
export const shipsPrasad = (c: Country): boolean => c.iso2 === "IN";

/** Digits only, capped at the country's longest national number. */
export function sanitizePhone(value: string, c: Country): string {
    return value.replace(/\D/g, "").slice(0, c.phone[1]);
}

export function isValidPhone(value: string, c: Country): boolean {
    const digits = value.replace(/\D/g, "").length;
    return digits >= c.phone[0] && digits <= c.phone[1];
}

/**
 * The number as the server should store it: bare 10 digits for India (exactly
 * what every existing booking, OneSignal alias and WhatsApp template already
 * expects), country code prefixed for everyone else so the confirmation
 * actually reaches them.
 */
export function toStoredPhone(value: string, c: Country): string {
    const digits = value.replace(/\D/g, "");
    return c.iso2 === "IN" ? digits : `${c.dial}${digits}`;
}
