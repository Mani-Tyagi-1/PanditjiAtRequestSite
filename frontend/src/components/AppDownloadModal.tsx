import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Pandit Ji At Request — "Get the app" modal (website).
 *
 * Shows ONLY to visitors who arrived via a partner/affiliate referral link (`?ref=CODE`), once per
 * code. The code is embedded into the Play Store link as the install referrer
 * (`referrer=referralCode=<code>`). On install + login the app reads that referrer and links the
 * account to the referrer, so every in-app booking is attributed to them. Dismissing keeps the
 * visitor on the website (where `?ref=` checkout attribution already applies).
 *
 * Two referral concepts live in storage and must not be confused:
 *   - `pjar_ref_arrival` (sessionStorage) — "arrived via an invite on this visit". Gates this modal.
 *   - `pjar_partner_ref` (localStorage, 2-day TTL) — checkout attribution. Outlives the visit by
 *     design, so gating on it would re-open this modal on every page for two days.
 */

const APP_PACKAGE = "com.panditJiAtReqapp";
const LOGO_URL =
  "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/pjar_logo-removebg-preview.png";
const PERKS = [
  "Verified pandits, booked in minutes",
  "Live darshan & chadhava at top mandirs",
  "Track your pandit on the way",
];
const ARRIVAL_KEY = "pjar_ref_arrival";
const SHOWN_CODES_KEY = "pjar_app_modal_shown_codes";
const REF_CODE = /^[A-Za-z0-9_-]{3,40}$/;

/**
 * The referral code this page load arrived with, or "" for an ordinary visit.
 *
 * The URL is checked first because an in-app SPA navigation to `?ref=CODE` never passes anything
 * that could have stashed a marker. On a real landing the URL is usually already clean: App's
 * <ReferralCapture> is a sibling mounted just above this one, so its effect strips `?ref=` before
 * this one runs — hence the sessionStorage fallback it writes on the way past.
 */
function readArrivalCode(routerSearch: string): string {
  for (const search of [routerSearch, window.location.search]) {
    const fromUrl = new URLSearchParams(search).get("ref");
    if (fromUrl && REF_CODE.test(fromUrl)) return fromUrl;
  }
  try {
    const marked = sessionStorage.getItem(ARRIVAL_KEY);
    if (marked && REF_CODE.test(marked)) return marked;
  } catch {
    /* ignore */
  }
  return "";
}

