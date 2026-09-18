import { RequestHandler } from "express";
import crypto from "crypto";
import { Server as SocketIOServer } from "socket.io";

import { reconcilePoojaBookingPayment } from "../poojaBooking/poojaBookingController";
import { reconcileLiveMandirPayment } from "../userApp/liveMandirController";
import { reconcileChadhavaPayment } from "../userApp/chadhavaController";
import { reconcileShopifyOrderPayment } from "../userApp/shopifyOrderController";
import { reconcilePaidConsultationPayment } from "../userApp/paidConsultationController";

// -------------------------------------------------------------
// SHARED RAZORPAY WEBHOOK
// -------------------------------------------------------------
// One endpoint for every service that charges through Razorpay:
//
//   • Puja bookings (normal + Live Mandir) → PendingPoojaBooking → PoojaBooking
//   • Chadhava bookings
//   • Shop orders
//   • Paid consultations
//
// Why this exists: the client-side "complete payment" call is not a reliable
// signal. The devotee's money is captured by Razorpay, then the browser tab is
// closed / the app is killed / the network drops before it can tell us — and the
// booking sits in the pending collection forever even though it was paid for.
// Razorpay retries this server-to-server call until we return 2xx, so it is the
// authoritative confirmation.
//
// Every reconciler below is idempotent and keyed on razorpayOrderId, so it is
// safe for both the browser and this webhook to confirm the same order (and for
// Razorpay to redeliver the same event).
//
// Configure in Razorpay Dashboard → Settings → Webhooks:
//   URL     : https://<your-api-host>/api/payments/razorpay/webhook
//   Secret  : RAZORPAY_WEBHOOK_SECRET (see below)
//   Events  : payment.captured, payment.failed, order.paid
// -------------------------------------------------------------

const isProduction = process.env.PAYMENT_MODE === "production";

/**
 * Razorpay issues a separate webhook secret per mode (test vs live). Prefer the
 * mode-specific var when present so switching PAYMENT_MODE doesn't silently
 * verify against the wrong secret; fall back to the single shared var that the
 * existing per-service webhooks already use.
 */
const getWebhookSecret = (): string | undefined =>
  (isProduction
    ? process.env.RAZORPAY_WEBHOOK_SECRET_LIVE
    : process.env.RAZORPAY_WEBHOOK_SECRET_TEST) || process.env.RAZORPAY_WEBHOOK_SECRET;

/** Timing-safe compare so the signature check can't be probed byte by byte. */
const signatureMatches = (expected: string, received: string): boolean => {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

export const razorpayWebhook: RequestHandler = async (req, res) => {
  try {
    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) {
      // Not configured — acknowledge so Razorpay stops retrying, but make the
      // misconfiguration loud in the logs.
      console.warn("[RazorpayWebhook] RAZORPAY_WEBHOOK_SECRET not set — event ignored.");
      res.status(200).json({ success: true, message: "Webhook not configured" });
      return;
    }

    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    // Populated by the express.json({ verify }) hook in src/index.ts.
    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!signature || !rawBody) {
      res.status(400).json({ success: false, message: "Missing webhook signature/body" });
      return;
    }

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!signatureMatches(expected, signature)) {
      console.warn("[RazorpayWebhook] Invalid signature — event rejected.");
      res.status(400).json({ success: false, message: "Invalid webhook signature" });
      return;
    }

    const payload = JSON.parse(rawBody.toString());
    const eventName: string = payload?.event || "";
    const paymentEntity = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;

    // `order.paid` carries the order entity; `payment.*` carries the payment.
    const orderId: string | undefined = paymentEntity?.order_id || orderEntity?.id;
    const paymentId: string | undefined = paymentEntity?.id;
    const amountPaise: number | undefined =
      typeof paymentEntity?.amount === "number"
        ? paymentEntity.amount
        : typeof orderEntity?.amount_paid === "number"
          ? orderEntity.amount_paid
          : undefined;

    if (!orderId) {
      console.log(`[RazorpayWebhook] event=${eventName} has no order id — ignored.`);
      res.status(200).json({ success: true });
      return;
    }

    const relevant =
      eventName === "payment.captured" ||
      eventName === "order.paid" ||
      eventName === "payment.failed";

    if (!relevant) {
      console.log(`[RazorpayWebhook] event=${eventName} not handled — acknowledged.`);
      res.status(200).json({ success: true });
      return;
    }

    // Acknowledge only after processing so a crash mid-way makes Razorpay retry.
    const io = req.app.get("io") as SocketIOServer | undefined;
    const activePanditExternalIds = (() => {
      const val = req.app?.get("activePanditExternalIds");
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(Boolean);
      if (val instanceof Set) return Array.from(val).filter(Boolean) as string[];
      return [];
    })();

    const handled: string[] = [];

    // Order matters: promote the puja booking FIRST so the Live Mandir
    // reconciler can repoint normalBookingId at the final booking.
    const runners: Array<[string, () => Promise<boolean>]> = [
      [
        "pooja",
        () =>
          reconcilePoojaBookingPayment({
            orderId,
            paymentId,
            event: eventName,
            amountPaise,
            io,
            activePanditExternalIds,
          }),
      ],
      ["liveMandir", () => reconcileLiveMandirPayment({ orderId, paymentId, event: eventName })],
      ["chadhava", () => reconcileChadhavaPayment({ orderId, paymentId, event: eventName })],
      ["shop", () => reconcileShopifyOrderPayment({ orderId, paymentId, event: eventName })],
      [
        "paidConsultation",
        () => reconcilePaidConsultationPayment({ orderId, paymentId, event: eventName }),
      ],
    ];

    // Every reconciler runs — a Live Mandir order legitimately matches two of
    // them (PoojaBooking + LiveMandirBooking). One failing service must not stop
    // the others, so each is isolated.
    for (const [name, run] of runners) {
      try {
        if (await run()) handled.push(name);
      } catch (e: any) {
        console.error(`[RazorpayWebhook] ${name} reconciler failed for order=${orderId}:`, e?.message || e);
      }
    }

    if (!handled.length) {
      // Not one of ours (or the row was deleted). Ack so Razorpay stops retrying.
      console.warn(`[RazorpayWebhook] event=${eventName} order=${orderId} matched no service.`);
    } else {
      console.log(
        `[RazorpayWebhook] event=${eventName} order=${orderId} handled by: ${handled.join(", ")}`,
      );
    }

    res.status(200).json({ success: true, event: eventName, orderId, handled });
  } catch (error: any) {
    console.error("[RazorpayWebhook] processing failed:", error?.message || error);
    // Non-2xx makes Razorpay retry with backoff — which is what we want here.
    res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};
