/**
 * Environment loader.
 *
 * `.env` holds only the MODE selector; all real configuration lives in
 * `.env.production` / `.env.development`. Importing this module (for its
 * side effect) populates process.env from the correct file.
 *
 * Import it BEFORE any module that reads process.env at load time.
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// server/src/config -> server
const ROOT = path.resolve(__dirname, "..", "..");

let loaded = false;

export const loadEnv = (): string => {
  if (loaded) return process.env.MODE || "development";

  // Step 1: read the selector from .env
  dotenv.config({ path: path.join(ROOT, ".env") });

  const mode = (process.env.MODE || process.env.NODE_ENV || "development").trim();

  // Step 2: load the mode-specific file. `.env.dev` is accepted as an alias
  // for `.env.development`.
  const candidates =
    mode === "production"
      ? [".env.production", ".env.prod"]
      : [".env.development", ".env.dev"];

  const file = candidates
    .map((name) => path.join(ROOT, name))
    .find((filePath) => fs.existsSync(filePath));

  if (!file) {
    throw new Error(
      `Environment file not found for MODE="${mode}". Expected one of ${candidates.join(
        " or "
      )} in ${ROOT}`
    );
  }

  const result = dotenv.config({ path: file });
  if (result.error) throw result.error;

  // Keep NODE_ENV in sync with MODE so existing NODE_ENV checks (and any
  // library that inspects it) agree with the selected env file.
  if (!process.env.NODE_ENV) process.env.NODE_ENV = mode;

  loaded = true;
  console.log(`[env] MODE=${mode} -> loaded ${path.basename(file)}`);

  return mode;
};

loadEnv();
