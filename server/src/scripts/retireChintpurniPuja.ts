/**
 * Retires the Maa Chintpurni / Shri Durga Mata campaign puja (poojaID RF_18).
 *
 * WHAT IT DOES
 * ────────────
 * Sets `isActive: false` on the catalog row. That hides it from
 * /fetch-all-poojas, the category listings, homepage search and the
 * /puja/<id> detail page — everywhere the site reads the catalog.
 *
 * WHAT IT DOES NOT DO
 * ───────────────────
 * It does NOT delete the row. Past bookings carry this `poojaId`, so deleting
 * it would break admin lookups and any report that joins back to the catalog.
 * Existing bookings are unaffected either way: `poojaNameEng` is denormalised
 * onto each booking document at creation time, so already-booked pujas keep
 * their name and continue to appear in devotees' "My Pujas".
 *
 * REVERSIBLE
 * ──────────
 * Re-activate with --undo (sets isActive back to true).
 *
 * USAGE
 * ─────
 *   # preview (no write) — always run this first
 *   MODE=production npx ts-node src/scripts/retireChintpurniPuja.ts --dry-run
 *
 *   # retire
 *   MODE=production npx ts-node src/scripts/retireChintpurniPuja.ts
 *
 *   # bring the campaign back
 *   MODE=production npx ts-node src/scripts/retireChintpurniPuja.ts --undo
 */

import "../config/loadEnv";

import { panditJiAtRequestMongooose } from "../config/connectDB";
import Pooja from "../model/userApp/poojaModel";

/** The campaign puja's stable catalog key. */
const POOJA_ID = "RF_18";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const undo = process.argv.includes("--undo");
  const nextActive = undo; // --undo -> true, default -> false

  const uri = process.env.MONGO_URI || "";
  const host = uri.replace(/^mongodb(\+srv)?:\/\/[^@]*@/, "").split(/[/?]/)[0];
  console.log(`[retire] MODE=${process.env.MODE} cluster=${host || "(unset)"}`);
  console.log(`[retire] action: set isActive=${nextActive} on poojaID=${POOJA_ID}`);

  if (!uri) {
    console.error("[retire] MONGO_URI is not set — aborting.");
    process.exit(1);
  }

  await panditJiAtRequestMongooose.connect(uri);

  const row: any = await Pooja.findOne({ poojaID: POOJA_ID }).lean();
  if (!row) {
    console.error(`[retire] no pooja found with poojaID=${POOJA_ID} — nothing to do.`);
    await panditJiAtRequestMongooose.disconnect();
    process.exit(1);
  }

  console.log(`[retire] found "${row.poojaNameEng}"  _id=${row._id}  isActive=${row.isActive}`);

  if (row.isActive === nextActive) {
    console.log(`[retire] already isActive=${nextActive} — no change needed.`);
    await panditJiAtRequestMongooose.disconnect();
    return;
  }

  if (dryRun) {
    console.log("[retire] --dry-run: no write performed.");
    await panditJiAtRequestMongooose.disconnect();
    return;
  }

  const updated: any = await Pooja.findOneAndUpdate(
    { poojaID: POOJA_ID },
    { $set: { isActive: nextActive, isFeatured: false, isExclusive: false } },
    { new: true }
  );

  console.log(`[retire] done. "${updated.poojaNameEng}" isActive=${updated.isActive}`);
  console.log("[retire] bookings already placed are untouched.");

  await panditJiAtRequestMongooose.disconnect();
}

main().catch(async (err) => {
  console.error("[retire] failed:", err?.message || err);
  try {
    await panditJiAtRequestMongooose.disconnect();
  } catch {
    /* already closed */
  }
  process.exit(1);
});
