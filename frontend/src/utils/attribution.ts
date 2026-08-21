/**
 * Campaign attribution — remembering which ad brought a devotee in, so the
 * booking they eventually make can say so.
 *
 * WHY THIS EXISTS SEPARATELY FROM analytics.ts
 * --------------------------------------------
 * `analytics.ts` reports events to GA4, Google Ads and Meta. Those platforms
 * answer "how many bookings did the Savan campaign produce?" — an aggregate,
 * in their dashboard, on their schedule. What they can never answer is the
 * question ops asks all day: which campaign produced THIS booking, the one on
 * the phone right now. There is no booking id in an ads report and never will
 * be.
 *
 * So the campaign is captured here, in the browser, and posted with the
 * booking itself. It lands in Mongo next to the devotee's name and the amount,
 * which means revenue by campaign is one aggregation away and stays queryable
 * long after the ad platform's attribution window has closed.
 *
 * WHY THE BROWSER AND NOT THE SERVER
 * ----------------------------------
 * The server sees only the checkout POST. By then the `?utm_campaign=...` the
 * devotee arrived on is several navigations in the past and the Referer header
 * reads as our own domain. The browser is the only party that still remembers.
 *
 * FIRST AND LAST TOUCH
 * --------------------
 * Both are kept, because they disagree and the disagreement is the point. A
 * Meta reel introduces someone to the site; they leave; a week later a branded
 * Google search brings them back and they book. Last touch is what matches the
 * ad platforms' own numbers. First touch is what tells you which campaign is
 * actually doing the acquiring. Crediting only one tells half the story.
 */

const FIRST_KEY = "pjar_attr_first";
const LAST_KEY = "pjar_attr_last";
/** Marks a browsing session, so an internal click isn't mistaken for a visit. */
const SESSION_KEY = "pjar_attr_session";

/** First touch outlives the consideration cycle — a wedding is booked slowly. */
const FIRST_TTL_MS = 180 * 24 * 60 * 60 * 1000;
/** Last touch matches the ad platforms' own click-through windows. */
const LAST_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Mirrors the server's clip limits; the server re-applies them regardless. */
const MAX_TAG = 200;
const MAX_ID = 300;
const MAX_URL = 600;

export type AttributionTouch = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  msclkid?: string;
  referrer?: string;
  landingPage?: string;
  /** ISO-8601. The server clamps anything in the future. */
  at?: string;
};

export type Attribution = {
  first?: AttributionTouch;
  last?: AttributionTouch;
};

const isBrowser = (): boolean => typeof window !== "undefined";

const clip = (value: string | null | undefined, max: number): string | undefined => {
  const trimmed = String(value ?? "").trim().slice(0, max);
  return trimmed || undefined;
};

/** Drop the empty keys so a stored touch holds only what was actually known. */
const compact = (touch: AttributionTouch): AttributionTouch =>
  Object.fromEntries(
    Object.entries(touch).filter(([, v]) => v !== undefined && v !== ""),
  ) as AttributionTouch;

/** Anything beyond the ambient context counts as a real campaign signal. */
const hasSignal = (touch: AttributionTouch): boolean =>
  Object.keys(touch).some((k) => k !== "at" && k !== "landingPage" && k !== "referrer");

/** Stamp a touch with when and where it happened. */
const withContext = (touch: AttributionTouch): AttributionTouch =>
  compact({
    ...touch,
    referrer: clip(document.referrer, MAX_URL),
    landingPage: clip(window.location.href, MAX_URL),
    at: new Date().toISOString(),
  });

/* ═══════════════════════════════════════════════════════════════════════════
   READING THE CURRENT VISIT
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The touch described by the URL, or undefined when the URL says nothing.
 *
 * Click ids count as a touch on their own: Google Ads auto-tagging appends
 * `gclid` WITHOUT any utm parameters unless the campaign was manually tagged,
 * so a UTM-only check would miss most of the paid clicks the site gets.
 */
const touchFromUrl = (): AttributionTouch | undefined => {
  const params = new URLSearchParams(window.location.search);
  const get = (key: string, max = MAX_TAG) => clip(params.get(key), max);

  const touch = compact({
    source: get("utm_source"),
    medium: get("utm_medium"),
    campaign: get("utm_campaign"),
    term: get("utm_term"),
    content: get("utm_content"),
    gclid: get("gclid", MAX_ID),
    gbraid: get("gbraid", MAX_ID),
    wbraid: get("wbraid", MAX_ID),
    fbclid: get("fbclid", MAX_ID),
    msclkid: get("msclkid", MAX_ID),
  });

  if (!hasSignal(touch)) return undefined;

  // A click id with no utm_medium is still a paid click — say so, rather than
  // leaving the medium blank and letting the row read as organic later.
  if (!touch.medium && (touch.gclid || touch.gbraid || touch.wbraid)) {
    touch.medium = "cpc";
    touch.source = touch.source || "google";
  }
  if (!touch.medium && touch.fbclid) {
    touch.medium = "paid_social";
    touch.source = touch.source || "facebook";
  }
  if (!touch.medium && touch.msclkid) {
    touch.medium = "cpc";
    touch.source = touch.source || "bing";
  }

  return withContext(touch);
};

