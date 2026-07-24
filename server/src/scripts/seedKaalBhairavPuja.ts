/**
 * Seeds the "Shree Kashi Kaal Bhairav Mahapuja" (Shri Kaal Bhairav Mandir,
 * Kashi) catalog entry.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The Kaal Bhairav puja page renders entirely from frontend data, but the
 * booking POST to /bookings/create-pending must resolve to a real Pooja
 * document — the server reads `poojaNameEng` off that document and stamps it
 * onto the booking, the WhatsApp/email confirmation, the pandit notification,
 * the admin record and the referral entry. Without its own catalog row the
 * puja has to borrow another puja's `_id`, and every Kaal Bhairav booking is
 * reported under that other puja's name.
 *
 * The document is keyed on `poojaID: "RF_BHAIRAV_01"` — a stable string, not a
 * Mongo `_id`. The booking controller resolves a puja by that field when the
 * client sends `pujaSlug`, so the frontend needs no environment-specific id
 * and the same build works against dev and production.
 *
 * USAGE
 * ─────
 *   # dev cluster (MODE=development in .env)
 *   npx ts-node src/scripts/seedKaalBhairavPuja.ts
 *
 *   # production cluster
 *   MODE=production npx ts-node src/scripts/seedKaalBhairavPuja.ts
 *
 *   # preview without writing
 *   npx ts-node src/scripts/seedKaalBhairavPuja.ts --dry-run
 *
 * Idempotent: upserts on `poojaID`, so re-running refreshes the content of
 * the existing row rather than creating a duplicate. The `_id` is preserved
 * across runs, so any bookings already pointing at it stay intact.
 */

import "../config/loadEnv";

import { panditJiAtRequestMongooose } from "../config/connectDB";
import Pooja from "../model/userApp/poojaModel";

/** Stable catalog key. The frontend sends this as `pujaSlug`. */
const POOJA_ID = "RF_BHAIRAV_01";

// Kept in sync with frontend/src/data/kaalBhairavPuja.ts so booking
// confirmations (WhatsApp/email) and admin records show the correct artwork.
const BANNER =
  "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Kaal%20Bhairava%20Banner.webp";

/**
 * Mirrors frontend/src/data/kaalBhairavPuja.ts. The page renders from the
 * frontend copy; this row exists so bookings resolve and report correctly.
 * Keep the two in sync when the puja copy changes.
 */
const KAAL_BHAIRAV_PUJA = {
  poojaID: POOJA_ID,
  poojaNameEng: "Shree Kashi Kaal Bhairav Mahapuja",
  poojaNameHindi: "श्री काशी काल भैरव महापूजा",
  poojaMode: "online" as const,
  poojaPriceOnline: 1100,
  poojaPriceOffline: 1100,
  poojaCardImage: BANNER,
  poojaMainImage: [BANNER],
  poojaGods: ["Lord Shiva", "Kaal Bhairav", "Bhairav Baba"],
  benefits: [
    "Kaal Bhairav is the Kotwal (guardian) of Kashi — his raksha shields you from every fear",
    "Removes black magic, evil eye (nazar) and negative energy from your life",
    "Pacifies Shani, Rahu and Kaal Sarp Dosh — Bhairav is their overlord",
    "Grants fearlessness, courage and victory over hidden enemies and obstacles",
    "As Mahakaal Bhairav, lord of time, he removes fear of untimely misfortune",
    "Clears debts, delays and stuck work — brings discipline and swift success",
  ],
  tags: ["Kalashtami", "Kaal Bhairav", "Kashi"],
  // Dakshina must stay <= the price: the booking controller derives the stored
  // pooja price as (amount - panditDakshina).
  panditDakshina: 251,
  samagriDetails: [] as any[],
  samagriPrice: 0,
  // Kalashtami of Shravan 2026.
  specialDate: new Date("2026-08-11T00:00:00.000Z"),
  poojaBenefitsDescription:
    "Verified pandits perform the Kaal Bhairav Mahapuja on your behalf at Shri Kaal Bhairav Mandir in Kashi on Kalashtami with traditional Vedic rituals.<br>\r\nA personalised Sankalp is done in your name and gotra so the puja is dedicated to you and your family.<br>\r\nOfferings include a mustard-oil deepam, black til, coconut, imarti bhog, sindoor and black-red flowers, with Kaal Bhairav Ashtakam and Bhairav mantra chanting, and seva of the shvan (his vahana).<br>\r\nYou receive the puja video with your name &amp; gotra on WhatsApp, and can have blessed prasad couriered to your home.<br>",
  poojaDescription: [
    {
      headingId: "1",
      heading: "Purpose of Puja",
      description:
        "<p>To seek the <strong>raksha</strong> (protection) of <strong>Shri Kaal Bhairav</strong> — the fierce swaroop of <strong>Mahadev</strong> who guards <strong>Kashi</strong> as its <strong>Kotwal</strong>. It is said that no soul finds peace in Kashi without his darshan.</p><p>This online puja is performed on your behalf at his temple in <strong>Kashi (Varanasi)</strong> on <strong>Kalashtami</strong> to burn away fear, negative energy, doshas and hidden enemies.</p>",
    },
    {
      headingId: "2",
      heading: "Best Time to Perform",
      description:
        "<p><strong>Day:</strong> Tuesday, 11 August 2026 — <strong>Kalashtami</strong>, the Ashtami of Krishna Paksha dedicated to Kaal Bhairav.</p><p><strong>Kalashtami</strong>, and <strong>Tuesdays and Sundays</strong>, are held to be the most powerful days to invoke <strong>Bhairav Baba</strong>.</p>",
    },
    {
      headingId: "3",
      heading: "What is performed",
      description:
        "<p>Verified pandits perform the complete Vedic vidhi at <strong>Shri Kaal Bhairav Mandir in Kashi</strong> — <strong>Sankalp in your name &amp; gotra</strong>, <strong>Kaal Bhairav Ashtakam</strong> and Bhairav mantra chanting, a <strong>mustard-oil deepam</strong>, ceremonial bhog, and the <strong>Bhairav aarti</strong>.</p>",
    },
    {
      headingId: "4",
      heading: "Offerings made on your behalf",
      description:
        "<p>• <strong>Mustard-oil deepam</strong> and dhoop lit before Bhairav Baba</p><p> • <strong>Black til</strong>, urad and coconut</p><p> • <strong>Imarti / jalebi</strong> bhog, the offering dear to Bhairav</p><p> • Sindoor, chandan and black-red flowers</p><p> • Seva of the <strong>shvan</strong> (black dog), his vahana</p><p> • <strong>Kaal Bhairav Ashtakam</strong> and Bhairav mantra chanting</p>",
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
        "On Tuesday, 11 August 2026 — Kalashtami, the Ashtami dedicated to Kaal Bhairav. The exact timing is confirmed with you on WhatsApp before the puja begins.",
    },
    {
      question: "Will I get the puja video?",
      answer:
        "Yes. The full puja video, with your name and gotra taken during the Sankalp, is shared with you on WhatsApp after the puja.",
    },
    {
      question: "Who is Kaal Bhairav?",
      answer:
        "Kaal Bhairav is the fierce swaroop of Lord Shiva and the Kotwal (guardian) of Kashi. He is the remover of fear, negativity and doshas, and the overlord of Shani, Rahu and time itself.",
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
    { $set: KAAL_BHAIRAV_PUJA },
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
