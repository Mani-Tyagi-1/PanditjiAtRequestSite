# React SPA SEO Audit — Live Diagnostic Methodology

Methodology developed during a live audit of panditjiatrequest.com (June 2026), a Vite/React SPA service marketplace.

## Why React SPAs Fail SEO

React SPAs (Vite, CRA, Next.js CSR mode) serve a minimal HTML shell with a `<div id="root">` and a single JS bundle. Googlebot, GPTBot, ClaudeBot, and PerplexityBot do NOT execute JavaScript. They see only the HTML shell. This means:

- **Zero content** reaches search engine crawlers (typical: ~30-200 chars of visible text)
- **Zero H1 tags** in initial HTML (all rendered by JS)
- **Zero internal links** discoverable (all rendered by JS)
- **All schema in JS** is invisible (only inline JSON-LD in `index.html` works)

## Audit Commands

### 1. Visible Text Test
```bash
# Fetch HTML, strip tags, check what Googlebot actually sees
curl -s https://example.com | python3 -c "
import sys, re
html = sys.stdin.read()
body = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
if body:
    text = re.sub(r'<[^>]+>', '', body.group(1)).strip()
    print(f'Visible text (no JS): ~{len(text)} chars')
    if len(text) < 200:
        print('CRITICAL: Very little content reaches Googlebot without JS')
"
```

### 2. H1 Tag Count
```bash
curl -s https://example.com | grep -o '<h1[^>]*>.*</h1>' | head -5
# Expected: 0 for CSR SPA without SSR
```

### 3. Script Bundle Analysis
```bash
curl -s https://example.com | grep -oP 'src="[^"]*\.js"' | sort -u
# Count scripts + check if it's a single bundle (CSR indicator)
```

### 4. JSON-LD Extraction
```bash
curl -s https://example.com | python3 -c "
import sys, re, json
html = sys.stdin.read()
schemas = re.findall(r'<script[^>]*type=\"?application/ld\\+json\"?[^>]*>(.*?)</script>', html, re.DOTALL)
print(f'Inline JSON-LD blocks: {len(schemas)}')
for s in schemas:
    d = json.loads(s.strip())
    print(f'  @type={d.get(\"@type\", \"unknown\")}')
"
```

### 5. Route Coverage Check
```bash
# Check App.tsx for routing patterns
grep -n 'Route path=' src/App.tsx | grep -v '//'
# Look for:
# - Missing index routes (e.g., /blog exists but no /blog/ route)
# - Catch-all redirect (* -> /) that hides broken routes
# - Lazy-loaded components that silently fail
```

### 6. Sitemap Audit
```bash
curl -s https://example.com/sitemap.xml | grep -o '<loc>[^<]*' | sed 's/<loc>//'
# Check:
# - Total page count (CSR SPAs often have <20)
# - Missing dynamic/programmatic pages
# - All URLs return 200
```

## Common React SPA SEO Issues

| Issue | Detection | Fix |
|---|---|---|
| CSR with no fallback | Visible text <200 chars | Add prerendering (Prerender.io, Rendertron) or migrate to SSR (Next.js) |
| Missing index route | `/blog/` → 404 or redirect to `/` | Add `Route path="/blog" element={<BlogListPage />}` |
| Lazy-loaded route broken | Route silently redirects to home | Check catch-all `Route path="*"` at end of router |
| Schema only in JS | JSON-LD not in `index.html` | Move critical schema inline in `index.html` |
| No hreflang | Missing despite Google Translate | Add `<link rel="alternate" hreflang="hi" href="...">` |
| Single bundle | One large `.js` file | Code-split by route with `React.lazy()` |
| Broken blog | Blog component exists but no listing route | Create BlogListPage + add `/blog` route |

## Fix Priority Order

1. **SSR/Prerendering** — fix the core issue so crawlers see content
2. **Inline critical schema** — Organization, FAQPage, Service in `index.html`
3. **Fix routing** — ensure all site sections have listing + detail routes
4. **Add hreflang** — even with Google Translate, add tags for SEO
5. **Expand sitemap** — add all programmatic/dynamic page URLs
6. **Add robots.txt AI rules** — unblock GPTBot, ClaudeBot, PerplexityBot
7. **Create /llms.txt** — AI crawler guidance file
