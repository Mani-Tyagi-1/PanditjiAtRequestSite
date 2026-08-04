/**
 * Seeds the "Shree Kashi Rudrabhishek Mahapuja" (Kashi Vishwanath) catalog entry.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The Savan puja page renders entirely from frontend data, but the booking
 * POST to /bookings/create-pending must resolve to a real Pooja document —
 * the server reads `poojaNameEng` off that document and stamps it onto the
 * booking, the WhatsApp/email confirmation, the pandit notification, the
 * admin record and the referral entry. Without its own catalog row the puja
 * has to borrow another puja's `_id`, and every Kashi booking is reported
 * under that other puja's name.
 *
 * The document is keyed on `poojaID: "RF_SAVAN_01"` — a stable string, not a
 * Mongo `_id`. The booking controller resolves a puja by that field when the
 * client sends `pujaSlug`, so the frontend needs no environment-specific id
 * and the same build works against dev and production.
 *
 * USAGE
 * ─────
 *   # dev cluster (MODE=development in .env)
 *   npx ts-node src/scripts/seedKashiMahadevPuja.ts
 *
 *   # production cluster
 *   MODE=production npx ts-node src/scripts/seedKashiMahadevPuja.ts
 *
 *   # preview without writing
 *   npx ts-node src/scripts/seedKashiMahadevPuja.ts --dry-run
 *
 * Idempotent: upserts on `poojaID`, so re-running refreshes the content of
 * the existing row rather than creating a duplicate. The `_id` is preserved
 * across runs, so any bookings already pointing at it stay intact.
 */

import "../config/loadEnv";

import { panditJiAtRequestMongooose } from "../config/connectDB";
import Pooja from "../model/userApp/poojaModel";

/** Stable catalog key. The frontend sends this as `pujaSlug`. */
const POOJA_ID = "RF_SAVAN_01";

const BANNER =
  "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Kashi%20banner%20(2).png";

/**
 * Mirrors frontend/src/data/kashiMahadevPuja.ts. The page renders from the
 * frontend copy; this row exists so bookings resolve and report correctly.
 * Keep the two in sync when the puja copy changes.
 */
