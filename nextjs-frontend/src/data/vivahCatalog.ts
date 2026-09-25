/**
 * Vedic Vivah — catalog types, local fallbacks and the merge helpers.
 * ============================================================================
 * The website reads the SAME admin-managed catalog the app reads
 * (`GET /bookings/vedic-vivah/catalog`, backed by the `vivah_catalog`
 * collection edited in VedicSuperAdmin). Prices are NEVER decided here — the
 * server re-prices everything from the catalog on create-lead / create-order.
 * The defaults below exist only so the page paints instantly and still works
 * if the catalog request fails, exactly like the app does.
 *
 * Ported from the app's `pages/VivahSanskar.tsx` + `vivahContent.ts` so both
 * clients fold, order and label rituals identically.
 */

import {
  getVivahContent,
  type MantraBlock,
  type RitualContent,
  type SaptapadiStep,
  type CatalogMuhurat,
  type VivahTemple,
  type VivahKashi,
  DEFAULT_VIVAH_CATALOG,
  DEFAULT_VIVAH_MUHURATS,
  DEFAULT_VIVAH_TEMPLES,
  DEFAULT_VIVAH_KASHI,
} from "./vivahContent";
import { money } from "../utils/currency";

export type { CatalogMuhurat, VivahTemple, VivahKashi, MantraBlock, SaptapadiStep };

/* ========================================================================== */
/*                                   TYPES                                    */
/* ========================================================================== */

export type CatalogRitual = {
  slug: string;
  name: string;
  price: number;
  samagriPrice: number;
  sortOrder?: number;
  isActive?: boolean;
};

export type CatalogSampooran = {
  name: string;
  packagePrice: number;
  samagriPrice: number;
  discountPercent: number;
  items?: string[];
  image?: string;
  fullBase?: number;
  fullSamagri?: number;
};

export type VivahGift = {
  title: string;
  image?: string;
  images?: string[];
  description?: string;
  count?: number;
  price?: number;
  forWhom?: string;
  ritualSlug?: string;
  shopifyProductId?: string;
};

export type VivahPerk = { icon?: string; title: string; description?: string };

export type VivahPackage = {
  packageId: string;
  name: string;
  hindiName?: string;
  tagline?: string;
  badge?: string;
  price: number;
  strikePrice?: number;
  panditCount: number;
  hasCoordinator: boolean;
  includesAllRituals: boolean;
  ritualSlugs: string[];
  gifts: VivahGift[];
  perks: VivahPerk[];
  freeTempleDarshan: boolean;
  advancePercent?: number;
  accentColor?: string;
  image?: string;
  liveTempleDarshan: boolean;
  templeDarshanCount?: number;
  seoKeywords?: string[];
  sortOrder?: number;
  isActive?: boolean;
};

export type CrossSellProduct = {
  shopifyProductId: string;
  title: string;
  handle?: string;
  image?: string;
  price: number;
  compareAtPrice?: number;
};

export type VivahSeo = {
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
};

export type VivahCatalog = {
  rituals?: CatalogRitual[];
  sampooranVivah?: CatalogSampooran;
  packages?: VivahPackage[];
  muhurats?: CatalogMuhurat[];
  temples?: VivahTemple[];
  kashi?: VivahKashi;
  advancePercent?: number;
  crossSellProducts?: CrossSellProduct[];
  supportedLanguages?: string[];
  seo?: VivahSeo;
};

/** The merged shape the ritual timeline + drawer render from. */
export type Ritual = {
  id: string;
  slug: string;
  step: number;
  titleEng: string;
  titleHindi: string;
  transliteration: string;
  subtitle: string;
  image: string | null; // medallion artwork (null → render the emoji)
  emoji: string;
  journeyDesc: string;
  price: number | null;
  samagriPrice: number;
  shortDesc: string;
  description: string;
  rituals: string[];
  significance: string;
  color: string;
  mantra?: MantraBlock;
  saptapadi?: SaptapadiStep[];
  friendshipVow?: MantraBlock;
  part: RitualContent["part"];
  /** Set when this card folds several catalog rituals (the Core Ceremony). */
  componentSlugs?: string[];
};

