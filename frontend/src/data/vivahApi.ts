/**
 * Vedic Vivah — API layer shared by the landing, package-detail and checkout
 * pages. Endpoint paths are IDENTICAL to the app's, because the website server
 * mounts the same routes against the same collection.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import API_URL from "../utils/apiConfig";
import analytics, { type AnalyticsItem } from "../utils/analytics";
import {
  DEFAULT_ADVANCE_PERCENT,
  DEFAULT_VIVAH_CATALOG,
  DEFAULT_VIVAH_KASHI,
  DEFAULT_VIVAH_LANGUAGES,
  DEFAULT_VIVAH_MUHURATS,
  DEFAULT_VIVAH_PACKAGES,
  DEFAULT_VIVAH_TEMPLES,
  buildRitualsFromCatalog,
  type CatalogMuhurat,
  type CatalogSampooran,
  type CrossSellProduct,
  type Ritual,
  type VivahKashi,
  type VivahPackage,
  type VivahSeo,
  type VivahTemple,
} from "./vivahCatalog";

/* ========================================================================== */
/*                                  SESSION                                   */
/* ========================================================================== */

/**
 * Login tokens are signed with `expiresIn: "7d"`. Once that lapses the server
 * answers every protected call with 401 "Invalid or expired token" — and until
 * now that surfaced as a raw red banner at the moment of payment, with no way
 * forward. These helpers let the UI notice a dead session BEFORE it builds an
 * order, and recover cleanly when the server rejects one anyway.
 */

/** Seconds-since-epoch this JWT expires, or null if it carries no `exp`. */
const jwtExpiry = (token: string): number | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    // base64url → base64, then decode. Never throws out of this function.
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = Number(JSON.parse(json)?.exp);
    return Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
};

/** The raw token, or "" when there isn't one. */
export const sessionToken = (): string => localStorage.getItem("user_token") || "";

/**
 * True only when a token exists AND has not expired. A token with no `exp`
 * claim is treated as valid — the server is the authority, we're only trying to
 * avoid the obviously-dead case.
 */
export const hasValidSession = (): boolean => {
  const token = sessionToken();
  if (!token) return false;
  const exp = jwtExpiry(token);
  if (exp === null) return true;
  // 30s of slack so a token expiring mid-request doesn't slip through.
  return exp * 1000 > Date.now() + 30_000;
};

/** Drop every trace of the dead session, exactly like AuthContext.logout(). */
export const clearSession = () => {
  localStorage.removeItem("user_token");
  localStorage.removeItem("user_data");
  localStorage.removeItem("user");
};

/** Thrown when the server rejects our token — callers re-open the login modal. */
export class VivahAuthError extends Error {
  constructor(message = "Your session has expired. Please sign in again to continue.") {
    super(message);
    this.name = "VivahAuthError";
  }
}

/**
 * fetch() for the protected Vivah endpoints. On 401 it wipes the stale session
 * and throws `VivahAuthError`, so a caller can prompt for login and retry
 * instead of dead-ending the family on a raw server message.
 */
export const vivahFetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
  const res = await fetch(url, init);
  if (res.status === 401) {
    clearSession();
    let message: string | undefined;
    try {
      message = (await res.clone().json())?.message;
    } catch {
      /* body wasn't JSON — the default copy is better than nothing anyway */
    }
    throw new VivahAuthError(
      message === "Authorization header missing" || !message
        ? undefined
        : "Your session has expired. Please sign in again to continue."
    );
  }
  return res;
};

/* ========================================================================== */
/*                            HUMAN-READABLE ERRORS                           */
/* ========================================================================== */

/**
 * Turn ANY failure into a sentence a family can act on.
 *
 * A wedding booking is not the place to read "TypeError: Failed to fetch" or
 * "Order ID mismatch". Every raw string — a thrown JS error, a server message,
 * a Razorpay code — is mapped here to plain language that says what happened
 * and what to do next. Anything we don't recognise falls back to a warm,
 * non-technical default rather than leaking internals.
 *
 * The real reason is still logged to the console for us.
 */
const SUPPORT = "call us on +91 90569 55311";

