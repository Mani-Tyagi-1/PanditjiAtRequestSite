import type { RequestHandler } from "express";
import DeviceToken from "../../models/firebaseNotification/Devicetoken";

type AppType = "user" | "pandit";
type PlatformType = "android" | "ios";

function normalizeAppType(input: any): AppType | null {
  const s = String(input || "").trim().toLowerCase();
  if (s === "user" || s === "pandit") return s;
  return null;
}

function normalizePlatform(input: any): PlatformType | null {
  const s = String(input || "").trim().toLowerCase();
  if (s === "android" || s === "ios") return s;
  return null;
}

/**
 * POST /api/push/register
 * body: { userId?, platform, deviceId, fcmToken?, voipToken?, appType }
 */
export const registerPushToken: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req.body as any).userId;

    const {
      platform: platformRaw,
      deviceId: deviceIdRaw,
      fcmToken: fcmTokenRaw,
      voipToken: voipTokenRaw,
      appType: appTypeRaw,
    } = req.body as any;

    if (!userId || !platformRaw || !deviceIdRaw) {
      res.status(400).json({
        ok: false,
        message: "Missing userId/platform/deviceId",
      });
      return;
    }

    const platform = normalizePlatform(platformRaw);
    if (!platform) {
      res.status(400).json({ ok: false, message: "Invalid platform" });
      return;
    }

    const appType = normalizeAppType(appTypeRaw);
    if (!appType) {
      res.status(400).json({
        ok: false,
        message: "Missing or invalid appType (expected 'user' or 'pandit')",
      });
      return;
    }

    const deviceId = String(deviceIdRaw).trim();
    if (!deviceId) {
      res.status(400).json({ ok: false, message: "Invalid deviceId" });
      return;
    }

    const update: any = {
      userId: String(userId),
      appType,
      platform,
      deviceId,
      lastSeenAt: new Date(),
    };

    if (typeof fcmTokenRaw === "string") {
      const token = fcmTokenRaw.trim();
      if (token) update.fcmToken = token;
    }

    if (typeof voipTokenRaw === "string") {
      const token = voipTokenRaw.trim();
      if (token) update.voipToken = token;
    }

    // ✅ include appType in query to avoid user/pandit overwrite on same device
    await DeviceToken.updateOne(
      { userId: String(userId), deviceId, appType },
      { $set: update },
      { upsert: true }
    );

    res.json({ ok: true });
  } catch (e: any) {
    console.error("[registerPushToken] error:", e);
    res.status(500).json({
      ok: false,
      message: e?.message || "Failed to register push token",
    });
  }
};
