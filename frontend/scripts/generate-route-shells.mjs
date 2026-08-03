#!/usr/bin/env node
/**
 * Per-route app shells carrying a parser-discoverable LCP preload.
 *
 * WHY THIS EXISTS
 * ---------------
 * The app is a client-rendered SPA. On a route like /kashi-mahadev-savan-puja the
 * hero <img> and its <link rel="preload"> are both produced by React, so the
 * browser cannot know the hero URL until it has downloaded the entry bundle,
 * downloaded the route's React.lazy chunk, rendered the page and let Helmet
 * commit to <head>. Until then the LCP image has not even been requested — which
 * is exactly what Lighthouse's "LCP request discovery → Request is discoverable
 * in initial document" check fails on. A preload injected by script cannot pass
 * it either: the audit wants the HTML parser itself to find the URL.
 *
 * So for these routes we emit dist/<route>/index.html — a copy of the built app
 * shell with the hero preload baked into <head>. nginx serves it via
 * `try_files $uri $uri/index.html /index.html` (see deploy/nginx-frontend.conf),
 * so the file is returned directly with no redirect and no SPA fallback; the URL
 * is unchanged, React Router matches the route as usual. The only difference is
 * that the parser now sees the hero URL in the first bytes of the document.
 *
 * Doing it per route rather than in index.html matters: index.html is the shell
 * for every route, so a preload added there would make every page on the site
 * download this page's hero at high priority.
 *
 * NO HARDCODED IMAGE URLS
 * -----------------------
 * The preload must be byte-identical to the URL React later requests — if the
 * two ever diverge the browser fetches both and the page ends up slower than
 * before the optimization. So nothing here is copied by hand: the origin image
 * and the resize width are both read out of the page's own sources at build
 * time, and the build fails loudly if either can no longer be found.
 *
 * Runs AFTER `vite build`.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "../dist");
const SRC = resolve(__dirname, "../src");

const ROUTES = [
  // CAMPAIGN STOPPED (Savan 2026) — the route is commented out in App.tsx, so
  // SavanPujaPage.tsx is no longer a React.lazy chunk and routeChunkLinks()
  // would throw here and fail the build. Uncomment together with the route.
  /*
  {
    path: "/kashi-mahadev-savan-puja",
    page: "pages/SavanPujaPage.tsx",
    // Shared image manifest — same file the page imports, so the preload and the
    // <img> can never disagree about candidates. Read as data, not regexed.
    images: "data/savanHeroImages.json",
    imageKey: "hero",
    // Origins index.html preconnects for other routes' benefit but this one never
    // touches. A preconnect completes a DNS + TCP + TLS handshake eagerly, so one
    // left unused is a connection opened and thrown away — worth dropping on a
    // route we are tuning for LCP. This page self-hosts its images, so it has no
    // use for the resizer origin.
    dropOrigins: ["images.weserv.nl"],
  },
  */
];

/** Reads a source file, or fails the build with a pointer to what broke. */
function readSource(rel, route) {
  const file = resolve(SRC, rel);
  if (!existsSync(file)) {
    throw new Error(
      `[shells] ${route.path}: expected source file src/${rel} — it moved or was renamed. ` +
      `Update ROUTES in scripts/generate-route-shells.mjs.`
    );
  }
  return readFileSync(file, "utf8");
}

function matchOrThrow(text, re, what, rel, route) {
  const m = text.match(re);
  if (!m) {
    throw new Error(
      `[shells] ${route.path}: could not find ${what} in src/${rel}. The preload would ` +
      `go stale and silently double-fetch the hero, so refusing to emit a shell. ` +
      `Fix the pattern in scripts/generate-route-shells.mjs.`
    );
  }
  return m[1];
}

/**
 * Reads the route's hero image set from the manifest the page itself imports,
 * then proves every file it names actually shipped in dist/. A preload pointing
 * at a missing file is worse than none: it spends a request, logs a console
 * warning, and leaves LCP unimproved.
 */
function heroImageFor(route) {
  const manifest = JSON.parse(readSource(route.images, route));
  const set = manifest[route.imageKey];
  if (!set?.src) {
    throw new Error(
      `[shells] ${route.path}: src/${route.images} has no "${route.imageKey}.src". ` +
      `Update ROUTES in scripts/generate-route-shells.mjs to match the manifest.`
    );
  }
  // Every candidate in src + srcSet must exist on disk.
  const files = [set.src, ...String(set.srcSet ?? "").split(",").map((c) => c.trim().split(/\s+/)[0])]
    .filter(Boolean)
    .filter((f, i, a) => a.indexOf(f) === i);
  for (const f of files) {
    if (f.startsWith("/") && !existsSync(resolve(DIST, `.${f}`))) {
      throw new Error(
        `[shells] ${route.path}: manifest references ${f} but dist${f} does not exist. ` +
        `Self-hosted images live in public/hero/ — run \`node scripts/regenerate-hero-images.mjs\`.`
      );
    }
  }
  return set;
}

