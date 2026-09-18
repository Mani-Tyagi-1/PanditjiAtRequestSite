// Central SEO configuration. Single source of truth for brand, URLs, and
// the social profiles used in Organization `sameAs` / schema entity signals.
// Keep this in sync with the static tags in index.html.

export const SITE = {
  baseUrl: "https://panditjiatrequest.com",
  brand: "PanditJiAtRequest",
  legalName: "PanditJiAtRequest",
  defaultTitle:
    "PanditJiAtRequest – Book Verified Pandit Online for Puja, Havan & Ceremonies",
  defaultDescription:
    "Book a verified Pandit online for Puja, Havan, Satyanarayan Katha, Griha Pravesh and all Hindu ceremonies. Doorstep service across India with live video proof and a free consultation before you book.",
  defaultImage:
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png",
  logo: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/pjar_logo-removebg-preview.png",
  phone: "+91-9056955311",
  locale: "en_IN",
  twitterHandle: "@AtRequest50649",
  // sameAs: confirmed brand profiles only. Add Instagram/Facebook/YouTube URLs
  // here once verified — do NOT ship placeholder or guessed URLs (bad entity signal).
  social: [
    "https://x.com/AtRequest50649",
  ] as string[],
  address: {
    streetAddress: "1031, Tricity Trade Tower",
    addressLocality: "Zirakpur",
    addressRegion: "Punjab",
    postalCode: "140603",
    addressCountry: "IN",
  },
} as const;

/** Build an absolute, canonical URL from a path ("/puja/foo" -> "https://.../puja/foo"). */
export function absoluteUrl(pathOrUrl = "/"): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE.baseUrl}${path === "/" ? "/" : path.replace(/\/$/, "")}`;
}
