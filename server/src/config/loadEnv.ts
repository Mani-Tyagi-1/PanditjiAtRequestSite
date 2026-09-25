import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

/**
 * Centralised environment loader.
 *
 * `.env` holds a single selector variable, MODE:
 *   MODE=production   -> loads .env.production
 *   MODE=development  -> loads .env.dev
 *
 * All real configuration lives in .env.production / .env.dev.
 *
 * Import this module (`import "./config/loadEnv";`) BEFORE anything that reads
 * `process.env`, so every module sees the fully-resolved configuration.
 */

// `__dirname` is <root>/src/config in dev (ts-node) and <root>/dist/config in prod,
// so "../.." resolves to the server root in both cases.
const serverRoot = path.resolve(__dirname, "../..");

// 1) Read the selector from .env.
dotenv.config({ path: path.join(serverRoot, ".env") });

// Anything that isn't explicitly "production" is treated as development.
// NODE_ENV is only a fallback, for hosts that set it but not MODE.
const mode = (process.env.MODE || process.env.NODE_ENV || "development")
  .trim()
  .toLowerCase();
const isProd = mode === "production";

// 2) Load the environment-specific config file, overriding the selector file.
//    Both spellings are accepted: this repo has used .env.dev and .env.development
//    at different times, and a checkout may have either.
const candidates = isProd
  ? [".env.production", ".env.prod"]
  : [".env.dev", ".env.development"];

const envSpecificPath = candidates
  .map((name) => path.join(serverRoot, name))
  .find((candidate) => fs.existsSync(candidate));

// Nothing here injects config from the platform (no Docker/CI env), so a missing
// file means nothing is configured. Fail loudly rather than booting with an empty
// process.env and surfacing as a confusing error further downstream.
if (!envSpecificPath) {
  throw new Error(
    `[env] No environment file found for MODE="${mode}". ` +
      `Expected one of ${candidates.join(" or ")} in ${serverRoot}`
  );
}

const result = dotenv.config({ path: envSpecificPath, override: true });
if (result.error) throw result.error;

// Keep NODE_ENV in sync for any library/code that relies on it. Always set it, so
// NODE_ENV can never disagree with the env file actually loaded — src/config/environment.ts
// falls back to NODE_ENV to decide between the local and live partner-affiliate engines.
process.env.NODE_ENV = isProd ? "production" : "development";

console.log(`[env] MODE="${mode}" -> loaded ${path.basename(envSpecificPath)}`);

export const MODE = mode;
export const isProduction = isProd;
export const isDevelopment = !isProd;

/** Back-compat no-op: the work above runs once, on first import. */
export const loadEnv = (): string => mode;