/** Server/network strings → what the family should actually be told. */
const HUMAN: { match: RegExp; say: string }[] = [
  // ── Connectivity ──
  {
    match: /failed to fetch|networkerror|network request failed|load failed|fetch event|err_internet|err_connection|err_network|typeerror: cancelled/i,
    say: `We couldn't reach our servers just now. Please check your internet and try again — or ${SUPPORT} and we'll book it for you.`,
  },
  { match: /timeout|timed out|aborted/i,
    say: `That took longer than expected and we stopped it to be safe. Nothing has been charged — please try once more.` },

  // ── Session ──
  { match: /invalid or expired token|jwt|unauthorized|authorization header missing|token missing|user not found/i,
    say: "Your session has expired. Please sign in again — everything you've filled in has been kept." },
  { match: /not authorized/i,
    say: "This booking belongs to a different account. Please sign in with the number you booked from." },

  // ── Payments ──
  { match: /payments are temporarily unavailable/i,
    say: `Online payment is temporarily unavailable. Please request a callback below and our team will confirm your booking — or ${SUPPORT}.` },
  { match: /payment sdk failed to load|razorpay/i,
    say: "The secure payment window couldn't open. Please refresh the page and try again — nothing has been charged." },
  { match: /payment verification failed|signature/i,
    say: `We couldn't verify that payment with our bank. If money has left your account it is safe and will be confirmed or refunded — please ${SUPPORT} with your payment ID.` },
  { match: /order id mismatch|missing payment completion details/i,
    say: `Something didn't line up while confirming your payment. Your money is safe — please ${SUPPORT} and we'll settle it immediately.` },
  { match: /invalid booking amount/i,
    say: "We couldn't price this booking correctly. Please reload the page and choose your rituals again — you have not been charged." },
  { match: /no balance is pending/i, say: "This booking is already fully paid — there's nothing left to pay." },
  { match: /hasn't been confirmed yet/i,
    say: "Please complete the advance payment first — the balance can be paid after that." },

  // ── Booking state ──
  { match: /booking not found/i,
    say: `We couldn't find that booking. Please refresh My Bookings — or ${SUPPORT} and we'll look it up.` },
  { match: /this booking is cancelled/i, say: "This booking has already been cancelled." },
  { match: /missing required details/i,
    say: "Some required details are missing. Please check the highlighted fields above and try again." },
  { match: /name and a valid whatsapp number are required/i,
    say: "Please enter your name and a valid 10-digit WhatsApp number." },

  // ── Uploads ──
  { match: /no file uploaded|failed to upload kundali|could not upload/i,
    say: "That kundali image couldn't be uploaded. Please try a clear JPG or PNG under 25 MB." },

  // ── Generic server faults ──
  { match: /failed to create order|failed to submit request|failed to complete payment|failed to fetch catalog|failed to submit consultation|internal server error|500/i,
    say: `Something went wrong at our end — not with your details. Please try again in a moment, or ${SUPPORT} and we'll complete the booking for you.` },
];

const GENERIC_FAILURE = `Something didn't go through just now. Please try again — or ${SUPPORT} and our team will complete your booking personally.`;

/**
 * @param err     the caught error (or a server `message` string)
 * @param context short label for the console log, e.g. "create-order"
 */
export const humanError = (err: unknown, context = "vivah"): string => {
  const raw =
    typeof err === "string" ? err : (err as any)?.message ? String((err as any).message) : "";

  // Keep the real cause for us, never for them.
  if (raw) console.error(`[Vivah:${context}]`, err);

  if (!raw) return GENERIC_FAILURE;

  // A message we deliberately wrote for the family already reads well —
  // these are full sentences ending in punctuation and free of jargon.
  const alreadyHuman =
    /[.!?]$/.test(raw.trim()) && raw.length > 40 && !/[{}<>]|error:|exception|undefined|null/i.test(raw);

  const hit = HUMAN.find((h) => h.match.test(raw));
  if (hit) return hit.say;
  return alreadyHuman ? raw : GENERIC_FAILURE;
};

/** Razorpay's own failure payload → plain language. */
export const humanPaymentError = (resp: any): string => {
  const reason = String(resp?.error?.reason || "");
  const desc = String(resp?.error?.description || "");
  console.error("[Vivah:razorpay]", resp?.error || resp);

  if (/insufficient/i.test(reason + desc))
    return "The payment was declined for insufficient funds. Please try another method — nothing has been charged.";
  if (/cancel/i.test(reason + desc))
    return "The payment was cancelled. You can try again, or request a callback and pay later.";
  if (/expired|invalid.*(card|vpa|upi)/i.test(reason + desc))
    return "Those payment details were declined. Please check them or try another method.";
  if (/international|not.*permitted|blocked/i.test(reason + desc))
    return "Your bank declined this payment. Please try another card or UPI — or ask your bank to allow it.";
  if (/timeout|timed out/i.test(reason + desc))
    return "The payment timed out before your bank responded. Nothing has been charged — please try again.";
  return `Your bank couldn't complete this payment. Nothing has been charged — please try another method, or ${SUPPORT}.`;
};

