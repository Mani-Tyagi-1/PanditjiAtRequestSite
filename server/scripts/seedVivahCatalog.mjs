/**
 * Vedic Vivah — diagnose & seed the catalog + gift products.
 * ============================================================================
 * WHY THIS EXISTS
 * The Vivah pages read `GET /bookings/vedic-vivah/catalog`, which serves the
 * singleton `vivah_catalog` document. This script puts the full catalog there
 * (and the gift products it references) so the pages render DB data instead of
 * their bundled fallbacks.
 *
 * TARGETS — this project talks to more than one database, so the script
 * resolves each server's URI exactly the way that server does:
 *
 *   --target=site      PanditjiAtRequestSite/server
 *                      .env, then .env.dev / .env.production per MODE
 *   --target=app       RahulPanditJiAtRequest/server
 *                      .env, then .env.<NODE_ENV> (production by default)
 *   --target=app-dev   the app's .env.development cluster
 *   --target=all       every DISTINCT database found across the above
 *   --uri="mongodb+srv://…"   an explicit connection string
 *
 * Default target is `site`.
 *
 * MODES
 *   (default)   diagnose, then fill ONLY missing/empty fields; muhurats and
 *               product ids are UNIONed, so admin-entered values always win
 *   --force     overwrite every catalog field with the seed
 *   --verify    diagnose only, write nothing
 *
 * It always prints which host/db it connected to, every document in
 * `vivah_catalog`, and WHICH ONE the API will actually read — the API uses
 * `findOne().sort({ createdAt: 1 })`, i.e. the OLDEST document, so a stale
 * legacy doc silently wins over a newer one. That is the single most common
 * reason seeded data "doesn't show up".
 *
 * Run from server/:
 *   npm run seed:vivah                 # site DB, fill gaps
 *   npm run seed:vivah -- --verify     # look, change nothing
 *   npm run seed:vivah -- --force      # overwrite
 *   npm run seed:vivah -- --target=all # every distinct DB
 *
 * Credentials are read from the .env files and never printed.
 */
import mongoose from "mongoose";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* ── CLI ─────────────────────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const flag = (name) => {
  const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : true;
};
const FORCE = !!flag("force");
const VERIFY_ONLY = !!flag("verify");
const TARGET = String(flag("target") || "site").toLowerCase();
const EXPLICIT_URI = typeof flag("uri") === "string" ? flag("uri") : "";

/* ── env resolution: mirror each server's own cascade ────────────────────── */
const here = dirname(fileURLToPath(import.meta.url));
const serverRoot = resolve(here, "..");                 // <repo>/server
const siteRoot = serverRoot;                            // we live in the site server
const appRoot = resolve(serverRoot, "../../RahulPanditJiAtRequest/server");

