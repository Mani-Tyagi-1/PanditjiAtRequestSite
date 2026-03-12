import admin from "firebase-admin";

type FirebaseAppType = "user" | "pandit";

function parseBase64JsonFromEnv(...keys: string[]) {
  for (const key of keys) {
    const b64 = process.env[key];
    if (!b64) continue;

    const json = Buffer.from(b64, "base64").toString("utf-8");
    return JSON.parse(json);
  }

  throw new Error(`❌ Missing firebase service account base64 env. Tried: ${keys.join(", ")}`);
}

function ensureNamedAdminApp(
  appName: string,
  envKeys: string[]
): admin.app.App {
  const existing = admin.apps.find(
    (a): a is admin.app.App => !!a && a.name === appName
  );
  if (existing) return existing;

  const serviceAccount = parseBase64JsonFromEnv(...envKeys);

  return admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
    },
    appName
  );
}

/**
 * ✅ User app Firebase project
 * supports both spellings:
 * - FIREBASE_USER_SERVICE_jSON_BASE64 (your current key)
 * - FIREBASE_USER_SERVICE_JSON_BASE64 (recommended future key)
 */
export function userFirebaseAdmin() {
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
export function panditFirebaseAdmin() {
  return ensureNamedAdminApp("pandit-firebase-app", [
    "FIREBASE_ADMIN_JSON_BASE64",
    "FIREBASE_PANDIT_SERVICE_JSON_BASE64",
  ]);
}

/**
 * ✅ Backward compatibility (old code using single firebaseAdmin())
 * returns pandit admin (same behavior as your old setup)
 */
export function firebaseAdmin() {
  return panditFirebaseAdmin();
}

export function getFirebaseMessagingByAppType(appType: FirebaseAppType) {
  return appType === "user"
    ? userFirebaseAdmin().messaging()
    : panditFirebaseAdmin().messaging();
}