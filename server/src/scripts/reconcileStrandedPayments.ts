/**
 * Recovers bookings that were PAID but never confirmed.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The Razorpay webhook (POST /api/payments/razorpay/webhook) confirms payments
 * server-to-server, so a devotee whose browser died after paying still gets
 * their booking. But it only covers events fired from the moment it goes live —
 * Razorpay does not replay old ones. Anything stranded BEFORE that is still
 * sitting unconfirmed, with the money already taken.
 *
 * This script closes that gap once: it walks every unconfirmed row, asks
 * Razorpay what actually happened to each order, and confirms the ones that
 * were genuinely captured. After the initial run you should never need it again
 * — but it is safe to re-run (every reconciler is idempotent).
 *
 * ⚠️  IT SENDS REAL MESSAGES
 * ─────────────────────────
 * Confirming a booking fires the full notification pipeline: WhatsApp, email,
 * push. For an OLD stranded booking that means messaging a devotee about a puja
 * whose date may have already passed. Use --since-days to bound how far back
 * you reach, and ALWAYS read the dry-run output first.
 *
 * USAGE
 * ─────
 *   # preview only — no writes, no messages (this is the default)
 *   MODE=production npx ts-node src/scripts/reconcileStrandedPayments.ts
 *
 *   # only look at the last 7 days, then actually confirm them
 *   MODE=production npx ts-node src/scripts/reconcileStrandedPayments.ts --since-days=7 --apply
 *
 *   # limit to one service while testing
 *   MODE=production npx ts-node src/scripts/reconcileStrandedPayments.ts --only=pooja
 *   # services: pooja, liveMandir, chadhava, shop, paidConsultation, vivah
 */

import "../config/loadEnv";

import Razorpay from "razorpay";
import { panditJiAtRequestMongooose } from "../config/connectDB";

import pendingPoojaBookingModel from "../model/poojaBooking/pendingPoojaBooking.model";
import poojaBookingModel from "../model/poojaBooking/poojaBooking.model";
import ChadhavaBooking from "../model/userApp/chadhavaBookingModel";
import ShopifyOrder from "../model/userApp/shopifyOrderModel";
import PaidConsultation from "../model/userApp/paidConsultationModel";
import LiveMandirBooking from "../model/userApp/liveMandirBookingModel";
import VedicVivahBooking from "../model/userApp/vedicVivahBookingModel";

import { reconcilePoojaBookingPayment } from "../controller/poojaBooking/poojaBookingController";
import { reconcileLiveMandirPayment } from "../controller/userApp/liveMandirController";
import { reconcileChadhavaPayment } from "../controller/userApp/chadhavaController";
import { reconcileShopifyOrderPayment } from "../controller/userApp/shopifyOrderController";
import { reconcilePaidConsultationPayment } from "../controller/userApp/paidConsultationController";
import { reconcileVedicVivahPayment } from "../controller/userApp/vedicVivahBookingController";

const isProduction = process.env.PAYMENT_MODE === "production";
const razorpayKeyId = isProduction
  ? process.env.RAZORPAY_KEY_ID_LIVE
  : process.env.RAZORPAY_KEY_ID_TEST;
const razorpayKeySecret = isProduction
  ? process.env.RAZORPAY_KEY_SECRET_LIVE
  : process.env.RAZORPAY_KEY_SECRET_TEST;

const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

type Candidate = {
  service: string;
  orderId: string;
  label: string;
  createdAt?: Date;
};

