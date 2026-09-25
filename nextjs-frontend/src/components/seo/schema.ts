// JSON-LD schema builders. Pure functions returning schema.org objects ready to
// drop into a <script type="application/ld+json"> block (the <Seo> component does
// the stringify + injection). Keep each builder small and composable.

import { SITE, absoluteUrl } from "./siteConfig";

type Json = Record<string, unknown>;

/** Organization entity — the brand's knowledge-panel anchor. */
export function organizationSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.baseUrl}/#organization`,
    name: SITE.brand,
    legalName: SITE.legalName,
    url: `${SITE.baseUrl}/`,
    logo: SITE.logo,
    image: SITE.defaultImage,
    telephone: SITE.phone,
    address: { "@type": "PostalAddress", ...SITE.address },
    ...(SITE.social.length ? { sameAs: SITE.social } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE.phone,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: [
        "English", "Hindi", "Telugu", "Tamil", "Bengali", "Gujarati",
        "Marathi", "Kannada", "Malayalam", "Odia", "Punjabi",
      ],
    },
  };
}

/** WebSite entity + Sitelinks Search Box action. */
export function webSiteSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.baseUrl}/#website`,
    url: `${SITE.baseUrl}/`,
    name: SITE.brand,
    publisher: { "@id": `${SITE.baseUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.baseUrl}/puja?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface ServiceSchemaInput {
  name: string;
  description: string;
  path: string;
  areaServed?: string;
  price?: number | string;
  priceCurrency?: string;
  image?: string;
  rating?: AggregateRatingInput;
}

/** Service entity for a puja/ceremony/city page. */
export function serviceSchema(s: ServiceSchemaInput): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: s.name,
    name: s.name,
    description: s.description,
    url: absoluteUrl(s.path),
    image: s.image || SITE.defaultImage,
    provider: { "@id": `${SITE.baseUrl}/#organization` },
    areaServed: s.areaServed
      ? { "@type": "City", name: s.areaServed }
      : { "@type": "Country", name: "India" },
    ...(s.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: String(s.price),
            priceCurrency: s.priceCurrency || "INR",
            availability: "https://schema.org/InStock",
            url: absoluteUrl(s.path),
          },
        }
      : {}),
    ...(s.rating ? { aggregateRating: aggregateRatingSchema(s.rating) } : {}),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** FAQPage — strongest AEO/rich-result lever. Keep answers 40-170 words. */
export function faqPageSchema(items: FaqItem[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };
}

export interface HowToStep {
  name: string;
  text: string;
}

/** HowTo — for ritual/procedure guides ("How to perform Griha Pravesh"). */
export function howToSchema(input: {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration, e.g. "PT2H"
  image?: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    image: input.image || SITE.defaultImage,
    ...(input.totalTime ? { totalTime: input.totalTime } : {}),
    step: input.steps.map((st, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: st.name,
      text: st.text,
    })),
  };
}

export interface AggregateRatingInput {
  ratingValue: number | string;
  reviewCount: number | string;
  bestRating?: number | string;
}

/** AggregateRating — usually nested inside Service/Product, not standalone. */
export function aggregateRatingSchema(r: AggregateRatingInput): Json {
  return {
    "@type": "AggregateRating",
    ratingValue: String(r.ratingValue),
    reviewCount: String(r.reviewCount),
    bestRating: String(r.bestRating ?? 5),
  };
}

export interface Crumb {
  name: string;
  path: string;
}

/** BreadcrumbList — site hierarchy for SERP breadcrumbs + crawl context. */
export function breadcrumbSchema(crumbs: Crumb[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}
