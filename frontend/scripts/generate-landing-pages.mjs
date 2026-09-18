#!/usr/bin/env node
/**
 * Wave-2 programmatic landing-page generator (build-time static SSG, no browser).
 *
 * Emits fully-crawlable static HTML at dist/pandit/<contentLang>/<puja>/<city>/index.html.
 * <contentLang> is the LANGUAGE OF THE PAGE CONTENT (en | hi) — so en and hi
 * versions of the same (puja, city) are true hreflang alternates and cross-link
 * reciprocally (en-IN / hi-IN / x-default=en). The English page additionally
 * TARGETS the city's dominant regional-language priest in its title/copy (e.g.
 * "Telugu Vadhyar for ... in Hyderabad") to win those high-intent queries.
 *
 * Full regional-SCRIPT content (Telugu/Tamil/Bengali/... body copy) is a later
 * wave — we don't ship machine-translated filler here. Only en + hi, written by hand.
 *
 * Each page has a real <h1>, body copy, "Devotion you can verify" Trust Card,
 * transparent price, 5-Q FAQ, internal links, and Service + FAQPage +
 * BreadcrumbList JSON-LD baked into the HTML (visible to AI crawlers, no JS).
 *
 * Data MIRRORS src/components/seo/catalog.ts — keep in sync. Runs AFTER vite build.
 * Exports wave1Pages() so the sitemap generator includes the same URL set.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "../dist");
const BASE = "https://panditjiatrequest.com";
const BRAND = "PanditJiAtRequest";
const OG_IMAGE =
  "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/poojaMainImage_1779258749947.webp";
const LOGO =
  "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/pjar_logo-removebg-preview.png";
const PHONE = "+91-9056955311";

const CONTENT_LANGS = ["en", "hi"];

// Regional priest framing per dominant language (label used in English titles +
// Hindi labels). priest = local word; hi = language name in Devanagari.
const REGIONAL = {
  te: { en: "Telugu", hi: "तेलुगु", priest: "Vadhyar", priestHi: "पंडित" },
  ta: { en: "Tamil", hi: "तमिल", priest: "Vadhyar", priestHi: "पंडित" },
  bn: { en: "Bengali", hi: "बंगाली", priest: "Purohit", priestHi: "पुरोहित" },
  kn: { en: "Kannada", hi: "कन्नड़", priest: "Purohita", priestHi: "पुरोहित" },
  gu: { en: "Gujarati", hi: "गुजराती", priest: "Pandit", priestHi: "पंडित" },
  mr: { en: "Marathi", hi: "मराठी", priest: "Guruji", priestHi: "गुरुजी" },
  hi: { en: "Hindi", hi: "हिंदी", priest: "Pandit", priestHi: "पंडित" },
};

const CITIES = [
  { slug: "hyderabad", name: "Hyderabad", hindi: "हैदराबाद", primaryLang: "te" },
  { slug: "chennai", name: "Chennai", hindi: "चेन्नई", primaryLang: "ta" },
  { slug: "bangalore", name: "Bangalore", hindi: "बेंगलुरु", primaryLang: "kn" },
  { slug: "kolkata", name: "Kolkata", hindi: "कोलकाता", primaryLang: "bn" },
  { slug: "ahmedabad", name: "Ahmedabad", hindi: "अहमदाबाद", primaryLang: "gu" },
  { slug: "pune", name: "Pune", hindi: "पुणे", primaryLang: "mr" },
  { slug: "mumbai", name: "Mumbai", hindi: "मुंबई", primaryLang: "mr" },
  { slug: "delhi", name: "Delhi", hindi: "दिल्ली", primaryLang: "hi" },
  { slug: "jaipur", name: "Jaipur", hindi: "जयपुर", primaryLang: "hi" },
];

const PUJAS = [
  { slug: "satyanarayan-katha", name: "Satyanarayan Katha", hindi: "सत्यनारायण कथा", fromPrice: 999 },
  { slug: "griha-pravesh", name: "Griha Pravesh Puja", hindi: "गृह प्रवेश पूजा", fromPrice: 1500 },
  { slug: "havan", name: "Havan", hindi: "हवन", fromPrice: 899 },
  { slug: "rudrabhishek", name: "Rudrabhishek", hindi: "रुद्राभिषेक", fromPrice: 1100 },
  { slug: "ganesh-puja", name: "Ganesh Puja", hindi: "गणेश पूजा", fromPrice: 799 },
  { slug: "lakshmi-puja", name: "Lakshmi Puja", hindi: "लक्ष्मी पूजा", fromPrice: 799 },
];

// ── Helpers ──
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const rupee = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const hreflangFor = (lang) => (lang === "en" ? "en-IN" : "hi-IN");

function regionalLabel(city, lang) {
  const r = REGIONAL[city.primaryLang];
  if (city.primaryLang === "hi") return ""; // avoid "Hindi Pandit" redundancy
  return lang === "hi" ? `${r.hi} ` : `${r.en} `;
}
function priestWord(city, lang) {
  const r = REGIONAL[city.primaryLang];
  return lang === "hi" ? r.priestHi : r.priest;
}

function alternatesFor(puja, city) {
  const alts = CONTENT_LANGS.map((l) => ({
    hreflang: hreflangFor(l),
    path: `/pandit/${l}/${puja.slug}/${city.slug}`,
  }));
  alts.push({ hreflang: "x-default", path: `/pandit/en/${puja.slug}/${city.slug}` });
  return alts;
}

// ── Bilingual copy ──
const COPY = {
  en: {
    htmlLang: "en-IN",
    title: (c, p) =>
      `${regionalLabel(c, "en")}${priestWord(c, "en")} for ${p.name} in ${c.name} | Live Verified | ${BRAND}`,
    h1: (c, p) => `${regionalLabel(c, "en")}${priestWord(c, "en")} for ${p.name} in ${c.name}`,
    description: (c, p) =>
      `Book a verified ${regionalLabel(c, "en")}${priestWord(c, "en")} for ${p.name} in ${c.name}. Live timestamped sankalp on video with your name & gotra, transparent pricing from ${rupee(p.fromPrice)}, and a free consultation before you book.`,
    intro: (c, p) =>
      `Book a verified, ${REGIONAL[c.primaryLang].en}-speaking ${priestWord(c, "en")} for ${p.name} in ${c.name} — performed live at your home or online with a timestamped sankalp on camera. Pricing is transparent from ${rupee(p.fromPrice)}, every booking includes a free consultation before you pay, and you receive photo and video proof of the complete ceremony.`,
    priceLine: (p) => `From ${rupee(p.fromPrice)} · Same-day booking · Live video proof`,
    secVerify: "Devotion You Can Verify",
    secGet: "What you get",
    secHow: "How it works",
    secFaq: "Frequently asked questions",
    secRelated: "Related services",
    ctaBook: (p) => `Book Your ${p.name} Now →`,
    ctaConsult: (c) => `Talk to a ${priestWord(c, "en")} Free First →`,
    trust: (c) => [
      `<strong>Live, timestamped sankalp</strong> — the ${priestWord(c, "en")} performs your sankalp on camera with your name &amp; gotra, so you can verify the puja is genuinely done for you.`,
      `<strong>Verified ${REGIONAL[c.primaryLang].en}-speaking ${priestWord(c, "en")}</strong> — background-checked, credential-verified and rated, so language is never a barrier in ${c.name}.`,
      `<strong>Free consultation before you book</strong> — talk to the ${priestWord(c, "en")} and confirm everything before you pay.`,
      `<strong>All samagri arranged</strong> — the complete puja kit is organised for you, with post-puja prasad guidance.`,
    ],
    get: (c, p) => [
      `A verified ${REGIONAL[c.primaryLang].en}-speaking ${priestWord(c, "en")} matched to ${p.name}`,
      `Live video participation with timestamped sankalp (name &amp; gotra)`,
      `Complete samagri (puja items) arranged and explained`,
      `Photo + video proof of the full ceremony`,
      `Transparent pricing from ${rupee(p.fromPrice)} — no hidden charges`,
      `Free consultation before you book`,
    ],
    how: (c, p) =>
      `1. Choose ${p.name} and share your date, location in ${c.name}, and preferred language (${REGIONAL[c.primaryLang].en}). 2. We match a verified, ${REGIONAL[c.primaryLang].en}-speaking ${priestWord(c, "en")}. 3. Join live on video as the ${priestWord(c, "en")} performs your timestamped sankalp. 4. Receive photo &amp; video proof and prasad guidance.`,
    faqs: (c, p) => [
      { q: `How much does ${p.name} cost in ${c.name}?`, a: `${p.name} in ${c.name} starts from ${rupee(p.fromPrice)} with PanditJiAtRequest. The exact price depends on the ceremony's duration, the samagri required, and whether it's performed at home or online. All pricing is shown upfront before you confirm — no hidden charges, and a free consultation is included.` },
      { q: `Is the ${REGIONAL[c.primaryLang].en} ${priestWord(c, "en")} verified?`, a: `Yes. Every ${REGIONAL[c.primaryLang].en}-speaking ${priestWord(c, "en")} on PanditJiAtRequest is credential-verified, background-checked, and rated by past devotees. You can see the verification score before booking, and the sankalp is performed live on camera.` },
      { q: `Can I watch the ${p.name} live?`, a: `Yes. You join the ceremony over live video and the ${priestWord(c, "en")} performs your sankalp on camera, stating your name and gotra with a visible timestamp. You witness the puja as it happens — not just a photo afterwards.` },
      { q: `Do I need to arrange the puja samagri myself?`, a: `No. The complete samagri for ${p.name} is arranged for you as part of the booking, and the ${priestWord(c, "en")} guides you on anything to prepare at home. After the ceremony you receive prasad and follow-up guidance.` },
      { q: `Can NRIs book a ${REGIONAL[c.primaryLang].en} ${priestWord(c, "en")} for family in ${c.name}?`, a: `Yes. NRIs regularly book a ${REGIONAL[c.primaryLang].en}-speaking ${priestWord(c, "en")} for ${p.name} on behalf of family in ${c.name}. You schedule it, pay online, and join live over video — with full photo and video proof shared afterwards.` },
    ],
    footer: `<strong>${BRAND}</strong> — verified pandits for Puja, Havan, Satyanarayan Katha, Griha Pravesh &amp; all Hindu ceremonies, with live video proof across India.`,
  },
  hi: {
    htmlLang: "hi-IN",
    title: (c, p) =>
      `${c.hindi} में ${p.hindi} के लिए ${regionalLabel(c, "hi")}${priestWord(c, "hi")} | लाइव वेरिफाइड | ${BRAND}`,
    h1: (c, p) => `${c.hindi} में ${p.hindi} के लिए ${regionalLabel(c, "hi")}${priestWord(c, "hi")}`,
    description: (c, p) =>
      `${c.hindi} में ${p.hindi} के लिए वेरिफाइड ${regionalLabel(c, "hi")}${priestWord(c, "hi")} बुक करें। आपके नाम व गोत्र के साथ लाइव टाइमस्टैम्प्ड संकल्प, ${rupee(p.fromPrice)} से पारदर्शी मूल्य, और बुकिंग से पहले मुफ़्त परामर्श।`,
    intro: (c, p) =>
      `${c.hindi} में ${p.hindi} के लिए वेरिफाइड, ${REGIONAL[c.primaryLang].hi || "हिंदी"} बोलने वाले ${priestWord(c, "hi")} बुक करें — आपके घर पर या ऑनलाइन, कैमरे पर टाइमस्टैम्प्ड संकल्प के साथ लाइव। मूल्य ${rupee(p.fromPrice)} से पारदर्शी है, हर बुकिंग में बुकिंग से पहले मुफ़्त परामर्श शामिल है, और आपको पूरी पूजा का फोटो व वीडियो प्रूफ मिलता है।`,
    priceLine: (p) => `${rupee(p.fromPrice)} से · उसी दिन बुकिंग · लाइव वीडियो प्रूफ`,
    secVerify: "ऐसी पूजा जिसे आप सत्यापित कर सकें",
    secGet: "आपको क्या मिलता है",
    secHow: "यह कैसे काम करता है",
    secFaq: "अक्सर पूछे जाने वाले प्रश्न",
    secRelated: "संबंधित सेवाएँ",
    ctaBook: (p) => `अभी ${p.hindi} बुक करें →`,
    ctaConsult: (c) => `पहले ${priestWord(c, "hi")} से मुफ़्त बात करें →`,
    trust: (c) => [
      `<strong>लाइव, टाइमस्टैम्प्ड संकल्प</strong> — ${priestWord(c, "hi")} आपके नाम और गोत्र के साथ कैमरे पर संकल्प करते हैं, ताकि आप पुष्टि कर सकें कि पूजा वास्तव में आपके लिए की जा रही है।`,
      `<strong>वेरिफाइड ${regionalLabel(c, "hi")}${priestWord(c, "hi")}</strong> — बैकग्राउंड-चेक्ड, क्रेडेंशियल-वेरिफाइड और रेटेड, ताकि ${c.hindi} में भाषा कोई बाधा न बने।`,
      `<strong>बुकिंग से पहले मुफ़्त परामर्श</strong> — भुगतान से पहले ${priestWord(c, "hi")} से बात करके सब कुछ तय करें।`,
      `<strong>सम्पूर्ण सामग्री की व्यवस्था</strong> — पूरी पूजा सामग्री आपके लिए तैयार, साथ में प्रसाद व आगे की प्रक्रिया का मार्गदर्शन।`,
    ],
    get: (c, p) => [
      `${p.hindi} के लिए वेरिफाइड ${regionalLabel(c, "hi")}${priestWord(c, "hi")}`,
      `लाइव वीडियो पर टाइमस्टैम्प्ड संकल्प (नाम व गोत्र)`,
      `सम्पूर्ण पूजा सामग्री की व्यवस्था और जानकारी`,
      `पूरी पूजा का फोटो व वीडियो प्रूफ`,
      `${rupee(p.fromPrice)} से पारदर्शी मूल्य — कोई छिपा शुल्क नहीं`,
      `बुकिंग से पहले मुफ़्त परामर्श`,
    ],
    how: (c, p) =>
      `1. ${p.hindi} चुनें और ${c.hindi} में अपनी तिथि, स्थान व पसंदीदा भाषा बताएं। 2. हम एक वेरिफाइड, ${regionalLabel(c, "hi")}बोलने वाले ${priestWord(c, "hi")} का मिलान करते हैं। 3. लाइव वीडियो पर जुड़ें जब ${priestWord(c, "hi")} आपका टाइमस्टैम्प्ड संकल्प करते हैं। 4. फोटो व वीडियो प्रूफ और प्रसाद मार्गदर्शन प्राप्त करें।`,
    faqs: (c, p) => [
      { q: `${c.hindi} में ${p.hindi} का खर्च कितना है?`, a: `${c.hindi} में ${p.hindi} ${rupee(p.fromPrice)} से शुरू होती है। अंतिम मूल्य पूजा की अवधि, आवश्यक सामग्री और स्थान पर निर्भर करता है। सभी मूल्य बुकिंग से पहले पारदर्शी रूप से दिखाए जाते हैं — कोई छिपा शुल्क नहीं, और मुफ़्त परामर्श शामिल है।` },
      { q: `क्या ${regionalLabel(c, "hi")}${priestWord(c, "hi")} वेरिफाइड हैं?`, a: `हाँ। PanditJiAtRequest पर हर ${priestWord(c, "hi")} क्रेडेंशियल-वेरिफाइड, बैकग्राउंड-चेक्ड और पिछले भक्तों द्वारा रेटेड होते हैं। बुकिंग से पहले आप वेरिफिकेशन स्कोर देख सकते हैं, और संकल्प लाइव कैमरे पर किया जाता है।` },
      { q: `क्या मैं ${p.hindi} लाइव देख सकता/सकती हूँ?`, a: `हाँ। आप लाइव वीडियो पर जुड़ते हैं और ${priestWord(c, "hi")} कैमरे पर आपके नाम व गोत्र के साथ संकल्प करते हैं — दृश्य टाइमस्टैम्प के साथ। आप पूजा को घटित होते हुए देखते हैं, केवल बाद की फोटो नहीं।` },
      { q: `क्या मुझे पूजा सामग्री खुद जुटानी होगी?`, a: `नहीं। ${p.hindi} की सम्पूर्ण सामग्री आपकी बुकिंग में शामिल है, और ${priestWord(c, "hi")} घर पर तैयारी के लिए मार्गदर्शन देते हैं। पूजा के बाद प्रसाद व आगे के अनुष्ठान की जानकारी मिलती है।` },
      { q: `क्या NRI ${c.hindi} में परिवार के लिए ${priestWord(c, "hi")} बुक कर सकते हैं?`, a: `हाँ। NRI नियमित रूप से ${c.hindi} में परिवार के लिए ${p.hindi} हेतु ${priestWord(c, "hi")} बुक करते हैं। आप पूजा शेड्यूल करते हैं, ऑनलाइन भुगतान करते हैं, और लाइव वीडियो पर संकल्प देखते हैं — बाद में फोटो व वीडियो प्रूफ के साथ।` },
    ],
    footer: `<strong>${BRAND}</strong> — पूजा, हवन, सत्यनारायण कथा, गृह प्रवेश व सभी हिंदू अनुष्ठानों के लिए वेरिफाइड पंडित, पूरे भारत में लाइव वीडियो प्रूफ के साथ।`,
  },
};

/** The full Wave-2 page set. (Name kept as wave1Pages for sitemap import compat.) */
export function wave1Pages() {
  const pages = [];
  for (const city of CITIES) {
    for (const puja of PUJAS) {
      for (const lang of CONTENT_LANGS) {
        pages.push({
          lang,
          city,
          puja,
          path: `/pandit/${lang}/${puja.slug}/${city.slug}`,
          hreflang: hreflangFor(lang),
          alternates: alternatesFor(puja, city),
          title: COPY[lang].title(city, puja),
          description: COPY[lang].description(city, puja),
        });
      }
    }
  }
  return pages;
}

