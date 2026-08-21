/**
 * Read-only health check for the Razorpay payment pipeline.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Two things decide whether a paid booking ever gets confirmed, and neither is
 * visible from the code:
 *
 *   1. Is the account set to AUTO-CAPTURE? `payment_capture` is deliberately
 *      omitted at order creation (it races the UPI collect window), so the
 *      account default decides. If that default is manual, payments sit at
 *      `authorized`, `payment.captured` never fires, and Razorpay auto-refunds
 *      them after ~5 days.
 *
 *   2. Is the webhook actually registered, active, and subscribed to the events
 *      the handler cares about (`payment.captured`, `order.paid`)?
 *
 * This script answers both from the Razorpay API, then cross-references every
 * captured payment against the database to count what is genuinely stranded.
 *
 * It is STRICTLY READ-ONLY: no writes, no messages, no captures. Safe to run
 * against production any time.
 *
 * NOTE: the webhook SECRET cannot be checked here — Razorpay never returns it
 * after creation. Use the signature self-test in the docs section below, or
 * simply re-enter the secret in the dashboard to remove the doubt.
 *
 * USAGE
 * ─────
 *   MODE=production npx ts-node src/scripts/diagnosePayments.ts
 *   MODE=production npx ts-node src/scripts/diagnosePayments.ts --since-days=30
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

const isProduction = process.env.PAYMENT_MODE === "production";
const razorpayKeyId = isProduction
  ? process.env.RAZORPAY_KEY_ID_LIVE
  : process.env.RAZORPAY_KEY_ID_TEST;
const razorpayKeySecret = isProduction
  ? process.env.RAZORPAY_KEY_SECRET_LIVE
  : process.env.RAZORPAY_KEY_SECRET_TEST;

const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

/** Pulls every payment in the window, 100 at a time (the API's page cap). */
async function fetchPayments(razorpay: Razorpay, from: number, to: number) {
  const out: any[] = [];
  let skip = 0;
  for (;;) {
    const page: any = await razorpay.payments.all({ from, to, count: 100, skip });
    const items: any[] = Array.isArray(page?.items) ? page.items : [];
    out.push(...items);
    if (items.length < 100) break;
    skip += 100;
    if (skip >= 10000) break; // API hard stop
  }
  return out;
}

/**
 * Which service an order belongs to, and whether it reached a confirmed state.
 * `null` means no row anywhere — a payment we have no record of at all.
 */
async function classifyOrder(orderId: string): Promise<{ service: string; confirmed: boolean } | null> {
  if (await poojaBookingModel.exists({ razorpayOrderId: orderId }))
    return { service: "pooja", confirmed: true };
  if (await pendingPoojaBookingModel.exists({ razorpayOrderId: orderId }))
    return { service: "pooja", confirmed: false };

  const live: any = await LiveMandirBooking.findOne({ razorpayOrderId: orderId }).lean();
  if (live) return { service: "liveMandir", confirmed: live.paymentStatus === "paid" };

  const chad: any = await ChadhavaBooking.findOne({ razorpayOrderId: orderId }).lean();
  if (chad) return { service: "chadhava", confirmed: chad.paymentStatus === "paid" };

  const shop: any = await ShopifyOrder.findOne({ razorpayOrderId: orderId }).lean();
  if (shop) return { service: "shop", confirmed: shop.paymentStatus === "paid" };

  const cons: any = await PaidConsultation.findOne({ razorpayOrderId: orderId }).lean();
  if (cons) return { service: "paidConsultation", confirmed: cons.isPaymentDone === true };

  const vivah: any = await VedicVivahBooking.findOne({ razorpayOrderId: orderId }).lean();
  if (vivah) return { service: "vivah", confirmed: vivah.isPaymentDone === true };

  return null;
}