/** Bearer header for the logged-in family, or {} when signed out. */
export const authHeaders = (): Record<string, string> => {
  const token = sessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const jsonHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  ...authHeaders(),
});

/** The logged-in user as AuthContext stores it (read fresh, not closed over). */
export const currentUser = (): any | null => {
  try {
    const raw = localStorage.getItem("user_data");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export type VivahCatalogState = {
  rituals: Ritual[];
  sampooran: CatalogSampooran | null;
  packages: VivahPackage[];
  muhurats: CatalogMuhurat[];
  temples: VivahTemple[];
  kashi: VivahKashi | null;
  crossSell: CrossSellProduct[];
  supportedLanguages: string[];
  advancePercent: number;
  seo: VivahSeo | null;
  loading: boolean;
  /** True when BOTH fetch attempts failed and we're on the bundled defaults. */
  loadError: boolean;
};

const FALLBACK: Omit<VivahCatalogState, "loading" | "loadError"> = {
  rituals: buildRitualsFromCatalog(DEFAULT_VIVAH_CATALOG),
  sampooran: DEFAULT_VIVAH_CATALOG.sampooranVivah as CatalogSampooran,
  packages: DEFAULT_VIVAH_PACKAGES,
  muhurats: DEFAULT_VIVAH_MUHURATS,
  temples: DEFAULT_VIVAH_TEMPLES,
  kashi: DEFAULT_VIVAH_KASHI,
  crossSell: [],
  supportedLanguages: DEFAULT_VIVAH_LANGUAGES,
  advancePercent: DEFAULT_ADVANCE_PERCENT,
  seo: null,
};

/**
 * Fetch the admin catalog once (with a single retry), falling back to the
 * bundled defaults so the page is always usable. Same contract as the app.
 */
export function useVivahCatalog(): VivahCatalogState {
  const [state, setState] = useState<VivahCatalogState>({
    ...FALLBACK,
    loading: true,
    loadError: false,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let lastErr: any = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(`${API_URL}/bookings/vedic-vivah/catalog`);
          const data = await res.json();
          if (!res.ok || data?.success !== true || !data?.catalog) {
            throw new Error(data?.message || "Malformed catalog response");
          }
          if (cancelled) return;
          const c = data.catalog;
          setState({
            rituals: Array.isArray(c.rituals) && c.rituals.length
              ? buildRitualsFromCatalog(c)
              : FALLBACK.rituals,
            sampooran: c.sampooranVivah || FALLBACK.sampooran,
            packages: Array.isArray(c.packages) && c.packages.length ? c.packages : FALLBACK.packages,
            muhurats: Array.isArray(c.muhurats) && c.muhurats.length ? c.muhurats : FALLBACK.muhurats,
            temples: Array.isArray(c.temples) && c.temples.length ? c.temples : FALLBACK.temples,
            kashi: c.kashi || FALLBACK.kashi,
            crossSell: Array.isArray(c.crossSellProducts) ? c.crossSellProducts : [],
            supportedLanguages:
              Array.isArray(c.supportedLanguages) && c.supportedLanguages.length
                ? c.supportedLanguages
                : FALLBACK.supportedLanguages,
            advancePercent:
              Number(c.advancePercent) > 0 ? Number(c.advancePercent) : FALLBACK.advancePercent,
            seo: c.seo || null,
            loading: false,
            loadError: false,
          });
          return;
        } catch (e) {
          lastErr = e;
        }
      }
      if (cancelled) return;
      console.warn(
        "[Vivah] catalog fetch failed, using bundled default pricing:",
        (lastErr as any)?.message
      );
      setState({ ...FALLBACK, loading: false, loadError: true });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/* ========================================================================== */
/*                            RE-ENGAGEMENT NUDGE                             */
/* ========================================================================== */

/**
 * Fire the "user sat on this page for 5 minutes without acting" signal, exactly
 * like the app does. Fire-and-forget: a nudge must never surface as an error.
 * Returns a `cancel()` the page calls the moment the family converts.
 */
export function useDwellNudge(nameHint: string, phoneHint: string) {
  const firedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Kept fresh on every render so the timer closure always reads current values.
  const infoRef = useRef({ name: nameHint, phone: phoneHint });
  infoRef.current = { name: nameHint, phone: phoneHint };

  const cancel = useCallback(() => {
    firedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (firedRef.current) return;
      const phone = String(infoRef.current.phone || "").replace(/\D/g, "");
      // Only nudge someone we can actually reach.
      if (phone.length !== 10) return;
      firedRef.current = true;
      const user = currentUser();
      void fetch(`${API_URL}/bookings/vedic-vivah/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "page_dwell",
          userId: user?._id,
          name: infoRef.current.name || user?.name || "Yajaman",
          whatsapp: phone,
        }),
      }).catch(() => {});
    }, 5 * 60 * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Mount-only, exactly like the app: the timer reads live values off infoRef.
  }, []);

  return cancel;
}

/** Tell the server the family closed the Razorpay sheet without paying. */
export const reportPaymentAbandoned = (bookingId: string, name: string, whatsapp: string) => {
  const user = currentUser();
  void fetch(`${API_URL}/bookings/vedic-vivah/nudge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "payment_abandoned",
      bookingId,
      userId: user?._id,
      name,
      whatsapp,
    }),
  }).catch(() => {});
};

/* ========================================================================== */
/*                          RAZORPAY CHECKOUT SCRIPT                          */
/* ========================================================================== */

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/**
 * Inject the Razorpay web SDK once and resolve when it is usable. Awaiting this
 * (rather than assuming the script already loaded) avoids the "Payment SDK
 * failed to load" race on a slow first paint.
 */
export const loadRazorpay = (): Promise<any> =>
  new Promise((resolve, reject) => {
    const w = window as any;
    if (w.Razorpay) return resolve(w.Razorpay);

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).Razorpay));
      existing.addEventListener("error", () => reject(new Error("Payment SDK failed to load.")));
      // Already finished loading before we attached the listener.
      if (w.Razorpay) resolve(w.Razorpay);
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.onload = () => resolve((window as any).Razorpay);
    script.onerror = () =>
      reject(new Error("Payment SDK failed to load. Please refresh and try again."));
    document.body.appendChild(script);
  });

