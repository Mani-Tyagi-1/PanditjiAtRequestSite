"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userFirebaseAdmin = userFirebaseAdmin;
exports.panditFirebaseAdmin = panditFirebaseAdmin;
exports.firebaseAdmin = firebaseAdmin;
exports.getFirebaseMessagingByAppType = getFirebaseMessagingByAppType;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
function parseBase64JsonFromEnv(...keys) {
    for (const key of keys) {
        const b64 = process.env[key];
        if (!b64)
            continue;
        const json = Buffer.from(b64, "base64").toString("utf-8");
        return JSON.parse(json);
    }
    throw new Error(`❌ Missing firebase service account base64 env. Tried: ${keys.join(", ")}`);
}
function ensureNamedAdminApp(appName, envKeys) {
    const existing = firebase_admin_1.default.apps.find((a) => !!a && a.name === appName);
    if (existing)
        return existing;
    const serviceAccount = parseBase64JsonFromEnv(...envKeys);
    return firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
    }, appName);
}
/**
 * ✅ User app Firebase project
 * supports both spellings:
 * - FIREBASE_USER_SERVICE_jSON_BASE64 (your current key)
 * - FIREBASE_USER_SERVICE_JSON_BASE64 (recommended future key)
 */
function userFirebaseAdmin() {
    return ensureNamedAdminApp("user-firebase-app", [
        "FIREBASE_USER_SERVICE_jSON_BASE64",
        "FIREBASE_USER_SERVICE_JSON_BASE64",
    ]);
}
/**
 * ✅ Pandit app Firebase project
 * current key in your setup:
 * - FIREBASE_ADMIN_JSON_BASE64
 * optional future key:
 * - FIREBASE_PANDIT_SERVICE_JSON_BASE64
 */
function panditFirebaseAdmin() {
    return ensureNamedAdminApp("pandit-firebase-app", [
        "FIREBASE_ADMIN_JSON_BASE64",
        "FIREBASE_PANDIT_SERVICE_JSON_BASE64",
    ]);
}
/**
 * ✅ Backward compatibility (old code using single firebaseAdmin())
 * returns pandit admin (same behavior as your old setup)
 */
function firebaseAdmin() {
    return panditFirebaseAdmin();
}
function getFirebaseMessagingByAppType(appType) {
    return appType === "user"
        ? userFirebaseAdmin().messaging()
        : panditFirebaseAdmin().messaging();
}
