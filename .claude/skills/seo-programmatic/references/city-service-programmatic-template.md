# City × Service Programmatic Page Template

Template pattern for location-based service marketplaces (pandits, doctors, tutors, contractors, etc.).

## 3-Tier Architecture

```
TIER 1: City × Service Pages (500+ pages)
  URL:    /[city]/[service]-[provider-type]
  Title:  {Service} in {City} - Book Verified {Provider}
  Fields: city, service, provider_type, price_range, count, language

TIER 2: Category × City × Language (2,000+ pages)
  URL:    /[language]/[category]/[city]
  Title:  {Category} {Service} in {City} - {language_name}

TIER 3: Occasion × City Pages (5,000+ pages)
  URL:    /[city]/[occasion]-[service]
  Title:  {Occasion} {Service} in {City}
```

## Data Model Requirements

Each record needs enough unique attributes to generate ≥40% unique content:

| Column | Example | Source |
|---|---|---|
| city | Hyderabad | Provider DB |
| service | Satyanarayan Katha | Service DB |
| provider_type | Pandit | Fixed |
| price_range | ₹799 - ₹2,500 | Service DB |
| provider_count | 47 verified | Aggregate |
| language | Telugu, Hindi, English | City DB |
| avg_rating | 4.8 | Aggregate |
| same_day | true | Provider DB |

## Content Differentiation Rules

| Metric | Threshold | Action |
|---|---|---|
| Unique content per page | ≥40% | ✅ Pass quality gate |
| Page word count | ≥400 words | ✅ Pass |
| Template boilerplate | ≤60% | ✅ Pass |
| Human review sample | 10% of first 100 pages | Required before scaling past 100 |

## Uniqueness Calculation

```
unique_% = (words unique to this page) / (total words - shared footer/header/nav) × 100
```

Template boilerplate text IS included in the uniqueness calculation.

## Template Engine Design

### Static blocks (shared across pages):
- Site header/navigation
- Footer with contact/trust signals
- Booking CTA sidebar
- Trust badges section

### Dynamic blocks (unique per page):
- H1 and title tag (city + service + provider)
- First paragraph: "Book a verified {provider} for {service} in {city}. {price_range}. Same-day availability."
- Service description with city-specific context
- Pricing table with city-adjusted rates
- Available providers count + average rating
- City-specific FAQ (e.g., "Are Telugu-speaking pandits available in Hyderabad?")
- Local reviews/testimonials
- Related services in same city
- Schema: Service + LocalBusiness + FAQPage + AggregateRating

## Progressive Rollout

1. Batch 1: 50 pages → monitor indexing for 2 weeks
2. Batch 2: 150 more pages → monitor for 1 week
3. Batch 3: 300 more pages → full production
4. Never publish 500+ programmatic pages simultaneously without quality review

## Sitemap Strategy

- Auto-generate sitemap entries for all programmatic pages
- Split at 50,000 URLs per sitemap file
- Update sitemap dynamically as new cities/services are added
- Register sitemap in robots.txt
