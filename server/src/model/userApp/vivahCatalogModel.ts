import { Schema, Model, Document } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";
import LiveMandirPuja from "./liveMandirPujaModel";

/**
 * Vedic Vivah Catalog (SINGLETON)
 * ------------------------------------------------------------------
 * The *pricing* source of truth for the Vedic Vivah Sanskar flow.
 *
 * This document is authored/edited by the SuperAdmin
 * (VedicSuperAdmin → Panditji At Request → "Vedic Vivah Sanskar")
 * and written to the SAME database this app server uses, in the
 * collection `vivah_catalog`. The app only READS it here.
 *
 * Only NAME + PRICE + SAMAGRI PRICE (per ritual), the Sampooran
 * package pricing, and the marriage PACKAGE TIERS live in the DB.
 * All the rich *content* (mantras, descriptions, imagery) is
 * hard-coded in the app frontend and mapped to these rows by `slug`.
 *
 * v2 additions (package-driven Vivah marketplace):
 *   - `packages[]`         → the 3 marriage tiers (₹21k / ₹51k / ₹1.11L)
 *                            with pandit count, coordinator, gifts, perks
 *                            and a per-package advance % override.
 *   - `advancePercent`     → global default advance % (admin-configurable;
 *                            replaces the old hard-coded 50%).
 *   - `crossSellProductIds`→ admin-picked ACTIVE shop products surfaced as
 *                            gifting add-ons across the Vivah journey.
 *
 * v3 additions (muhurat + temple + Kashi):
 *   - gift `description`, `count`, `images[]` → richer package uphaar.
 *   - `muhurats[]`         → admin-authored shubh vivah dates (month/year/date)
 *                            surfaced on the booking form + for pre-booking.
 *   - `temples[]`          → live-darshan temples with a per-temple price
 *                            (paid for single-ritual darshan; FREE inside the
 *                            Raj & Maharaja tiers).
 *   - `kashi`              → the highlighted "invite a Pandit Ji from Kashi"
 *                            section: featured Kashi pandits + a premium add-on
 *                            that is added to the order total when invited.
 */

/** A gift included inside a package (free) — optionally linked to a live shop product. */
export interface IVivahGift {
  title: string;
  image?: string;             // primary image (kept for back-compat)
  images?: string[];          // additional gallery images
  description?: string;       // what the gift is / why it delights
  count?: number;             // how many pieces are included (default 1)
  price?: number;             // display value of the gift ("worth ₹…")
  forWhom?: string;           // "Dulha" | "Dulhan" | "Couple" | "Family" | free text
  ritualSlug?: string;        // elite gifts tied to a major ritual (Maharaja tier)
  shopifyProductId?: string;  // when the admin picks it from the active shop catalog
}

export interface IVivahRitual {
  slug: string;
  name: string;
  price: number;
  samagriPrice: number;
  sortOrder: number;
  isActive: boolean;
}

export interface IVivahSampooran {
  name: string;
  packagePrice: number; // computed from the ritual sum − discount (see loadVivahCatalog)
  samagriPrice: number; // computed from the ritual samagri sum − discount
  discountPercent: number; // flat % off the overall billing (base + samagri)
  items: string[];
  image?: string;
  // Convenience (computed, not persisted): undiscounted sums for "you save" copy
  fullBase?: number;
  fullSamagri?: number;
}

/** A non-product perk of a package (e.g. free temple darshan, dedicated coordinator). */
export interface IVivahPerk {
  icon?: string;              // Ionicons name hint for the app
  title: string;
  description?: string;
}

/** A marriage package tier (Shubh / Raj / Maharaja). */
export interface IVivahPackage {
  packageId: string;          // slug, e.g. "shubh-vivah"
  name: string;               // "Shubh Vivah"
  hindiName?: string;         // "शुभ विवाह"
  tagline?: string;
  badge?: string;             // "Most Popular" | "Elite" | ""
  price: number;              // all-inclusive package price (INR)
  strikePrice?: number;       // anchor price for the savings strike-through
  panditCount: number;        // 1 | 2 | 3
  hasCoordinator: boolean;    // dedicated vivah coordinator included
  includesAllRituals: boolean;
  ritualSlugs: string[];      // used only when includesAllRituals = false
  gifts: IVivahGift[];        // free gifts bundled in this tier
  perks: IVivahPerk[];        // non-product perks
  freeTempleDarshan: boolean; // Maharaja: free darshan at all listed temples
  advancePercent?: number;    // per-package override of the global advance %
  accentColor?: string;       // app card accent, e.g. "#C99A3B"
  image?: string;
  liveTempleDarshan: boolean; // after-marriage live darshan at a temple (streamed)
  templeDarshanCount?: number;// how many temples are free in this tier (0 = none, 1 = pick one, 99 = all)
  seoKeywords?: string[];     // per-tier high-intent keywords for landing/ASO
  sortOrder: number;
  isActive: boolean;
}