/** Hosts whose inbound traffic is a search result, not a link someone placed. */
const SEARCH_HOSTS: Array<[RegExp, string]> = [
  [/(^|\.)google\./i, "google"],
  [/(^|\.)bing\.com$/i, "bing"],
  [/(^|\.)duckduckgo\.com$/i, "duckduckgo"],
  [/(^|\.)search\.yahoo\./i, "yahoo"],
  [/(^|\.)yandex\./i, "yandex"],
  [/(^|\.)ecosia\.org$/i, "ecosia"],
  [/(^|\.)baidu\.com$/i, "baidu"],
  [/(^|\.)search\.brave\.com$/i, "brave"],
];

/**
 * The touch implied by an untagged arrival — organic search, a link from
 * another site, or nothing at all.
 *
 * Returns undefined for an internal navigation, which is what stops a click
 * from /puja to /checkout being recorded as a fresh referral from ourselves.
 */
const touchFromReferrer = (): AttributionTouch | undefined => {
  const referrer = document.referrer || "";
  if (!referrer) return withContext({ source: "(direct)", medium: "(none)" });

  let host = "";
  try {
    host = new URL(referrer).hostname;
  } catch {
    return withContext({ source: "(direct)", medium: "(none)" });
  }

  if (host === window.location.hostname) return undefined;

  const engine = SEARCH_HOSTS.find(([pattern]) => pattern.test(host));
  if (engine) return withContext({ source: engine[1], medium: "organic" });

  return withContext({ source: host.replace(/^www\./i, ""), medium: "referral" });
};

/* ═══════════════════════════════════════════════════════════════════════════
   STORAGE
   ═══════════════════════════════════════════════════════════════════════════ */

type StoredTouch = { touch: AttributionTouch; storedAt: number };

const read = (key: string, ttlMs: number): AttributionTouch | undefined => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as StoredTouch;
    if (!parsed?.touch || typeof parsed.storedAt !== "number") return undefined;
    if (Date.now() - parsed.storedAt > ttlMs) {
      localStorage.removeItem(key);
      return undefined;
    }
    return parsed.touch;
  } catch {
    // Private mode, a quota error, or a value someone hand-edited. Attribution
    // is a nice-to-have; nothing here may throw into a checkout page.
    return undefined;
  }
};

const write = (key: string, touch: AttributionTouch): void => {
  try {
    localStorage.setItem(key, JSON.stringify({ touch, storedAt: Date.now() }));
  } catch {
    /* ignore */
  }
};

/**
 * True once per browsing session.
 *
 * Attribution only changes on arrival, not on every route change, and this is
 * what tells the two apart. In private mode, where sessionStorage throws, it
 * answers true every time — harmless, because an untagged internal navigation
 * yields no touch at all and a direct touch can never overwrite a stored
 * campaign.
 */
const isNewSession = (): boolean => {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return false;
    sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  } catch {
    return true;
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Record the current page as a touch, if it is one.
 *
 * Safe to call on every route change — <AttributionCapture/> in App.tsx does
 * exactly that — because these rules make repeat calls within a visit no-ops:
 *
 *   • A tagged URL (utm_* or a click id) is ALWAYS a new last touch. The
 *     devotee just clicked an ad; that is the campaign to credit.
 *   • An untagged page is only considered on the first page of a session, so
 *     browsing the site never overwrites how the session began.
 *   • A direct arrival never overwrites a stored campaign. Someone who clicked
 *     an ad on Monday and typed the URL on Friday was still brought here by
 *     Monday's ad — the same rule GA4 applies. Without it, every return visit
 *     would quietly launder paid traffic into "(direct)".
 */
export function captureAttribution(): void {
  if (!isBrowser()) return;

  const tagged = touchFromUrl();
  const newSession = isNewSession();

  const touch = tagged || (newSession ? touchFromReferrer() : undefined);
  if (!touch) return;

  const isDirect = !tagged && touch.medium === "(none)";
  if (isDirect && read(LAST_KEY, LAST_TTL_MS)) return;

  write(LAST_KEY, touch);
  // First touch is written once and then left alone for FIRST_TTL_MS.
  if (!read(FIRST_KEY, FIRST_TTL_MS)) write(FIRST_KEY, touch);
}

/**
 * What to send with a booking, or undefined when nothing is known.
 *
 * The server whitelists and clips whatever arrives
 * (server/src/utils/marketingAttribution.ts) before storing it on the booking.
 */
export function getAttribution(): Attribution | undefined {
  if (!isBrowser()) return undefined;

  const first = read(FIRST_KEY, FIRST_TTL_MS);
  const last = read(LAST_KEY, LAST_TTL_MS);
  if (!first && !last) return undefined;

  return {
    ...(first && { first }),
    ...(last && { last }),
  };
}

/**
 * Spreadable form, so a checkout adds campaign tracking in one line and no
 * branch:
 *
 *     await axios.post(url, { ...bookingFields, ...attributionPayload() });
 *
 * A devotee with nothing recorded contributes no `attribution` key at all,
 * which is what keeps untracked bookings distinguishable from tracked ones in
 * the database rather than all carrying an empty object.
 */
export function attributionPayload(): { attribution?: Attribution } {
  const attribution = getAttribution();
  return attribution ? { attribution } : {};
}

export default { captureAttribution, getAttribution, attributionPayload };
