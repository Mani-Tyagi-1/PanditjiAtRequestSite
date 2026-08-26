#!/usr/bin/env node
/**
 * Redirect shells for retired campaign routes.
 *
 * WHY THIS EXISTS
 * ---------------
 * When a campaign ends we delete its React route and point the path at a
 * replacement. On localhost that is enough: the dev server has no file at
 * /mahakaal-savan-somwar-puja, so the request falls through to the SPA and
 * React Router runs the redirect.
 *
 * Production does not behave that way. While a campaign is live,
 * scripts/generate-route-shells.mjs writes a REAL file at
 * dist/<route>/index.html (an LCP preload shell), and nginx serves it via
 * `try_files $uri $uri/index.html /index.html`. Removing the route from ROUTES
 * stops generating that file but does NOT delete the copy already sitting on
 * the server — and a deploy that copies without `--delete` leaves it there
 * forever. nginx keeps serving the old shell, which boots an old hashed bundle
 * that predates the redirect. The site looks un-fixed no matter how many times
 * you deploy.
 *
 * So instead of relying on the file being deleted, we OVERWRITE it. Any deploy
 * that copies dist/ over the webroot replaces the stale shell with the redirect
 * below, because the path is identical. No nginx edit, no --delete, no SSH.
 *
 * The redirect is belt-and-braces because this file is the last thing standing
 * between a visitor and a dead page:
 *   • <meta http-equiv="refresh"> fires without JavaScript.
 *   • location.replace() fires immediately and leaves no history entry, so Back
 *     does not bounce the visitor into the dead URL again.
 *   • <link rel="canonical"> + noindex tell crawlers where the page went. This
 *     is still a 200, so it is weaker than the nginx 301 in
 *     deploy/nginx-frontend.conf — apply that too when you can. This file is
 *     what makes the fix survive a deploy that forgets.
 *
 * Runs AFTER `vite build`.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "../dist");

/**
 * `from` must match the path that was in generate-route-shells.mjs ROUTES while
 * the campaign was live — that is the exact path a stale file can exist at.
 * `?from=<flag>` is read by the destination page to show the "campaign ended"
 * popup; a redirect cannot carry React Router state.
 */
const REDIRECTS = [
  // Savan 2026 Mahakaal puja (Ujjain) — concluded 24 Aug 2026.
  { from: "/mahakaal-savan-somwar-puja", to: "/vrindavan-banke-bihari-puja?from=mahakaal" },
  { from: "/mahakaal-savan-somwar-puja/booking", to: "/vrindavan-banke-bihari-puja?from=mahakaal" },
];

const escapeAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function redirectHtml(to) {
  const href = escapeAttr(to);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Redirecting…</title>
<meta name="robots" content="noindex, follow" />
<meta http-equiv="refresh" content="0; url=${href}" />
<link rel="canonical" href="${href}" />
<script>window.location.replace(${JSON.stringify(to)});</script>
</head>
<body>
<p>This puja has concluded. Redirecting to <a href="${href}">Krishna Janmashtami Sewa</a>…</p>
</body>
</html>
`;
}

function main() {
  for (const { from, to } of REDIRECTS) {
    const outDir = resolve(DIST, `.${from}`);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "index.html"), redirectHtml(to), "utf8");
    console.log(`[expired] ${from}/index.html -> ${to}`);
  }
  console.log(`[expired] wrote ${REDIRECTS.length} redirect shell(s) overwriting any stale campaign page.`);
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
