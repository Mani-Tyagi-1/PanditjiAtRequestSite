/**
 * Retires the Ujjain Savan Rudrabhishek campaign (poojaID RF_SAVAN_01).
 * The catalog row is kept for historical booking/admin lookups, but hidden
 * from active catalog endpoints. Existing bookings are not modified.
 *
 * Usage:
 *   npx ts-node src/scripts/retireSavanPuja.ts --dry-run
 *   npx ts-node src/scripts/retireSavanPuja.ts
 *   npx ts-node src/scripts/retireSavanPuja.ts --undo
 */

import "../config/loadEnv";

import { panditJiAtRequestMongooose } from "../config/connectDB";
import Pooja from "../model/userApp/poojaModel";

const POOJA_ID = "RF_SAVAN_01";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const undo = process.argv.includes("--undo");
  const nextActive = undo;
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

  console.log(`[retire] found "${row.poojaNameEng}" _id=${row._id} isActive=${row.isActive}`);

  if (row.isActive === nextActive || dryRun) {
    console.log(dryRun ? "[retire] --dry-run: no write performed." : `[retire] already isActive=${nextActive} — no change needed.`);
    await panditJiAtRequestMongooose.disconnect();
    return;
  }

  const updated: any = await Pooja.findOneAndUpdate(
    { poojaID: POOJA_ID },
    { $set: { isActive: nextActive, isFeatured: false, isExclusive: false } },
    { new: true }
  );

  console.log(`[retire] done. "${updated.poojaNameEng}" isActive=${updated.isActive}`);
  console.log("[retire] existing bookings are untouched.");
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
