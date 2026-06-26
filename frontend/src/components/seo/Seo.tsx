// Reusable per-page SEO head. Wraps react-helmet-async with sensible defaults
// for title, description, canonical, robots, Open Graph, Twitter, hreflang, and
// JSON-LD. Replaces the bare <Helmet><title/></Helmet> pattern scattered across
// pages so every route gets full, consistent metadata.
//
// NOTE: tags injected here are visible to JS-rendering crawlers (Googlebot) and
// social scrapers immediately, but only become visible to non-rendering AI
// crawlers (GPTBot, PerplexityBot, etc.) once the route is prerendered to static
// HTML. See scripts/prerender for that step.

import { Helmet } from "react-helmet-async";
import { SITE, absoluteUrl } from "./siteConfig";
import { breadcrumbSchema, type Crumb } from "./schema";

export interface HreflangAlternate {
  hrefLang: string; // e.g. "en-IN", "hi-IN", "te-IN", "x-default"
  href: string; // absolute or path (resolved to absolute)
}

export interface SeoProps {
  title: string;
  description?: string;
  /** Canonical path, e.g. "/puja/satyanarayan-katha". Defaults to current path. */
  path?: string;
  /** Full canonical URL override (wins over `path`). */
  canonical?: string;
  image?: string;
  type?: "website" | "article" | "product" | "profile";
  keywords?: string;
  noindex?: boolean;
  locale?: string;
  alternates?: HreflangAlternate[];
  breadcrumbs?: Crumb[];
  /** One schema object or an array of them. Breadcrumbs are added automatically. */
  schema?: object | object[];
  children?: React.ReactNode;
}

export function Seo({
  title,
  description = SITE.defaultDescription,
  path,
  canonical,
  image = SITE.defaultImage,
  type = "website",
  keywords,
  noindex = false,
  locale = SITE.locale,
  alternates,
  breadcrumbs,
  schema,
  children,
}: SeoProps) {
  const canonicalUrl =
    canonical ||
    absoluteUrl(
      path ??
        (typeof window !== "undefined" ? window.location.pathname : "/")
    );

  const schemaList: object[] = schema
    ? Array.isArray(schema)
      ? [...schema]
      : [schema]
    : [];
  if (breadcrumbs && breadcrumbs.length) {
    schemaList.push(breadcrumbSchema(breadcrumbs));
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <link rel="canonical" href={canonicalUrl} />
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow"}
      />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE.brand} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={locale} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SITE.twitterHandle} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* hreflang alternates */}
      {alternates?.map((alt) => (
        <link
          key={alt.hrefLang}
          rel="alternate"
          hrefLang={alt.hrefLang}
          href={absoluteUrl(alt.href)}
        />
      ))}

      {/* JSON-LD */}
      {schemaList.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}

      {children}
    </Helmet>
  );
}

export default Seo;
