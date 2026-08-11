// -------------------------------------------------------------
// At-home puja payment split (backend-only, env-driven)
// -------------------------------------------------------------
// Deliberately reads the SAME env var names as the app server's
// src/config/dispatchConfig.ts, so one value in the environment keeps the
// website and the app quoting the devotee an identical figure. Changing the
// percentage in one place only would let a family see 30% on the site and a
// different number in the app for the same puja.

const numberFromEnv = (key: string, fallback: number, minimum = 0): number => {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
};

const booleanFromEnv = (key: string, fallback = false): boolean => {
  const value = String(process.env[key] ?? "").trim().toLowerCase();
  if (!value) return fallback;
  return value === "true" || value === "1" || value === "yes";
};

export const poojaPaymentConfig = {
  /** Master switch for offering "pay part now, rest after the puja". */
  ADVANCE_ENABLED: booleanFromEnv("POOJA_POSTPAID_ENABLED", true),

  /**
   * Percentage of the bill taken UP FRONT when the devotee picks the split
   * option. Clamped to 1..99 — 0 would mean a booking that reaches a pandit
   * without a rupee behind it, and 100 is just "pay in full".
   */
  ADVANCE_PERCENT: Math.min(
    99,
    Math.max(1, Math.round(numberFromEnv("POOJA_ADVANCE_PERCENT", 30, 1))),
  ),
};

export type PoojaPaymentConfig = typeof poojaPaymentConfig;