const KASHI_MAHADEV_PUJA = {
  poojaID: POOJA_ID,
  poojaNameEng: "Shree Kashi Rudrabhishek Mahapuja",
  poojaNameHindi: "श्री काशी रुद्राभिषेक महापूजा",
  poojaMode: "online" as const,
  poojaPriceOnline: 851,
  poojaPriceOffline: 851,
  poojaCardImage: BANNER,
  poojaMainImage: [BANNER],
  poojaGods: ["Lord Shiva", "Mahadev", "Baba Vishwanath"],
  benefits: [
    "Rudrabhishek at Kashi — Mahadev's own eternal city",
    "Gangajal drawn from the Ganga at Varanasi offered in your name",
    "Removes fear, ill health, and untimely misfortune (Mahamrityunjaya blessings)",
    "Kashi is the foremost kshetra for pacifying Pitra, Kaal Sarp and Shani doshas",
    "Brings marital harmony and blessings for an early, suitable match",
    "Grants inner peace, courage, and progress toward moksha",
  ],
  tags: ["Savan 2026", "Jyotirlinga", "Rudrabhishek"],
  // Dakshina must stay <= the price: the booking controller derives the stored
  // pooja price as (amount - panditDakshina).
  panditDakshina: 251,
  samagriDetails: [] as any[],
  samagriPrice: 0,
  // Last Savan Somwar of Shravan 2026. Must match LAST_SAVAN_SOMWAR in
  // frontend/src/data/kashiMahadevPuja.ts — the booking page sends the date it
  // reads from there, so a drift here shows one date on the row and another on
  // the booking.
  specialDate: new Date("2026-08-24T00:00:00.000Z"),
  poojaBenefitsDescription:
    "Verified pandits perform Rudrabhishek of Baba Vishwanath on your behalf at Kashi on the last Savan Somwar with traditional Vedic rituals.<br>\r\nA personalised Sankalp is done in your name and gotra so the puja is dedicated to you and your family.<br>\r\nOfferings include Gangajal drawn from the Ganga at Varanasi, milk, bel patra, dhatura, bhang, white flowers and chandan, with Rudri path and Mahamrityunjaya mantra chanting.<br>\r\nYou receive the puja video with your name &amp; gotra on WhatsApp, and can have blessed prasad couriered to your home.<br>",
  poojaDescription: [
    {
      headingId: "1",
      heading: "Purpose of Puja",
      description:
        "<p>To seek the blessings of <strong>Baba Vishwanath</strong> — <strong>Mahadev</strong> as the Lord of the Universe, worshipped at <strong>Kashi Vishwanath</strong>, among the most revered of the twelve Jyotirlingas.</p><p><strong>Kashi (Varanasi)</strong> is held to be Shiva's own city, said to rest upon his trishul and to stand untouched even at the dissolution of the world. The month of <strong>Shravan (Savan)</strong> is his most beloved month, and <strong>Savan Somwar</strong> is its most powerful day.</p>",
    },
    {
      headingId: "2",
      heading: "Best Time to Perform",
      description:
        "<p><strong>Day:</strong> Monday, 24 August 2026 — the last Savan Somwar</p><p>Shravan month runs from <strong>30 July to 28 August 2026</strong>. Mondays of this month are considered the single most auspicious time in the year to worship <strong>Mahadev</strong>, and the <em>last</em> Savan Somwar is the closing offering of Shiva's own month, believed to seal the merit of the entire Shravan.</p>",
    },
    {
      headingId: "3",
      heading: "What is performed",
      description:
        "<p>Verified pandits perform the complete Vedic vidhi at <strong>MAHADEV Temple in Kashi</strong> — <strong>Sankalp in your name &amp; gotra</strong>, <strong>Rudrabhishek</strong> of the Jyotirlinga with Gangajal and panchamrit, <strong>Rudri path</strong>, <strong>Mahamrityunjaya mantra</strong> chanting, and Shiv aarti.</p>",
    },
    {
      headingId: "4",
      heading: "Offerings made on your behalf",
      description:
        "<p>• <strong>Gangajal</strong> drawn from the Ganga at Varanasi, and raw milk abhishek</p><p> • <strong>Bel patra</strong>, dhatura, bhang and white aak flowers</p><p> • Panchamrit — milk, curd, ghee, honey and sugar</p><p> • Chandan, bhasma, akshata and white flowers</p><p> • <strong>Rudri path</strong> and Mahamrityunjaya mantra chanting</p>",
    },
    {
      headingId: "5",
      heading: "What you will receive",
      description:
        "<p>• Personalised <strong>Sankalp</strong> performed in your name &amp; gotra</p><p> • Full <strong>puja video</strong> shared on WhatsApp</p><p> • Photos of the offerings made in your name</p><p> • Blessed <strong>prasad couriered to your home</strong> (optional)</p>",
    },
  ],
  faqs: [
    {
      question: "When exactly is this puja performed?",
      answer:
        "On Monday, 24 August 2026 — the last Savan Somwar of Shravan 2026. The exact timing is confirmed with you on WhatsApp before the puja begins.",
    },
    {
      question: "Will I get the puja video?",
      answer:
        "Yes. The full puja video, with your name and gotra taken during the Sankalp, is shared with you on WhatsApp after the puja.",
    },
    {
      question: "What is Rudrabhishek?",
      answer:
        "Rudrabhishek is the ceremonial bathing of the Shivling with Gangajal, milk, panchamrit and sacred offerings while Rudri path and Shiv mantras are chanted.",
    },
    {
      question: "Is prasad included?",
      answer:
        "Prasad is optional. You can add a blessed prasad box for ₹298 during booking and it will be couriered to your home after the puja.",
    },
  ],
  isActive: true,
  isFeatured: false,
  isExclusive: false,
  packageIncluded: true,
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const uri = process.env.MONGO_URI || "";

  // Show which cluster we're about to touch, without leaking credentials.
  const host = uri.replace(/^mongodb(\+srv)?:\/\/[^@]*@/, "").split(/[/?]/)[0];
  console.log(`[seed] MODE=${process.env.MODE} cluster=${host || "(unset)"}`);

  if (!uri) {
    console.error("[seed] MONGO_URI is not set — aborting.");
    process.exit(1);
  }

  await panditJiAtRequestMongooose.connect(uri);
  console.log("[seed] connected");

  const existing: any = await Pooja.findOne({ poojaID: POOJA_ID }).lean();
  if (existing) {
    console.log(`[seed] found existing "${existing.poojaNameEng}" _id=${existing._id}`);
  } else {
    console.log("[seed] no existing row — will insert");
  }

  if (dryRun) {
    console.log("[seed] --dry-run: no write performed.");
    await panditJiAtRequestMongooose.disconnect();
    return;
  }

  const doc: any = await Pooja.findOneAndUpdate(
    { poojaID: POOJA_ID },
    { $set: KASHI_MAHADEV_PUJA },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log(`[seed] ${existing ? "updated" : "created"} "${doc.poojaNameEng}"`);
  console.log(`[seed]   _id     = ${doc._id}`);
  console.log(`[seed]   poojaID = ${doc.poojaID}   <-- frontend sends this as pujaSlug`);
  console.log(`[seed]   price   = ₹${doc.poojaPriceOnline} (dakshina ₹${doc.panditDakshina})`);

  await panditJiAtRequestMongooose.disconnect();
  console.log("[seed] done");
}

main().catch(async (err) => {
  console.error("[seed] failed:", err?.message || err);
  try {
    await panditJiAtRequestMongooose.disconnect();
  } catch {
    /* already closed */
  }
  process.exit(1);
});