function relatedLinks(page, all) {
  const lang = page.lang;
  const t = COPY[lang];
  const sameCity = all
    .filter((x) => x.lang === lang && x.city.slug === page.city.slug && x.path !== page.path)
    .slice(0, 3)
    .map((x) => ({ href: x.path, label: x.puja[lang === "hi" ? "hindi" : "name"] }));
  const samePuja = all
    .filter((x) => x.lang === lang && x.puja.slug === page.puja.slug && x.city.slug !== page.city.slug)
    .slice(0, 3)
    .map((x) => ({ href: x.path, label: t.h1(x.city, x.puja) }));
  return [...sameCity, ...samePuja];
}

function jsonLd(page) {
  const { city, puja, lang } = page;
  const t = COPY[lang];
  const url = `${BASE}${page.path}`;
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: `${puja.name} by ${REGIONAL[city.primaryLang].en}-speaking ${priestWord(city, "en")}`,
    name: t.h1(city, puja),
    description: page.description,
    url,
    image: OG_IMAGE,
    inLanguage: page.hreflang,
    provider: { "@id": `${BASE}/#organization` },
    areaServed: { "@type": "City", name: city.name },
    offers: {
      "@type": "Offer",
      price: String(puja.fromPrice),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url,
    },
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: page.hreflang,
    mainEntity: t.faqs(city, puja).map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: puja.name, item: `${BASE}/puja` },
      { "@type": "ListItem", position: 3, name: t.h1(city, puja), item: url },
    ],
  };
  return [service, faq, crumbs];
}

