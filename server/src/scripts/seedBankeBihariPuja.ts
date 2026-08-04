/**
 * Seeds the "Shree Banke Bihari Ji Janmashtami Mahapuja" (Shri Banke Bihari Ji
 * Mandir, Vrindavan) catalog entry.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The Banke Bihari puja page renders entirely from frontend data, but the
 * booking POST to /bookings/create-pending must resolve to a real Pooja
 * document — the server reads `poojaNameEng` off that document and stamps it
 * onto the booking, the WhatsApp/email confirmation, the pandit notification,
 * the admin record and the referral entry. Without its own catalog row the
 * puja has to borrow another puja's `_id`, and every Janmashtami booking is
 * reported under that other puja's name.
 *
 * The document is keyed on `poojaID: "RF_BIHARI_01"` — a stable string, not a
 * Mongo `_id`. The booking controller resolves a puja by that field when the
 * client sends `pujaSlug`, so the frontend needs no environment-specific id
 * and the same build works against dev and production.
 *
 * USAGE
 * ─────
 *   # dev cluster (MODE=development in .env)
 *   npx ts-node src/scripts/seedBankeBihariPuja.ts
 *
 *   # production cluster
 *   MODE=production npx ts-node src/scripts/seedBankeBihariPuja.ts
 *
 *   # preview without writing
 *   npx ts-node src/scripts/seedBankeBihariPuja.ts --dry-run
 *
 * Idempotent: upserts on `poojaID`, so re-running refreshes the content of
 * the existing row rather than creating a duplicate. The `_id` is preserved
 * across runs, so any bookings already pointing at it stay intact.
 */

import "../config/loadEnv";

import { panditJiAtRequestMongooose } from "../config/connectDB";
import Pooja from "../model/userApp/poojaModel";

/** Stable catalog key. The frontend sends this as `pujaSlug`. */
const POOJA_ID = "RF_BIHARI_01";

// Kept in sync with PEACOCK_FEATHER_IMAGE in
// frontend/src/data/bankeBihariPuja.ts so booking confirmations
// (WhatsApp/email) and admin records show the same artwork as the page.
const BANNER =
  "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/peacock%20feather%20(2).webp";

/**
 * Mirrors frontend/src/data/bankeBihariPuja.ts. The page renders from the
 * frontend copy; this row exists so bookings resolve and report correctly.
 * Keep the two in sync when the puja copy changes.
 */
