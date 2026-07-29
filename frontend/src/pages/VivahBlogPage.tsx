import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Clock,
  Sparkles,
} from "lucide-react";

import BLOG_DATA from "../data/vivahBlogs.json";
import { Btn, Orn, Wrap } from "../components/vivah/ui";
import {
  AnimatePresence,
  EASE,
  Reveal,
  RevealItem,
  Stagger,
  motion,
  useLift,
  useTap,
} from "../components/vivah/motion";
import { PjarLogo, VivahFooter, VivahHeader, VivahScope } from "../components/vivah/VivahLayout";

/**
 * Vedic Vivah guides — a JSON-driven blog built for search.
 *
 * Every post lives in `data/vivahBlogs.json` (add a post there, it renders
 * here — no code change). The detail page emits Article + FAQPage +
 * BreadcrumbList JSON-LD, a canonical URL, and full OG tags, because these
 * pages exist to RANK: each one targets a head keyword families actually
 * search ("vivah muhurat 2026", "saptapadi meaning", "pandit for marriage
 * cost") and funnels readers into the booking flow.
 *
 * Content is deliberately mixed Hindi/Hinglish/English — the way these
 * queries are actually typed — which also wins the Hinglish long-tail that
 * English-only wedding blogs miss.
 */

const SITE = "https://panditjiatrequest.com";

type Block =
  | { t: "h2"; text: string }
  | { t: "p"; text: string }
  | { t: "list"; items: string[] }
  | { t: "tip"; text: string }
  | { t: "shloka"; devanagari: string; transliteration: string; meaning: string }
  | { t: "cta"; text: string; label: string; to: string };

type Post = {
  slug: string;
  title: string;
  hindiTitle?: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  cover: string;
  coverAlt: string;
  category: string;
  minutes: number;
  datePublished: string;
  author: string;
  intro: string;
  blocks: Block[];
  faqs: { q: string; a: string }[];
};

const POSTS = (BLOG_DATA as { posts: Post[] }).posts;

const CATEGORIES = ["All", ...Array.from(new Set(POSTS.map((p) => p.category)))];

/** "x.webp" → "x@2x.webp" — every cover ships a retina sibling. */
const cover2x = (src: string) => src.replace(/\.(webp|jpg)$/, "@2x.$1");
const coverSet = (src: string) => `${src} 1x, ${cover2x(src)} 2x`;

/** The plain-text body, used for Article schema's articleBody. */
const bodyText = (p: Post): string =>
  [
    p.intro,
    ...p.blocks.map((b) => {
      if (b.t === "list") return b.items.join(". ");
      if (b.t === "shloka") return `${b.transliteration} — ${b.meaning}`;
      if ("text" in b) return b.text;
      return "";
    }),
  ].join(" ");

/* ========================================================================== */
/*                                THE LIST                                    */
/* ========================================================================== */

