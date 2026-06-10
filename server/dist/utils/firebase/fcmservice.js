"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFcmToUser = sendFcmToUser;
const Devicetoken_1 = __importDefault(require("../../model/firebaseNotification/Devicetoken"));
const firebaseamdin_1 = require("../firebase/firebaseamdin");
function toStr(v) {
    if (v === undefined || v === null)
        return "";
    return String(v);
}
async function sendFcmToUser(params) {
    const query = {
        userId: String(params.userId),
        appType: params.appType, // ✅ critical fix
        fcmToken: { $exists: true, $ne: null },
    };
    if (params.androidOnly)
        query.platform = "android";
    const devices = await Devicetoken_1.default.find(query).lean();
    const tokens = devices.map((d) => d.fcmToken).filter(Boolean);
    if (!tokens.length) {
        return { ok: true, sent: 0, failed: 0, details: [] };
    }
    const ttlSeconds = params.ttlSeconds ?? Number(process.env.FCM_DEFAULT_TTL_SECONDS ?? 60);
    // ✅ FCM data payload values must be strings
    const data = {};
    for (const [k, v] of Object.entries(params.data || {})) {
        data[k] = toStr(v);
    }
    const messaging = (0, firebaseamdin_1.getFirebaseMessagingByAppType)(params.appType);
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
        .filter((d) => d.error === "messaging/registration-token-not-registered" ||
        d.error === "messaging/invalid-registration-token")
        .map((d) => d.token);
    if (invalid.length) {
        await Devicetoken_1.default.updateMany({ appType: params.appType, fcmToken: { $in: invalid } }, { $set: { fcmToken: null } });
    }
    return {
        ok: true,
        sent: res.successCount,
        failed: res.failureCount,
        details,
    };
}