/** A shubh vivah muhurat date the admin publishes for families to pick. */
export interface IVivahMuhurat {
  date: string;               // "DD/MM/YYYY" — the auspicious date
  day?: string;               // "Friday"
  month?: string;             // "November"
  year?: number;              // 2026
  tithi?: string;             // "Shukla Ekadashi"
  nakshatra?: string;         // "Rohini"
  note?: string;              // "Highly auspicious — Devshayani season"
  isActive: boolean;
  sortOrder: number;
}

/** A temple offered for after-marriage live darshan (priced for single-ritual bookings). */
export interface IVivahTemple {
  templeId: string;           // slug, e.g. "kashi-vishwanath"
  name: string;               // "Kashi Vishwanath"
  city?: string;              // "Varanasi"
  deity?: string;             // "Lord Shiva"
  image?: string;
  price: number;              // live-darshan seva price (single ritual). Free inside packages.
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

/** A featured Pandit Ji from Kashi (showcase card in the highlighted Kashi section). */
export interface IVivahKashiPandit {
  name: string;               // "Acharya Pt. Rajeshwar Dwivedi"
  photo?: string;
  experienceYears?: number;   // 28
  specialization?: string;    // "Kashi Vishwanath Rudrabhishek & Vivah"
  temple?: string;            // "Kashi Vishwanath, Varanasi"
  languages?: string[];
}

/** The highlighted "invite a Pandit Ji from Kashi" section + its premium pricing. */
export interface IVivahKashi {
  enabled: boolean;           // show the section on the app
  title: string;              // "Invite a Pandit Ji from Kashi"
  hindiName?: string;         // "काशी से पंडित जी"
  description?: string;
  image?: string;
  premiumPrice: number;       // add-on premium ADDED TO TOTAL when a family invites a Kashi pandit
  note?: string;              // "Includes travel, stay & a Ganga Aarti sankalp"
  pandits: IVivahKashiPandit[];
  isActive: boolean;
}

/** SEO / share metadata — feeds landing pages, share cards, ASO & AI search. */
export interface IVivahSeo {
  slug: string;            // e.g. "vedic-vivah-marriage-pandit-booking"
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export interface IVivahCatalog extends Document {
  isActive: boolean;
  rituals: IVivahRitual[];
  sampooranVivah: IVivahSampooran;
  packages: IVivahPackage[];
  muhurats: IVivahMuhurat[];      // admin-published shubh vivah dates
  temples: IVivahTemple[];        // live-darshan temples (priced for single rituals)
  kashi: IVivahKashi;             // highlighted "invite a Kashi Pandit Ji" section
  advancePercent: number;         // global default advance % (booking confirmation)
  crossSellProductIds: string[];  // shopifyProductId[] picked by the admin
  supportedLanguages: string[];   // pan-India ritual languages offered
  seo: IVivahSeo;                 // section-level SEO/share metadata
  createdAt: Date;
  updatedAt?: Date;
}

const ritualSchema = new Schema<IVivahRitual>(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    samagriPrice: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const sampooranSchema = new Schema<IVivahSampooran>(
  {
    name: { type: String, default: "Sampooran Vivah (Complete Package)" },
    packagePrice: { type: Number, default: 0 },
    samagriPrice: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 10 },
    items: { type: [String], default: [] },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const giftSchema = new Schema<IVivahGift>(
  {
    title: { type: String, required: true },
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    description: { type: String, default: "" },
    count: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    forWhom: { type: String, default: "" },
    ritualSlug: { type: String, default: "" },
    shopifyProductId: { type: String, default: "" },
  },
  { _id: false }
);

const perkSchema = new Schema<IVivahPerk>(
  {
    icon: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const packageSchema = new Schema<IVivahPackage>(
  {
    packageId: { type: String, required: true },
    name: { type: String, required: true },
    hindiName: { type: String, default: "" },
    tagline: { type: String, default: "" },
    badge: { type: String, default: "" },
    price: { type: Number, required: true },
    strikePrice: { type: Number, default: 0 },
    panditCount: { type: Number, default: 1 },
    hasCoordinator: { type: Boolean, default: false },
    includesAllRituals: { type: Boolean, default: true },
    ritualSlugs: { type: [String], default: [] },
    gifts: { type: [giftSchema], default: [] },
    perks: { type: [perkSchema], default: [] },
    freeTempleDarshan: { type: Boolean, default: false },
    advancePercent: { type: Number, default: 0 }, // 0 → use the catalog default
    accentColor: { type: String, default: "" },
    image: { type: String, default: "" },
    liveTempleDarshan: { type: Boolean, default: false },
    templeDarshanCount: { type: Number, default: 0 },
    seoKeywords: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const muhuratSchema = new Schema<IVivahMuhurat>(
  {
    date: { type: String, required: true },
    day: { type: String, default: "" },
    month: { type: String, default: "" },
    year: { type: Number, default: 0 },
    tithi: { type: String, default: "" },
    nakshatra: { type: String, default: "" },
    note: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const templeSchema = new Schema<IVivahTemple>(
  {
    templeId: { type: String, required: true },
    name: { type: String, required: true },
    city: { type: String, default: "" },
    deity: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: Number, default: 0 },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const kashiPanditSchema = new Schema<IVivahKashiPandit>(
  {
    name: { type: String, required: true },
    photo: { type: String, default: "" },
    experienceYears: { type: Number, default: 0 },
    specialization: { type: String, default: "" },
    temple: { type: String, default: "" },
    languages: { type: [String], default: [] },
  },
  { _id: false }
);

const kashiSchema = new Schema<IVivahKashi>(
  {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "Invite a Pandit Ji from Kashi" },
    hindiName: { type: String, default: "काशी से पंडित जी" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    premiumPrice: { type: Number, default: 0 },
    note: { type: String, default: "" },
    pandits: { type: [kashiPanditSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const seoSchema = new Schema<IVivahSeo>(
  {
    slug: { type: String, default: "vedic-vivah-marriage-pandit-booking" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    ogImage: { type: String, default: "" },
    canonicalUrl: { type: String, default: "" },
  },
  { _id: false }
);

const vivahCatalogSchema = new Schema<IVivahCatalog>({
  isActive: { type: Boolean, default: true },
  rituals: { type: [ritualSchema], default: [] },
  sampooranVivah: { type: sampooranSchema, default: () => ({}) },
  packages: { type: [packageSchema], default: [] },
  muhurats: { type: [muhuratSchema], default: [] },
  temples: { type: [templeSchema], default: [] },
  kashi: { type: kashiSchema, default: () => ({}) },
  advancePercent: { type: Number, default: 50 },
  crossSellProductIds: { type: [String], default: [] },
  supportedLanguages: { type: [String], default: [] },
  seo: { type: seoSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/**
 * Default seed — kept in sync with VedicSuperAdmin's
 * `vivahSanskar.seed.ts`. Used as an in-memory fallback so the app keeps
 * working (and pricing stays correct) even before the admin has opened
 * the catalog page for the first time.
 */
export const DEFAULT_VIVAH_PACKAGES: IVivahPackage[] = [
  {
    packageId: "shubh-vivah",
    name: "Shubh Vivah",
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
      { title: "Dulha Shagun Set — Safa & Shawl", forWhom: "Dulha", price: 2100, count: 1, description: "A regal safa (turban) and a hand-embroidered shawl for the groom's shagun." },
      { title: "Dulhan Shringar Set", forWhom: "Dulhan", price: 2100, count: 1, description: "A curated 16-shringar essentials box for the bride." },
      { title: "Silver-Finish Pooja Kalash", forWhom: "Couple", price: 1100, count: 1, description: "A silver-finish kalash the couple keeps as a blessing of abundance." },
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
      { title: "Gold-Finish Shagun Thali", forWhom: "Family", ritualSlug: "shagun", price: 3100, count: 1, description: "An ornate gold-finish thali for the family's shagun rasam." },
      { title: "Haldi Ceremony Elite Kit", forWhom: "Couple", ritualSlug: "haldi-ceremony", price: 2500, count: 2, description: "Two premium haldi kits — organic haldi, chandan & marigold for both sides." },
      { title: "Kalash & Mandap Shobha Set", forWhom: "Family", ritualSlug: "mandap-sthapana", price: 5100, count: 1, description: "A complete mandap shobha set to adorn the sacred canopy." },
      { title: "Elite Dulha Vastra Shagun", forWhom: "Dulha", ritualSlug: "vivah-sanskar", price: 5100, count: 1, description: "Premium groom's vastra shagun for the pheras." },
      { title: "Elite Dulhan Shringar & Vastra", forWhom: "Dulhan", ritualSlug: "vivah-sanskar", price: 5100, count: 1, description: "An elite bridal shringar & vastra hamper for the pheras." },
      { title: "Prasad, Chunri & Seva Hamper", forWhom: "Couple", ritualSlug: "mandir-darshan", price: 2100, count: 1, description: "A blessed prasad & chunri hamper for the couple's temple seva." },
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

/** Pan-India ritual languages offered (drives pandit assignment matching). */
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

/**
 * Default shubh vivah muhurats (indicative 2026 dates — the admin edits/verifies
 * these against a pandit-proofed panchang). Surfaced on the booking form so a
 * family can lock an auspicious date now and pre-book a future wedding.
 */
export const DEFAULT_VIVAH_MUHURATS: IVivahMuhurat[] = [
  { date: "16/01/2026", day: "Friday", month: "January", year: 2026, tithi: "Shukla Ashtami", nakshatra: "Uttara Bhadrapada", note: "Auspicious winter muhurat", isActive: true, sortOrder: 1 },
  { date: "23/01/2026", day: "Friday", month: "January", year: 2026, tithi: "Krishna Panchami", nakshatra: "Hasta", note: "Popular winter date", isActive: true, sortOrder: 2 },
  { date: "15/02/2026", day: "Sunday", month: "February", year: 2026, tithi: "Krishna Trayodashi", nakshatra: "Uttara Ashadha", note: "Basant season muhurat", isActive: true, sortOrder: 3 },
  { date: "20/04/2026", day: "Monday", month: "April", year: 2026, tithi: "Shukla Tritiya", nakshatra: "Rohini", note: "Akshaya Tritiya window — highly auspicious", isActive: true, sortOrder: 4 },
  { date: "08/05/2026", day: "Friday", month: "May", year: 2026, tithi: "Krishna Saptami", nakshatra: "Uttara Ashadha", note: "Peak summer muhurat", isActive: true, sortOrder: 5 },
  { date: "12/06/2026", day: "Friday", month: "June", year: 2026, tithi: "Krishna Dwadashi", nakshatra: "Revati", note: "Pre-monsoon auspicious date", isActive: true, sortOrder: 6 },
  { date: "03/07/2026", day: "Friday", month: "July", year: 2026, tithi: "Shukla Trayodashi", nakshatra: "Anuradha", note: "Last muhurat before Chaturmas", isActive: true, sortOrder: 7 },
  { date: "20/11/2026", day: "Friday", month: "November", year: 2026, tithi: "Shukla Ekadashi", nakshatra: "Uttara Ashadha", note: "Devuthani season — very auspicious", isActive: true, sortOrder: 8 },
  { date: "22/11/2026", day: "Sunday", month: "November", year: 2026, tithi: "Shukla Trayodashi", nakshatra: "Shatabhisha", note: "Popular November date", isActive: true, sortOrder: 9 },
  { date: "27/11/2026", day: "Friday", month: "November", year: 2026, tithi: "Krishna Dwitiya", nakshatra: "Rohini", note: "Grand winter wedding date", isActive: true, sortOrder: 10 },
];

/**
 * Default live-darshan temples. `price` applies to a single-ritual live darshan
 * booking; inside the Raj (1 free) and Maharaja (all free) tiers it is complimentary.
 */
export const DEFAULT_VIVAH_TEMPLES: IVivahTemple[] = [
  { templeId: "kashi-vishwanath", name: "Kashi Vishwanath", city: "Varanasi", deity: "Lord Shiva", price: 5100, description: "The couple's first darshan at the eternal city of Kashi.", image: "", isActive: true, sortOrder: 1 },
  { templeId: "mahakaleshwar", name: "Mahakaleshwar Jyotirlinga", city: "Ujjain", deity: "Lord Shiva", price: 5100, description: "Bhasma-aarti blessings for a long, prosperous marriage.", image: "", isActive: true, sortOrder: 2 },
  { templeId: "somnath", name: "Somnath Jyotirlinga", city: "Gujarat", deity: "Lord Shiva", price: 4100, description: "Darshan at the first among the twelve Jyotirlingas.", image: "", isActive: true, sortOrder: 3 },
  { templeId: "siddhivinayak", name: "Siddhivinayak", city: "Mumbai", deity: "Lord Ganesha", price: 3100, description: "Vighnaharta's blessings for an obstacle-free life together.", image: "", isActive: true, sortOrder: 4 },
  { templeId: "tirupati-balaji", name: "Tirupati Balaji", city: "Tirumala", deity: "Lord Venkateshwara", price: 6100, description: "Balaji's darshan for the newlyweds' abundance.", image: "", isActive: true, sortOrder: 5 },
  { templeId: "vaishno-devi", name: "Vaishno Devi", city: "Katra", deity: "Mata Rani", price: 4100, description: "Mata Rani's aashirwad for the new household.", image: "", isActive: true, sortOrder: 6 },
];

/** Default highlighted Kashi section — featured Kashi Pandit Jis + a premium add-on. */
export const DEFAULT_VIVAH_KASHI: IVivahKashi = {
  enabled: true,
  title: "Invite a Pandit Ji from Kashi",
  hindiName: "काशी से पंडित जी",
  description:
    "Have your vivah sanskar performed by a revered Vedacharya from Kashi (Varanasi) — the spiritual heart of Sanatan Dharma. Steeped in the Kashi Vivah Paddhati, they bring the blessings of Baba Vishwanath and the Ganga to your ceremony.",
  image:
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/vivah/kashi-ghat_11zon.png",
  premiumPrice: 21000,
  note: "Premium covers the Kashi Acharya's travel, stay and a special Ganga-Aarti sankalp for the couple. Added to your total when you invite a Kashi Pandit Ji.",
  pandits: [
    { name: "Acharya Pt. Rajeshwar Dwivedi", experienceYears: 28, specialization: "Kashi Vishwanath Rudrabhishek & Vivah Sanskar", temple: "Kashi Vishwanath, Varanasi", languages: ["Hindi", "Sanskrit", "Bhojpuri"], photo: "" },
    { name: "Pt. Omkarnath Tiwari", experienceYears: 22, specialization: "Vedic Vivah & Kashi Ganga Aarti", temple: "Dashashwamedh Ghat, Varanasi", languages: ["Hindi", "Sanskrit"], photo: "" },
    { name: "Pt. Vishwanath Shastri", experienceYears: 35, specialization: "Maithil & Kashi Vivah Paddhati", temple: "Sankat Mochan, Varanasi", languages: ["Hindi", "Sanskrit", "Maithili"], photo: "" },
  ],
  isActive: true,
};

export const DEFAULT_VIVAH_SEO: IVivahSeo = {
  slug: "vedic-vivah-marriage-pandit-booking",
  metaTitle: "Vedic Vivah — Book a Verified Marriage Pandit Ji Online | Pandit Ji At Request",
  metaDescription:
    "Book verified Vedic Pandit Jis for your complete Hindu marriage — Kundali Milan, Muhurat, Haldi, Pheras & after-marriage live temple darshan. Transparent packages from ₹21,000, pan-India, in your language.",
  keywords: [
    "pandit for marriage",
    "wedding pandit near me",
    "vivah pandit booking",
    "online pandit booking",
    "marriage puja package",
    "vivah muhurat 2026",
    "kundali milan for marriage",
    "shaadi ke liye pandit",
    "book pandit for wedding",
    "hindu marriage pandit",
    "vivah sanskar vidhi",
    "wedding pandit in [city]",
  ],
  ogImage:
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/vivah/vivah-banner_11zon.png",
  canonicalUrl: "https://panditjiatrequest.com/vedic-vivah",
};

export const DEFAULT_VIVAH_ADVANCE_PERCENT = 50;

export const DEFAULT_VIVAH_CATALOG: {
  isActive: boolean;
  rituals: IVivahRitual[];
  sampooranVivah: IVivahSampooran;
  packages: IVivahPackage[];
  muhurats: IVivahMuhurat[];
  temples: IVivahTemple[];
  kashi: IVivahKashi;
  advancePercent: number;
  crossSellProductIds: string[];
  supportedLanguages: string[];
  seo: IVivahSeo;
} = {
  isActive: true,
  rituals: [
    { slug: "kundali-milan", name: "Kundali Milan (Guna Milan)", price: 1100, samagriPrice: 0, sortOrder: 1, isActive: true },
    { slug: "vivah-muhoorat", name: "Vivah Muhurat", price: 1100, samagriPrice: 0, sortOrder: 2, isActive: true },
    { slug: "shagun", name: "Shagun / Sagai (Tilak)", price: 5100, samagriPrice: 1500, sortOrder: 3, isActive: true },
    { slug: "ganesh-gauri-puja", name: "Ganesh–Gauri Puja", price: 2100, samagriPrice: 700, sortOrder: 4, isActive: true },
    { slug: "haldi-ceremony", name: "Haldi Ceremony", price: 2100, samagriPrice: 900, sortOrder: 5, isActive: true },
    { slug: "mandap-sthapana", name: "Mandap & Kalash Sthapana", price: 5100, samagriPrice: 2100, sortOrder: 6, isActive: true },
    // Merged step: core ceremony + Saptapadi & Pheras + Vidaai + Griha Pravesh
    { slug: "vivah-sanskar", name: "Vivah Sanskar — Complete Ceremony", price: 25400, samagriPrice: 8000, sortOrder: 7, isActive: true },
    { slug: "mandir-darshan", name: "Mandir Darshan", price: 3100, samagriPrice: 700, sortOrder: 8, isActive: true },
    // After-marriage LIVE temple darshan (streamed) — the newlyweds' first blessings.
    { slug: "post-vivah-live-darshan", name: "After-Marriage Live Temple Darshan", price: 2100, samagriPrice: 300, sortOrder: 9, isActive: true },
  ],
  sampooranVivah: {
    name: "Sampooran Vivah (Complete Package)",
    packagePrice: 0, // computed = sum(base) − discount%
    samagriPrice: 0, // computed = sum(samagri) − discount%
    discountPercent: 10,
    items: [
      "Every Vedic ritual — Kundali Milan to Mandir Darshan",
      "Verified Vedic Pandit Ji for the full ceremony",
      "Muhurat & Kundali guidance",
      "End-to-end coordination & support",
      "Flat 10% off your overall billing",
    ],
    image: "",
  },
  packages: DEFAULT_VIVAH_PACKAGES,
  muhurats: DEFAULT_VIVAH_MUHURATS,
  temples: DEFAULT_VIVAH_TEMPLES,
  kashi: DEFAULT_VIVAH_KASHI,
  advancePercent: DEFAULT_VIVAH_ADVANCE_PERCENT,
  crossSellProductIds: [],
  supportedLanguages: DEFAULT_VIVAH_LANGUAGES,
  seo: DEFAULT_VIVAH_SEO,
};

const VivahCatalog: Model<IVivahCatalog> =
  panditJiAtRequestMongooose.model<IVivahCatalog>(
    "VivahCatalog",
    vivahCatalogSchema,
    "vivah_catalog"
  );

export type NormalisedCatalog = {
  isActive: boolean;
  ritualMap: Record<string, IVivahRitual>;
  rituals: IVivahRitual[];
  sampooranVivah: IVivahSampooran;
  packages: IVivahPackage[];
  packageMap: Record<string, IVivahPackage>;
  muhurats: IVivahMuhurat[];
  temples: IVivahTemple[];
  templeMap: Record<string, IVivahTemple>;
  kashi: IVivahKashi;
  advancePercent: number;
  crossSellProductIds: string[];
  supportedLanguages: string[];
  seo: IVivahSeo;
};

/** Loose key for matching the same mandir written two different ways. */
const templeKey = (v?: string) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const templeSlug = (v?: string) =>
  String(v || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * The mandirs the admin added under **Live Darshan**, shaped as vivah temples.
 *
 * These rows live in `liveMandirPujas` and already drive the Live Mandir pages;
 * this is what makes them reachable from Vedic Vivah too, so a mandir only has
 * to be added once.
 *
 * A mandir can host several live pujas, but the vivah picker chooses a MANDIR,
 * not a puja — so rows are grouped by temple name. The representative row is
 * the CHEAPEST active puja at that mandir, which keeps the wedding darshan
 * add-on from ever costing more than booking the same darshan directly.
 *
 * Never throws: a mandir list that fails to load must not take the whole
 * pricing catalog down with it.
 */
const loadLiveDarshanTemples = async (): Promise<IVivahTemple[]> => {
  let rows: any[] = [];
  try {
    rows = await LiveMandirPuja.find({ isActive: true })
      .select("templeName templeLocation deity image price sortOrder createdAt")
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
  } catch {
    return [];
  }

  const byTemple = new Map<string, IVivahTemple>();
  for (const r of rows) {
    const name = String(r?.templeName || "").trim();
    const key = templeKey(name);
    if (!name || !key) continue;

    const price = Number(r?.price) || 0;
    const existing = byTemple.get(key);
    // Map keeps the first insertion's position, so a cheaper puja replaces the
    // entry without reshuffling the admin's ordering.
    if (existing && existing.price <= price) continue;

    const city = String(r?.templeLocation || "").trim();
    byTemple.set(key, {
      templeId: templeSlug(name),
      name,
      city,
      deity: String(r?.deity || "").trim(),
      image: String(r?.image || "").trim(),
      price,
      description: `Live darshan seva at ${name}${city ? `, ${city}` : ""}.`,
      isActive: true,
      sortOrder: 0, // re-numbered once both sources are merged
    });
  }

  return Array.from(byTemple.values()).filter((t) => t.templeId);
};

/**
 * Read the singleton catalog (falls back to the default seed if the
 * admin hasn't created it yet). Never throws on "missing" — always
 * returns a usable, normalised catalog.
 */
export const loadVivahCatalog = async (): Promise<NormalisedCatalog> => {
  let doc: IVivahCatalog | null = null;
  try {
    doc = await VivahCatalog.findOne().sort({ createdAt: 1 }).lean<IVivahCatalog>();
  } catch (e) {
    // fall through to default
  }

  // Use the admin's saved document whenever it EXISTS, then fall back to the seed
  // PER FIELD — so an admin doc that has packages but (say) empty rituals still
  // surfaces its packages instead of being ignored wholesale.
  const source: any = doc || DEFAULT_VIVAH_CATALOG;

  const ritualsRaw =
    Array.isArray(source.rituals) && source.rituals.length
      ? source.rituals
      : DEFAULT_VIVAH_CATALOG.rituals;

  const rituals = (ritualsRaw as IVivahRitual[])
    .filter((r) => r && r.slug)
    .slice()
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const ritualMap: Record<string, IVivahRitual> = {};
  for (const r of rituals) ritualMap[r.slug] = r;

  // ── Compute the "add all" package pricing: sum of every active ritual,
  //    minus a flat discount on the overall billing (base + samagri). ──
  const activeRituals = rituals.filter((r) => r.isActive !== false);
  const fullBase = activeRituals.reduce((s, r) => s + (r.price || 0), 0);
  const fullSamagri = activeRituals.reduce((s, r) => s + (r.samagriPrice || 0), 0);
  const rawPkg = source.sampooranVivah || DEFAULT_VIVAH_CATALOG.sampooranVivah;
  const discountPercent = Math.min(100, Math.max(0, Number(rawPkg.discountPercent ?? 10)));
  const factor = 1 - discountPercent / 100;

  const sampooranVivah: IVivahSampooran = {
    name: rawPkg.name || "Sampooran Vivah (Complete Package)",
    discountPercent,
    packagePrice: Math.round(fullBase * factor),
    samagriPrice: Math.round(fullSamagri * factor),
    items: rawPkg.items || [],
    image: rawPkg.image || "",
    fullBase,
    fullSamagri,
  };

  // ── Marriage package tiers. Fall back to the default 3 tiers when the
  //    admin hasn't authored any yet (schema-less older docs included). ──
  const rawPackages =
    Array.isArray((source as any).packages) && (source as any).packages.length
      ? ((source as any).packages as IVivahPackage[])
      : DEFAULT_VIVAH_PACKAGES;

  const packages = rawPackages
    .filter((p) => p && p.packageId && p.isActive !== false)
    .slice()
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const packageMap: Record<string, IVivahPackage> = {};
  for (const p of packages) packageMap[p.packageId] = p;

  // ── Shubh muhurat dates (admin-authored; fall back to indicative defaults). ──
  const rawMuhurats =
    Array.isArray((source as any).muhurats) && (source as any).muhurats.length
      ? ((source as any).muhurats as IVivahMuhurat[])
      : DEFAULT_VIVAH_MUHURATS;
  const muhurats = rawMuhurats
    .filter((m) => m && m.date && m.isActive !== false)
    .slice()
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // ── Live-darshan temples. Two admin sources feed the mandir picker:
  //
  //   1. Temples authored inside the Vivah Sanskar catalog itself.
  //   2. Mandirs added under Live Darshan — see loadLiveDarshanTemples above.
  //
  // Catalog entries come first and win a tie, because their price and copy
  // were written for a wedding darshan specifically. The bundled samples are a
  // last resort only: the moment EITHER real source has a row they are dropped,
  // so the picker never mixes real mandirs with demo ones.
  // Read from `doc`, NOT `source`: `source` falls back to DEFAULT_VIVAH_CATALOG,
  // which carries the sample temples — treating those as "authored" would pin the
  // samples in place forever on an install where the admin never saved the vivah
  // catalog at all, which is exactly the case this change exists to fix.
  const authoredTemples = (
    doc && Array.isArray((doc as any).temples) ? ((doc as any).temples as IVivahTemple[]) : []
  )
    .filter((t) => t && t.templeId && t.isActive !== false)
    .slice()
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const darshanTemples = await loadLiveDarshanTemples();

  const seenTemple = new Set<string>();
  const mergedTemples: IVivahTemple[] = [];
  for (const t of [...authoredTemples, ...darshanTemples]) {
    // The same mandir can exist in both places — match on either the slug or
    // the name, since the two are typed independently.
    const keys = [templeKey(t.templeId), templeKey(t.name)].filter(Boolean);
    if (!keys.length || keys.some((k) => seenTemple.has(k))) continue;
    for (const k of keys) seenTemple.add(k);
    mergedTemples.push({ ...t, sortOrder: mergedTemples.length + 1 });
  }

  const temples = mergedTemples.length
    ? mergedTemples
    : DEFAULT_VIVAH_TEMPLES.filter((t) => t && t.templeId && t.isActive !== false)
        .slice()
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const templeMap: Record<string, IVivahTemple> = {};
  for (const t of temples) templeMap[t.templeId] = t;

  // ── Highlighted Kashi section (admin-authored; fall back to default). ──
  const rawKashi = (source as any).kashi;
  const kashi: IVivahKashi =
    rawKashi && typeof rawKashi === "object" && (rawKashi.title || rawKashi.premiumPrice)
      ? {
          enabled: rawKashi.enabled !== false,
          title: rawKashi.title || DEFAULT_VIVAH_KASHI.title,
          hindiName: rawKashi.hindiName || DEFAULT_VIVAH_KASHI.hindiName,
          description: rawKashi.description || DEFAULT_VIVAH_KASHI.description,
          image: rawKashi.image || DEFAULT_VIVAH_KASHI.image,
          premiumPrice: Number(rawKashi.premiumPrice) || DEFAULT_VIVAH_KASHI.premiumPrice,
          note: rawKashi.note || DEFAULT_VIVAH_KASHI.note,
          pandits: Array.isArray(rawKashi.pandits) ? rawKashi.pandits : DEFAULT_VIVAH_KASHI.pandits,
          isActive: rawKashi.isActive !== false,
        }
      : DEFAULT_VIVAH_KASHI;

  const advancePercentRaw = Number((source as any).advancePercent);
  const advancePercent =
    Number.isFinite(advancePercentRaw) && advancePercentRaw > 0 && advancePercentRaw <= 100
      ? Math.round(advancePercentRaw)
      : DEFAULT_VIVAH_ADVANCE_PERCENT;

  const crossSellProductIds = Array.isArray((source as any).crossSellProductIds)
    ? ((source as any).crossSellProductIds as string[]).filter(Boolean)
    : [];

  const supportedLanguages =
    Array.isArray((source as any).supportedLanguages) && (source as any).supportedLanguages.length
      ? ((source as any).supportedLanguages as string[]).filter(Boolean)
      : DEFAULT_VIVAH_LANGUAGES;

  const rawSeo = (source as any).seo || {};
  const seo: IVivahSeo = {
    slug: rawSeo.slug || DEFAULT_VIVAH_SEO.slug,
    metaTitle: rawSeo.metaTitle || DEFAULT_VIVAH_SEO.metaTitle,
    metaDescription: rawSeo.metaDescription || DEFAULT_VIVAH_SEO.metaDescription,
    keywords:
      Array.isArray(rawSeo.keywords) && rawSeo.keywords.length
        ? rawSeo.keywords.filter(Boolean)
        : DEFAULT_VIVAH_SEO.keywords,
    ogImage: rawSeo.ogImage || DEFAULT_VIVAH_SEO.ogImage,
    canonicalUrl: rawSeo.canonicalUrl || DEFAULT_VIVAH_SEO.canonicalUrl,
  };

  return {
    isActive: source.isActive !== false,
    ritualMap,
    rituals,
    sampooranVivah,
    packages,
    packageMap,
    muhurats,
    temples,
    templeMap,
    kashi,
    advancePercent,
    crossSellProductIds,
    supportedLanguages,
    seo,
  };
};

/** Effective advance % for a booking: package override → catalog default. */
export const effectiveAdvancePercent = (
  catalog: NormalisedCatalog,
  pkg?: IVivahPackage | null
): number => {
  const p = Number(pkg?.advancePercent);
  if (Number.isFinite(p) && p > 0 && p <= 100) return Math.round(p);
  return catalog.advancePercent;
};

export default VivahCatalog;
