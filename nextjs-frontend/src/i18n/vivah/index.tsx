import { useSyncExternalStore, type ReactNode } from "react";

import en from "./dicts/en";

/* ==========================================================================
   VEDIC VIVAH — MULTILINGUAL CORE
   --------------------------------------------------------------------------
   The seven most-spoken Indian languages plus English, for the whole Vivah
   segment. Built for speed, deliberately NOT i18next:

     • English ships in the main bundle (it is the fallback, so t() can never
       flash empty), every other dictionary lazy-loads as its own tiny chunk
       the first time it's chosen — a reader who never leaves English pays
       zero bytes for the other seven.
     • Dictionaries are flat string maps, so a lookup is one object access —
       no interpolation engine in the hot path, no lag on language switch.
     • The choice persists (localStorage) AND travels (?lang= in the URL), so
       a shared Hindi link opens in Hindi, which is also what the hreflang
       tags promise the search engines.
   ========================================================================== */

export type VivLang = "en" | "hi" | "bn" | "mr" | "te" | "ta" | "gu" | "kn";

export const VIV_LANGS: { code: VivLang; native: string; label: string }[] = [
  { code: "en", native: "English", label: "English" },
  { code: "hi", native: "हिन्दी", label: "Hindi" },
  { code: "bn", native: "বাংলা", label: "Bengali" },
  { code: "mr", native: "मराठी", label: "Marathi" },
  { code: "te", native: "తెలుగు", label: "Telugu" },
  { code: "ta", native: "தமிழ்", label: "Tamil" },
  { code: "gu", native: "ગુજરાતી", label: "Gujarati" },
  { code: "kn", native: "ಕನ್ನಡ", label: "Kannada" },
];

const CODES = new Set(VIV_LANGS.map((l) => l.code));
const STORE_KEY = "viv_lang";

/** One loader per language so each dictionary becomes its own chunk. */
const loaders: Record<Exclude<VivLang, "en">, () => Promise<{ default: Record<string, string> }>> = {
  hi: () => import("./dicts/hi"),
  bn: () => import("./dicts/bn"),
  mr: () => import("./dicts/mr"),
  te: () => import("./dicts/te"),
  ta: () => import("./dicts/ta"),
  gu: () => import("./dicts/gu"),
  kn: () => import("./dicts/kn"),
};

/** Already-fetched dictionaries — switching back is instant. */
const cache: Partial<Record<VivLang, Record<string, string>>> = { en };

const initialLang = (): VivLang => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl && CODES.has(fromUrl as VivLang)) return fromUrl as VivLang;
    const stored = localStorage.getItem(STORE_KEY);
    if (stored && CODES.has(stored as VivLang)) return stored as VivLang;
  } catch {
    /* SSR/privacy mode — English */
  }
  return "en";
};

/* ── A tiny external store instead of React context ─────────────────────────
   The Vivah pages each mount their own <VivahScope>, so a context provider
   inside the scope sits BELOW the page component that wants to read it. A
   module-level store + useSyncExternalStore gives every component — page,
   header, footer, drawer — the same language state regardless of where it
   sits in the tree, with zero provider plumbing and instant switches. */

type Snapshot = {
  lang: VivLang;
  t: (key: string) => string;
  /**
   * Content translator for catalog-driven text (ritual names, package
   * taglines, perk lines…). Dictionaries carry entries keyed `c:<exact
   * English source>`; when the admin has customised the text there is no
   * entry, and the source string passes through untouched — so translation
   * never fights the admin's own words.
   */
  tc: (source: string | null | undefined) => string;
  ready: boolean;
};

let currentLang: VivLang = initialLang();
let currentDict: Record<string, string> = cache[currentLang] || en;
const listeners = new Set<() => void>();

const makeSnapshot = (): Snapshot => {
  const dict = currentDict;
  return {
    lang: currentLang,
    t: (key: string) => dict[key] ?? en[key] ?? key,
    tc: (source: string | null | undefined) => {
      if (!source) return "";
      return dict[`c:${source}`] ?? source;
    },
    ready: dict === cache[currentLang],
  };
};
let snapshot: Snapshot = makeSnapshot();

const notify = () => {
  snapshot = makeSnapshot();
  listeners.forEach((l) => l());
};

const applyDict = (lang: VivLang, dict: Record<string, string>) => {
  if (lang !== currentLang) return; // a faster later switch won
  currentDict = dict;
  document.documentElement.lang = lang;
  notify();
};

export const setVivahLang = (l: VivLang) => {
  if (!CODES.has(l) || l === currentLang) return;
  currentLang = l;
  try {
    localStorage.setItem(STORE_KEY, l);
    const url = new URL(window.location.href);
    if (l === "en") url.searchParams.delete("lang");
    else url.searchParams.set("lang", l);
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {
    /* non-fatal */
  }
  const cached = cache[l];
  if (cached) {
    applyDict(l, cached);
    return;
  }
  // Show English keys for the ~100ms the chunk takes, then swap in.
  currentDict = en;
  document.documentElement.lang = l;
  notify();
  loaders[l as Exclude<VivLang, "en">]()
    .then((m) => {
      cache[l] = m.default;
      applyDict(l, m.default);
    })
    .catch(() => {
      /* offline mid-switch — English stands in */
    });
};

// Preload a non-English initial language (arrived via ?lang= or storage).
if (currentLang !== "en" && !cache[currentLang]) {
  const wanted = currentLang;
  loaders[wanted as Exclude<VivLang, "en">]()
    .then((m) => {
      cache[wanted] = m.default;
      applyDict(wanted, m.default);
    })
    .catch(() => {});
}
if (typeof document !== "undefined") document.documentElement.lang = currentLang;

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => snapshot;

/** Kept as a passthrough so existing <VivahLangProvider> mounts stay valid. */
export function VivahLangProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const useVivahLang = () => {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { lang: snap.lang, t: snap.t, tc: snap.tc, ready: snap.ready, setLang: setVivahLang };
};

/**
 * Format a dictionary template: replaces `{n}`, `{amt}`, `{name}` style
 * placeholders. One tiny helper instead of an interpolation engine.
 */
export const tfmt = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

/**
 * hreflang alternates for a Vivah path — every language variant of the page,
 * plus x-default, exactly as the URL scheme (?lang=) serves them.
 */
export const hreflangLinks = (path: string) => {
  const base = `https://panditjiatrequest.com${path}`;
  return [
    { hrefLang: "x-default", href: base },
    ...VIV_LANGS.map((l) => ({
      hrefLang: l.code === "en" ? "en-IN" : `${l.code}-IN`,
      href: l.code === "en" ? base : `${base}?lang=${l.code}`,
    })),
  ];
};
