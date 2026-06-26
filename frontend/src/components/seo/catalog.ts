// Programmatic SEO catalog: the FORWARD ROADMAP of the language × city × puja
// matrix (all cities/pujas/regional priest-languages for future waves).
//
// SOURCE OF TRUTH for what is actually generated today is
// scripts/generate-landing-pages.mjs. Two important conventions there:
//   • The URL's language segment = CONTENT LANGUAGE (currently en | hi), so en/hi
//     variants of a (puja, city) are true hreflang alternates. The `LANGUAGES`
//     list below is the REGIONAL PRIEST language (a targeting facet surfaced in
//     the English page's title/copy, e.g. "Telugu Vadhyar…"), NOT the page's
//     content language. Don't emit hreflang=te-IN for an English-content page.
//   • Only build/prerender slugs that have a real page (no soft-404 sitemap rows).
//
// This file is the app-side reference for a future in-app React landing route;
// keep its city/puja slugs aligned with the generator.

export interface LanguageDef {
  code: string; // BCP-47 base, e.g. "te"
  hreflang: string; // e.g. "te-IN"
  english: string; // "Telugu"
  native: string; // "తెలుగు"
  priest: string; // local word for pandit, e.g. "Vadhyar"
}

export const LANGUAGES: LanguageDef[] = [
  { code: "hi", hreflang: "hi-IN", english: "Hindi", native: "हिन्दी", priest: "Pandit" },
  { code: "te", hreflang: "te-IN", english: "Telugu", native: "తెలుగు", priest: "Vadhyar" },
  { code: "ta", hreflang: "ta-IN", english: "Tamil", native: "தமிழ்", priest: "Vadhyar" },
  { code: "bn", hreflang: "bn-IN", english: "Bengali", native: "বাংলা", priest: "Purohit" },
  { code: "gu", hreflang: "gu-IN", english: "Gujarati", native: "ગુજરાતી", priest: "Pandit" },
  { code: "mr", hreflang: "mr-IN", english: "Marathi", native: "मराठी", priest: "Guruji" },
  { code: "kn", hreflang: "kn-IN", english: "Kannada", native: "ಕನ್ನಡ", priest: "Purohita" },
  { code: "ml", hreflang: "ml-IN", english: "Malayalam", native: "മലയാളം", priest: "Namboothiri" },
  { code: "or", hreflang: "or-IN", english: "Odia", native: "ଓଡ଼ିଆ", priest: "Pandit" },
  { code: "pa", hreflang: "pa-IN", english: "Punjabi", native: "ਪੰਜਾਬੀ", priest: "Pandit" },
  { code: "en", hreflang: "en-IN", english: "English", native: "English", priest: "Pandit" },
];

export interface CityDef {
  slug: string;
  name: string;
  primaryLang: string; // language code dominant in this metro
  tier: 1 | 2;
}

export const CITIES: CityDef[] = [
  // Regional-language metros first — the white space.
  { slug: "hyderabad", name: "Hyderabad", primaryLang: "te", tier: 1 },
  { slug: "chennai", name: "Chennai", primaryLang: "ta", tier: 1 },
  { slug: "bangalore", name: "Bangalore", primaryLang: "kn", tier: 1 },
  { slug: "kolkata", name: "Kolkata", primaryLang: "bn", tier: 1 },
  { slug: "ahmedabad", name: "Ahmedabad", primaryLang: "gu", tier: 1 },
  { slug: "pune", name: "Pune", primaryLang: "mr", tier: 1 },
  { slug: "kochi", name: "Kochi", primaryLang: "ml", tier: 2 },
  { slug: "bhubaneswar", name: "Bhubaneswar", primaryLang: "or", tier: 2 },
  { slug: "visakhapatnam", name: "Visakhapatnam", primaryLang: "te", tier: 2 },
  { slug: "coimbatore", name: "Coimbatore", primaryLang: "ta", tier: 2 },
  // National Hindi/English.
  { slug: "delhi", name: "Delhi", primaryLang: "hi", tier: 1 },
  { slug: "mumbai", name: "Mumbai", primaryLang: "mr", tier: 1 },
  { slug: "jaipur", name: "Jaipur", primaryLang: "hi", tier: 1 },
  { slug: "lucknow", name: "Lucknow", primaryLang: "hi", tier: 2 },
  { slug: "chandigarh", name: "Chandigarh", primaryLang: "pa", tier: 2 },
];