/** `&` must be a character reference inside an HTML attribute value. */
const attr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/**
 * Resolves the route's own JS chunk (and any CSS it owns) from Vite's manifest.
 *
 * The routes are React.lazy, so the chunk URL lives inside the entry bundle: the
 * browser cannot request it until it has downloaded AND executed ~92 KB of entry
 * JS. That serialized round trip sits between the HTML and the hero being
 * rendered, so preloading the hero image alone does not fix LCP — the bytes
 * arrive early but nothing can paint them yet. A modulepreload lets the route
 * chunk download in parallel with the entry instead of after it.
 *
 * Returns [] if the manifest is missing so a stale dist still produces a shell
 * with the hero preload rather than failing the build outright.
 */
function routeChunkLinks(route) {
  const manifestPath = resolve(DIST, ".vite/manifest.json");
  if (!existsSync(manifestPath)) {
    console.warn(`[shells] ${route.path}: no dist/.vite/manifest.json (build.manifest) — ` +
      `skipping route-chunk modulepreload.`);
    return [];
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const key = `src/${route.page}`;
  const entry = manifest[key];
  if (!entry) {
    throw new Error(
      `[shells] ${route.path}: src/${route.page} is not a chunk in the Vite manifest. ` +
      `It is probably no longer a React.lazy route — update ROUTES in ` +
      `scripts/generate-route-shells.mjs.`
    );
  }
  const links = [`  <link rel="modulepreload" href="/${entry.file}" crossorigin />`];
  for (const css of entry.css ?? []) {
    links.push(`  <link rel="stylesheet" href="/${css}" />`);
  }
  return links;
}

function buildShell(shellHtml, route) {
  const hero = heroImageFor(route);
  const chunkLinks = routeChunkLinks(route);

  // Drop preloads inherited from index.html. They target other routes' heroes,
  // and on this route they would burn bandwidth and high-priority queue slots
  // racing the hero we actually need. `[^>]*` spans newlines, so this matches the
  // multi-line <link> formatting in index.html.
  let html = shellHtml.replace(/[ \t]*<link\b[^>]*\brel="preload"[^>]*\bas="image"[^>]*>\n?/g, "");

  // Drop preconnect / dns-prefetch hints for origins this route never requests.
  for (const origin of route.dropOrigins ?? []) {
    const esc = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(
      new RegExp(`[ \\t]*<link\\b[^>]*\\brel="(?:preconnect|dns-prefetch)"[^>]*${esc}[^>]*>\\n?`, "g"),
      ""
    );
  }

  // imagesrcset/imagesizes make the preload resolve through the SAME candidate
  // selection as the <img>, so a DPR-1 phone preloads the 448w file and a retina
  // phone preloads 896w — rather than preloading one and then fetching the other.
  const srcset = hero.srcSet
    ? ` imagesrcset="${attr(hero.srcSet)}" imagesizes="${attr(hero.sizes ?? "")}"`
    : "";
  const inject =
    `  <!-- Critical path for ${route.path} — generated by scripts/generate-route-shells.mjs.\n` +
    `       Do not edit by hand; derived from src/${route.images} and\n` +
    `       dist/.vite/manifest.json, so it always matches what the page requests. -->\n` +
    `  <link rel="preload" as="image" href="${attr(hero.src)}"${srcset} fetchpriority="high" />\n` +
    chunkLinks.map((l) => `${l}\n`).join("");

  // Insert ahead of the first asset Vite injected (entry <script type="module">
  // / stylesheet), NOT before </head>. index.html carries ~290 lines of JSON-LD
  // before those tags, so injecting at the end of <head> would queue the hero
  // request behind the entry bundle — the parser finds it either way, but the
  // point of the exercise is for the hero to be requested first. Falls back to
  // </head> if Vite's output stops looking like that.
  const firstAsset = html.search(/[ \t]*<(?:script[^>]*\btype="module"|link[^>]*\brel="stylesheet")/);
  if (firstAsset !== -1) {
    return { html: html.slice(0, firstAsset) + inject + html.slice(firstAsset), hero };
  }
  if (!html.includes("</head>")) {
    throw new Error("[shells] built dist/index.html has no </head> — cannot inject preload.");
  }
  return { html: html.replace("</head>", `${inject}</head>`), hero };
}

function main() {
  const shellPath = resolve(DIST, "index.html");
  if (!existsSync(shellPath)) {
    console.warn(`[shells] dist/index.html not found — run after \`vite build\`. Skipping.`);
    return;
  }
  const shellHtml = readFileSync(shellPath, "utf8");

  for (const route of ROUTES) {
    const { html, hero } = buildShell(shellHtml, route);
    const outDir = resolve(DIST, `.${route.path}`);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "index.html"), html, "utf8");
    const candidates = hero.srcSet ? hero.srcSet.split(",").length : 1;
    console.log(
      `[shells] ${route.path}/index.html — preloading ${hero.src}` +
      (candidates > 1 ? ` (+${candidates - 1} srcset candidate(s), sizes="${hero.sizes}")` : "")
    );
  }
  console.log(`[shells] wrote ${ROUTES.length} route shell(s) with parser-discoverable LCP preloads.`);
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