async function main() {
  const sinceDays = Number(arg("since-days") || 14);
  const to = Math.floor(Date.now() / 1000);
  const from = to - sinceDays * 24 * 60 * 60;

  console.log(`[diagnose] PAYMENT_MODE=${process.env.PAYMENT_MODE} key=${razorpayKeyId?.slice(0, 12)}…`);
  console.log(`[diagnose] window=last ${sinceDays} day(s)\n`);

  if (!razorpayKeyId || !razorpayKeySecret) {
    console.error("[diagnose] Razorpay credentials missing — aborting.");
    process.exit(1);
  }

  const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });

  // ── 1) Webhook registration ───────────────────────────────────────────────
  console.log("── 1. WEBHOOKS REGISTERED ON THIS ACCOUNT ──────────────────────");
  try {
    const hooks: any = await razorpay.webhooks.all({} as any);
    const items: any[] = Array.isArray(hooks?.items) ? hooks.items : [];
    if (!items.length) {
      console.log("  ❌ NONE. No webhook is registered — nothing will ever be confirmed");
      console.log("     server-to-server. This alone explains stranded bookings.");
    }
    for (const h of items) {
      const events: string[] = Array.isArray(h.events)
        ? h.events
        : Object.keys(h.events || {}).filter((k) => (h.events as any)[k]);
      const hasCaptured = events.includes("payment.captured");
      const hasOrderPaid = events.includes("order.paid");
      console.log(`  url    : ${h.url}`);
      console.log(`  active : ${h.active === false ? "❌ NO" : "✅ yes"}`);
      console.log(`  events : ${events.join(", ") || "(none)"}`);
      console.log(`           payment.captured ${hasCaptured ? "✅" : "❌ MISSING"}  ` +
                  `order.paid ${hasOrderPaid ? "✅" : "⚠️  not subscribed"}`);
      console.log("");
    }
    console.log("  ℹ️  The webhook SECRET is not returned by the API and cannot be");
    console.log("     compared from here. See the signature self-test in the header.\n");
  } catch (e: any) {
    console.log(`  ⚠️  Could not list webhooks: ${e?.error?.description || e?.message || e}`);
    console.log("     (Some accounts restrict this endpoint — check the dashboard instead.)\n");
  }

  // ── 2) Capture mode ───────────────────────────────────────────────────────
  console.log("── 2. AUTO-CAPTURE CHECK ───────────────────────────────────────");
  const payments = await fetchPayments(razorpay, from, to);
  const byStatus: Record<string, number> = {};
  for (const p of payments) byStatus[p.status] = (byStatus[p.status] || 0) + 1;

  console.log(`  ${payments.length} payment(s) in window`);
  for (const [s, n] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${s.padEnd(12)} ${n}`);
  }

  // Auto-capture settles within seconds. Anything still `authorized` after half
  // an hour means the account is on MANUAL capture — the money is held but
  // `payment.captured` never fires, so no booking is ever confirmed.
  const STALE = 30 * 60;
  const nowSec = Math.floor(Date.now() / 1000);
  const stuck = payments.filter((p) => p.status === "authorized" && nowSec - p.created_at > STALE);

  if (stuck.length) {
    const held = stuck.reduce((s, p) => s + Number(p.amount || 0), 0);
    console.log(`\n  ❌ MANUAL CAPTURE LIKELY: ${stuck.length} payment(s) authorized but never`);
    console.log(`     captured, ${rupees(held)} held. Razorpay auto-refunds these after ~5 days.`);
    console.log(`     Fix: Dashboard → Account & Settings → Payment Capture → automatic.`);
    for (const p of stuck.slice(0, 10)) {
      const age = Math.round((nowSec - p.created_at) / 3600);
      console.log(`       ${p.id}  ${rupees(p.amount)}  ${p.method}  ${age}h old  order=${p.order_id}`);
    }
    if (stuck.length > 10) console.log(`       … and ${stuck.length - 10} more`);
  } else {
    console.log(`\n  ✅ No stale authorized payments — auto-capture appears to be ON.`);
  }
  console.log("");

  // ── 3) Captured but not confirmed ─────────────────────────────────────────
  console.log("── 3. CAPTURED BUT NOT CONFIRMED (the stranded set) ────────────");
  const uri = process.env.MONGO_URI || "";
  if (!uri) {
    console.log("  ⚠️  MONGO_URI unset — skipping the database cross-reference.\n");
  } else {
    await panditJiAtRequestMongooose.connect(uri);

    const captured = payments.filter((p) => p.status === "captured" && p.order_id);
    const stranded: any[] = [];
    const unknown: any[] = [];
    const perService: Record<string, { ok: number; bad: number }> = {};

    for (const p of captured) {
      const hit = await classifyOrder(p.order_id);
      if (!hit) {
        unknown.push(p);
        continue;
      }
      perService[hit.service] ??= { ok: 0, bad: 0 };
      if (hit.confirmed) perService[hit.service].ok++;
      else {
        perService[hit.service].bad++;
        stranded.push({ ...p, service: hit.service });
      }
    }

    console.log(`  ${captured.length} captured payment(s) checked\n`);
    console.log(`    service            confirmed   STRANDED`);
    for (const [svc, c] of Object.entries(perService)) {
      const flag = c.bad > 0 ? "  ❌" : "";
      console.log(`    ${svc.padEnd(18)} ${String(c.ok).padStart(9)} ${String(c.bad).padStart(10)}${flag}`);
    }

    if (stranded.length) {
      const lost = stranded.reduce((s, p) => s + Number(p.amount || 0), 0);
      console.log(`\n  ❌ ${stranded.length} paid booking(s) never confirmed — ${rupees(lost)} collected.`);
      console.log(`     These are also the Purchase events Meta/GA4 never received.`);
      console.log(`     Recover with: npx ts-node src/scripts/reconcileStrandedPayments.ts --since-days=${sinceDays}`);
      for (const p of stranded.slice(0, 15)) {
        const when = new Date(p.created_at * 1000).toISOString().slice(0, 10);
        console.log(`       [${p.service}] ${p.order_id}  ${rupees(p.amount)}  ${p.method}  ${when}`);
      }
      if (stranded.length > 15) console.log(`       … and ${stranded.length - 15} more`);
    } else {
      console.log(`\n  ✅ Every captured payment has a confirmed booking.`);
    }

    if (unknown.length) {
      console.log(`\n  ℹ️  ${unknown.length} captured payment(s) matched no collection at all`);
      console.log(`     (app-only flows, or orders created before a schema change).`);
    }
  }

  console.log("\n[diagnose] done — nothing was modified.");
}

main()
  .catch((e) => {
    console.error("[diagnose] failed:", e?.error?.description || e?.message || e);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode || 0));
