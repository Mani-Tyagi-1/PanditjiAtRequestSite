#!/usr/bin/env node
/**
 * Dynamic sitemap generator.
 *
 * Emits public/sitemap.xml from:
 *   1. Curated static routes (always real pages).
 *   2. Live puja detail pages fetched from the API at build time (/puja/:id).
 *
 * Design rules (per seo-programmatic): only emit URLs that resolve to a real
 * page. We do NOT emit the language×city×puja matrix here yet — those URLs go in
 * once their pages are actually built & prerendered (see the WAVE1 hook below),
 * otherwise they are soft-404s that waste crawl budget.
 *
 * Fail-safe: any network/API error degrades to "static routes only" and still
 * writes a valid sitemap. It never exits non-zero, so it is safe in `prebuild`.
 *
 * Run: node scripts/generate-sitemap.mjs   (also runs automatically on prebuild)
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { wave1Pages } from "./generate-landing-pages.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/sitemap.xml");
const BASE = "https://panditjiatrequest.com";
const API_URL =
  process.env.VITE_API_URL || "https://panditjiatrequest.com/api";
const today = new Date().toISOString().slice(0, 10);

// changefreq/priority tuned per page importance.
const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/puja", priority: "0.9", changefreq: "daily" },
  { path: "/category", priority: "0.8", changefreq: "weekly" },
  { path: "/chadhava", priority: "0.8", changefreq: "weekly" },
  { path: "/kashi", priority: "0.7", changefreq: "weekly" },
  { path: "/all-pandits", priority: "0.7", changefreq: "weekly" },
  { path: "/shop", priority: "0.6", changefreq: "weekly" },
  { path: "/free-consultation", priority: "0.7", changefreq: "monthly" },
  { path: "/paid-consultation", priority: "0.6", changefreq: "monthly" },
  { path: "/blog", priority: "0.7", changefreq: "weekly" },
  // Savan 2026 seasonal campaign page — remove after 28 Aug 2026
  { path: "/kashi-mahadev-savan-puja", priority: "0.9", changefreq: "daily" },
  { path: "/join-as-panditji", priority: "0.5", changefreq: "monthly" },
  { path: "/privacypolicy", priority: "0.3", changefreq: "yearly" },
  { path: "/termsandconditions", priority: "0.3", changefreq: "yearly" },
];

async function fetchPujaUrls() {
  if (typeof fetch !== "function") {
    console.warn("[sitemap] global fetch unavailable (Node <18) — static only");
    return [];
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(`${API_URL}/fetch-all-poojas`, {
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = data?.poojas || data?.data || [];
    const urls = list
      .map((p) => p?._id)
      .filter(Boolean)
      .map((id) => ({
        path: `/puja/${id}`,
        priority: "0.8",
        changefreq: "weekly",
      }));
    console.log(`[sitemap] fetched ${urls.length} puja pages from API`);
    return urls;
  } catch (err) {
    console.warn(
      `[sitemap] puja fetch failed (${err?.message || err}) — static only`
    );
    return [];
  }
}

function xmlFor(routes) {
  const seen = new Set();
  const body = routes
    .filter((r) => (seen.has(r.path) ? false : seen.add(r.path)))
    .map((r) => {
      const loc = `${BASE}${r.path === "/" ? "/" : r.path}`;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

async function main() {
  const pujaUrls = await fetchPujaUrls();
  // Wave-1 programmatic landing pages — real static files emitted by
  // generate-landing-pages.mjs (post-build). Shared source = one URL set.
  const wave1 = wave1Pages().map((p) => ({
    path: p.path,
    priority: "0.9",
    changefreq: "weekly",
  }));
  const routes = [...STATIC_ROUTES, ...wave1, ...pujaUrls];
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, xmlFor(routes), "utf8");
  console.log(`[sitemap] wrote ${routes.length} URLs -> ${OUT}`);
}

main();