/* ========================================================================== */
/*                                  IMAGERY                                   */
/* ========================================================================== */

const CDN = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request";

export const VIVAH_IMG = {
  banner: `${CDN}/vivah/vivah-banner_11zon.png`,
  kundali: `${CDN}/vivah/kundali-milan_11zon.png`,
  muhurat: `${CDN}/vivah/vivah-muhurat_11zon.png`,
  shagun: `${CDN}/vivah/shagun_11zon.png`,
  sanskaar: `${CDN}/vivah/vivah-sanskaar_11zon.png`,
  mandir: `${CDN}/vivah/mandir-darshan_11zon.png`,
  packageBg: `${CDN}/vivah/package-bg_11zon.png`,
  packageKalash: `${CDN}/vivah/package-kalash_11zon.png`,
  consultBg: `${CDN}/vivah/consult-bg_11zon.png`,
  consultDiya: `${CDN}/vivah/consult-diya_11zon.png`,
  knowBooks: `${CDN}/vivah/know-books_11zon.png`,
  ritualModalBg: `${CDN}/vivah/ritual-modal-bg_11zon.png`,
  kashiGhat: `${CDN}/vivah/kashi-ghat_11zon.png`,
  panditPlaceholder: `${CDN}/user_placeholder.png`,
};

/** Only these five rituals ship medallion artwork; the rest render an emoji. */
const RITUAL_IMAGE: Record<string, string> = {
  "kundali-milan": VIVAH_IMG.kundali,
  "vivah-muhoorat": VIVAH_IMG.muhurat,
  shagun: VIVAH_IMG.shagun,
  "vivah-sanskar": VIVAH_IMG.sanskaar,
  "mandir-darshan": VIVAH_IMG.mandir,
};

/* ========================================================================== */
/*                          LOCAL FALLBACK PACKAGES                           */
/* ========================================================================== */

/**
 * Mirrors the server's `DEFAULT_VIVAH_PACKAGES`. Used as instant paint-before-
 * fetch state and as the offline fallback, so the three tiers and their prices
 * always render. A live catalog REPLACES these.
 */