function renderHtml(page, all) {
  const { city, puja, lang } = page;
  const t = COPY[lang];
  const url = `${BASE}${page.path}`;
  const related = relatedLinks(page, all);
  const trust = t.trust(city);
  const get = t.get(city, puja);
  const faqs = t.faqs(city, puja);

  const schemas = jsonLd(page)
    .map((s) => `  <script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n  </script>`)
    .join("\n");
  const alternates = page.alternates
    .map((a) => `  <link rel="alternate" hreflang="${a.hreflang}" href="${BASE}${a.path}" />`)
    .join("\n");

  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(page.description)}" />
  <link rel="canonical" href="${url}" />
  <meta name="robots" content="index, follow" />
  <link rel="icon" href="${LOGO}" />
  <link rel="preconnect" href="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com" crossorigin />
${alternates}
  <meta property="og:site_name" content="${BRAND}" />
  <meta property="og:title" content="${esc(page.title)}" />
  <meta property="og:description" content="${esc(page.description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta property="og:locale" content="${lang === "hi" ? "hi_IN" : "en_IN"}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(page.title)}" />
  <meta name="twitter:description" content="${esc(page.description)}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />
${schemas}
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1c1917;background:#FFFAF3;line-height:1.6}
    .wrap{max-width:760px;margin:0 auto;padding:20px 16px 64px}
    header{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #fde7cf}
    header img{height:40px}header b{color:#c2410c;font-size:18px}
    h1{font-size:26px;line-height:1.3;margin:20px 0 12px;color:#7c2d12}
    h2{font-size:20px;margin:28px 0 12px;color:#9a3412}
    p{margin:0 0 14px}.lead{font-size:17px}
    .card{background:#fff;border:1px solid #fed7aa;border-radius:14px;padding:16px 18px;margin:16px 0;box-shadow:0 1px 3px rgba(0,0,0,.04)}
    .trust li,.get li{margin:0 0 10px;list-style:none;padding-left:26px;position:relative}
    .trust li:before,.get li:before{content:"✓";position:absolute;left:0;color:#16a34a;font-weight:700}
    .price{font-size:21px;font-weight:800;color:#c2410c}
    .cta{display:inline-block;background:linear-gradient(90deg,#ea580c,#dc2626);color:#fff;font-weight:700;padding:14px 26px;border-radius:999px;text-decoration:none;margin:8px 0}
    .faq dt{font-weight:700;margin:16px 0 4px;color:#7c2d12}.faq dd{margin:0 0 12px}
    .related a{display:block;padding:10px 14px;background:#fff;border:1px solid #fed7aa;border-radius:10px;margin:8px 0;color:#9a3412;text-decoration:none;font-weight:600}
    footer{margin-top:32px;padding-top:16px;border-top:1px solid #fde7cf;font-size:13px;color:#78716c}
    a{color:#c2410c}
  </style>
</head>
<body>
  <div class="wrap">
    <header><img src="${LOGO}" alt="${BRAND}" /><b>${BRAND}</b></header>
    <h1>${esc(t.h1(city, puja))}</h1>
    <p class="lead">${t.intro(city, puja)}</p>
    <a class="cta" href="/puja">${esc(t.ctaBook(puja))}</a>
    <p class="price">${t.priceLine(puja)}</p>

    <div class="card">
      <h2 style="margin-top:0">${esc(t.secVerify)}</h2>
      <ul class="trust">
        ${trust.map((x) => `<li>${x}</li>`).join("\n        ")}
      </ul>
    </div>

    <h2>${esc(t.secGet)}</h2>
    <ul class="get">
      ${get.map((x) => `<li>${x}</li>`).join("\n      ")}
    </ul>

    <h2>${esc(t.secHow)}</h2>
    <p>${t.how(city, puja)}</p>
    <a class="cta" href="/free-consultation">${esc(t.ctaConsult(city))}</a>

    <h2>${esc(t.secFaq)}</h2>
    <dl class="faq">
      ${faqs.map((f) => `<dt>${esc(f.q)}</dt>\n      <dd>${esc(f.a)}</dd>`).join("\n      ")}
    </dl>

    ${
      related.length
        ? `<h2>${esc(t.secRelated)}</h2>
    <div class="related">
      ${related.map((r) => `<a href="${r.href}">${esc(r.label)} →</a>`).join("\n      ")}
    </div>`
        : ""
    }

    <footer>
      <p>${t.footer}</p>
      <p>Call ${PHONE} · <a href="/">panditjiatrequest.com</a></p>
    </footer>
  </div>
</body>
</html>
`;
}

function main() {
  if (!existsSync(DIST)) {
    console.warn(`[landing] dist/ not found at ${DIST} — run after \`vite build\`. Skipping.`);
    return;
  }
  const pages = wave1Pages();
  let n = 0;
  for (const page of pages) {
    const outDir = resolve(DIST, `.${page.path}`);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "index.html"), renderHtml(page, pages), "utf8");
    n++;
  }
  console.log(`[landing] wrote ${n} Wave-2 landing pages (en+hi) -> ${DIST}/pandit/...`);
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