/** Codes already offered, in localStorage so a browser restart doesn't re-pitch the same invite. */
function readShownCodes(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SHOWN_CODES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function markShown(code: string): void {
  try {
    const codes = readShownCodes();
    if (codes.includes(code)) return;
    localStorage.setItem(SHOWN_CODES_KEY, JSON.stringify([...codes, code].slice(-20)));
  } catch {
    /* ignore */
  }
}

function playStoreUrl(code: string): string {
  const base = `https://play.google.com/store/apps/details?id=${APP_PACKAGE}`;
  if (!code) return base;
  return `${base}&referrer=${encodeURIComponent(`referralCode=${code}`)}`;
}

export default function AppDownloadModal() {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [code, setCode] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => setMounted(false), 220);
  }, []);

  useEffect(() => {
    const arrival = readArrivalCode(location.search);
    if (!arrival || readShownCodes().includes(arrival)) return;
    const t = window.setTimeout(() => {
      setCode(arrival);
      setMounted(true);
      markShown(arrival);
      // next frame → trigger the enter transition
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    }, 1600);
    return () => window.clearTimeout(t);
  }, [location.search]);

  // Modal manners: Escape closes, focus starts inside and stays inside, and the page
  // behind the sheet doesn't scroll under it.
  useEffect(() => {
    if (!mounted) return;
    const panel = panelRef.current;
    panel?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const stops = panel.querySelectorAll<HTMLElement>("button");
      if (!stops.length) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted, close]);

  if (!mounted) return null;

  const getApp = () => {
    const url = playStoreUrl(code);
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.location.href = url;
    }
    close();
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end justify-center transition-opacity duration-300 motion-reduce:transition-none sm:items-center sm:p-4 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "rgba(17,24,39,0.6)", backdropFilter: "blur(3px)" }}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-modal-title"
      aria-describedby="app-modal-desc"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full overflow-hidden rounded-t-[28px] bg-white shadow-2xl outline-none transition-all duration-300 ease-out motion-reduce:transition-none sm:max-w-[380px] sm:rounded-[28px] ${
          visible
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-full opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
      >
        {/* Header */}
        <div
          className="relative px-6 pb-9 pt-4 text-center text-white sm:pt-6"
          style={{ background: "linear-gradient(160deg,#fb923c 0%,#f97316 45%,#ea580c 100%)" }}
        >
          {/* Warm glow behind the icon + faint mandala rings, purely decorative */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 75% at 50% 0%, rgba(255,255,255,0.38), transparent 62%)",
            }}
          />
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border border-white/15"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full border border-white/10"
            aria-hidden="true"
          />

          {/* Drag affordance — this is a bottom sheet on phones */}
          <div className="relative mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/40 sm:hidden" />

          <button
            onClick={close}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {/* The brand asset is a wide horizontal lockup (~2.4:1), so it gets a pill that fits it
              rather than a square icon tile that would shrink it to an illegible stamp. */}
          <div className="relative mx-auto mb-3.5 inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 shadow-[0_10px_30px_-6px_rgba(120,30,0,0.5)] ring-1 ring-black/5">
            <img src={LOGO_URL} alt="" className="h-10 w-auto object-contain" />
          </div>
          <h3 id="app-modal-title" className="relative text-[22px] font-extrabold leading-tight tracking-tight">
            Get the Pandit Ji app
          </h3>
          <p id="app-modal-desc" className="relative mx-auto mt-1.5 max-w-[19rem] text-balance text-[13px] leading-snug text-white/90">
            Book pandits, chadhava &amp; live mandir seva — faster.
          </p>
        </div>

        {/* Invite coupon — straddles the seam so it reads as the point of the modal */}
        <div className="relative -mt-5 px-5">
          <div className="rounded-2xl border border-orange-200/80 bg-white p-3.5 shadow-[0_10px_28px_-10px_rgba(234,88,12,0.55)]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 ring-1 ring-orange-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="8" width="18" height="4" rx="1" />
                  <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 1 1 0-5C9 3 12 8 12 8M16.5 8a2.5 2.5 0 1 0 0-5C15 3 12 8 12 8" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-extrabold text-gray-900">You were invited</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-gray-500">
                  Install from this button to keep your invite linked.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50/70 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-500">Invite code</span>
              <span className="ml-auto font-mono text-[13px] font-extrabold tracking-[0.12em] text-orange-700">{code}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pt-4" style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>
          <ul className="mb-4 space-y-2">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2.5 text-[12.5px] font-medium text-gray-600">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="#ffedd5" />
                  <path d="m8 12.5 2.5 2.5L16 9.5" stroke="#ea580c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {perk}
              </li>
            ))}
          </ul>

          <button
            onClick={getApp}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-[15px] font-bold text-white shadow-lg shadow-orange-500/30 transition-transform duration-150 hover:brightness-[1.04] active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            style={{ background: "linear-gradient(180deg,#fb923c,#ea580c)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3 20.5v-17c0-.6.3-1.1.8-1.4L14.5 12 3.8 21.9c-.5-.3-.8-.8-.8-1.4zM16.8 14.3 5.9 20.9l8.6-8.1 2.3 1.5zM20.7 10.9c.4.3.6.7.6 1.1s-.2.8-.6 1.1l-2.4 1.4-2.6-1.7 2.6-1.7 2.4 1.4zM5.9 3.1l10.9 6.6-2.3 1.5L5.9 3.1z" />
            </svg>
            Get it on Google Play
          </button>
          <button
            onClick={close}
            className="mt-1.5 w-full rounded-xl py-2.5 text-[13px] font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          >
            Continue on website
          </button>
        </div>
      </div>
    </div>
  );
}