const BANKE_BIHARI_PUJA = {
  poojaID: POOJA_ID,
  poojaNameEng: "Shree Banke Bihari Ji Janmashtami Mahapuja",
  poojaNameHindi: "श्री बांके बिहारी जी जन्माष्टमी महापूजा",
  poojaMode: "online" as const,
  poojaPriceOnline: 1100,
  poojaPriceOffline: 1100,
  poojaCardImage: BANNER,
  poojaMainImage: [BANNER],
  poojaGods: ["Shri Krishna Ji", "Banke Bihari Ji", "Laddu Gopal Ji"],
  benefits: [
    "Banke Bihari Ji is the most loving swaroop of Shri Krishna Ji — his kripa fulfils every heartfelt wish",
    "Janmashtami seva at Vrindavan brings prem, shanti and happiness into the home",
    "Removes rukawat in marriage, love and family relationships",
    "Blesses children with good health, buddhi, sanskaar and a bright future",
    "As Yogeshwar Krishna Ji, brings abundance, growth and success in business",
    "Frees the mind from chinta and grants bhakti, contentment and inner peace",
  ],
  tags: ["Janmashtami", "Banke Bihari", "Vrindavan", "Krishna"],
  // Dakshina must stay <= the price: the booking controller derives the stored
  // pooja price as (amount - panditDakshina).
  panditDakshina: 251,
  samagriDetails: [] as any[],
  samagriPrice: 0,
  // Krishna Janmashtami 2026 — confirm against the panchang before launch and
  // keep in sync with BANKE_BIHARI_PUJA_DATE in the frontend data file.
  specialDate: new Date("2026-09-04T00:00:00.000Z"),
  poojaBenefitsDescription:
    "Verified pandits perform the Janmashtami Mahapuja on your behalf at Shri Banke Bihari Ji Mandir in Vrindavan with traditional Vedic vidhi.<br>\r\nA personalised Sankalp is done in your name and gotra so the seva is dedicated to you and your family.<br>\r\nOfferings include Panchamrit abhishek, makhan-mishri bhog, peetambar vastra, tulsi archana, vaijayanti mala and mor pankh, with Krishna Ji mantra japa and the midnight Janmashtami aarti.<br>\r\nYou receive the puja video with your name &amp; gotra on WhatsApp, and blessed prasad couriered to your home.<br>",
  poojaDescription: [
    {
      headingId: "1",
      heading: "Purpose of Puja",
      description:
        "<p>To seek the <strong>kripa</strong> of <strong>Shri Banke Bihari Ji</strong> — the enchanting swaroop of <strong>Shri Krishna Ji</strong> who resides in <strong>Vrindavan</strong> and is worshipped as the deity who never refuses a devotee who comes with love.</p><p>This online seva is performed on your behalf at his mandir in <strong>Vrindavan</strong> on <strong>Krishna Janmashtami</strong> — the night of his avataran — to invite prem, prosperity, family harmony and the fulfilment of your heart's wish.</p>",
    },
    {
      headingId: "2",
      heading: "Best Time to Perform",
      description:
        "<p><strong>Day:</strong> Friday, 4 September 2026 — <strong>Krishna Janmashtami</strong>, the Ashtami of Bhadrapada Krishna Paksha.</p><p>The <strong>Nishith Kaal</strong> (midnight muhurat) of Janmashtami — the very moment of Kanha Ji's birth — is held to be the most powerful time of the entire year to invoke Shri Krishna Ji.</p>",
    },
    {
      headingId: "3",
      heading: "What is performed",
      description:
        "<p>Verified pandits perform the complete Vedic vidhi at <strong>Shri Banke Bihari Ji Mandir, Vrindavan</strong> — <strong>Sankalp in your name &amp; gotra</strong>, <strong>Panchamrit abhishek</strong> of Laddu Gopal Ji, <strong>makhan-mishri bhog</strong>, tulsi archana, <strong>Krishna Ji mantra japa</strong> and the midnight <strong>Janmashtami aarti</strong>.</p>",
    },
    {
      headingId: "4",
      heading: "Offerings made on your behalf",
      description:
        "<p>• <strong>Panchamrit abhishek</strong> — milk, dahi, ghee, honey and sugar</p><p> • <strong>Makhan-mishri</strong> bhog, the offering dearest to Kanha Ji</p><p> • <strong>Peetambar vastra</strong> and chandan shringar</p><p> • <strong>Tulsi dal</strong> archana and vaijayanti mala</p><p> • <strong>Mor pankh</strong> and bansuri offered at his charan</p><p> • <strong>Krishna Ji mantra japa</strong> and the midnight Janmashtami aarti</p>",
    },
    {
      headingId: "5",
      heading: "What you will receive",
      description:
        "<p>• Personalised <strong>Sankalp</strong> performed in your name &amp; gotra</p><p> • Full <strong>puja video</strong> shared on WhatsApp</p><p> • Photos of the offerings made in your name</p><p> • A blessed <strong>prasad box</strong> couriered home — free in the ₹5100 &amp; ₹11000 packages, or an optional ₹501 add-on in the ₹1100 &amp; ₹2100 packages</p>",
    },
  ],
  faqs: [
    {
      question: "When exactly is this puja performed?",
      answer:
        "On Friday, 4 September 2026 — Krishna Janmashtami. The main seva is performed around the Nishith Kaal (midnight muhurat), and the exact timing is confirmed with you on WhatsApp before the puja begins.",
    },
    {
      question: "Will I get the puja video?",
      answer:
        "Yes. The full puja video, with your name and gotra taken during the Sankalp, is shared with you on WhatsApp after the seva.",
    },
    {
      question: "Who is Banke Bihari Ji?",
      answer:
        "Banke Bihari Ji is the beloved swaroop of Shri Krishna Ji worshipped at Vrindavan. 'Banke' means bent in three places (tribhanga) and 'Bihari' means the supreme enjoyer. He is known as the deity of prem and kripa.",
    },
    {
      question: "Is the prasad box included?",
      answer:
        "The prasad box is FREE in the ₹5100 Shringar Seva (dry prasad, murli, jaap counter, Radha naam tulsi mala, mor pankh, a small handi for Laddu Gopal Ji and 3 Laddu Gopal Ji dresses) and in the ₹11000 Raj Bhog Seva, which also adds a brass Laddu Gopal Ji idol and carries 5 Laddu Gopal Ji dresses. In the ₹1100 and ₹2100 packages it is an optional ₹501 add-on chosen during booking.",
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
    { $set: BANKE_BIHARI_PUJA },
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
