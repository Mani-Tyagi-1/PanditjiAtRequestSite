/**
 * Proves whether a given secret is the one your LIVE endpoint accepts.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Razorpay never shows a webhook's secret again after you create it, so the
 * value in .env.production cannot be compared against the dashboard directly.
 * This closes the loop from the other side: it signs a payload with the secret
 * the SERVER is configured with and posts it to the real endpoint.
 *
 *   200 → the server accepts payloads signed with this secret. Any remaining
 *         failure is on the dashboard side (different secret typed there).
 *   400 → the server rejects it. The secret in your env is not what the
 *         running process is using — wrong file, stale deploy, or unset var.
 *
 * The payload carries NO order id. That is deliberate: it passes the signature
 * check and then hits the `has no order id — ignored` early return, so no
 * reconciler runs, no booking changes, and no message is sent. Completely inert.
 *
 * USAGE
 * ─────
 *   # against production (uses RAZORPAY_WEBHOOK_SECRET from .env.production)
 *   MODE=production npx ts-node src/scripts/pingWebhookSignature.ts \
 *     --url=https://api.panditjiatrequest.com/api/payments/razorpay/webhook
 *
 *   # prove a REJECTION looks different (sanity-check the test itself)
 *   ... --url=<same> --secret=deliberately-wrong
 */

import "../config/loadEnv";
import crypto from "crypto";

const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

const isProduction = process.env.PAYMENT_MODE === "production";

async function main() {
  const url = arg("url");
  if (!url) {
    console.error("Missing --url=<your webhook endpoint>");
    process.exit(1);
  }

  // Same resolution order as the handler in razorpayWebhookController.ts.
  const secret =
    arg("secret") ||
    (isProduction
      ? process.env.RAZORPAY_WEBHOOK_SECRET_LIVE
      : process.env.RAZORPAY_WEBHOOK_SECRET_TEST) ||
    process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("No webhook secret found in env (RAZORPAY_WEBHOOK_SECRET).");
    process.exit(1);
  }

  // No order id → the handler acks and returns before touching any reconciler.
  const body = JSON.stringify({ event: "ping.signature_selftest", payload: {} });
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  const fingerprint = crypto.createHash("sha1").update(secret).digest("hex").slice(0, 12);
  console.log(`[ping] PAYMENT_MODE=${process.env.PAYMENT_MODE}`);
  console.log(`[ping] secret fingerprint sha1:${fingerprint} (len ${secret.length})`);
  console.log(`[ping] POST ${url}\n`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": signature,
    },
    body,
  });

  const text = await res.text();
  console.log(`[ping] HTTP ${res.status}`);
  console.log(`[ping] body: ${text.slice(0, 400)}\n`);

  if (res.status === 200) {
    console.log("✅ The running server ACCEPTS this secret.");
    console.log("   If webhooks are still failing, the dashboard has a different");
    console.log("   secret — re-enter this one there (Settings → Webhooks → Edit).");
  } else if (res.status === 400) {
    console.log("❌ The running server REJECTED this secret.");
    console.log("   The deployed process is not using the value you just signed with:");
    console.log("   check which env file the server actually loads, and redeploy/restart.");
  } else {
    console.log("⚠️  Unexpected status — the request may not have reached the handler");
    console.log("   (nginx, auth middleware, or a wrong path).");
  }
}

main().catch((e) => {
  console.error("[ping] failed:", e?.message || e);
  process.exit(1);
});