/* ========================================================================== */
/*                            ANALYTICS EVENTS                                */
/* ========================================================================== */
/* These were Meta-only helpers. They now go through utils/analytics, which     */
/* fans each call out to GA4 + Google Ads as well. The Meta leg is byte-for-    */
/* byte what it always was — the `meta` blocks below carry the original event   */
/* names and params — so Ads Manager history is continuous. The names and       */
/* signatures are unchanged so every existing call site keeps working.          */

/** One Vedic Vivah package as a GA4 line item. */
const vivahItems = (label: string, value: number): AnalyticsItem[] => [
  {
    id: "VEDIC_VIVAH",
    name: `Vedic Vivah — ${label}`,
    price: value,
    quantity: 1,
    category: "Vedic Vivah",
    variant: label,
  },
];

/** Browser-side Purchase. `eventID` must match the server's CAPI event_id. */
export const pixelVivahPurchase = (orderId: string, value: number, label: string) => {
  analytics.purchase({
    transactionId: orderId,
    items: vivahItems(label, value),
    value,
    currency: "INR",
    meta: {
      event: "Purchase",
      eventId: `vivah_purchase_${orderId}`,
      params: {
        content_name: `Vedic Vivah — ${label}`,
        content_ids: ["VEDIC_VIVAH"],
        content_type: "vivah",
        value,
        currency: "INR",
      },
    },
  });
};

export const pixelVivahInitiateCheckout = (value: number, label: string) => {
  analytics.beginCheckout({
    items: vivahItems(label, value),
    value,
    currency: "INR",
    meta: {
      event: "InitiateCheckout",
      params: {
        content_name: `Vedic Vivah — ${label}`,
        content_ids: ["VEDIC_VIVAH"],
        content_type: "vivah",
        value,
        currency: "INR",
      },
    },
  });
};

export const pixelVivahLead = (label: string) => {
  analytics.generateLead({
    leadType: `Vedic Vivah — ${label}`,
    method: "vivah_enquiry",
    meta: {
      event: "Lead",
      params: { content_name: `Vedic Vivah — ${label}`, content_type: "vivah" },
    },
  });
};

/**
 * Park this browser's GA4/Ads ids against a Vivah Razorpay order.
 *
 * Call right after the order is created and before the Razorpay sheet opens, so
 * the webhook can still attribute the purchase if the tab is closed.
 */
export const stashVivahOrderAttribution = (razorpayOrderId: string) =>
  analytics.stashOrderAttribution(razorpayOrderId);