export interface PujaDef {
  slug: string;
  name: string;
  intent: "ceremony" | "remedy" | "offering";
  fromPrice: number;
}

export const PUJAS: PujaDef[] = [
  { slug: "satyanarayan-katha", name: "Satyanarayan Katha", intent: "ceremony", fromPrice: 999 },
  { slug: "griha-pravesh", name: "Griha Pravesh Puja", intent: "ceremony", fromPrice: 1500 },
  { slug: "havan", name: "Havan", intent: "ceremony", fromPrice: 899 },
  { slug: "rudrabhishek", name: "Rudrabhishek", intent: "ceremony", fromPrice: 1100 },
  { slug: "ganesh-puja", name: "Ganesh Puja", intent: "ceremony", fromPrice: 799 },
  { slug: "lakshmi-puja", name: "Lakshmi Puja", intent: "ceremony", fromPrice: 799 },
  { slug: "navagraha-shanti", name: "Navagraha Shanti Puja", intent: "remedy", fromPrice: 1500 },
  { slug: "kaal-sarp-dosh", name: "Kaal Sarp Dosh Nivaran", intent: "remedy", fromPrice: 2100 },
  { slug: "pitru-dosh", name: "Pitru Dosh Nivaran", intent: "remedy", fromPrice: 2100 },
  { slug: "mundan", name: "Mundan Sanskar", intent: "ceremony", fromPrice: 999 },
  { slug: "namkaran", name: "Namkaran Sanskar", intent: "ceremony", fromPrice: 999 },
  { slug: "bhoomi-pujan", name: "Bhoomi Pujan", intent: "ceremony", fromPrice: 1500 },
];

const langByCode = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));

export interface MatrixPage {
  path: string; // /pandit-for/:puja/:city or /:lang/...
  hreflang: string;
  language: LanguageDef;
  city: CityDef;
  puja: PujaDef;
  title: string;
  description: string;
  fromPrice: number;
}

/**
 * Build a programmatic page for a (language, city, puja) triple.
 * URL pattern: /pandit/<contentLang>/<puja-slug>/<city-slug>. NOTE: the shipped
 * generator uses content language (en|hi) for <lang>; this helper currently keys
 * off the regional `language.code` and is kept for the future React route — pass
 * a content-language LanguageDef (en/hi) when wiring it to match deployed URLs.
 */
export function buildMatrixPage(
  language: LanguageDef,
  city: CityDef,
  puja: PujaDef
): MatrixPage {
  const path = `/pandit/${language.code}/${puja.slug}/${city.slug}`;
  const langLabel = language.code === "en" ? "" : `${language.english} `;
  return {
    path,
    hreflang: language.hreflang,
    language,
    city,
    puja,
    fromPrice: puja.fromPrice,
    title: `${langLabel}${language.priest} for ${puja.name} in ${city.name} | Live Verified | ${"PanditJiAtRequest"}`,
    description: `Book a verified ${langLabel}${language.priest} for ${puja.name} in ${city.name}. Live timestamped sankalp on video, transparent pricing from ₹${puja.fromPrice}, and a free consultation before you book.`,
  };
}

/**
 * Wave 1 = highest-priority subset to build & prerender first: each regional
 * metro in its own primary language, for the top ceremonies. This is the list
 * that should be reflected in the sitemap once the pages exist.
 */
export function wave1Pages(topPujas = 4): MatrixPage[] {
  const pujas = PUJAS.slice(0, topPujas);
  const pages: MatrixPage[] = [];
  for (const city of CITIES.filter((c) => c.tier === 1)) {
    const lang = langByCode[city.primaryLang];
    if (!lang) continue;
    for (const puja of pujas) {
      pages.push(buildMatrixPage(lang, city, puja));
    }
  }
  return pages;
}
