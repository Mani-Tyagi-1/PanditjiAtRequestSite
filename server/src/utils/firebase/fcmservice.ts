import DeviceToken from "../../models/firebaseNotification/Devicetoken";
import { getFirebaseMessagingByAppType } from "../firebase/firebaseamdin";

type AppType = "user" | "pandit";

function toStr(v: any): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

export async function sendFcmToUser(params: {
  userId: string;
  appType: AppType; // ✅ REQUIRED in multi-app setup
  data: Record<string, any>;
  ttlSeconds?: number;
  androidOnly?: boolean;
}) {
  const query: any = {
    userId: String(params.userId),
    appType: params.appType, // ✅ critical fix
    fcmToken: { $exists: true, $ne: null },
  };

  if (params.androidOnly) query.platform = "android";

  const devices = await DeviceToken.find(query).lean();
  const tokens = devices.map((d: any) => d.fcmToken).filter(Boolean) as string[];

  if (!tokens.length) {
    return { ok: true, sent: 0, failed: 0, details: [] as any[] };
  }

  const ttlSeconds =
    params.ttlSeconds ?? Number(process.env.FCM_DEFAULT_TTL_SECONDS ?? 60);

  // ✅ FCM data payload values must be strings
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(params.data || {})) {
    data[k] = toStr(v);
  }

  const messaging = getFirebaseMessagingByAppType(params.appType);

  const res = await messaging.sendEachForMulticast({
    tokens,
    data,
    android: {
      priority: "high",
      ttl: ttlSeconds * 1000,
    },
  });

  const details = res.responses.map((r, i) => ({
    token: tokens[i],
    success: r.success,
    error: r.error?.code,
  }));

  // ✅ Cleanup invalid tokens automatically
  const invalid = details
    .filter(
      (d) =>
        d.error === "messaging/registration-token-not-registered" ||
        d.error === "messaging/invalid-registration-token"
    )
    .map((d) => d.token);

  if (invalid.length) {
    await DeviceToken.updateMany(
      { appType: params.appType, fcmToken: { $in: invalid } },
      { $set: { fcmToken: null } }
    );
  }

  return {
    ok: true,
    sent: res.successCount,
    failed: res.failureCount,
    details,
  };
}
