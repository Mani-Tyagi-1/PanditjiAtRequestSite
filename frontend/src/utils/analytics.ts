/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ANALYTICS — the single entry point for every marketing/measurement event.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Tracking used to be ~40 inline `window.fbq(...)` calls scattered across the
 * booking pages. Each one re-derived its own payload, so Meta had a slightly
 * different idea of "value" on every page, and nothing at all reached Google.
 * Everything now goes through this module, which fans a single call out to:
 *
 *   1. GA4          — via `dataLayer` → GTM container GTM-MVRGQH4N
 *   2. Google Ads   — the SAME `dataLayer` event, mapped to a conversion in GTM
 *   3. Meta Pixel   — via `window.fbq`, with the exact event names and params
 *                     the site sent before, so Ads Manager history is unbroken
 *
 * THE ONE RULE
 * ------------
 * The GA4 payload is built from the TYPED fields of each function's argument —
 * never from the free-form `meta.params` blob. That blob still carries things
 * like `bhaktName` and `contactNumber` for Meta (which has always received
 * them), and those must never reach Google: personally-identifiable data in a
 * GA4 property is a Terms of Service violation that can get it suspended.
 * Keeping the two payloads structurally separate is what enforces that.
 *
 * People are identified to Google only as a SHA-256 hash — see `identify()`.
 *
 * GTM SETUP THIS FILE ASSUMES
 * ---------------------------
 * Every function below pushes a named event. In GTM, create one Custom Event
 * trigger per name and a GA4 Event tag firing on it. Event names match GA4's
 * recommended-event vocabulary, so the ecommerce reports populate themselves.
 * `docs/analytics-gtm-setup.md` has the click-by-click list.
 */

import API_URL from "./apiConfig";

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Only used to locate the GA4 session cookie (`_ga_<id>`), which the server
 * needs to stitch a webhook-fired purchase onto the right session. The tag
 * itself is injected by GTM, so nothing here loads GA4.
 */
const GA4_MEASUREMENT_ID =
  (import.meta.env.VITE_GA4_MEASUREMENT_ID as string) || "G-GLFX9MEX7V";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

/** One line item, in the shape GA4's ecommerce reports expect. */
export interface AnalyticsItem {
  /** Stable product id — Mongo _id, SKU, or slug. Never a display name alone. */
  id: string;
  name: string;
  /** Unit price in major units (rupees), not paise. */
  price?: number;
  quantity?: number;
  /** e.g. "Puja", "Chadhava", "Shop", "Consultation", "Live Mandir". */
  category?: string;
  /** e.g. the package tier chosen. */
  variant?: string;
  /** Temple / deity / city, whichever is the meaningful second axis. */
  brand?: string;
}

/**
 * Verbatim instructions for the Meta Pixel leg of an event.
 *
 * This exists so migrating a call site cannot change what Meta receives. Pass
 * the event name and params the page sent before and the pixel behaviour is
 * bit-identical; the GA4 leg is derived separately from the typed fields.
 */
export interface MetaSpec {
  /** Meta event name, e.g. "Purchase" or "Chadhava Participate Now". */
  event: string;
  /**
   * true → `fbq("trackCustom", ...)` instead of `fbq("track", ...)`.
   * Leave unset and it is inferred from `event`: anything that is not one of
   * Meta's standard event names is sent as a custom event automatically.
   */
  custom?: boolean;
  /** Params exactly as Meta should receive them. */
  params?: Record<string, unknown>;
  /** Dedup key shared with the server-side Conversions API event. */
  eventId?: string;
}

