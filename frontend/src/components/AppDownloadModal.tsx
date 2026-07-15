import { useEffect, useState } from "react";

/**
 * Pandit Ji At Request — "Get the app" modal (website).
 *
 * Shows once per browser session. When the visitor arrived via a partner/affiliate referral link,
 * the captured code (`pjar_partner_ref`, 2-day TTL — same entry the checkout reads) is embedded into
 * the Play Store link as the install referrer (`referrer=referralCode=<code>`). On install + login
 * the app reads that referrer and links the account to the referrer, so every in-app booking is
 * attributed to them. Dismissing keeps the visitor on the website (where `?ref=` checkout
 * attribution already applies).
 */

const APP_PACKAGE = "com.panditJiAtReqapp";
const SESSION_FLAG = "pjar_app_modal_shown";

function getReferralCode(): string {
  try {
    const raw = localStorage.getItem("pjar_partner_ref");
    if (!raw) return "";
    const entry = JSON.parse(raw) as { code: string; storedAt: number };
    if (Date.now() - entry.storedAt > 2 * 24 * 60 * 60 * 1000) return "";
    return entry.code || "";
  } catch {
    return "";
  }
}

function playStoreUrl(code: string): string {
  const base = `https://play.google.com/store/apps/details?id=${APP_PACKAGE}`;
  if (!code) return base;
  return `${base}&referrer=${encodeURIComponent(`referralCode=${code}`)}`;
}

export default function AppDownloadModal() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    let shown = false;
    try {
      shown = sessionStorage.getItem(SESSION_FLAG) === "1";
    } catch {
      /* ignore */
    }
    if (shown) return;
    const t = window.setTimeout(() => {
      setCode(getReferralCode());
      setMounted(true);
      try {
        sessionStorage.setItem(SESSION_FLAG, "1");
      } catch {
        /* ignore */
      }
      // next frame → trigger the enter transition
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    }, 1600);
    return () => window.clearTimeout(t);
  }, []);

  if (!mounted) return null;

  const close = () => {
    setVisible(false);
    window.setTimeout(() => setMounted(false), 220);
  };

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
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "rgba(17,24,39,0.55)" }}
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-200 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center text-white" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
          <button
            onClick={close}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 20.5v-17c0-.6.3-1.1.8-1.4L14.5 12 3.8 21.9c-.5-.3-.8-.8-.8-1.4zM16.8 14.3 5.9 20.9l8.6-8.1 2.3 1.5zM20.7 10.9c.4.3.6.7.6 1.1s-.2.8-.6 1.1l-2.4 1.4-2.6-1.7 2.6-1.7 2.4 1.4zM5.9 3.1l10.9 6.6-2.3 1.5L5.9 3.1z" />
            </svg>
          </div>
          <h3 className="text-xl font-extrabold">Get the Pandit Ji App</h3>
          <p className="mt-1 text-sm text-white/95">Book pandits, chadhava & live mandir seva — faster.</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {code ? (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
                <rect x="3" y="8" width="18" height="4" rx="1" />
                <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 1 1 0-5C9 3 12 8 12 8M16.5 8a2.5 2.5 0 1 0 0-5C15 3 12 8 12 8" />
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-bold text-orange-800">You were invited!</p>
                <p className="text-xs text-orange-700">
                  Install with this button to keep your invite linked — code{" "}
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-800">{code}</span>
                </p>
              </div>
            </div>
          ) : (
            <p className="mb-4 text-center text-sm text-gray-500">
              Download the app for the best experience, or continue on the website.
            </p>
          )}

          <button
            onClick={getApp}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
            style={{ background: "linear-gradient(180deg,#ff8a2e,#f97316)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 20.5v-17c0-.6.3-1.1.8-1.4L14.5 12 3.8 21.9c-.5-.3-.8-.8-.8-1.4zM16.8 14.3 5.9 20.9l8.6-8.1 2.3 1.5zM20.7 10.9c.4.3.6.7.6 1.1s-.2.8-.6 1.1l-2.4 1.4-2.6-1.7 2.6-1.7 2.4 1.4z" />
            </svg>
            Get it on Google Play
          </button>
          <button onClick={close} className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50">
            Continue on website
          </button>
        </div>
      </div>
    </div>
  );
}
