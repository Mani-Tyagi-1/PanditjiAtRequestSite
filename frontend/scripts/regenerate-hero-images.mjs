#!/usr/bin/env node
/**
 * Regenerates the self-hosted, display-sized WebP heroes in public/hero/.
 *
 * These assets are committed, so this script is NOT part of the build — run it by
 * hand (`node scripts/regenerate-hero-images.mjs`) only when the source artwork on
 * the CDN changes. It exists so the binaries in public/hero/ are reproducible
 * rather than mystery files nobody can regenerate.
 *
 * The resize itself is done once here by images.weserv.nl and the result is saved
 * to disk. That keeps the free third-party resizer entirely out of the runtime
 * critical path — the browser only ever talks to our own origin, which is already
 * connected by the time the hero preload is parsed.
 *
 * Widths must stay in sync with src/data/savanHeroImages.json, which is the single
 * source of truth for what the page and the route-shell generator reference. This
 * script verifies that every file the manifest names actually gets written.
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/hero");
const MANIFEST = resolve(__dirname, "../src/data/savanHeroImages.json");

const CDN = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request";

/** origin artwork -> the variants to emit. Quality tuned per image by eye. */
const SOURCES = [
  { origin: `${CDN}/Kashi%20puja%20banner.png`, variants: [
      { file: "kashi-rudrabhishek-448.webp", w: 448, q: 76 },
      { file: "kashi-rudrabhishek-896.webp", w: 896, q: 75 },
  ]},
  { origin: `${CDN}/trishul%20(1).png`, variants: [
      { file: "trishul-88.webp",  w: 88,  q: 78 },
      // Retina candidate for an 88px decorative mark — compressed harder than the
      // hero because it is small, lazy-loaded and never the LCP element.
      { file: "trishul-176.webp", w: 176, q: 62 },
  ]},
];

const weserv = (url, w, q) => {
  const source = url.replace(/^https:\/\//i, "ssl:");
  return `https://images.weserv.nl/?url=${encodeURIComponent(source)}&w=${w}&output=webp&q=${q}&we`;
};

/** Minimal WebP dimension reader, so we can assert what we actually wrote. */
function webpSize(buf) {
  let i = 12;
  while (i < buf.length - 8) {
    const tag = buf.toString("ascii", i, i + 4);
    const size = buf.readUInt32LE(i + 4);
    if (tag === "VP8X") return [1 + buf.readUIntLE(i + 12, 3), 1 + buf.readUIntLE(i + 15, 3)];
    if (tag === "VP8 ") return [buf.readUInt16LE(i + 14) & 0x3fff, buf.readUInt16LE(i + 16) & 0x3fff];
    if (tag === "VP8L") {
      const v = buf.readUInt32LE(i + 9);
      return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1];
    }
    i += 8 + size + (size & 1);
  }
  return null;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const manifest = readFileSync(MANIFEST, "utf8");
  const written = [];

  for (const { origin, variants } of SOURCES) {
    for (const { file, w, q } of variants) {
      const res = await fetch(weserv(origin, w, q));
      if (!res.ok) throw new Error(`[hero] ${file}: resizer returned HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") {
        throw new Error(`[hero] ${file}: response was not a WebP`);
      }
      const dims = webpSize(buf);
      if (!dims || dims[0] !== w) {
        throw new Error(`[hero] ${file}: expected width ${w}, got ${dims && dims[0]}`);
      }
      writeFileSync(resolve(OUT, file), buf);
      written.push(file);
      console.log(`[hero] ${file.padEnd(30)} ${dims[0]}x${dims[1]}  ${buf.length.toLocaleString()} B`);
    }
  }

  // Every file the manifest points at must now exist on disk.
  const missing = [...manifest.matchAll(/\/hero\/([A-Za-z0-9._-]+\.webp)/g)]
    .map((m) => m[1])
    .filter((f, i, a) => a.indexOf(f) === i)
    .filter((f) => !written.includes(f));
  if (missing.length) {
    throw new Error(
      `[hero] src/data/savanHeroImages.json references ${missing.join(", ")}, ` +
      `which this script does not generate. Add the variant to SOURCES.`
    );
  }
  console.log(`[hero] ${written.length} variants written to public/hero/ — manifest satisfied.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
