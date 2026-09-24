/**
 * Partner/affiliate referral code captured site-wide by <ReferralCapture/> in App.tsx
 * (`?ref=CODE` -> localStorage).
 *
 * Every checkout must attribute through THIS helper rather than reading localStorage inline:
 * the 2-day TTL is the contract, and a checkout that forgets to apply it would keep crediting
 * a partner long after the click window closed. Returns "" when there is no live code, so
 * callers can spread it conditionally.
 */
const STORAGE_KEY = "pjar_partner_ref";

/** Must match the window <ReferralCapture/> advertises when it stores the code. */
const TTL_MS = 2 * 24 * 60 * 60 * 1000;

export function getPartnerRefCode(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "";
    const entry = JSON.parse(raw) as { code?: string; storedAt?: number };
    if (!entry?.code || typeof entry.storedAt !== "number") return "";
    if (Date.now() - entry.storedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return "";
    }
    return String(entry.code);
  } catch {
    // Private mode / corrupt entry — treat as organic rather than breaking checkout.
    return "";
  }
}
