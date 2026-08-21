/**
 * Read-only check of the Meta Conversions API credentials.
 *
 * WHY THIS EXISTS
 * ───────────────
 * A CAPI failure is invisible from the product: `sendMetaPurchaseEvent` is
 * fire-and-forget, so a bad pixel id or an unauthorised token shows up only as
 * a line in the server log — and every Purchase silently stops reaching Meta
 * while the ads keep spending against a model that no longer sees conversions.
 *
 * `GraphMethodException` with code 100 / subcode 33 on the /events endpoint
 * means "object does not exist, or you lack permission on it". This script
 * separates the two possibilities without sending any event:
 *
 *   • the pixel object cannot be read at all  → wrong META_PIXEL_ID
 *   • the pixel reads but /events is refused  → token lacks permission on it
 *
 * STRICTLY READ-ONLY. No events are sent. The access token is never printed —
 * only its length and a short fingerprint, so two environments can be compared
 * without the value ever appearing in a terminal or a log.
 *
 * USAGE
 *   MODE=production npx ts-node src/scripts/diagnoseMetaCapi.ts
 */

import "../config/loadEnv";
import crypto from "crypto";
import axios from "axios";

const pixelId = (process.env.META_PIXEL_ID || "").trim();
const token = (process.env.META_ACCESS_TOKEN || "").trim();
const apiVersion = (process.env.META_GRAPH_API_VERSION || "v24.0").trim();

const fingerprint = (s: string) =>
  s ? `sha1:${crypto.createHash("sha1").update(s).digest("hex").slice(0, 12)} (len ${s.length})` : "(unset)";

/** Pulls the useful bits out of a Graph API error without dumping the payload. */
function describe(e: any): string {
  const err = e?.response?.data?.error;
  if (!err) return e?.message || String(e);
  const parts = [
    `${err.type || "Error"} code=${err.code}`,
    err.error_subcode ? `subcode=${err.error_subcode}` : "",
    err.message ? `— ${err.message}` : "",
  ].filter(Boolean);
  return parts.join(" ");
}

async function main() {
  console.log(`[meta] MODE=${process.env.MODE} PAYMENT_MODE=${process.env.PAYMENT_MODE}`);
  console.log(`[meta] pixel id     : ${pixelId || "(unset)"}`);
  console.log(`[meta] access token : ${fingerprint(token)}`);
  console.log(`[meta] api version  : ${apiVersion}\n`);

  if (!pixelId || !token) {
    console.log("❌ META_PIXEL_ID or META_ACCESS_TOKEN is unset — CAPI is skipped entirely.");
    process.exit(1);
  }

  if (!/^\d+$/.test(pixelId)) {
    console.log(`⚠️  META_PIXEL_ID is not all digits. A pixel / dataset id is numeric —`);
    console.log(`   this looks like something else (an app id string, or a stray quote).\n`);
  }

  // ── 1) Can the token read the pixel object at all? ────────────────────────
  console.log("── 1. Can the token see this pixel? ────────────────────────────");
  let pixelReadable = false;
  try {
    const r = await axios.get(`https://graph.facebook.com/${apiVersion}/${pixelId}`, {
      params: { fields: "id,name,is_created_by_business", access_token: token },
      timeout: 20000,
    });
    pixelReadable = true;
    console.log(`  ✅ readable — name: ${r.data?.name ?? "(no name)"}  id: ${r.data?.id}`);
  } catch (e: any) {
    const err = e?.response?.data?.error;
    console.log(`  ❌ ${describe(e)}`);
    if (err?.code === 100 && err?.error_subcode === 33) {
      console.log(`\n  → This is the same error your server logged. The id ${pixelId}`);
      console.log(`    is not a pixel this token can reach. Either the id is wrong, or`);
      console.log(`    the token belongs to a different business / system user.`);
      console.log(`    Fix: Events Manager → Data Sources → your pixel → copy the`);
      console.log(`    numeric Dataset ID, and generate the token from the SAME business.`);
    } else if (err?.code === 190) {
      console.log(`\n  → The token itself is invalid or expired. Generate a new`);
      console.log(`    System User token in Business Settings and update META_ACCESS_TOKEN.`);
    }
  }

  // ── 2) Is the /events edge itself reachable? ──────────────────────────────
  // Sent with NO data payload on purpose: Meta validates the route and the
  // permission before it validates the events array, so an auth problem and a
  // payload problem come back as clearly different errors — and nothing is
  // recorded either way.
  console.log("\n── 2. Is the /events edge writable? ────────────────────────────");
  try {
    await axios.post(
      `https://graph.facebook.com/${apiVersion}/${pixelId}/events`,
      new URLSearchParams({ data: "[]", access_token: token }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 20000 },
    );
    console.log("  ✅ accepted an empty batch — credentials are good, CAPI should work.");
  } catch (e: any) {
    const err = e?.response?.data?.error;
    console.log(`  ❌ ${describe(e)}`);
    if (err?.code === 100 && err?.error_subcode === 33) {
      console.log(`\n  → Confirms the server-log error. CAPI Purchase events are NOT`);
      console.log(`    reaching Meta right now.`);
    } else if (err?.code === 200 || err?.code === 10) {
      console.log(`\n  → The pixel exists but this token lacks the ads_management /`);
      console.log(`    business_management permission on it. Re-issue the System User`);
      console.log(`    token with the pixel assigned as an asset.`);
    }
  }

  console.log("");
  if (pixelReadable) {
    console.log("[meta] The pixel id resolves. If step 2 failed, it is a permission problem.");
  } else {
    console.log("[meta] The pixel id does not resolve — fix that first; step 2 cannot pass.");
  }
  console.log("[meta] done — no events were sent.");
}

main().catch((e) => {
  console.error("[meta] failed:", e?.message || e);
  process.exit(1);
});