const readVar = (file, key) => {
  try {
    const line = readFileSync(file, "utf8")
      .split("\n")
      .find((l) => l.trim().startsWith(`${key}=`));
    if (!line) return "";
    return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
};

/** The site server: .env for MODE, then .env.dev / .env.production overrides. */
const siteUri = () => {
  const base = join(siteRoot, ".env");
  const mode = (readVar(base, "MODE") || "development").toLowerCase();
  const specific = join(siteRoot, mode === "production" ? ".env.production" : ".env.dev");
  // The specific file overrides, but only if it exists AND defines the key.
  return (existsSync(specific) && readVar(specific, "MONGO_URI")) || readVar(base, "MONGO_URI");
};

/** The app server: .env for NODE_ENV, then .env.<NODE_ENV> overrides. */
const appUri = (forceEnv) => {
  const base = join(appRoot, ".env");
  const env = (forceEnv || readVar(base, "NODE_ENV") || "development").toLowerCase();
  const specific = join(appRoot, `.env.${env}`);
  return (existsSync(specific) && readVar(specific, "MONGO_URI")) || readVar(base, "MONGO_URI");
};

/** Host + db of a URI, with credentials stripped — safe to print. */
const describe = (uri) => {
  const host = uri.replace(/^[^@]*@/, "").replace(/^mongodb(\+srv)?:\/\//, "").split(/[/?]/)[0];
  const db = (uri.split("/").pop() || "").split("?")[0] || "test";
  return `${host}/${db}`;
};

const targets = [];
const push = (label, uri) => {
  if (!uri) return;
  if (targets.some((t) => t.uri === uri)) return; // de-dupe: same DB, one pass
  targets.push({ label, uri });
};

if (EXPLICIT_URI) push("--uri", EXPLICIT_URI);
else if (TARGET === "all") {
  push("site", siteUri());
  push("app", appUri());
  push("app-dev", appUri("development"));
} else if (TARGET === "app") push("app", appUri());
else if (TARGET === "app-dev") push("app-dev", appUri("development"));
else push("site", siteUri());

if (!targets.length) {
  console.error("✗ No MONGO_URI resolved. Checked:");
  console.error(`   site: ${join(siteRoot, ".env")}`);
  console.error(`   app : ${join(appRoot, ".env")}`);
  process.exit(1);
}

/* ── the data (mirrors the app + website bundled defaults) ───────────────── */
const CDN = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request";

const RITUALS = [
  { slug: "kundali-milan", name: "Kundali Milan (Guna Milan)", price: 1100, samagriPrice: 0, sortOrder: 1, isActive: true },
  { slug: "vivah-muhoorat", name: "Vivah Muhurat", price: 1100, samagriPrice: 0, sortOrder: 2, isActive: true },
  { slug: "shagun", name: "Shagun / Sagai (Tilak)", price: 5100, samagriPrice: 1500, sortOrder: 3, isActive: true },
  { slug: "ganesh-gauri-puja", name: "Ganesh–Gauri Puja", price: 2100, samagriPrice: 700, sortOrder: 4, isActive: true },
  { slug: "haldi-ceremony", name: "Haldi Ceremony", price: 2100, samagriPrice: 900, sortOrder: 5, isActive: true },
  { slug: "mandap-sthapana", name: "Mandap & Kalash Sthapana", price: 5100, samagriPrice: 2100, sortOrder: 6, isActive: true },
  { slug: "vivah-sanskar", name: "Vivah Sanskar — Complete Ceremony", price: 25400, samagriPrice: 8000, sortOrder: 7, isActive: true },
  { slug: "mandir-darshan", name: "Mandir Darshan", price: 3100, samagriPrice: 700, sortOrder: 8, isActive: true },
  { slug: "post-vivah-live-darshan", name: "After-Marriage Live Temple Darshan", price: 2100, samagriPrice: 300, sortOrder: 9, isActive: true },
];

const PACKAGES = [
  {
    packageId: "shubh-vivah", name: "Shubh Vivah", hindiName: "शुभ विवाह",
    tagline: "Every sacred ritual, one dedicated Pandit Ji", badge: "",
    price: 21000, strikePrice: 25100, panditCount: 1, hasCoordinator: false,
    includesAllRituals: true, ritualSlugs: [], gifts: [],
    perks: [
      { icon: "shield-checkmark", title: "1 Verified Vedic Pandit Ji", description: "Performs every ritual — Kundali Milan to Mandir Darshan" },
      { icon: "flower", title: "All Vivah rituals included", description: "Complete shastra-sammat vidhi, start to finish" },
      { icon: "book", title: "Muhurat & Kundali guidance", description: "Auspicious date and guna-milan support" },
      { icon: "logo-whatsapp", title: "WhatsApp updates at every step", description: "Reminders before every ritual and updates after" },
      { icon: "videocam", title: "After-marriage LIVE temple darshan", description: "A streamed darshan for the new couple's blessings" },
    ],
    freeTempleDarshan: false, advancePercent: 0, accentColor: "#E25800", image: "",
    liveTempleDarshan: true, templeDarshanCount: 0,
    seoKeywords: ["pandit for marriage", "vivah pandit booking", "wedding pandit near me", "shaadi ke liye pandit"],
    sortOrder: 1, isActive: true,
  },
  {
    packageId: "raj-vivah", name: "Raj Vivah", hindiName: "राज विवाह",
    tagline: "Two Pandit Jis, grander vidhi & shagun gifts", badge: "Most Popular",
    price: 51000, strikePrice: 61000, panditCount: 2, hasCoordinator: false,
    includesAllRituals: true, ritualSlugs: [],
    gifts: [
      { title: "Dulha Shagun Set — Safa & Shawl", forWhom: "Dulha", price: 2100, count: 1, shopifyProductId: "VIVAH-GIFT-DULHA-SAFA", description: "A regal safa (turban) and a hand-embroidered shawl for the groom's shagun." },
      { title: "Dulhan Shringar Set", forWhom: "Dulhan", price: 2100, count: 1, shopifyProductId: "VIVAH-GIFT-SHRINGAR", description: "A curated 16-shringar essentials box for the bride." },
      { title: "Silver-Finish Pooja Kalash", forWhom: "Couple", price: 1100, count: 1, shopifyProductId: "VIVAH-GIFT-KALASH", description: "A silver-finish kalash the couple keeps as a blessing of abundance." },
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
    freeTempleDarshan: false, advancePercent: 0, accentColor: "#C99A3B", image: "",
    liveTempleDarshan: true, templeDarshanCount: 1,
    seoKeywords: ["2 pandit wedding package", "vivah sanskar booking", "marriage puja with gifts", "raj vivah package"],
    sortOrder: 2, isActive: true,
  },
  {
    packageId: "maharaja-vivah", name: "Maharaja Vivah", hindiName: "महाराजा विवाह",
    tagline: "Three Pandit Jis, dedicated coordinator & elite uphaar", badge: "Elite",
    price: 111000, strikePrice: 131000, panditCount: 3, hasCoordinator: true,
    includesAllRituals: true, ritualSlugs: [],
    gifts: [
      { title: "Gold-Finish Shagun Thali", forWhom: "Family", ritualSlug: "shagun", price: 3100, count: 1, shopifyProductId: "VIVAH-GIFT-THALI", description: "An ornate gold-finish thali for the family's shagun rasam." },
      { title: "Haldi Ceremony Elite Kit", forWhom: "Couple", ritualSlug: "haldi-ceremony", price: 2500, count: 2, shopifyProductId: "VIVAH-GIFT-HALDI-KIT", description: "Two premium haldi kits — organic haldi, chandan & marigold for both sides." },
      { title: "Kalash & Mandap Shobha Set", forWhom: "Family", ritualSlug: "mandap-sthapana", price: 5100, count: 1, shopifyProductId: "VIVAH-GIFT-MANDAP-SET", description: "A complete mandap shobha set to adorn the sacred canopy." },
      { title: "Elite Dulha Vastra Shagun", forWhom: "Dulha", ritualSlug: "vivah-sanskar", price: 5100, count: 1, description: "Premium groom's vastra shagun for the pheras." },
      { title: "Elite Dulhan Shringar & Vastra", forWhom: "Dulhan", ritualSlug: "vivah-sanskar", price: 5100, count: 1, description: "An elite bridal shringar & vastra hamper for the pheras." },
      { title: "Prasad, Chunri & Seva Hamper", forWhom: "Couple", ritualSlug: "mandir-darshan", price: 2100, count: 1, shopifyProductId: "VIVAH-GIFT-PRASAD-HAMPER", description: "A blessed prasad & chunri hamper for the couple's temple seva." },
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
    freeTempleDarshan: true, advancePercent: 0, accentColor: "#7A1E1E", image: "",
    liveTempleDarshan: true, templeDarshanCount: 99,
    seoKeywords: ["premium wedding pandit", "3 pandit vivah package", "elite marriage ceremony", "destination wedding pandit"],
    sortOrder: 3, isActive: true,
  },
];

/** 2026–27 season, from published panchang lists. Admin edits always win. */
const MUHURATS = [
  ["20/11/2026","Friday",2026,"Uttara Bhadrapada"],["21/11/2026","Saturday",2026,"Uttara Bhadrapada"],
  ["25/11/2026","Wednesday",2026,"Rohini"],["26/11/2026","Thursday",2026,"Rohini"],
  ["02/12/2026","Wednesday",2026,"Uttara Phalguni"],["03/12/2026","Thursday",2026,"Hasta"],
  ["04/12/2026","Friday",2026,"Hasta"],["12/12/2026","Saturday",2026,"Uttara Ashadha"],
  ["14/01/2027","Thursday",2027,"Uttara Bhadrapada"],["18/01/2027","Monday",2027,"Rohini"],
  ["24/01/2027","Sunday",2027,"Magha"],["31/01/2027","Sunday",2027,"Anuradha"],
  ["10/02/2027","Wednesday",2027,"Uttara Bhadrapada"],["15/02/2027","Monday",2027,"Mrigashirsha"],
  ["22/02/2027","Monday",2027,"Uttara Phalguni"],["24/02/2027","Wednesday",2027,"Swati"],
  ["01/03/2027","Monday",2027,"Moola"],["03/03/2027","Wednesday",2027,"Uttara Ashadha"],
  ["10/03/2027","Wednesday",2027,"Revati"],["14/03/2027","Sunday",2027,"Rohini"],
  ["18/04/2027","Sunday",2027,"Uttara Phalguni"],["23/04/2027","Friday",2027,"Anuradha"],
  ["25/04/2027","Sunday",2027,"Moola"],["03/05/2027","Monday",2027,"Uttara Bhadrapada"],
  ["07/05/2027","Friday",2027,"Rohini"],["16/05/2027","Sunday",2027,"Hasta"],
  ["24/05/2027","Monday",2027,"Uttara Ashadha"],["30/05/2027","Sunday",2027,"Uttara Bhadrapada"],
  ["09/06/2027","Wednesday",2027,"Magha"],["13/06/2027","Sunday",2027,"Hasta"],
  ["16/06/2027","Wednesday",2027,"Anuradha"],["20/06/2027","Sunday",2027,"Uttara Ashadha"],
  ["07/07/2027","Wednesday",2027,"Magha"],["12/07/2027","Monday",2027,"Swati"],
  ["22/11/2027","Monday",2027,"Uttara Phalguni"],["24/11/2027","Wednesday",2027,"Hasta"],
  ["29/11/2027","Monday",2027,"Moola"],["02/12/2027","Thursday",2027,"Uttara Ashadha"],
  ["08/12/2027","Wednesday",2027,"Revati"],
].map(([date, day, year, nakshatra], i) => ({ date, day, year, nakshatra, isActive: true, sortOrder: i + 1 }));

const TEMPLES = [
  { templeId: "kashi-vishwanath", name: "Kashi Vishwanath", city: "Varanasi", deity: "Lord Shiva", price: 5100, description: "The couple's first darshan at the eternal city of Kashi.", isActive: true, sortOrder: 1 },
  { templeId: "mahakaleshwar", name: "Mahakaleshwar Jyotirlinga", city: "Ujjain", deity: "Lord Shiva", price: 5100, description: "Bhasma-aarti blessings for a long, prosperous marriage.", isActive: true, sortOrder: 2 },
  { templeId: "somnath", name: "Somnath Jyotirlinga", city: "Gujarat", deity: "Lord Shiva", price: 4100, description: "Darshan at the first among the twelve Jyotirlingas.", isActive: true, sortOrder: 3 },
  { templeId: "siddhivinayak", name: "Siddhivinayak", city: "Mumbai", deity: "Lord Ganesha", price: 3100, description: "Vighnaharta's blessings for an obstacle-free life together.", isActive: true, sortOrder: 4 },
  { templeId: "tirupati-balaji", name: "Tirupati Balaji", city: "Tirumala", deity: "Lord Venkateshwara", price: 6100, description: "Balaji's darshan for the newlyweds' abundance.", isActive: true, sortOrder: 5 },
  { templeId: "vaishno-devi", name: "Vaishno Devi", city: "Katra", deity: "Mata Rani", price: 4100, description: "Mata Rani's aashirwad for the new household.", isActive: true, sortOrder: 6 },
];

const KASHI = {
  enabled: true, isActive: true,
  title: "Invite a Pandit Ji from Kashi", hindiName: "काशी से पंडित जी",
  description: "Have your vivah sanskar performed by a revered Vedacharya from Kashi (Varanasi) — the spiritual heart of Sanatan Dharma. Steeped in the Kashi Vivah Paddhati, they bring the blessings of Baba Vishwanath and the Ganga to your ceremony.",
  image: `${CDN}/vivah/kashi-ghat_11zon.png`,
  premiumPrice: 21000,
  note: "Premium covers the Kashi Acharya's travel, stay and a special Ganga-Aarti sankalp for the couple.",
  pandits: [
    { name: "Acharya Pt. Rajeshwar Dwivedi", experienceYears: 28, specialization: "Kashi Vishwanath Rudrabhishek & Vivah Sanskar", temple: "Kashi Vishwanath, Varanasi", languages: ["Hindi", "Sanskrit", "Bhojpuri"] },
    { name: "Pt. Omkarnath Tiwari", experienceYears: 22, specialization: "Vedic Vivah & Kashi Ganga Aarti", temple: "Dashashwamedh Ghat, Varanasi", languages: ["Hindi", "Sanskrit"] },
    { name: "Pt. Vishwanath Shastri", experienceYears: 35, specialization: "Maithil & Kashi Vivah Paddhati", temple: "Sankat Mochan, Varanasi", languages: ["Hindi", "Sanskrit", "Maithili"] },
  ],
};

const LANGUAGES = ["Hindi","Sanskrit","Marathi","Bengali","Gujarati","Tamil","Telugu","Kannada","Malayalam","Punjabi","Odia","Maithili","Bhojpuri","Rajasthani/Marwari","Konkani","Assamese"];

const SAMPOORAN = {
  name: "Sampooran Vivah (Complete Package)", packagePrice: 0, samagriPrice: 0, discountPercent: 10,
  items: [
    "Every Vedic ritual — Kundali Milan to Mandir Darshan",
    "Verified Vedic Pandit Ji for the full ceremony",
    "Muhurat & Kundali guidance",
    "End-to-end coordination & support",
    "Flat 10% off your overall billing",
  ],
  image: "",
};

const SEO = {
  slug: "vedic-vivah-marriage-pandit-booking",
  metaTitle: "Vedic Vivah — Book a Verified Marriage Pandit Ji Online | Pandit Ji At Request",
  metaDescription: "Book verified Vedic Pandit Jis for your complete Hindu marriage — Kundali Milan, Muhurat, Haldi, Pheras & after-marriage live temple darshan. Transparent packages from ₹21,000, pan-India, in your language.",
  keywords: ["pandit for marriage","wedding pandit near me","vivah pandit booking","online pandit booking","marriage puja package"],
  ogImage: `${CDN}/vivah/vivah-banner_11zon.png`,
  canonicalUrl: "https://panditjiatrequest.com/vedic-vivah",
};

/** Gift products — the checkout "Add a Gift" shelf. Priced in whole rupees. */
const PRODUCTS = [
  { id: "VIVAH-GIFT-KALASH",        title: "Silver-Finish Pooja Kalash",        price: 1100, compareAt: 1500, image: `${CDN}/vivah/package-kalash_11zon.png` },
  { id: "VIVAH-GIFT-THALI",         title: "Gold-Finish Shagun Thali",          price: 3100, compareAt: 3900, image: `${CDN}/vivah/shagun_11zon.png` },
  { id: "VIVAH-GIFT-DULHA-SAFA",    title: "Dulha Shagun Set — Safa & Shawl",   price: 2100, compareAt: 2700, image: `${CDN}/vivah/vivah-sanskaar_11zon.png` },
  { id: "VIVAH-GIFT-SHRINGAR",      title: "Dulhan Shringar Set (16 Shringar)", price: 2100, compareAt: 2700, image: `${CDN}/vivah/shagun_11zon.png` },
  { id: "VIVAH-GIFT-HALDI-KIT",     title: "Haldi Ceremony Elite Kit",          price: 1500, compareAt: 1900, image: `${CDN}/vivah/vivah-sanskaar_11zon.png` },
  { id: "VIVAH-GIFT-MANDAP-SET",    title: "Kalash & Mandap Shobha Set",        price: 5100, compareAt: 6100, image: `${CDN}/vivah/package-kalash_11zon.png` },
  { id: "VIVAH-GIFT-PRASAD-HAMPER", title: "Prasad, Chunri & Seva Hamper",      price: 1100, compareAt: 1500, image: `${CDN}/vivah/mandir-darshan_11zon.png` },
];

/* ── seed ────────────────────────────────────────────────────────────────── */
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const isEmpty = (v) =>
  v == null || (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

const productIds = PRODUCTS.map((p) => p.id);

const fullDoc = () => ({
  isActive: true,
  rituals: RITUALS,
  sampooranVivah: SAMPOORAN,
  packages: PACKAGES,
  muhurats: MUHURATS,
  temples: TEMPLES,
  kashi: KASHI,
  advancePercent: 50,
  crossSellProductIds: productIds,
  supportedLanguages: LANGUAGES,
  seo: SEO,
  updatedAt: new Date(),
});

/** Everything the API cares about, summarised for a human. */
const summarise = (d) => ({
  rituals: d?.rituals?.length ?? 0,
  packages: d?.packages?.length ?? 0,
  muhurats: d?.muhurats?.length ?? 0,
  temples: d?.temples?.length ?? 0,
  kashiPandits: d?.kashi?.pandits?.length ?? 0,
  crossSell: d?.crossSellProductIds?.length ?? 0,
  languages: d?.supportedLanguages?.length ?? 0,
  advancePercent: d?.advancePercent ?? "—",
});

async function run({ label, uri }) {
  console.log(`\n${"═".repeat(64)}\n▶ target "${label}"  →  ${describe(uri)}`);
  const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 20000 }).asPromise();
  const db = conn.db;
  const cat = db.collection("vivah_catalog");
  const shop = db.collection("shopifyProducts");

  /* ── DIAGNOSE ── */
  const docs = await cat.find().sort({ createdAt: 1 }).toArray();
  console.log(`\n  vivah_catalog documents: ${docs.length}`);
  if (!docs.length) {
    console.log("  (empty — the API is serving its built-in defaults)");
  }
  docs.forEach((d, i) => {
    const s = summarise(d);
    const winner = i === 0 ? "  ← THE API READS THIS ONE" : "";
    console.log(
      `   [${i}] _id=${d._id} createdAt=${d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : "MISSING"}${winner}`
    );
    console.log(
      `        rituals:${s.rituals} packages:${s.packages} muhurats:${s.muhurats} temples:${s.temples} kashiPandits:${s.kashiPandits} crossSell:${s.crossSell} advance:${s.advancePercent}`
    );
  });
  if (docs.length > 1) {
    console.log(
      "\n  ⚠ More than one catalog document exists. The API sorts by createdAt\n" +
      "    ASCENDING and takes the FIRST, so the OLDEST wins — a stale doc can\n" +
      "    mask a newer one. Delete the ones you don't want, or run --force to\n" +
      "    rewrite the winning document above."
    );
  }

  if (VERIFY_ONLY) {
    const live = await shop.countDocuments({
      shopifyProductId: { $in: productIds },
      status: { $in: ["active", "ACTIVE"] },
    });
    console.log(`\n  gift products live: ${live}/${productIds.length}`);
    console.log("\n  --verify: nothing written.");
    await conn.close();
    return;
  }

  /* ── PRODUCTS ── */
  let created = 0;
  for (const p of PRODUCTS) {
    const r = await shop.updateOne(
      { shopifyProductId: p.id },
      {
        $setOnInsert: {
          shopifyProductId: p.id,
          title: p.title,
          handle: slugify(p.title),
          status: "active",
          featuredImage: { url: p.image, altText: p.title },
          priceRangeV2: {
            minVariantPrice: { amount: String(p.price), currencyCode: "INR" },
            maxVariantPrice: { amount: String(p.price), currencyCode: "INR" },
          },
          compareAtPriceRange: {
            minVariantCompareAtPrice: { amount: String(p.compareAt), currencyCode: "INR" },
          },
          tags: ["vivah", "gift", "seeded"],
          vendor: "Pandit Ji At Request",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    if (r.upsertedCount) created++;
  }
  console.log(`\n  ✓ products: ${created} created, ${PRODUCTS.length - created} already present`);

  /* ── CATALOG ── */
  const existing = docs[0] || null;
  if (!existing) {
    await cat.insertOne({ ...fullDoc(), createdAt: new Date() });
    console.log("  ✓ catalog: inserted a complete document");
  } else if (FORCE) {
    await cat.updateOne({ _id: existing._id }, { $set: fullDoc() });
    console.log(`  ✓ catalog: FORCE — every field rewritten on _id=${existing._id}`);
  } else {
    const $set = {};
    for (const [k, v] of Object.entries(fullDoc())) {
      if (k === "updatedAt") continue;
      if (k === "muhurats") {
        const have = new Set((existing.muhurats || []).map((m) => m.date));
        const merged = [...(existing.muhurats || []), ...MUHURATS.filter((m) => !have.has(m.date))];
        if (merged.length !== (existing.muhurats || []).length) $set.muhurats = merged;
      } else if (k === "crossSellProductIds") {
        const merged = Array.from(new Set([...(existing.crossSellProductIds || []), ...productIds]));
        if (merged.length !== (existing.crossSellProductIds || []).length) $set.crossSellProductIds = merged;
      } else if (isEmpty(existing[k])) {
        $set[k] = v;
      }
    }
    if (Object.keys($set).length) {
      $set.updatedAt = new Date();
      await cat.updateOne({ _id: existing._id }, { $set });
      console.log(
        "  ✓ catalog: filled →",
        Object.keys($set).filter((k) => k !== "updatedAt").join(", ")
      );
    } else {
      console.log(
        "  • catalog: every field already populated — nothing changed.\n" +
        "    If the page still shows values you don't recognise, that document\n" +
        "    holds them. Re-run with --force to replace it with this seed."
      );
    }
  }

  /* ── VERIFY ── */
  const after = await cat.find().sort({ createdAt: 1 }).limit(1).next();
  const live = await shop.countDocuments({
    shopifyProductId: { $in: productIds },
    status: { $in: ["active", "ACTIVE"] },
  });
  const s = summarise(after);
  console.log("\n  ── the API will now serve ──");
  console.log(`     rituals:${s.rituals}  packages:${s.packages}  muhurats:${s.muhurats}  temples:${s.temples}`);
  console.log(`     kashiPandits:${s.kashiPandits}  crossSell:${s.crossSell}  languages:${s.languages}  advance:${s.advancePercent}%`);
  console.log(`     gift products live: ${live}/${productIds.length}`);
  console.log(`     packages: ${(after.packages || []).map((p) => `${p.packageId}@${p.price}`).join(", ")}`);
  await conn.close();
}

for (const t of targets) {
  try {
    await run(t);
  } catch (e) {
    console.error(`\n✗ target "${t.label}" (${describe(t.uri)}) failed: ${e.message}`);
    if (/ServerSelection|ETIMEDOUT|ENOTFOUND/i.test(e.message)) {
      console.error("   → Atlas is refusing the connection. Add this machine's IP to the");
      console.error("     cluster's Network Access list, or check you're online.");
    }
  }
}
await mongoose.disconnect().catch(() => {});
console.log(`\n${"═".repeat(64)}\n✓ done. Restart the server, then hard-refresh /vedic-vivah.`);
