"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPushToken = void 0;
const Devicetoken_1 = __importDefault(require("../../model/firebaseNotification/Devicetoken"));
function normalizeAppType(input) {
    const s = String(input || "").trim().toLowerCase();
    if (s === "user" || s === "pandit")
        return s;
    return null;
}
function normalizePlatform(input) {
    const s = String(input || "").trim().toLowerCase();
    if (s === "android" || s === "ios")
        return s;
    return null;
}
/**
 * POST /api/push/register
 * body: { userId?, platform, deviceId, fcmToken?, voipToken?, appType }
 */
const registerPushToken = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;
        const { platform: platformRaw, deviceId: deviceIdRaw, fcmToken: fcmTokenRaw, voipToken: voipTokenRaw, appType: appTypeRaw, } = req.body;
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
        const update = {
            userId: String(userId),
            appType,
            platform,
            deviceId,
            lastSeenAt: new Date(),
        };
        if (typeof fcmTokenRaw === "string") {
            const token = fcmTokenRaw.trim();
            if (token)
                update.fcmToken = token;
        }
        if (typeof voipTokenRaw === "string") {
            const token = voipTokenRaw.trim();
            if (token)
                update.voipToken = token;
        }
        // ✅ include appType in query to avoid user/pandit overwrite on same device
        await Devicetoken_1.default.updateOne({ userId: String(userId), deviceId, appType }, { $set: update }, { upsert: true });
        res.json({ ok: true });
    }
    catch (e) {
        console.error("[registerPushToken] error:", e);
        res.status(500).json({
            ok: false,
            message: e?.message || "Failed to register push token",
        });
    }
};
exports.registerPushToken = registerPushToken;