export function VivahBlogListPage() {
  const [cat, setCat] = useState("All");
  const lift = useLift();
  const tap = useTap();

  const shown = useMemo(
    () => (cat === "All" ? POSTS : POSTS.filter((p) => p.category === cat)),
    [cat]
  );

  const title = "Vivah Guides — Muhurat 2026, Rituals, Kundali Milan & More | Pandit Ji At Request";
  const description =
    "Expert Hindu wedding guides: shubh vivah muhurat 2026, saptapadi meaning, kundali milan, pandit booking cost, samagri checklist and more — by verified Vedic Pandits.";

  return (
    <VivahScope>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE}/vedic-vivah/guides`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url: `${SITE}/vedic-vivah/guides`,
            hasPart: POSTS.map((p) => ({
              "@type": "Article",
              headline: p.title,
              url: `${SITE}/vedic-vivah/guides/${p.slug}`,
            })),
          })}
        </script>
      </Helmet>

      <VivahHeader />

      <Wrap className="py-8 lg:py-12">
        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.16em] uppercase text-viv-orange bg-viv-tint border border-viv-hair rounded-full px-3 py-1.5">
              <BookOpen className="w-3 h-3" /> Vivah Gyan
            </span>
            <h1 className="text-[30px] sm:text-[38px] text-viv-ink mt-3">
              Guides for Your Sacred Journey
            </h1>
            <p className="text-[13px] text-viv-muted mt-2 max-w-[560px] mx-auto leading-relaxed">
              Muhurat, rituals, kundali, samagri — हर सवाल का जवाब, straight from verified Vedic
              Pandits. Written the way families actually ask.
            </p>
            <Orn className="mt-4" />
          </div>
        </Reveal>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {CATEGORIES.map((c) => (
            <motion.button
              key={c}
              {...tap}
              onClick={() => setCat(c)}
              className={`text-[12px] font-medium rounded-full px-4 py-2 border transition-colors ${
                cat === c
                  ? "bg-viv-maroon text-viv-cream border-viv-maroon"
                  : "bg-white text-viv-ink/85 border-viv-hair hover:border-viv-gold"
              }`}
            >
              {c}
            </motion.button>
          ))}
        </div>

        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8" gap={0.05}>
          {shown.map((p) => (
            <RevealItem key={p.slug} className="h-full">
              <motion.article {...lift} className="h-full">
                <Link
                  to={`/vedic-vivah/guides/${p.slug}`}
                  className="flex flex-col h-full bg-white border border-viv-hair rounded-2xl overflow-hidden shadow-[0_10px_26px_-22px_rgba(90,40,10,0.6)] hover:border-viv-gold transition-colors"
                >
                  <div className="relative h-[150px] overflow-hidden bg-viv-maroon-900">
                    <img
                      src={p.cover}
                      srcSet={coverSet(p.cover)}
                      alt={p.coverAlt}
                      loading="lazy"
                      decoding="async"
                      width={800}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute left-3 top-3 text-[9.5px] font-bold tracking-[0.12em] uppercase bg-viv-ivory/95 text-viv-maroon rounded-full px-2.5 py-1">
                      {p.category}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h2 className="display text-[17px] text-viv-ink leading-snug">{p.title}</h2>
                    {p.hindiTitle && (
                      <p className="text-[12px] text-viv-maroon/80 mt-1">{p.hindiTitle}</p>
                    )}
                    <p className="text-[12px] text-viv-muted leading-relaxed mt-2 line-clamp-3 flex-1">
                      {p.intro}
                    </p>
                    <span className="flex items-center justify-between mt-3 pt-3 border-t border-viv-hair/70">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-viv-muted-2">
                        <Clock className="w-3 h-3" /> {p.minutes} min read
                      </span>
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-viv-orange">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </span>
                  </div>
                </Link>
              </motion.article>
            </RevealItem>
          ))}
        </Stagger>
      </Wrap>

      <VivahFooter />
    </VivahScope>
  );
}

/* ========================================================================== */
/*                                THE POST                                    */
/* ========================================================================== */

export default function VivahBlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const tap = useTap();

  // Hopping guide → guide is a client-side nav — reset the scroll and the
  // open FAQ, or the next article opens mid-page with the old accordion state.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setOpenFaq(0);
  }, [slug]);

  const idx = POSTS.findIndex((p) => p.slug === slug);
  const post = idx >= 0 ? POSTS[idx] : undefined;
  /** Wrap-around neighbours, so every guide chains into the next. */
  const prev = idx >= 0 ? POSTS[(idx - 1 + POSTS.length) % POSTS.length] : undefined;
  const next = idx >= 0 ? POSTS[(idx + 1) % POSTS.length] : undefined;
  /** Same-category guides first, then the rest — never the current one. */
  const related = useMemo(() => {
    if (!post) return [];
    const others = POSTS.filter((p) => p.slug !== post.slug);
    return [
      ...others.filter((p) => p.category === post.category),
      ...others.filter((p) => p.category !== post.category),
    ].slice(0, 3);
  }, [post]);

  if (!post) {
    return (
      <VivahScope className="flex flex-col items-center justify-center px-6 text-center">
        <PjarLogo className="h-12" />
        <p className="display text-[19px] text-viv-ink mt-4">This guide isn't here anymore.</p>
        <Btn variant="orange" size="md" to="/vedic-vivah/guides" className="mt-4">
          See all guides
        </Btn>
      </VivahScope>
    );
  }

  const url = `${SITE}/vedic-vivah/guides/${post.slug}`;

  return (
    <VivahScope>
      <Helmet>
        <title>{post.metaTitle}</title>
        <meta name="description" content={post.metaDescription} />
        <meta name="keywords" content={post.keywords.join(", ")} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={post.metaTitle} />
        <meta property="og:description" content={post.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={`${SITE}${post.cover.replace(".webp", ".jpg")}`} />
        <meta name="twitter:card" content="summary_large_image" />
        {/* Article + FAQ + Breadcrumbs — the trio answer engines reward. */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                headline: post.title,
                description: post.metaDescription,
                image: `${SITE}${post.cover.replace(".webp", ".jpg")}`,
                datePublished: post.datePublished,
                dateModified: post.datePublished,
                inLanguage: "en-IN",
                author: { "@type": "Organization", name: "Pandit Ji At Request" },
                publisher: {
                  "@type": "Organization",
                  name: "Pandit Ji At Request",
                  url: SITE,
                },
                mainEntityOfPage: url,
                keywords: post.keywords.join(", "),
                articleBody: bodyText(post).slice(0, 4800),
              },
              {
                "@type": "FAQPage",
                mainEntity: post.faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Vedic Vivah", item: `${SITE}/vedic-vivah` },
                  { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/vedic-vivah/guides` },
                  { "@type": "ListItem", position: 3, name: post.title, item: url },
                ],
              },
            ],
          })}
        </script>
      </Helmet>

      <VivahHeader />

      {/* ── Cover ── */}
      <div className="relative bg-viv-maroon-900 overflow-hidden">
        <img
          src={post.cover}
          srcSet={coverSet(post.cover)}
          alt={post.coverAlt}
          width={1920}
          height={520}
          fetchPriority="high"
          decoding="async"
          className="w-full h-[220px] sm:h-[300px] object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(33,9,8,0.35)_0%,rgba(33,9,8,0.85)_100%)]" />
        <Wrap className="absolute inset-x-0 bottom-0 pb-5">
          <button
            onClick={() => navigate("/vedic-vivah/guides")}
            className="inline-flex items-center gap-1.5 text-[12px] text-viv-cream/85 hover:text-viv-cream mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All guides
          </button>
          <h1 className="text-[24px] sm:text-[34px] text-viv-cream leading-tight max-w-[760px]">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11.5px] text-viv-cream/70">
            {post.hindiTitle && <span className="text-viv-gold-lt">{post.hindiTitle}</span>}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> {post.minutes} min read
            </span>
            <span>{post.category}</span>
          </div>
        </Wrap>
      </div>

      {/* ── Body ── */}
      <Wrap className="py-8">
        <div className="max-w-[720px] mx-auto">
          <Reveal>
            <p className="text-[15px] text-viv-ink/90 leading-[1.75] display italic">
              {post.intro}
            </p>
            <Orn className="my-5" />
          </Reveal>

          <div className="space-y-5">
            {post.blocks.map((b, i) => {
              if (b.t === "h2")
                return (
                  <Reveal key={i}>
                    <h2 className="display text-[22px] text-viv-maroon pt-2">{b.text}</h2>
                  </Reveal>
                );
              if (b.t === "p")
                return (
                  <Reveal key={i}>
                    <p className="text-[14px] text-viv-ink/85 leading-[1.8]">{b.text}</p>
                  </Reveal>
                );
              if (b.t === "list")
                return (
                  <Reveal key={i}>
                    <ul className="space-y-2">
                      {b.items.map((it, j) => (
                        <li key={j} className="flex gap-2.5 text-[14px] text-viv-ink/85 leading-relaxed">
                          <span className="text-viv-gold mt-0.5 shrink-0">◆</span>
                          {it}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                );
              if (b.t === "tip")
                return (
                  <Reveal key={i}>
                    <div className="flex gap-3 bg-viv-tint border border-viv-hair rounded-xl p-4">
                      <Sparkles className="w-4 h-4 text-viv-gold shrink-0 mt-0.5" />
                      <p className="text-[13px] text-viv-ink/85 leading-relaxed">{b.text}</p>
                    </div>
                  </Reveal>
                );
              if (b.t === "shloka")
                return (
                  <Reveal key={i}>
                    <figure className="border-l-[3px] border-viv-gold bg-viv-sheet rounded-r-xl p-4">
                      <p className="text-[16px] text-viv-ink leading-relaxed">{b.devanagari}</p>
                      <p className="text-[12.5px] italic text-viv-muted mt-1.5">
                        {b.transliteration}
                      </p>
                      <figcaption className="text-[12.5px] text-viv-muted mt-1.5">
                        {b.meaning}
                      </figcaption>
                    </figure>
                  </Reveal>
                );
              if (b.t === "cta")
                return (
                  <Reveal key={i}>
                    <div className="rounded-2xl border border-viv-orange bg-gradient-to-r from-viv-tint to-viv-tint-2 p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                      <p className="flex-1 text-[13.5px] font-medium text-viv-ink leading-relaxed">
                        {b.text}
                      </p>
                      <motion.div {...tap}>
                        <Btn variant="orange" size="md" to={b.to} className="whitespace-nowrap">
                          {b.label} <ArrowRight className="w-3.5 h-3.5" />
                        </Btn>
                      </motion.div>
                    </div>
                  </Reveal>
                );
              return null;
            })}
          </div>

          {/* ── FAQs ── */}
          {post.faqs.length > 0 && (
            <Reveal>
              <h2 className="display text-[22px] text-viv-maroon mt-8 mb-3">
                Aapke Sawal, Seedhe Jawab
              </h2>
              <div className="space-y-2.5">
                {post.faqs.map((f, i) => {
                  const open = openFaq === i;
                  return (
                    <div
                      key={f.q}
                      className={`bg-white border rounded-xl overflow-hidden transition-colors ${
                        open ? "border-viv-gold" : "border-viv-hair"
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaq(open ? null : i)}
                        aria-expanded={open}
                        className="w-full flex items-center gap-3 text-left px-4 py-3.5"
                      >
                        <span className="flex-1 text-[13.5px] font-medium text-viv-ink leading-snug">
                          {f.q}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-viv-gold shrink-0 transition-transform ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            key="a"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.26, ease: EASE }}
                            style={{ overflow: "hidden" }}
                          >
                            <p className="px-4 pb-4 text-[13px] text-viv-muted leading-relaxed">
                              {f.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          )}

          {/* ── Prev / next chain ── */}
          {prev && next && (
            <Reveal>
              <nav
                aria-label="More guides"
                className="mt-9 grid sm:grid-cols-2 gap-3"
              >
                <Link
                  to={`/vedic-vivah/guides/${prev.slug}`}
                  rel="prev"
                  className="group rounded-xl border border-viv-hair bg-white p-4 hover:border-viv-gold transition-colors"
                >
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.12em] uppercase text-viv-muted-2">
                    <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
                    Pichhla guide
                  </span>
                  <span className="display block text-[15px] text-viv-ink leading-snug mt-1.5 line-clamp-2">
                    {prev.title}
                  </span>
                </Link>
                <Link
                  to={`/vedic-vivah/guides/${next.slug}`}
                  rel="next"
                  className="group rounded-xl border border-viv-hair bg-white p-4 text-right hover:border-viv-gold transition-colors"
                >
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.12em] uppercase text-viv-muted-2">
                    Agla guide
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="display block text-[15px] text-viv-ink leading-snug mt-1.5 line-clamp-2">
                    {next.title}
                  </span>
                </Link>
              </nav>
            </Reveal>
          )}

          {/* ── Related ── */}
          <Reveal>
            <h2 className="display text-[20px] text-viv-maroon mt-9 mb-3">Aage padhiye</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to={`/vedic-vivah/guides/${p.slug}`}
                  className="bg-white border border-viv-hair rounded-xl p-3.5 hover:border-viv-gold transition-colors"
                >
                  <span className="text-[9.5px] font-bold tracking-[0.12em] uppercase text-viv-gold">
                    {p.category}
                  </span>
                  <span className="display block text-[14px] text-viv-ink leading-snug mt-1 line-clamp-2">
                    {p.title}
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </Wrap>

      <VivahFooter />
    </VivahScope>
  );
}