/** Fields shared by every ecommerce event. */
interface CommercePayload {
  items: AnalyticsItem[];
  value: number;
  currency?: string;
  /** Overrides the auto-derived Meta event. Omit to accept the default. */
  meta?: MetaSpec;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOW-LEVEL PLUMBING
   ═══════════════════════════════════════════════════════════════════════════ */

const isBrowser = (): boolean => typeof window !== "undefined";

/**
 * GTM's own snippet creates `dataLayer`, but this module can be imported by a
 * module that evaluates first. Creating the array here means early pushes are
 * queued and replayed the moment the container boots, instead of being lost.
 */
function ensureDataLayer(): unknown[] {
  if (!window.dataLayer) window.dataLayer = [];
  return window.dataLayer;
}

// NOTE: the `gtag` shim that used to live here was removed with the consent
// banner — the consent calls were its only callers. If anything ever needs it
// again it must be a `function` declaration that pushes the raw `arguments`
// OBJECT (not a plain array): Consent Mode inspects `arguments.length` and
// silently rejects an array-shaped push. The remaining index.html block
// defines its own copy for the same reason.

/**
 * Push a named event for GTM to trigger on.
 *
 * `ecommerce: null` first is Google's prescribed reset: `dataLayer` is
 * append-only, so without it the previous event's `items` array leaks into
 * this one and a one-item purchase reports the whole browsing history.
 */
function pushEvent(event: string, payload: Record<string, unknown> = {}): void {
  if (!isBrowser()) return;
  const layer = ensureDataLayer();
  if ("ecommerce" in payload) layer.push({ ecommerce: null });
  layer.push({ event, ...payload });
}

/**
 * The complete set of events Meta defines. Anything outside it must go through
 * `trackCustom` — sending a custom name via `track` makes the Pixel log
 * "You are sending a non-standard event" and Meta does not treat the event as
 * reliably as a properly-declared custom one.
 *
 * Kept here rather than trusted to each call site: a caller that forgets
 * `custom: true` produces a console warning nobody sees in production and a
 * silently degraded event, so the safe default is derived from the name.
 */
const META_STANDARD_EVENTS = new Set([
  "AddPaymentInfo",
  "AddToCart",
  "AddToWishlist",
  "CompleteRegistration",
  "Contact",
  "CustomizeProduct",
  "Donate",
  "FindLocation",
  "InitiateCheckout",
  "Lead",
  "PageView",
  "Purchase",
  "Schedule",
  "Search",
  "StartTrial",
  "SubmitApplication",
  "Subscribe",
  "ViewContent",
]);

/** Send to the Meta Pixel, preserving the historical call shape exactly. */
function pushMeta(spec?: MetaSpec): void {
  if (!isBrowser() || !spec || typeof window.fbq !== "function") return;
  // An explicit `custom` still wins — a call site may deliberately send a
  // standard-looking name as a custom event. Otherwise infer it from the name.
  const isCustom = spec.custom ?? !META_STANDARD_EVENTS.has(spec.event);
  const method = isCustom ? "trackCustom" : "track";
  const params = spec.params ?? {};
  if (spec.eventId) {
    window.fbq(method, spec.event, params, { eventID: spec.eventId });
  } else {
    window.fbq(method, spec.event, params);
  }
}

/** GA4 wants `item_*` keys; our call sites speak plain English. */
function toGa4Items(items: AnalyticsItem[]): Record<string, unknown>[] {
  return items.map((item, index) => ({
    item_id: item.id,
    item_name: item.name,
    ...(item.price != null && { price: round2(item.price) }),
    quantity: item.quantity ?? 1,
    ...(item.category && { item_category: item.category }),
    ...(item.variant && { item_variant: item.variant }),
    ...(item.brand && { item_brand: item.brand }),
    index,
  }));
}

/** Meta's `contents` array, derived from the same items. */
function toMetaContents(
  items: AnalyticsItem[],
): Array<{ id: string; quantity: number; item_price?: number }> {
  return items.map((item) => ({
    id: item.id,
    quantity: item.quantity ?? 1,
    ...(item.price != null && { item_price: round2(item.price) }),
  }));
}

/** Money with float noise trimmed — 899.9999999 in a report reads as a bug. */
const round2 = (n: number): number => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Default Meta payload for a commerce event, matching what the booking pages
 * used to build by hand. Call sites that need something different pass `meta`.
 */
function defaultMetaParams(p: CommercePayload): Record<string, unknown> {
  const contents = toMetaContents(p.items);
  return {
    content_name: p.items[0]?.name,
    content_ids: p.items.map((i) => i.id),
    content_type: "product",
    contents,
    num_items: contents.reduce((n, c) => n + c.quantity, 0),
    value: round2(p.value),
    currency: p.currency || "INR",
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   COOKIES & IDENTITY
   ═══════════════════════════════════════════════════════════════════════════ */

/** Read a browser cookie. Returns "" when absent, never undefined. */
export function readCookie(name: string): string {
  if (!isBrowser()) return "";
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : "";
}

/**
 * The GA4 client id — the browser's pseudonymous identity.
 *
 * `_ga` looks like `GA1.1.1234567890.1700000000`; GA4 wants only the last two
 * dot-segments. The server needs this to attribute a webhook-fired purchase to
 * the session that produced it — without it, every server purchase lands as a
 * brand-new "(direct)" user and the ad that paid for it gets no credit.
 */
export function getGaClientId(): string {
  const raw = readCookie("_ga");
  if (!raw) return "";
  const parts = raw.split(".");
  return parts.length >= 4 ? `${parts[2]}.${parts[3]}` : "";
}

/**
 * The GA4 session id, from the per-property `_ga_<ID>` cookie
 * (`GS1.1.<session_id>.<session_number>...`). Optional but it lets a server
 * purchase join the live session rather than starting a new one.
 */
export function getGaSessionId(): string {
  const raw = readCookie(`_ga_${GA4_MEASUREMENT_ID.replace(/^G-/, "")}`);
  if (!raw) return "";
  const parts = raw.split(".");
  return parts.length >= 3 ? parts[2] : "";
}

/** The Google Ads click id, if this visit came from an ad. */
export function getGclid(): string {
  if (!isBrowser()) return "";
  const fromUrl = new URLSearchParams(window.location.search).get("gclid");
  return fromUrl || readCookie("_gcl_aw").split(".").pop() || "";
}

/** Lowercase SHA-256 hex. Returns "" if the browser has no SubtleCrypto (http). */
async function sha256Hex(value: string): Promise<string> {
  if (!isBrowser() || !window.crypto?.subtle) return "";
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** E.164 without the "+", which is what Google and Meta both hash. */
function normalizePhone(phone: string, defaultCountryCode = "91"): string {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10) digits = `${defaultCountryCode}${digits}`;
  return digits;
}

/**
 * Attach the logged-in devotee to the analytics stream — as a hash, always.
 *
 * Two separate things happen here, and they are not interchangeable:
 *
 *   • `user_id`   — a hashed account id for GA4 cross-device reporting.
 *   • `user_data` — pre-hashed email/phone for Google Ads Enhanced Conversions,
 *                   which recovers conversions the cookie alone would lose.
 *
 * Both are SHA-256'd HERE, in the browser, so no raw phone number or address
 * ever enters `dataLayer` where a mis-configured tag could forward it. The
 * `sha256_` key names are the ones Google Ads expects for pre-hashed input.
 *
 * Fire-and-forget: hashing is async and no caller should wait on it.
 */
export async function identify(user: {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
}): Promise<void> {
  if (!isBrowser()) return;

  const [userIdHash, emailHash, phoneHash] = await Promise.all([
    user.userId ? sha256Hex(String(user.userId).trim()) : "",
    user.email ? sha256Hex(String(user.email).trim().toLowerCase()) : "",
    user.phone ? sha256Hex(normalizePhone(String(user.phone))) : "",
  ]);

  const userData: Record<string, string> = {};
  if (emailHash) userData.sha256_email_address = emailHash;
  if (phoneHash) userData.sha256_phone_number = phoneHash;

  ensureDataLayer().push({
    ...(userIdHash && { user_id: userIdHash }),
    ...(Object.keys(userData).length > 0 && { user_data: userData }),
  });
}

/** Drop the identity on logout so the next visitor isn't merged into it. */
export function clearIdentity(): void {
  if (!isBrowser()) return;
  ensureDataLayer().push({ user_id: undefined, user_data: undefined });
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONSENT MODE v2 — no runtime half any more
   ═══════════════════════════════════════════════════════════════════════════

   All six grants are declared 'granted' for every visitor in index.html, above
   the GTM snippet, and nothing updates them afterwards. The banner and the
   stored-choice replay that used to live here were removed on purpose: with a
   single unconditional default there is no answer to collect, nothing to
   persist in localStorage, and no state to re-apply on the next visit.

   Reinstating opt-in means putting back BOTH halves — the region-scoped
   'denied' default in index.html and a banner calling gtag('consent','update')
   — because a default alone can never be revised upward. Git history has the
   previous implementation (ConsentBanner.tsx, readStoredConsent/setConsent/
   restoreConsent) if it is ever needed.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE VIEWS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * A route change in the SPA.
 *
 * GTM's GA4 config tag only fires a page_view when the container loads — which
 * on a single-page app is once, ever. Every subsequent route would be invisible
 * without this. Meta has the same problem, hence both legs.
 */
export function pageView(path?: string, title?: string): void {
  if (!isBrowser()) return;
  pushEvent("page_view", {
    page_path: path || window.location.pathname + window.location.search,
    page_location: window.location.href,
    page_title: title || document.title,
    page_referrer: document.referrer || undefined,
  });
  pushMeta({ event: "PageView" });
}

/* ═══════════════════════════════════════════════════════════════════════════
   ECOMMERCE FUNNEL
   ═══════════════════════════════════════════════════════════════════════════
   view_item_list → view_item → select_item → add_to_cart → begin_checkout
   → add_payment_info → purchase

   Google Ads optimises on the tail of that funnel, but it needs the head to
   build the audiences it optimises WITH — which is why the browse-level events
   are here and not treated as optional decoration.
   ═══════════════════════════════════════════════════════════════════════════ */

/** A catalog/listing page rendered a set of products. */
export function viewItemList(params: {
  listId: string;
  listName: string;
  items: AnalyticsItem[];
}): void {
  pushEvent("view_item_list", {
    ecommerce: {
      item_list_id: params.listId,
      item_list_name: params.listName,
      items: toGa4Items(params.items),
    },
  });
}

/** A product detail page was opened. Meta's ViewContent. */
export function viewItem(params: CommercePayload): void {
  pushEvent("view_item", {
    ecommerce: {
      currency: params.currency || "INR",
      value: round2(params.value),
      items: toGa4Items(params.items),
    },
  });
  pushMeta(params.meta ?? { event: "ViewContent", params: defaultMetaParams(params) });
}

/** A product was clicked out of a list. */
export function selectItem(params: {
  listId?: string;
  listName?: string;
  items: AnalyticsItem[];
  meta?: MetaSpec;
}): void {
  pushEvent("select_item", {
    ecommerce: {
      ...(params.listId && { item_list_id: params.listId }),
      ...(params.listName && { item_list_name: params.listName }),
      items: toGa4Items(params.items),
    },
  });
  pushMeta(params.meta);
}

/** Intent to buy, before any form. Meta's AddToCart. */
export function addToCart(params: CommercePayload): void {
  pushEvent("add_to_cart", {
    ecommerce: {
      currency: params.currency || "INR",
      value: round2(params.value),
      items: toGa4Items(params.items),
    },
  });
  pushMeta(params.meta ?? { event: "AddToCart", params: defaultMetaParams(params) });
}

/** Checkout opened. Meta's InitiateCheckout. */
export function beginCheckout(params: CommercePayload): void {
  pushEvent("begin_checkout", {
    ecommerce: {
      currency: params.currency || "INR",
      value: round2(params.value),
      items: toGa4Items(params.items),
    },
  });
  pushMeta(params.meta ?? { event: "InitiateCheckout", params: defaultMetaParams(params) });
}

/**
 * The Razorpay sheet is about to open with a real order behind it.
 *
 * This is the strongest pre-purchase signal the funnel has, and the one worth
 * giving Google Ads as a secondary optimisation target when purchase volume is
 * too thin for the algorithm to learn from.
 */
export function addPaymentInfo(
  params: CommercePayload & { paymentType?: string },
): void {
  pushEvent("add_payment_info", {
    ecommerce: {
      currency: params.currency || "INR",
      value: round2(params.value),
      payment_type: params.paymentType || "Razorpay",
      items: toGa4Items(params.items),
    },
  });
  pushMeta(params.meta);
}

/**
 * Money captured. The primary conversion for both GA4 and Google Ads.
 *
 * `transactionId` MUST be the Razorpay order id. The server fires this same
 * purchase from the Razorpay webhook so a closed tab cannot lose the sale, and
 * a shared transaction_id is the only thing keeping those two from counting as
 * two sales — GA4 deduplicates purchases on exactly that key.
 */
export function purchase(
  params: CommercePayload & {
    transactionId: string;
    tax?: number;
    shipping?: number;
    coupon?: string;
  },
): void {
  pushEvent("purchase", {
    ecommerce: {
      transaction_id: params.transactionId,
      currency: params.currency || "INR",
      value: round2(params.value),
      ...(params.tax != null && { tax: round2(params.tax) }),
      ...(params.shipping != null && { shipping: round2(params.shipping) }),
      ...(params.coupon && { coupon: params.coupon }),
      items: toGa4Items(params.items),
    },
  });
  pushMeta(params.meta ?? { event: "Purchase", params: defaultMetaParams(params) });
}

/** A paid booking was refunded/cancelled — keeps reported revenue honest. */
export function refund(params: { transactionId: string; value?: number; currency?: string }): void {
  pushEvent("refund", {
    ecommerce: {
      transaction_id: params.transactionId,
      currency: params.currency || "INR",
      ...(params.value != null && { value: round2(params.value) }),
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   LEADS & MICRO-CONVERSIONS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * An enquiry, consultation request, or callback — anything that hands us a
 * contact without taking payment. This is the Google Ads conversion action for
 * every non-transactional campaign.
 *
 * `value` is what a lead is worth to the business, not a price. Leave it at the
 * default only until you know the real number: Ads bids on it directly, so a
 * placeholder value is a placeholder bid.
 */
export function generateLead(params: {
  leadType: string;
  value?: number;
  currency?: string;
  method?: string;
  meta?: MetaSpec;
}): void {
  pushEvent("generate_lead", {
    lead_type: params.leadType,
    currency: params.currency || "INR",
    value: round2(params.value ?? 0),
    ...(params.method && { lead_method: params.method }),
  });
  pushMeta(params.meta ?? { event: "Lead", params: { content_name: params.leadType } });
}

/** WhatsApp / phone / chat tap. Intent, and a strong remarketing seed. */
export function contact(params: {
  method: "whatsapp" | "phone" | "chat" | "email" | "form";
  context?: string;
  meta?: MetaSpec;
}): void {
  pushEvent("contact", {
    contact_method: params.method,
    ...(params.context && { contact_context: params.context }),
  });
  pushMeta(params.meta ?? { event: "Contact", params: { content_name: params.context } });
}

/** Checkout form reached a usable name + phone. Mid-funnel drop-off marker. */
export function checkoutDetailsFilled(params: {
  itemName: string;
  itemId?: string;
  meta?: MetaSpec;
}): void {
  // Only the item is described here. The Meta leg below still carries the
  // devotee's name and number because it always has; GA4 gets neither.
  pushEvent("checkout_details_filled", {
    item_name: params.itemName,
    ...(params.itemId && { item_id: params.itemId }),
  });
  pushMeta(params.meta);
}

/** OTP login completed. */
export function login(method = "otp"): void {
  pushEvent("login", { method });
}

/** First-time account creation. */
export function signUp(method = "otp"): void {
  pushEvent("sign_up", { method });
  pushMeta({ event: "CompleteRegistration", params: { content_name: method } });
}

/** Search inside the catalog. */
export function search(term: string): void {
  pushEvent("search", { search_term: term });
  pushMeta({ event: "Search", params: { search_string: term } });
}

/**
 * Anything without a GA4 recommended-event equivalent — package upgrades,
 * prasad-box toggles, muhurat picks.
 *
 * Use a snake_case name. GA4 will not accept spaces, and a name that differs
 * from the Meta one is fine: `meta` carries Meta's own name unchanged.
 */
export function custom(
  name: string,
  params: Record<string, unknown> = {},
  meta?: MetaSpec,
): void {
  pushEvent(name, params);
  pushMeta(meta);
}

/* ═══════════════════════════════════════════════════════════════════════════
   LEGACY BRIDGE
   ═══════════════════════════════════════════════════════════════════════════ */

/** Meta event name → the GA4 recommended event that means the same thing. */
const META_TO_GA4: Record<string, string> = {
  ViewContent: "view_item",
  AddToCart: "add_to_cart",
  InitiateCheckout: "begin_checkout",
  Lead: "generate_lead",
  Contact: "contact",
  Search: "search",
  CompleteRegistration: "sign_up",
};

/** "puja_cta_click" from "Puja CTA Click" — GA4 rejects spaces in event names. */
const toSnakeCase = (name: string): string =>
  name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

/**
 * Bridge for the per-page `track(event, params, custom)` helpers that predate
 * this module.
 *
 * Those pages each grew their own thin `window.fbq` wrapper. Rewriting all of
 * their call sites by hand would be a large diff over working code for no
 * behavioural gain, so instead each helper now delegates here: Meta receives
 * byte-identical events, and GA4 gets a mapped equivalent.
 *
 * Purchase is deliberately NOT mapped. A GA4 purchase without a transaction_id
 * cannot be deduplicated against the server's webhook purchase, so it would
 * double-count revenue. Checkout pages call `purchase()` directly instead.
 */
export function metaBridge(
  event: string,
  params: Record<string, unknown> = {},
  custom = false,
): void {
  pushMeta({ event, custom, params });

  if (event === "Purchase") return;

  const value = Number(params.value) || 0;
  const currency = String(params.currency || "INR");
  const ids = Array.isArray(params.content_ids) ? params.content_ids : [];
  const name = String(params.content_name || event);

  const items: AnalyticsItem[] = ids.length
    ? ids.map((id) => ({ id: String(id), name, price: value, quantity: 1 }))
    : [{ id: toSnakeCase(name), name, price: value, quantity: 1 }];

  const ga4Event = META_TO_GA4[event];

  // Ecommerce events need the nested `ecommerce` envelope; everything else is
  // a flat custom event carrying whatever the page already passed to Meta.
  if (ga4Event === "view_item" || ga4Event === "add_to_cart" || ga4Event === "begin_checkout") {
    pushEvent(ga4Event, {
      ecommerce: { currency, value: round2(value), items: toGa4Items(items) },
    });
    return;
  }

  pushEvent(ga4Event || toSnakeCase(event), {
    ...params,
    ...(value > 0 && { value: round2(value), currency }),
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   SERVER-SIDE ATTRIBUTION BRIDGE
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Headers that let the API attribute a server-fired conversion.
 *
 * The `x-fbp`/`x-fbc` pair was already being sent by hand from four booking
 * pages for Meta's Conversions API; the two `x-ga-*` headers are the Google
 * equivalent. Centralising them means a new checkout page gets correct
 * attribution by using this helper rather than by remembering four strings.
 */
export function attributionHeaders(): Record<string, string> {
  return {
    "x-event-source-url": isBrowser() ? window.location.href : "",
    "x-fbp": readCookie("_fbp"),
    "x-fbc": readCookie("_fbc"),
    "x-ga-client-id": getGaClientId(),
    "x-ga-session-id": getGaSessionId(),
    "x-gclid": getGclid(),
  };
}

/**
 * Park this browser's analytics identity against a Razorpay order id.
 *
 * The problem this solves: when the tab closes after payment, the purchase is
 * reported by the Razorpay webhook — a server-to-server call with no cookies,
 * no user agent, and no idea which visitor it belongs to. Sending a purchase
 * without a client id makes GA4 invent a new user, so the sale is recorded but
 * credited to "(direct)" and the ad that earned it shows no return.
 *
 * Call this the moment an order id exists, BEFORE opening Razorpay. Deliberately
 * fire-and-forget: analytics must never be able to block or fail a payment.
 */
export function stashOrderAttribution(razorpayOrderId: string): void {
  if (!isBrowser() || !razorpayOrderId) return;

  const body = JSON.stringify({
    razorpayOrderId,
    clientId: getGaClientId(),
    sessionId: getGaSessionId(),
    gclid: getGclid(),
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
    userAgent: navigator.userAgent,
    eventSourceUrl: window.location.href,
  });

  // keepalive so the request still completes if the user navigates away or
  // closes the tab the instant payment succeeds — the exact case this exists for.
  try {
    void fetch(`${API_URL}/analytics/attribution`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* Attribution is best-effort; the purchase still reports without it. */
    });
  } catch {
    /* ignore */
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEFAULT EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Namespaced form, for call sites that prefer `analytics.purchase(...)` over a
 * long import list. Both are the same functions.
 */
const analytics = {
  // identity
  identify,
  clearIdentity,
  getGaClientId,
  getGaSessionId,
  getGclid,
  readCookie,
  // page
  pageView,
  // ecommerce
  viewItemList,
  viewItem,
  selectItem,
  addToCart,
  beginCheckout,
  addPaymentInfo,
  purchase,
  refund,
  // leads
  generateLead,
  contact,
  checkoutDetailsFilled,
  login,
  signUp,
  search,
  custom,
  metaBridge,
  // server bridge
  attributionHeaders,
  stashOrderAttribution,
};

export default analytics;
