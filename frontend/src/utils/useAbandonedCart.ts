import { useCallback, useEffect, useRef } from "react";
import API_URL from "./apiConfig";

import { attributionPayload } from "./attribution";
/**
 * Abandoned-cart capture for the booking pages.
 *
 * The devotee's mobile number is the first thing worth keeping: as soon as it
 * is long enough to dial, a row is created in Mongo (`abandonedCarts`) carrying
 * the puja they were booking. Everything they fill afterwards — name, gotra,
 * email, package, family Sankalp names, delivery address, amount — patches
 * that same row, so a drop-off at any step still leaves the team a complete
 * picture of how far they got.
 *
 * Nothing here is allowed to affect checkout: every request is fire-and-forget
 * and failures are swallowed.
 */

export type CartDraft = {
  phone?: string;
  name?: string;
  gotra?: string;
  email?: string;
  wish?: string;
  pujaId?: string;
  pujaSlug?: string;
  pujaName?: string;
  templeName?: string;
  packageId?: string;
  packageName?: string;
  amount?: number;
  familyMembers?: any[];
  items?: any[];
  address?: Record<string, any> | null;
  extra?: Record<string, any>;
  userId?: string;
};

// How long to wait after the last keystroke before saving. Long enough that
// typing a name is one request, short enough that a devotee who abandons a few
// seconds later is still captured with what they had typed.
const DEBOUNCE_MS = 900;

const SID_PREFIX = "pjar_cart_sid:";

const randomId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// One id per booking page per tab. sessionStorage (not localStorage) is
// deliberate: a devotee coming back next week is a fresh lead, not an edit of
// the old one, but a page refresh mid-form must keep patching the same row.
function getSessionId(source: string): string {
  const key = SID_PREFIX + source;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const sid = `${source}-${randomId()}`;
    sessionStorage.setItem(key, sid);
    return sid;
  } catch {
    // Private-mode / storage-blocked browsers still get a working (per-mount) id.
    return `${source}-${randomId()}`;
  }
}

/**
 * The number as the lead should be stored.
 *
 * A bare 10-digit Indian number is kept as-is (that is what every lead in the
 * table already looks like, and what the team dials). Anything longer arrives
 * from the international checkout already carrying its country code and is kept
 * whole — trimming it to the last 10 would leave a number nobody can call back.
 */
function leadPhone(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

/** Enough digits to be a real number in any country we take bookings from. */
const MIN_LEAD_DIGITS = 8;

// Drop empty strings / empty arrays so a half-filled form never overwrites a
// value the server already has.
function compact(draft: CartDraft): Record<string, any> {
  const out: Record<string, any> = {};
  Object.entries(draft).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return;
    out[key] = value;
  });
  return out;
}

/**
 * @param source    Which booking flow this is, stored on the row and used for
 *                  filtering (e.g. "chadhava-booking").
 * @param draft     Current form snapshot; only non-empty values are sent.
 * @param scopeKey  Distinguishes carts within one flow — the puja slug/id for
 *                  pages and modals that serve many pujas. Without it, booking
 *                  puja B after abandoning puja A would overwrite A's lead.
 */
export function useAbandonedCart(source: string, draft: CartDraft, scopeKey?: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest payload we have, and the last one actually sent — so a flush on
  // page-hide can tell whether there is anything still owed to the server.
  const pendingRef = useRef<string>("");
  const sentRef = useRef<string>("");
  const convertedRef = useRef(false);

  const cartKey = scopeKey ? `${source}:${scopeKey}` : source;
  const sidRef = useRef<string>("");
  const keyRef = useRef<string>("");
  if (keyRef.current !== cartKey) {
    // First render, or the devotee switched to a different puja in the same
    // mounted component — either way this is a new cart, not an edit of the old.
    keyRef.current = cartKey;
    sidRef.current = getSessionId(cartKey);
    pendingRef.current = "";
    sentRef.current = "";
    convertedRef.current = false;
  }

  const post = useCallback((body: string, useBeacon: boolean) => {
    try {
      if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
        // Blob type matters: express.json() only parses application/json, and
        // sendBeacon otherwise labels the body text/plain.
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(`${API_URL}/abandoned-carts`, blob)) return;
      }
      fetch(`${API_URL}/abandoned-carts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        // Survives the page being torn down mid-request — the exact moment an
        // abandoned cart is created.
        keepalive: true,
      }).catch(() => { });
    } catch {
      // Capture is best-effort; never surface this to the devotee.
    }
  }, []);

  const buildBody = useCallback(
    (extraFields?: Record<string, any>) =>
      JSON.stringify({
        sessionId: sidRef.current,
        source,
        pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        ...compact(draft),
        phone: leadPhone(draft.phone),
        // Which campaign brought this devotee in. Read from localStorage, so
        // it is byte-identical on every render and cannot make `buildBody`
        // produce a 'changed' payload that re-posts on a loop.
        ...attributionPayload(),
        ...(extraFields || {}),
      }),
    // draft is a fresh object literal each render; its serialization is the
    // real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source, cartKey, JSON.stringify(draft)]
  );

  // Save on every meaningful change, once the number is complete.
  useEffect(() => {
    if (convertedRef.current) return;
    if (leadPhone(draft.phone).length < MIN_LEAD_DIGITS) return;

    const body = buildBody();
    if (body === sentRef.current) return;
    pendingRef.current = body;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      sentRef.current = pendingRef.current;
      post(pendingRef.current, false);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [buildBody, post, draft.phone]);

  // Leaving the page is the abandonment itself — flush whatever the debounce
  // is still holding before the tab goes away.
  useEffect(() => {
    const flush = () => {
      if (convertedRef.current) return;
      if (!pendingRef.current || pendingRef.current === sentRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      sentRef.current = pendingRef.current;
      post(pendingRef.current, true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [post]);

  /**
   * Call once payment succeeds. Flips the row to "converted" so it drops out
   * of the abandoned-lead list, and stops any further updates from this mount.
   */
  const markCartConverted = useCallback(
    (bookingId?: string) => {
      if (convertedRef.current) return;
      if (leadPhone(draft.phone).length < MIN_LEAD_DIGITS) return;
      convertedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      post(buildBody({ status: "converted", bookingId }), false);
    },
    [buildBody, post, draft.phone]
  );

  return { markCartConverted, cartSessionId: sidRef.current };
}

export default useAbandonedCart;
