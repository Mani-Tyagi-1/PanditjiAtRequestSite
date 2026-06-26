// Pure HTML template for puja prerender — NO database imports, so it can be
// unit-tested in isolation. The controller fetches the puja and calls
// renderPoojaHtml(); nginx routes crawler traffic to that controller.

const BASE = "https://panditjiatrequest.com";
const BRAND = "PanditJiAtRequest";
const DEFAULT_IMAGE =
  "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/poojaMainImage_1779258749947.webp";
const LOGO =
  "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/pjar_logo-removebg-preview.png";
const PHONE = "+91-9056955311";

export type AnyPooja = Record<string, any>;

export const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const stripTags = (s: unknown): string =>
  String(s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const truncate = (s: string, n: number): string =>
  s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";

export const rupee = (n: unknown): string =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function priceOf(p: AnyPooja): number {
  return Number(p.poojaPriceOnline || p.poojaPriceOffline || 0);
}

export function imageOf(p: AnyPooja): string {
  if (p.poojaCardImage) return p.poojaCardImage;
  if (Array.isArray(p.poojaMainImage) && p.poojaMainImage[0])
    return p.poojaMainImage[0];
  return DEFAULT_IMAGE;
}

export function metaDescription(p: AnyPooja): string {
  const base =
    stripTags(p.poojaSubDescription) ||
    stripTags(p.poojaDescriptionMain) ||
    `Book ${p.poojaNameEng} online with a verified pandit. Live video proof, transparent pricing, free consultation before you book.`;
  return truncate(base, 160);
}

function jsonLdBlocks(p: AnyPooja, id: string): string {
  const url = `${BASE}/puja/${id}`;
  const price = priceOf(p);
  const faqs: AnyPooja[] = Array.isArray(p.faqs) ? p.faqs : [];

  const service: AnyPooja = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: p.poojaNameEng,
    name: p.poojaNameEng,
    description: metaDescription(p),
    url,
    image: imageOf(p),
    provider: { "@id": `${BASE}/#organization` },
    areaServed: { "@type": "Country", name: "India" },
  };
  if (price > 0) {
    service.offers = {
      "@type": "Offer",
      price: String(price),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url,
    };
  }

  const blocks: AnyPooja[] = [service];

  const validFaqs = faqs.filter((f) => f && f.question && f.answer);
  if (validFaqs.length) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: validFaqs.map((f) => ({
        "@type": "Question",
        name: stripTags(f.question),
        acceptedAnswer: { "@type": "Answer", text: stripTags(f.answer) },
      })),
    });
  }

  blocks.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Pujas", item: `${BASE}/puja` },
      { "@type": "ListItem", position: 3, name: p.poojaNameEng, item: url },
    ],
  });

  return blocks
    .map(
      (b) =>
        `  <script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n  </script>`
    )
    .join("\n");
}

