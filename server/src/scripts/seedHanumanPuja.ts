/**
 * Seeds the "Shree Hanuman Garhi Mahapuja" (Shri Hanuman Garhi Mandir,
 * Ayodhya) catalog entry.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The Hanuman puja page renders entirely from frontend data, but the booking
 * POST to /bookings/create-pending must resolve to a real Pooja document — the
 * server reads `poojaNameEng` off that document and stamps it onto the
 * booking, the WhatsApp/email confirmation, the pandit notification, the admin
 * record and the referral entry. Without its own catalog row the puja has to
 * borrow another puja's `_id`, and every Hanuman booking is reported under
 * that other puja's name.
 *
 * The document is keyed on `poojaID: "RF_HANUMAN_01"` — a stable string, not a
 * Mongo `_id`. The booking controller resolves a puja by that field when the
 * client sends `pujaSlug`, so the frontend needs no environment-specific id
 * and the same build works against dev and production.
 *
 * USAGE
 * ─────
 *   # dev cluster (MODE=development in .env)
 *   npx ts-node src/scripts/seedHanumanPuja.ts
 *
 *   # production cluster
 *   MODE=production npx ts-node src/scripts/seedHanumanPuja.ts
 *
 *   # preview without writing
 *   npx ts-node src/scripts/seedHanumanPuja.ts --dry-run
 *
 * Idempotent: upserts on `poojaID`, so re-running refreshes the content of
 * the existing row rather than creating a duplicate. The `_id` is preserved
 * across runs, so any bookings already pointing at it stay intact.
 */

import "../config/loadEnv";

import { panditJiAtRequestMongooose } from "../config/connectDB";
import Pooja from "../model/userApp/poojaModel";

/** Stable catalog key. The frontend sends this as `pujaSlug`. */
const POOJA_ID = "RF_HANUMAN_01";

// Kept in sync with frontend/src/data/hanumanPuja.ts so booking confirmations
// (WhatsApp/email) and admin records show the correct Hanuman Garhi artwork.
// The WhatsApp header image is read from this row's poojaCardImage, so it MUST
// be the Hanuman banner (not a generic/placeholder), else confirmations show
// the wrong puja's image.
const BANNER =
  "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Hanuman%20gari%20ji%20banner.webp";

/**
 * Mirrors frontend/src/data/hanumanPuja.ts. The page renders from the frontend
 * copy; this row exists so bookings resolve and report correctly. Keep the two
 * in sync when the puja copy changes.
 */
const HANUMAN_PUJA = {
  poojaID: POOJA_ID,
  poojaNameEng: "Shree Hanuman Garhi Mahapuja",
  poojaNameHindi: "श्री हनुमान गढ़ी महापूजा",
  poojaMode: "online" as const,
  poojaPriceOnline: 1100,
  poojaPriceOffline: 1100,
  poojaCardImage: BANNER,
  poojaMainImage: [BANNER],
  poojaGods: ["Hanuman Ji", "Bajrangbali", "Shree Ram"],
  benefits: [
    "Hanuman Garhi is the seat of Bajrangbali in Ram's own Ayodhya — his kripa shields you from every fear",
    "Removes Shani sade-sati, dhaiya and the malefic effects of Mangal (Mars) dosha",
    "Destroys evil eye (nazar), black magic and negative energy around you and your home",
    "Grants courage, strength, victory over enemies and success in stuck work",
    "Bhakti of Hanuman brings the grace of Shree Ram — protection, prosperity and peace",
    "Wards off bhoot-pret badha and fills the mind with confidence, health and devotion",
  ],
  tags: ["Savan Mangalwar", "Hanuman", "Ayodhya"],
  // Dakshina must stay <= the price: the booking controller derives the stored
  // pooja price as (amount - panditDakshina).
  panditDakshina: 251,
  samagriDetails: [] as any[],
  samagriPrice: 0,
  // Savan Mangalwar of Shravan 2026.
  specialDate: new Date("2026-08-04T00:00:00.000Z"),
  poojaBenefitsDescription:
    "Verified pandits perform the Hanuman Garhi Mahapuja on your behalf at Shri Hanuman Garhi Mandir in Ayodhya on Savan Mangalwar with traditional Vedic rituals.<br>\r\nA personalised Sankalp is done in your name and gotra so the puja is dedicated to you and your family.<br>\r\nOfferings include a sindoor-and-chameli-oil chola, boondi laddoo and paan bhog, a red dhwaja, with the Hanuman Chalisa, Sundarkand paath and Bajrang Baan chanting.<br>\r\nYou receive the puja video with your name &amp; gotra on WhatsApp, and can have blessed prasad couriered to your home.<br>",
  poojaDescription: [
    {
      headingId: "1",
      heading: "Purpose of Puja",
      description:
        "<p>To seek the <strong>kripa</strong> (grace) of <strong>Shri Hanuman</strong> — <strong>Bajrangbali</strong>, the greatest devotee of <strong>Shree Ram</strong> and the remover of all fear, sorrow and obstacles (<em>Sankat Mochan</em>).</p><p><strong>Hanuman Garhi</strong> in <strong>Ayodhya</strong> is among the most powerful seats of Hanuman. This online puja is performed on your behalf there on <strong>Savan Mangalwar</strong> — a Tuesday of the sacred Shravan month — to burn away fear, negativity and doshas, and to grant courage, strength and swift success.</p>",
    },
    {
      headingId: "2",
      heading: "Best Time to Perform",
      description:
        "<p><strong>Day:</strong> Tuesday, 4 August 2026 — <strong>Savan Mangalwar</strong>, a Tuesday of the sacred month of Shravan (Savan).</p><p><strong>Tuesdays (Mangalwar)</strong> and <strong>Saturdays</strong> are held to be the most powerful days to invoke <strong>Hanuman Ji</strong>.</p>",
    },
    {
      headingId: "3",
      heading: "What is performed",
      description:
        "<p>Verified pandits perform the complete Vedic vidhi at <strong>Shri Hanuman Garhi Mandir in Ayodhya</strong> — <strong>Sankalp in your name &amp; gotra</strong>, the <strong>Hanuman Chalisa</strong>, <strong>Sundarkand</strong> and Bajrang Baan chanting, a <strong>sindoor chola</strong> offering, ceremonial bhog, and the <strong>Hanuman aarti</strong>.</p>",
    },
    {
      headingId: "4",
      heading: "Offerings made on your behalf",
      description:
        "<p>• <strong>Sindoor chola</strong> in chameli (jasmine) oil, dear to Hanuman</p><p> • <strong>Boondi laddoo</strong> and paan bhog</p><p> • A red <strong>dhwaja</strong> (victory flag) offered at his feet</p><p> • Ghee deepam, dhoop, chandan and red flowers</p><p> • <strong>Hanuman Chalisa</strong>, Sundarkand and Bajrang Baan paath</p>",
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
        "On Tuesday, 4 August 2026 — Savan Mangalwar, a Tuesday of the sacred Shravan month dedicated to Hanuman Ji. The exact timing is confirmed with you on WhatsApp before the puja begins.",
    },
    {
      question: "Will I get the puja video?",
      answer:
        "Yes. The full puja video, with your name and gotra taken during the Sankalp, is shared with you on WhatsApp after the puja.",
    },
    {
      question: "Who is Hanuman Ji?",
      answer:
        "Hanuman Ji, also called Bajrangbali and Sankat Mochan, is the greatest devotee of Shree Ram and the remover of all fear, sorrow and obstacles. His worship grants strength, courage, protection and swift removal of troubles.",
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
    { $set: HANUMAN_PUJA },
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
