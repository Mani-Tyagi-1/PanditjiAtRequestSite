// utils/oneSignal.ts
import crypto from "crypto";

/**
 * OneSignal (REST API) helpers
 *
 * - sendPushNotification: send immediately
 * - schedulePujaDayReminder: schedule for 00:00 IST on a given calendar date
 */

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID!;             // UUID (public)
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!; // REST API Key (secret)

if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
  console.warn("⚠️ OneSignal env vars missing; notifications disabled.");
}

type PushPayload = {
  externalIds?: string[]; // aliases: external_id values
  heading?: string;
  content: string;
  data?: Record<string, any>;
  ttlSeconds?: number;
  tagFilter?: { city?: string; lang?: string };
};

type SchedulePayload = {
  externalIds?: string[];
  heading?: string;
  content: string;
  data?: Record<string, any>;
  bookingDate: Date | string;
  tagFilter?: { city?: string; lang?: string };
};

/** Internal: call OneSignal API */
async function postOneSignal(body: Record<string, any>) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    return { success: false, reason: "missing-config" as const };
  }

  try {
    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ⬇️ IMPORTANT: must be `Key`, not `Bearer`
        Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("OneSignal error:", res.status, json);
      return { success: false as const, status: res.status, json };
    }

    return { success: true as const, id: (json as any)?.id, json };
  } catch (err) {
    console.error("OneSignal fetch failed:", err);
    return { success: false as const, reason: "network-error", error: String(err) };
  }
}

/** Build filters for tag-based targeting (role=pandit, is_active=true, + optional city/lang) */
function buildFilters(tagFilter?: { city?: string; lang?: string }) {
  const filters: any[] = [
    { field: "tag", key: "role", relation: "=", value: "pandit" },
    { field: "tag", key: "is_active", relation: "=", value: "true" },
  ];
  if (tagFilter?.city) {
    filters.push({ field: "tag", key: "city", relation: "=", value: tagFilter.city });
  }
  if (tagFilter?.lang) {
    filters.push({ field: "tag", key: "lang", relation: "=", value: tagFilter.lang });
  }
  return filters;
}

/** Send an immediate push */
export async function sendPushNotification({
  externalIds,
  heading,
  content,
  data,
  ttlSeconds = 60 * 60 * 12,
  tagFilter,
}: PushPayload) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    return { success: false, reason: "missing-config-or-targets" as const };
  }

  const body: any = {
    app_id: ONESIGNAL_APP_ID,
    contents: { en: content },
    ttl: ttlSeconds,
    android_channel_id: process.env.OS_ANDROID_CHANNEL_ID || "puja_requests",
  };

  if (heading) body.headings = { en: heading };
  if (data) body.data = data;

  if (externalIds && externalIds.length) {
    // 🔑 send to specific external_ids
    body.include_aliases = { external_id: externalIds };
    body.target_channel = "push";
  } else {
    // 🎯 fallback to tag-based targeting for pandits
    body.filters = buildFilters(tagFilter);
  }

  return postOneSignal(body);
}

/** Compute UTC send_after for 00:00 IST on booking day */
function utcStringForISTMidnight(bookingDate: Date | string): string {
  const d = new Date(bookingDate);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();

  // 00:00 IST of (y-m-day) == 18:30 UTC (previous day)
  const sendAfterUTC = new Date(Date.UTC(y, m, day - 1, 18, 30, 0));
  return sendAfterUTC.toUTCString();
}

/** Schedule push for puja day 00:00 IST */
export async function schedulePujaDayReminder({
  externalIds,
  heading,
  content,
  data,
  bookingDate,
  tagFilter,
}: SchedulePayload) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    return { success: false, reason: "missing-config-or-targets" as const };
  }

  const body: any = {
    app_id: ONESIGNAL_APP_ID,
    contents: { en: content },
    send_after: utcStringForISTMidnight(bookingDate),
    android_channel_id: process.env.OS_ANDROID_CHANNEL_ID || "puja_requests",
  };

  if (heading) body.headings = { en: heading };
  if (data) body.data = data;

  if (externalIds && externalIds.length) {
    body.include_aliases = { external_id: externalIds };
    body.target_channel = "push";
  } else {
    body.filters = buildFilters(tagFilter);
  }

  const resp = await postOneSignal(body);
  if (!(resp as any)?.success) {
    console.error("OneSignal schedule error; send_after:", body.send_after);
  }
  return resp;
}
