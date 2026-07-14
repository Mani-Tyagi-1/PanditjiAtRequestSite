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
const mode = (process.env.MODE || "development").trim().toLowerCase();
const isProd = mode === "production";

// 2) Load the environment-specific config file, overriding the selector file.
const envSpecificFile = isProd ? ".env.production" : ".env.dev";
const envSpecificPath = path.join(serverRoot, envSpecificFile);

if (fs.existsSync(envSpecificPath)) {
  dotenv.config({ path: envSpecificPath, override: true });
} else {
  console.warn(
    `[env] "${envSpecificFile}" not found at ${envSpecificPath} — no configuration loaded`
  );
}

// Keep NODE_ENV in sync for any library/code that relies on it.
process.env.NODE_ENV = isProd ? "production" : "development";

console.log(`[env] MODE="${mode}" -> loaded ${envSpecificFile}`);

export const MODE = mode;
export const isProduction = isProd;
export const isDevelopment = !isProd;
