/**
 * Vedic Vivah — API layer shared by the landing, package-detail and checkout
 * pages. Endpoint paths are IDENTICAL to the app's, because the website server
 * mounts the same routes against the same collection.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import API_URL from "../utils/apiConfig";
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
/*                              META PIXEL EVENTS                             */
/* ========================================================================== */

/** Browser-side Purchase. `eventID` must match the server's CAPI event_id. */
export const pixelVivahPurchase = (orderId: string, value: number, label: string) => {
  const fbq = (window as any).fbq;
  if (!fbq) return;
  fbq(
    "track",
    "Purchase",
    {
      content_name: `Vedic Vivah — ${label}`,
      content_ids: ["VEDIC_VIVAH"],
      content_type: "vivah",
      value,
      currency: "INR",
    },
    { eventID: `vivah_purchase_${orderId}` }
  );
};

export const pixelVivahInitiateCheckout = (value: number, label: string) => {
  const fbq = (window as any).fbq;
  if (!fbq) return;
  fbq("track", "InitiateCheckout", {
    content_name: `Vedic Vivah — ${label}`,
    content_ids: ["VEDIC_VIVAH"],
    content_type: "vivah",
    value,
    currency: "INR",
  });
};

export const pixelVivahLead = (label: string) => {
  const fbq = (window as any).fbq;
  if (!fbq) return;
  fbq("track", "Lead", { content_name: `Vedic Vivah — ${label}`, content_type: "vivah" });
};