export const DEFAULT_VIVAH_PACKAGES: VivahPackage[] = [
  {
    packageId: "shubh-vivah",
    name: "Shubh Vivah111",
    hindiName: "शुभ विवाह",
    tagline: "Every sacred ritual, one dedicated Pandit Ji",
    badge: "",
    price: 21000,
    strikePrice: 25100,
    panditCount: 1,
    hasCoordinator: false,
    includesAllRituals: true,
    ritualSlugs: [],
    gifts: [],
    perks: [
      { icon: "shield-checkmark", title: "1 Verified Vedic Pandit Ji", description: "Performs every ritual — Kundali Milan to Mandir Darshan" },
      { icon: "flower", title: "All Vivah rituals included", description: "Complete shastra-sammat vidhi, start to finish" },
      { icon: "book", title: "Muhurat & Kundali guidance", description: "Auspicious date and guna-milan support" },
      { icon: "logo-whatsapp", title: "WhatsApp updates at every step", description: "Reminders before every ritual and updates after" },
      { icon: "videocam", title: "After-marriage LIVE temple darshan", description: "A streamed darshan for the new couple's blessings" },
    ],
    freeTempleDarshan: false,
    advancePercent: 0,
    accentColor: "#E25800",
    image: "",
    liveTempleDarshan: true,
    templeDarshanCount: 0,
    seoKeywords: ["pandit for marriage", "vivah pandit booking", "wedding pandit near me", "shaadi ke liye pandit"],
    sortOrder: 1,
    isActive: true,
  },
  {
    packageId: "raj-vivah",
    name: "Raj Vivah",
    hindiName: "राज विवाह",
    tagline: "Two Pandit Jis, grander vidhi & shagun gifts",
    badge: "Most Popular",
    price: 51000,
    strikePrice: 61000,
    panditCount: 2,
    hasCoordinator: false,
    includesAllRituals: true,
    ritualSlugs: [],
    gifts: [
      { title: "Dulha Shagun Set — Safa & Shawl", forWhom: "Dulha", price: 2100, count: 1, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/vivah/vivah-sanskaar_11zon.png", description: "A regal safa (turban) and a hand-embroidered shawl for the groom's shagun." },
      { title: "Dulhan Shringar Set", forWhom: "Dulhan", price: 2100, count: 1, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/vivah/shagun_11zon.png", description: "A curated 16-shringar essentials box for the bride." },
      { title: "Silver-Finish Pooja Kalash", forWhom: "Couple", price: 1100, count: 1, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/vivah/package-kalash_11zon.png", description: "A silver-finish kalash the couple keeps as a blessing of abundance." },
    ],
    perks: [
      { icon: "people", title: "2 Verified Vedic Pandit Jis", description: "Mukhya Acharya + Sahayak for a seamless, grander ceremony" },
      { icon: "flower", title: "All Vivah rituals included", description: "Complete shastra-sammat vidhi, start to finish" },
      { icon: "gift", title: "3 Shagun gifts included", description: "For the Dulha, the Dulhan and the couple" },
      { icon: "book", title: "Muhurat & Kundali guidance", description: "Auspicious date and guna-milan support" },
      { icon: "business", title: "1 FREE live temple darshan", description: "Pick any listed temple for the couple's darshan" },
      { icon: "logo-whatsapp", title: "Priority WhatsApp support", description: "Reminders before every ritual and updates after" },
      { icon: "videocam", title: "After-marriage LIVE temple darshan", description: "A streamed darshan for the new couple's blessings" },
    ],
    freeTempleDarshan: false,
    advancePercent: 0,
    accentColor: "#C99A3B",
    image: "",
    liveTempleDarshan: true,
    templeDarshanCount: 1,
    seoKeywords: ["2 pandit wedding package", "vivah sanskar booking", "marriage puja with gifts", "raj vivah package"],
    sortOrder: 2,
    isActive: true,
  },
  {
    packageId: "maharaja-vivah",
    name: "Maharaja Vivah",
    hindiName: "महाराजा विवाह",
    tagline: "Three Pandit Jis, dedicated coordinator & elite uphaar",
    badge: "Elite",
    price: 111000,
    strikePrice: 131000,
    panditCount: 3,
    hasCoordinator: true,
    includesAllRituals: true,
    ritualSlugs: [],
    gifts: [
      { title: "Gold-Finish Shagun Thali", forWhom: "Family", ritualSlug: "shagun", price: 3100, count: 1, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/vivah/shagun_11zon.png", description: "An ornate gold-finish thali for the family's shagun rasam." },
      { title: "Haldi Ceremony Elite Kit", forWhom: "Couple", ritualSlug: "haldi-ceremony", price: 2500, count: 2, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/vivah/vivah-sanskaar_11zon.png", description: "Two premium haldi kits — organic haldi, chandan & marigold for both sides." },
      { title: "Kalash & Mandap Shobha Set", forWhom: "Family", ritualSlug: "mandap-sthapana", price: 5100, count: 1, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/vivah/package-kalash_11zon.png", description: "A complete mandap shobha set to adorn the sacred canopy." },
      { title: "Elite Dulha Vastra Shagun", forWhom: "Dulha", ritualSlug: "vivah-sanskar", price: 5100, count: 1, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/vivah/vivah-sanskaar_11zon.png", description: "Premium groom's vastra shagun for the pheras." },
      { title: "Elite Dulhan Shringar & Vastra", forWhom: "Dulhan", ritualSlug: "vivah-sanskar", price: 5100, count: 1, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/vivah/shagun_11zon.png", description: "An elite bridal shringar & vastra hamper for the pheras." },
      { title: "Prasad, Chunri & Seva Hamper", forWhom: "Couple", ritualSlug: "mandir-darshan", price: 2100, count: 1, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/vivah/mandir-darshan_11zon.png", description: "A blessed prasad & chunri hamper for the couple's temple seva." },
    ],
    perks: [
      { icon: "people", title: "3 Verified Vedic Pandit Jis", description: "Senior Vedacharya-led sampoorna ritual team" },
      { icon: "ribbon", title: "Dedicated Vivah Coordinator", description: "One person owns your entire ceremony, end to end" },
      { icon: "gift", title: "Elite gifts on every major ritual", description: "Curated uphaar across 5–6 major rituals" },
      { icon: "business", title: "FREE darshan at all listed temples", description: "Complimentary darshan seva for the new couple" },
      { icon: "flower", title: "All Vivah rituals included", description: "Complete shastra-sammat vidhi, start to finish" },
      { icon: "call", title: "24×7 priority concierge", description: "WhatsApp + call support for the whole family" },
      { icon: "videocam", title: "After-marriage LIVE temple darshan", description: "Streamed darshan at a jyotirlinga/major temple for the couple" },
    ],
    freeTempleDarshan: true,
    advancePercent: 0,
    accentColor: "#7A1E1E",
    image: "",
    liveTempleDarshan: true,
    templeDarshanCount: 99,
    seoKeywords: ["premium wedding pandit", "3 pandit vivah package", "elite marriage ceremony", "destination wedding pandit"],
    sortOrder: 3,
    isActive: true,
  },
];

/** Pan-India ritual languages offered (mirrors the server default). */
export const DEFAULT_VIVAH_LANGUAGES = [
  "Hindi",
  "Sanskrit",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Odia",
  "Maithili",
  "Bhojpuri",
  "Rajasthani/Marwari",
  "Konkani",
  "Assamese",
];

export const DEFAULT_ADVANCE_PERCENT = 50;

export {
  DEFAULT_VIVAH_CATALOG,
  DEFAULT_VIVAH_MUHURATS,
  DEFAULT_VIVAH_TEMPLES,
  DEFAULT_VIVAH_KASHI,
};

/* ========================================================================== */
/*                              MERGE / FOLD LOGIC                            */
/* ========================================================================== */

/** Merge one catalog row (or bare slug) with the curated content. */
export const mergeRitual = (
  slug: string,
  step: number,
  catalog?: { name?: string; price?: number; samagriPrice?: number }
): Ritual => {
  const content = getVivahContent(slug);
  return {
    id: slug,
    slug,
    step,
    titleEng: catalog?.name || content.titleEng,
    titleHindi: content.titleHindi,
    transliteration: content.transliteration,
    subtitle: content.subtitle,
    image: RITUAL_IMAGE[slug] ?? null,
    emoji: content.icon,
    journeyDesc: content.microLine,
    price: catalog?.price ?? null,
    samagriPrice: catalog?.samagriPrice ?? 0,
    shortDesc: content.microLine,
    description: content.whatHappens,
    rituals: content.includes ?? [],
    significance: content.significance,
    color: content.color,
    mantra: content.mantra,
    saptapadi: content.saptapadi,
    friendshipVow: content.friendshipVow,
    part: content.part,
  };
};

/**
 * Fold every ritual from position 7 onward into a single
 * "Vivah Sanskar (Core Ceremony)" card. Prices/samagri are summed and the
 * underlying slugs are kept in `componentSlugs` so the server still bills each
 * folded ritual individually — the display merges, the booking stays accurate.
 */
const FOLD_FROM_INDEX = 6; // 0-based → 7th ritual and beyond

export const foldCoreCeremony = (list: Ritual[]): Ritual[] => {
  if (list.length <= FOLD_FROM_INDEX + 1) return list;
  const head = list.slice(0, FOLD_FROM_INDEX);
  const tail = list.slice(FOLD_FROM_INDEX);

  const base = getVivahContent("vivah-sanskar");
  const merged: Ritual = {
    id: "vivah-sanskar",
    slug: "vivah-sanskar",
    step: FOLD_FROM_INDEX + 1,
    titleEng: "Vivah Sanskar (Core Ceremony)",
    titleHindi: base.titleHindi,
    transliteration: base.transliteration,
    subtitle: base.subtitle,
    image: RITUAL_IMAGE["vivah-sanskar"] ?? null,
    emoji: base.icon,
    journeyDesc: base.microLine,
    price: tail.reduce((s, r) => s + (r.price ?? 0), 0),
    samagriPrice: tail.reduce((s, r) => s + (r.samagriPrice ?? 0), 0),
    shortDesc: base.microLine,
    description: base.whatHappens,
    rituals: tail.flatMap((r) => [r.titleEng, ...(r.rituals || [])]),
    significance: base.significance,
    color: base.color,
    mantra: base.mantra,
    saptapadi: base.saptapadi,
    friendshipVow: base.friendshipVow,
    part: base.part,
    componentSlugs: tail.map((r) => r.slug),
  };
  return [...head, merged];
};

/**
 * The Vivah journey used to fold rituals 7+ into a single "Core Ceremony"
 * card, which meant the admin could save 8 (or 12) rituals and the site would
 * forever show 7 — reported as "only 7 are being fetched". Every active
 * ritual now renders as its own medallion; the fold helper is kept exported
 * only so nothing that imported it breaks.
 */
const unfolded = (list: Ritual[]): Ritual[] => list;

/** Build the ordered, merged ritual list from a catalog shape (live or default). */
export const buildRitualsFromCatalog = (catalog: { rituals?: any[] }): Ritual[] =>
  unfolded(
    (catalog.rituals || [])
      .filter((r: any) => r?.isActive !== false)
      .slice()
      .sort((a: any, b: any) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0))
      .map((r: any, i: number) =>
        mergeRitual(r.slug, i + 1, { name: r.name, price: r.price, samagriPrice: r.samagriPrice })
      )
  );

/* ========================================================================== */
/*                                  HELPERS                                   */
/* ========================================================================== */

/** ₹ with Indian digit grouping and no decimals — e.g. ₹1,11,000. */
export const fmtINR = (n: number | null | undefined) =>
  `${money(Number(n || 0))}`;

/** Effective advance % for a package: tier override → catalog default. */
export const effectiveAdvancePercent = (
  catalogPercent: number | undefined,
  pkg?: VivahPackage | null
): number => {
  const p = Number(pkg?.advancePercent);
  if (Number.isFinite(p) && p > 0 && p <= 100) return Math.round(p);
  const c = Number(catalogPercent);
  return Number.isFinite(c) && c > 0 && c <= 100 ? Math.round(c) : DEFAULT_ADVANCE_PERCENT;
};

/** The advance payable now — same formula the server uses. */
export const advanceOf = (total: number, percent: number) =>
  Math.min(total, Math.max(1, Math.round((total * percent) / 100)));

/**
 * Raj & Maharaja tiers include the live temple darshan. Mirrors the server's
 * `freeTempleDarshan || templeDarshanCount > 0` rule so the price the family
 * sees matches the price the server charges.
 */
export const templeIsFreeInTier = (pkg?: VivahPackage | null) =>
  !!pkg && (pkg.freeTempleDarshan === true || (pkg.templeDarshanCount || 0) > 0);

/** "20/11/2026" → a Date (or null). */
export const parseDDMMYYYY = (s?: string): Date | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || "").trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
};

/** A Date → "DD/MM/YYYY" (the wire format the server expects). */
export const toDDMMYYYY = (d?: Date | null): string => {
  if (!d || isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/** An <input type="date"> value ("YYYY-MM-DD") → "DD/MM/YYYY". */
export const isoToDDMMYYYY = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "").trim());
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

/** "DD/MM/YYYY" → an <input type="date"> value ("YYYY-MM-DD"). */
export const ddmmyyyyToIso = (v: string): string => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(v || "").trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};
