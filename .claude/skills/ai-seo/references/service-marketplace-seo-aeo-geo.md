# Combined SEO + AEO + GEO Strategy for Service Marketplaces

A three-pillar strategy framework developed during the PanditJiAtRequest audit (June 2026) — applicable to any location-based service marketplace (pandits, doctors, tutors, plumbers, etc.).

## The Three Pillars

```
PILLAR 1: Technical Foundation (Weeks 1-4)
  ├── Fix JS rendering (SSR/prerendering) — highest priority
  ├── AI crawler config in robots.txt
  ├── /llms.txt creation
  ├── Hreflang tags for multi-language
  └── Critical schema inline in index.html

PILLAR 2: Content & Programmatic SEO (Weeks 2-12)
  ├── Fix blog routing (listing + detail routes)
  ├── 3-tier programmatic page architecture
  ├── 7 keyword clusters with pillar+spoke content
  └── Quality gates (≥40% uniqueness, ≥400 words)

PILLAR 3: AEO/GEO — AI Search (Weeks 4-16)
  ├── 134-167 word answer blocks
  ├── Brand mentions (Wikipedia, Reddit, YouTube, Quora)
  ├── Schema on every page type
  └── Question-based content for AI citation
```

## Skill Orchestration Order

This is the recommended load-and-use order when tackling a service marketplace SEO/AEO/GEO project:

1. **`seo-technical`** — Audit JS rendering, robots.txt, security, Core Web Vitals
2. **`seo-fundamentals`** — Establish E-E-A-T framework foundation
3. **`seo-geo`** — Check AI crawler access, create /llms.txt, passage citability
4. **`ai-seo`** — Brand mentions strategy, AI visibility audit
5. **`seo-aeo-keyword-research`** — 3-tier keyword research with AEO question queries
6. **`seo-aeo-content-cluster`** — Build 7+ topical clusters with pillar pages
7. **`seo-aeo-schema-generator`** — Generate FAQPage, Service, Organization, AggregateRating schema
8. **`seo-programmatic`** — Design city×service page architecture with quality gates

## Service Marketplace Specifics

### TLS (Trust, Language, Scale) Framework

| Factor | SEO/AEO Leverage |
|---|---|
| **Trust** | Money-back guarantee → FAQ content, AggregateRating schema |
| **Language** | 11+ regional languages → hreflang, translated programmatic pages |
| **Scale** | City×Service database → programmatic SEO with ≥40% uniqueness |

### Programmatic Page Template

Pattern: `/[city]/[service]-[provider-type]`
Example: `/hyderabad/satyanarayan-katha-pandit`

| URL Component | Data Source |
|---|---|
| City | From provider/service area database |
| Service | From service category database |
| Provider type | Service type identifier |
| Title | "{Service} in {City} - Book Verified {Provider Type}" |
| H1 | "Book {Service} {Provider Type} in {City}" |
| Description | "Book a verified {provider type} for {service} in {city}. ₹{price} onwards. Same-day booking. {verification claim}." |

### Quick Wins Checklist (Day 1)

1. ✅ Add AI crawler rules to robots.txt (5 min)
2. ✅ Create /llms.txt (15 min) — see template below
3. ✅ Fix React SPA blog routing (add listing route + page)
4. ✅ Add FAQPage schema to homepage (30 min)
5. ✅ Check brand presence in ChatGPT/Perplexity (10 min)

### /llms.txt Template

```markdown
# [Brand Name]
> [One-line value proposition with key differentiator]

## Main sections
- [Page Title] -> https://example.com/[path]: Description
- ...

## Key facts
- [metric 1]
- [metric 2]

## Contact
- Website: https://example.com/
- Phone: [+91-...]
```

### FAQPage Schema Template (6 Questions)

For service marketplaces, target these question types:
1. "How to [book/hire/find] [service]?" — Process question
2. "How much does [service] cost?" — Pricing question (include ₹ value)
3. "Is [platform/service] safe and reliable?" — Trust question
4. "Can I book [service] for same-day?" — Urgency question
5. "What [services/options] can I [book/get]?" — Range question
6. "Do you provide services for [segment]?" — Niche segment question

Each answer should be 140-170 words (optimal for AI citation per `ai-seo` skill).