export function renderPoojaHtml(p: AnyPooja, id: string): string {
  const url = `${BASE}/puja/${id}`;
  const title = `${esc(p.poojaNameEng)} — Book Online with Verified Pandit | ${BRAND}`;
  const desc = metaDescription(p);
  const price = priceOf(p);
  const img = imageOf(p);
  const benefits: string[] = Array.isArray(p.benefits) ? p.benefits : [];
  const gods: string[] = Array.isArray(p.poojaGods) ? p.poojaGods : [];
  const sections: AnyPooja[] = Array.isArray(p.poojaDescription)
    ? p.poojaDescription
    : [];
  const faqs: AnyPooja[] = Array.isArray(p.faqs)
    ? p.faqs.filter((f) => f && f.question && f.answer)
    : [];

  const mainDesc =
    stripTags(p.poojaDescriptionMain) || stripTags(p.poojaSubDescription) || "";

  const trustPoints = [
    "<strong>Live, timestamped sankalp</strong> on camera with your name &amp; gotra — verify the puja is genuinely performed for you.",
    "<strong>Verified pandit</strong> — credential-checked, background-verified, and rated by past devotees.",
    "<strong>Free consultation before you book</strong>, and secure payment.",
    "<strong>Photo &amp; video proof</strong> of the complete ceremony, with post-puja prasad guidance.",
  ];

  return `<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  <meta name="robots" content="index, follow" />
  <link rel="icon" href="${LOGO}" />
  <link rel="preconnect" href="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com" crossorigin />
  <meta property="og:site_name" content="${BRAND}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:type" content="product" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${esc(img)}" />
  <meta property="og:locale" content="en_IN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${esc(img)}" />
${jsonLdBlocks(p, id)}
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1c1917;background:#FFFAF3;line-height:1.6}
    .wrap{max-width:760px;margin:0 auto;padding:20px 16px 64px}
    header{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #fde7cf}
    header img{height:40px}header b{color:#c2410c;font-size:18px}
    h1{font-size:26px;line-height:1.25;margin:18px 0 6px;color:#7c2d12}
    .hindi{color:#9a3412;font-size:18px;margin-bottom:10px}
    h2{font-size:20px;margin:26px 0 10px;color:#9a3412}
    h3{font-size:16px;margin:16px 0 4px;color:#7c2d12}
    p{margin:0 0 14px}.lead{font-size:17px}
    img.hero{width:100%;max-height:360px;object-fit:cover;border-radius:14px;margin:12px 0}
    .card{background:#fff;border:1px solid #fed7aa;border-radius:14px;padding:16px 18px;margin:16px 0}
    ul{margin:0 0 14px 0}li{margin:0 0 8px;list-style:none;padding-left:24px;position:relative}
    li:before{content:"✓";position:absolute;left:0;color:#16a34a;font-weight:700}
    .price{font-size:22px;font-weight:800;color:#c2410c}
    .cta{display:inline-block;background:linear-gradient(90deg,#ea580c,#dc2626);color:#fff;font-weight:700;padding:14px 26px;border-radius:999px;text-decoration:none;margin:8px 0}
    .faq dt{font-weight:700;margin:14px 0 4px;color:#7c2d12}.faq dd{margin:0 0 12px}
    footer{margin-top:32px;padding-top:16px;border-top:1px solid #fde7cf;font-size:13px;color:#78716c}
    a{color:#c2410c}
  </style>
</head>
<body>
  <div class="wrap">
    <header><img src="${LOGO}" alt="${BRAND}" /><b>${BRAND}</b></header>
    <h1>${esc(p.poojaNameEng)}</h1>
    ${p.poojaNameHindi ? `<div class="hindi">${esc(p.poojaNameHindi)}</div>` : ""}
    <img class="hero" src="${esc(img)}" alt="${esc(p.poojaNameEng)}" />
    ${price > 0 ? `<p class="price">From ${rupee(price)} · Live video proof</p>` : ""}
    <a class="cta" href="/puja/${esc(id)}">Book ${esc(p.poojaNameEng)} Now →</a>
    ${mainDesc ? `<p class="lead">${esc(truncate(mainDesc, 600))}</p>` : ""}

    <div class="card">
      <h2 style="margin-top:0">Devotion You Can Verify</h2>
      <ul>${trustPoints.map((t) => `<li>${t}</li>`).join("")}</ul>
    </div>

    ${
      benefits.length
        ? `<h2>Benefits of ${esc(p.poojaNameEng)}</h2><ul>${benefits
            .map((b) => `<li>${esc(b)}</li>`)
            .join("")}</ul>`
        : ""
    }
    ${
      gods.length
        ? `<p><strong>Deities:</strong> ${gods.map((g) => esc(g)).join(", ")}</p>`
        : ""
    }
    ${sections
      .filter((s) => s && (s.heading || s.description))
      .map(
        (s) =>
          `${s.heading ? `<h3>${esc(s.heading)}</h3>` : ""}${
            s.description ? `<p>${esc(truncate(stripTags(s.description), 800))}</p>` : ""
          }`
      )
      .join("\n    ")}

    ${
      faqs.length
        ? `<h2>Frequently asked questions</h2><dl class="faq">${faqs
            .map(
              (f) =>
                `<dt>${esc(stripTags(f.question))}</dt><dd>${esc(
                  stripTags(f.answer)
                )}</dd>`
            )
            .join("")}</dl>`
        : ""
    }

    <a class="cta" href="/free-consultation">Free Consultation Before You Book →</a>
    <footer>
      <p><strong>${BRAND}</strong> — verified pandits for Puja, Havan, Satyanarayan Katha, Griha Pravesh &amp; all Hindu ceremonies, with live video proof across India.</p>
      <p>Call ${PHONE} · <a href="/">panditjiatrequest.com</a></p>
    </footer>
  </div>
</body>
</html>
`;
}