/** Asks Razorpay whether an order was actually captured. */
async function fetchCapturedPayment(razorpay: Razorpay, orderId: string) {
  const result: any = await razorpay.orders.fetchPayments(orderId);
  const payments: any[] = Array.isArray(result?.items) ? result.items : [];
  return payments.find((p) => p?.status === "captured") || null;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const only = arg("only");
  const sinceDays = Number(arg("since-days") || 0);
  const since =
    sinceDays > 0 ? new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000) : null;

  const uri = process.env.MONGO_URI || "";
  const host = uri.replace(/^mongodb(\+srv)?:\/\/[^@]*@/, "").split(/[/?]/)[0];

  console.log(`[reconcile] MODE=${process.env.MODE} PAYMENT_MODE=${process.env.PAYMENT_MODE}`);
  console.log(`[reconcile] cluster=${host || "(unset)"}`);
  console.log(`[reconcile] mode=${apply ? "APPLY (writes + sends messages)" : "DRY RUN (no writes)"}`);
  console.log(`[reconcile] window=${since ? `since ${since.toISOString()}` : "all time"}`);
  if (only) console.log(`[reconcile] only=${only}`);

  if (!uri) {
    console.error("[reconcile] MONGO_URI is not set — aborting.");
    process.exit(1);
  }
  if (!razorpayKeyId || !razorpayKeySecret) {
    console.error("[reconcile] Razorpay credentials missing — aborting.");
    process.exit(1);
  }

  const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });

  await panditJiAtRequestMongooose.connect(uri);

  const dateFilter = since ? { createdAt: { $gte: since } } : {};
  const wanted = (s: string) => !only || only === s;

  const candidates: Candidate[] = [];

  if (wanted("pooja")) {
    const rows = await pendingPoojaBookingModel
      .find({ razorpayOrderId: { $exists: true, $ne: null }, ...dateFilter })
      .lean();
    for (const r of rows as any[]) {
      // Skip ones the client already promoted — the pending row is just litter.
      const already = await poojaBookingModel.exists({ razorpayOrderId: r.razorpayOrderId });
      if (already) continue;
      candidates.push({
        service: "pooja",
        orderId: r.razorpayOrderId,
        label: `${r.poojaNameEng} · ${r.userPhone} · ₹${r.amount} · ${new Date(r.bookingDate).toDateString()}`,
        createdAt: r.createdAt,
      });
    }
  }

  if (wanted("liveMandir")) {
    const rows = await LiveMandirBooking.find({
      paymentStatus: { $ne: "paid" },
      razorpayOrderId: { $exists: true, $ne: null },
      ...dateFilter,
    }).lean();
    for (const r of rows as any[]) {
      candidates.push({
        service: "liveMandir",
        orderId: r.razorpayOrderId,
        label: `${r.pujaName} · ${r.phone} · ₹${r.amount}`,
        createdAt: r.createdAt,
      });
    }
  }

  if (wanted("chadhava")) {
    const rows = await ChadhavaBooking.find({
      paymentStatus: { $ne: "paid" },
      razorpayOrderId: { $exists: true, $ne: null },
      ...dateFilter,
    }).lean();
    for (const r of rows as any[]) {
      candidates.push({
        service: "chadhava",
        orderId: r.razorpayOrderId,
        label: `${r.deity || r.chadhavaName} · ${r.phone} · ₹${r.totalAmount}`,
        createdAt: r.createdAt,
      });
    }
  }

  if (wanted("shop")) {
    const rows = await ShopifyOrder.find({
      paymentStatus: { $ne: "paid" },
      paymentMethod: { $ne: "cod" },
      razorpayOrderId: { $exists: true, $ne: null },
      ...dateFilter,
    }).lean();
    for (const r of rows as any[]) {
      candidates.push({
        service: "shop",
        orderId: r.razorpayOrderId,
        label: `${r.customerName} · ${r.phone} · ₹${r.totalAmount}`,
        createdAt: r.createdAt,
      });
    }
  }

  if (wanted("paidConsultation")) {
    const rows = await PaidConsultation.find({
      isPaymentDone: { $ne: true },
      razorpayOrderId: { $exists: true, $ne: null },
      ...dateFilter,
    }).lean();
    for (const r of rows as any[]) {
      candidates.push({
        service: "paidConsultation",
        orderId: r.razorpayOrderId,
        label: `${r.fullName} · ${r.mobileNumber} · ₹${r.amount}`,
        createdAt: r.createdAt,
      });
    }
  }

  if (wanted("vivah")) {
    // `bookingType: consultation` leads never raise an order, so the
    // razorpayOrderId filter already excludes them.
    const rows = await VedicVivahBooking.find({
      isPaymentDone: { $ne: true },
      razorpayOrderId: { $exists: true, $ne: null },
      ...dateFilter,
    }).lean();
    for (const r of rows as any[]) {
      candidates.push({
        service: "vivah",
        orderId: r.razorpayOrderId,
        label: `${r.packageName || "Vedic Vivah"} · ${r.whatsapp} · ₹${
          r.paymentOption === "full" ? r.totalAmount : r.advanceAmount
        }`,
        createdAt: r.createdAt,
      });
    }
  }

  console.log(`\n[reconcile] ${candidates.length} unconfirmed row(s) to check against Razorpay.\n`);

  let paid = 0;
  let confirmed = 0;
  const failures: string[] = [];

  for (const c of candidates) {
    let captured: any = null;
    try {
      captured = await fetchCapturedPayment(razorpay, c.orderId);
    } catch (e: any) {
      // A 400 here usually means the order id no longer exists (test-mode key
      // against live orders, or vice versa) — worth surfacing, not fatal.
      failures.push(`${c.service} ${c.orderId}: ${e?.error?.description || e?.message || e}`);
      continue;
    }

    if (!captured) continue; // genuinely abandoned — leave it alone

    paid++;
    const when = c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : "unknown";
    console.log(`  💰 PAID BUT UNCONFIRMED  [${c.service}] ${c.orderId}  (${when})  ${c.label}`);

    if (!apply) continue;

    try {
      const opts = { orderId: c.orderId, paymentId: captured.id, event: "payment.captured" };
      switch (c.service) {
        case "pooja":
          await reconcilePoojaBookingPayment({ ...opts, amountPaise: captured.amount });
          break;
        case "liveMandir":
          await reconcileLiveMandirPayment(opts);
          break;
        case "chadhava":
          await reconcileChadhavaPayment(opts);
          break;
        case "shop":
          await reconcileShopifyOrderPayment(opts);
          break;
        case "paidConsultation":
          await reconcilePaidConsultationPayment(opts);
          break;
        case "vivah":
          await reconcileVedicVivahPayment({ ...opts, amountPaise: captured.amount });
          break;
      }
      confirmed++;
      console.log(`     ↳ ✅ confirmed`);
    } catch (e: any) {
      failures.push(`${c.service} ${c.orderId}: ${e?.message || e}`);
      console.log(`     ↳ ❌ ${e?.message || e}`);
    }
  }

  console.log(`\n[reconcile] ── summary ──`);
  console.log(`[reconcile] checked            : ${candidates.length}`);
  console.log(`[reconcile] paid but unconfirmed: ${paid}`);
  console.log(`[reconcile] confirmed now      : ${apply ? confirmed : 0}${apply ? "" : "  (dry run — re-run with --apply)"}`);
  if (failures.length) {
    console.log(`[reconcile] errors             : ${failures.length}`);
    failures.forEach((f) => console.log(`   - ${f}`));
  }

  // Notifications are fire-and-forget; give them a moment to flush before exit.
  if (apply && confirmed > 0) {
    console.log(`[reconcile] waiting 15s for notifications to flush...`);
    await new Promise((r) => setTimeout(r, 15_000));
  }

  await panditJiAtRequestMongooose.disconnect();
}

main().catch(async (err) => {
  console.error("[reconcile] failed:", err?.message || err);
  try {
    await panditJiAtRequestMongooose.disconnect();
  } catch {
    /* already closed */
  }
  process.exit(1);
});
