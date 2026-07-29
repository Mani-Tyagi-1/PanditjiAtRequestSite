import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Flower2,
  Gift,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import {
  advanceOf,
  effectiveAdvancePercent,
  fmtINR,
  VIVAH_IMG,
  type VivahPackage,
} from "../data/vivahCatalog";
import { useVivahCatalog } from "../data/vivahApi";
import { Btn, Card, Wrap } from "../components/vivah/ui";
import { Reveal, RevealItem, Stagger, motion, useLift, useTap } from "../components/vivah/motion";
import { PjarLogo, VivahMark, VivahScope } from "../components/vivah/VivahLayout";

/**
 * Full detail for one marriage tier, drawn to the approved comp. Reachable two
 * ways:
 *   • from the landing page, with the package handed over in router state
 *     (instant paint, no refetch), and
 *   • from a direct/shared URL — /vedic-vivah/package/raj-vivah — in which case
 *     we resolve it out of the catalog. That second path is why this is a real
 *     route rather than a modal: these URLs get shared and indexed.
 */

const FALLBACK_RITUAL_NAMES = [
  "Kundali Milan (Guna Milan)",
  "Vivah Muhurat",
  "Shagun / Sagai (Tilak)",
  "Ganesh–Gauri Puja",
  "Haldi Ceremony",
  "Mandap & Kalash Sthapana",
  "Vivah Sanskar (Core Ceremony)",
];

const templeLabel = (p: VivahPackage): string => {
  const n = p.templeDarshanCount || 0;
  if (n >= 99 || p.freeTempleDarshan) return "FREE live darshan at all listed temples";
  if (n === 1) return "1 FREE live temple darshan (pick any temple)";
  if (p.liveTempleDarshan) return "After-marriage LIVE temple darshan included";
  return "";
};

/** Section shell — ivory card with the comps' lotus-flanked serif heading. */
function Panel({
  title,
  sub,
  right,
  children,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
    <Card className="!bg-viv-sheet p-5 lg:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="display text-[19px] lg:text-[21px] text-viv-maroon flex items-center gap-2">
          <Flower2 className="w-4 h-4 text-viv-gold shrink-0" aria-hidden="true" />
          {title}
          <Flower2 className="w-4 h-4 text-viv-gold shrink-0 scale-x-[-1]" aria-hidden="true" />
        </h2>
        {right}
      </div>
      {sub && <p className="text-[12.5px] text-viv-muted mt-1.5 leading-relaxed">{sub}</p>}
      <div className="mt-3.5">{children}</div>
    </Card>
    </Reveal>
  );
}

export default function VivahPackageDetailPage() {
  const navigate = useNavigate();
  const { packageId } = useParams<{ packageId: string }>();
  const location = useLocation();
  const state = (location.state || {}) as any;

  const catalog = useVivahCatalog();
  const lift = useLift();
  const tap = useTap();

  // Router state wins (instant), catalog is the fallback for direct hits.
  const pkg: VivahPackage | null = useMemo(
    () =>
      (state.pkg as VivahPackage) ||
      catalog.packages.find((p) => p.packageId === packageId) ||
      null,
    [state.pkg, catalog.packages, packageId]
  );

  const ritualNames: string[] = (state.ritualNames as string[])?.length
    ? state.ritualNames
    : catalog.rituals.length
      ? catalog.rituals.map((r) => r.titleEng)
      : FALLBACK_RITUAL_NAMES;

  if (!pkg) {
    // Still fetching, or a bad slug once the catalog has landed.
    if (catalog.loading) {
      return (
        <VivahScope className="flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-viv-orange animate-spin" />
        </VivahScope>
      );
    }
    return (
      <VivahScope className="flex flex-col items-center justify-center px-6 text-center">
        <PjarLogo className="h-12" />
        <p className="display text-[19px] text-viv-ink mt-4">This package is no longer listed.</p>
        <Btn variant="orange" size="md" to="/vedic-vivah" className="mt-4">
          See all Vivah packages
        </Btn>
      </VivahScope>
    );
  }

  const advPct = effectiveAdvancePercent(catalog.advancePercent ?? state.advancePercent, pkg);
  const advAmount = advanceOf(pkg.price, advPct);
  const save = Math.max(0, (pkg.strikePrice || 0) - pkg.price);
  const gifts = pkg.gifts || [];
  const giftWorth = gifts.reduce((s, g) => s + (g.price || 0) * (g.count || 1), 0);
  const tLabel = templeLabel(pkg);
  const temples = catalog.temples || state.temples || [];
  const kashi = catalog.kashi || state.kashi || null;

  /**
   * The rituals this package covers, in the shape the checkout books with.
   * The checkout asks for a date PER RITUAL, so a package buyer must arrive
   * with the same list an a-la-carte buyer would. Empty `ritualSlugs` or
   * `includesAllRituals` both mean the whole journey.
   */
  const packageRituals = (() => {
    const wanted =
      !pkg.includesAllRituals && pkg.ritualSlugs?.length ? new Set(pkg.ritualSlugs) : null;
    return (catalog.rituals || [])
      .filter(
        (r) =>
          !wanted ||
          wanted.has(r.slug) ||
          (r.componentSlugs || []).some((c) => wanted.has(c))
      )
      .map((r) => ({
        slug: r.slug,
        name: r.titleEng,
        price: r.price || 0,
        samagriPrice: r.samagriPrice || 0,
        ...(r.componentSlugs?.length ? { componentSlugs: r.componentSlugs } : {}),
      }));
  })();

  const book = () =>
    navigate("/vedic-vivah/checkout", {
      state: {
        rituals: [],
        isSampooranPackage: false,
        samagriNeeded: true,
        packageTier: {
          packageId: pkg.packageId,
          name: pkg.name,
          price: pkg.price,
          panditCount: pkg.panditCount,
          hasCoordinator: pkg.hasCoordinator,
          gifts: pkg.gifts,
          advancePercent: pkg.advancePercent,
          freeTempleDarshan: pkg.freeTempleDarshan,
          templeDarshanCount: pkg.templeDarshanCount,
        },
        packageRituals,
        crossSell: catalog.crossSell,
        advancePercent: catalog.advancePercent,
        supportedLanguages: catalog.supportedLanguages,
        temples,
        kashi,
        muhurats: catalog.muhurats,
      },
    });

  const title = `${pkg.name} — Vedic Vivah Package (${fmtINR(pkg.price)}) | Pandit Ji At Request`;
  const description =
    pkg.tagline ||
    `${pkg.panditCount} verified Pandit Ji${pkg.panditCount > 1 ? "s" : ""}, every Vivah ritual${
      pkg.hasCoordinator ? ", a dedicated coordinator" : ""
    } and samagri included — ${fmtINR(pkg.price)} all-inclusive.`;

  return (
    <VivahScope className="pb-28">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link
          rel="canonical"
          href={`https://panditjiatrequest.com/vedic-vivah/package/${pkg.packageId}`}
        />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={pkg.image || VIVAH_IMG.banner} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${pkg.name} — Vedic Vivah Package`,
            description,
            brand: { "@type": "Brand", name: "Pandit Ji At Request" },
            offers: {
              "@type": "Offer",
              price: pkg.price,
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
              url: `https://panditjiatrequest.com/vedic-vivah/package/${pkg.packageId}`,
            },
          })}
        </script>
      </Helmet>

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-viv-ivory/95 backdrop-blur border-b border-viv-hair">
        <Wrap className="max-w-[900px]! py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 rounded-full bg-white border border-viv-hair flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-viv-maroon" />
          </button>
          <PjarLogo className="h-7 sm:h-9" />
          <div className="min-w-0 pl-1">
            <h1 className="display text-[18px] text-viv-maroon leading-tight truncate">
              {pkg.name}
            </h1>
            <p className="text-[11.5px] text-viv-gold leading-tight">
              {pkg.badge ? `${pkg.badge} Package` : "Vedic Vivah Package"}
            </p>
          </div>
        </Wrap>
      </div>

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* ── Hero card ── */}
        <motion.div
          {...lift}
          className="viv-art-package relative rounded-[18px] overflow-hidden bg-viv-maroon-800 bg-cover bg-center min-h-[300px] sm:min-h-[340px] flex items-end"
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(50,17,16,0.94)_0%,rgba(50,17,16,0.7)_55%,rgba(50,17,16,0.92)_100%)] sm:bg-[linear-gradient(95deg,rgba(50,17,16,0.97)_0%,rgba(50,17,16,0.92)_42%,rgba(50,17,16,0.35)_66%,rgba(50,17,16,0.1)_100%)]" />
          <div className="relative p-5 sm:p-7 w-full sm:max-w-[62%]">
            {pkg.badge && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] uppercase text-viv-gold-lt border border-viv-gold/50 rounded-full px-3 py-1.5">
                <span aria-hidden="true">★</span> {pkg.badge}
              </span>
            )}
            {pkg.hindiName && (
              <p className="text-[15px] text-viv-gold-lt font-medium mt-3">{pkg.hindiName}</p>
            )}
            <h2 className="text-[34px] sm:text-[44px] text-viv-cream leading-none mt-1">
              {pkg.name}
            </h2>
            {pkg.tagline && (
              <p className="text-[13px] text-viv-cream/80 mt-2.5 leading-relaxed max-w-[380px]">
                {pkg.tagline}
              </p>
            )}

            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-viv-cream bg-black/35 border border-white/15 rounded-full px-3 py-1.5 mt-4">
              <Users className="w-3.5 h-3.5" />
              {pkg.panditCount} Pandit Ji{(pkg.panditCount || 1) > 1 ? "s" : ""}
            </span>
            {pkg.hasCoordinator && (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-viv-cream bg-black/35 border border-white/15 rounded-full px-3 py-1.5 mt-4 ml-2">
                Dedicated coordinator
              </span>
            )}

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-4">
              {!!pkg.strikePrice && pkg.strikePrice > pkg.price && (
                <span className="text-[17px] text-viv-cream/50 line-through">
                  {fmtINR(pkg.strikePrice)}
                </span>
              )}
              <span className="text-[34px] font-bold text-viv-cream leading-none">
                {fmtINR(pkg.price)}
              </span>
              <span className="text-[13px] text-viv-cream/70">all-inclusive</span>
            </div>
            {save > 0 && (
              <span className="inline-block text-[12px] font-bold text-viv-orange bg-white rounded-full px-3.5 py-1.5 mt-3">
                YOU SAVE {fmtINR(save)}
              </span>
            )}
          </div>
        </motion.div>

        {/* ── What's included ── */}
        <Panel title="What's included">
          <ul className="divide-y divide-viv-hair/70">
            {(pkg.perks || []).map((perk, i) => (
              <li key={`${perk.title}-${i}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className="w-5 h-5 rounded-full bg-viv-gold-pale border border-viv-hair flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-viv-maroon" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-viv-ink leading-snug">
                    {perk.title}
                  </span>
                  {perk.description && (
                    <span className="block text-[12px] text-viv-muted mt-0.5 leading-snug">
                      {perk.description}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* ── Every sacred ritual ── */}
        {pkg.includesAllRituals !== false && ritualNames.length > 0 && (
          <Panel
            title="Every sacred ritual"
            sub="The complete Vivah journey — start to finish — is included."
          >
            <div className="flex flex-wrap gap-2">
              {ritualNames.map((n) => (
                <span
                  key={n}
                  className="text-[12.5px] font-medium text-viv-maroon bg-viv-tint border border-viv-hair rounded-full px-3.5 py-2"
                >
                  {n}
                </span>
              ))}
            </div>
          </Panel>
        )}

        {/* ── Free gifts included — the highlighted uphaar section ── */}
        {gifts.length > 0 && (
          <Reveal>
            <div className="rounded-[18px] overflow-hidden border-2 border-viv-gold/60 bg-white shadow-[0_18px_44px_-26px_rgba(191,139,52,0.9)]">
              <div className="bg-gradient-to-r from-viv-gold-lt to-viv-gold px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                <p className="display text-[19px] text-[#3A2205] flex items-center gap-2">
                  <Gift className="w-4.5 h-4.5" /> Free Gifts Included
                </p>
                <span className="text-[11px] font-bold tracking-wide uppercase bg-[#3A2205] text-viv-gold-lt rounded-full px-3 py-1.5">
                  {gifts.length} Uphaar{giftWorth > 0 ? ` · worth ${fmtINR(giftWorth)}` : ""} · FREE
                </span>
              </div>

              <div className="p-4 sm:p-5 bg-gradient-to-b from-viv-tint to-white">
                <Stagger className="grid sm:grid-cols-2 gap-3" gap={0.05}>
                  {gifts.map((g, i) => (
                    <RevealItem key={`${g.title}-${i}`} className="h-full">
                      <motion.div
                        {...lift}
                        className="h-full flex gap-3 bg-white border border-viv-hair rounded-xl p-3 hover:border-viv-gold transition-colors"
                      >
                        <span className="relative w-16 h-16 rounded-lg overflow-hidden bg-viv-gold-pale border border-viv-hair flex items-center justify-center shrink-0">
                          {g.image ? (
                            <img
                              src={g.image}
                              alt={g.title}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Gift className="w-6 h-6 text-viv-maroon" />
                          )}
                          <span className="absolute left-0 bottom-0 right-0 text-center text-[8.5px] font-bold tracking-[0.08em] uppercase bg-viv-orange text-white py-0.5">
                            Free
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-semibold text-viv-ink leading-snug">
                            {g.title}
                            {(g.count || 1) > 1 ? ` ×${g.count}` : ""}
                          </span>
                          {g.description && (
                            <span className="block text-[11.5px] text-viv-muted mt-0.5 leading-snug line-clamp-2">
                              {g.description}
                            </span>
                          )}
                          <span className="flex flex-wrap gap-1.5 mt-1.5">
                            {g.forWhom && (
                              <span className="text-[10px] font-medium text-viv-muted bg-viv-sheet border border-viv-hair rounded-full px-2 py-0.5">
                                For {g.forWhom}
                              </span>
                            )}
                            {!!g.price && (
                              <span className="text-[10px] font-semibold text-viv-orange bg-viv-tint border border-viv-hair rounded-full px-2 py-0.5">
                                worth {fmtINR(g.price)}
                              </span>
                            )}
                          </span>
                        </span>
                      </motion.div>
                    </RevealItem>
                  ))}
                </Stagger>
                <p className="text-[11px] text-viv-muted-2 text-center mt-3">
                  Every uphaar is included in the {pkg.name} price — nothing extra to pay.
                </p>
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Temple darshan ── */}
        {!!tLabel && (
          <Panel title="After-marriage live temple darshan" sub={tLabel}>
            {temples.length > 0 && (
              <>
                <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-viv-muted-2 mb-2">
                  Available destinations
                </p>
                <div className="flex flex-wrap gap-2">
                  {temples.map((t: any) => (
                    <span
                      key={t.templeId}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-viv-maroon bg-viv-tint border border-viv-hair rounded-full px-3.5 py-2"
                    >
                      <Building2 className="w-3.5 h-3.5 text-viv-gold" />
                      {t.name}
                      {t.city ? ` • ${t.city}` : ""}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Panel>
        )}

        {/* ── Kashi upsell ── */}
        {kashi && kashi.enabled !== false && kashi.isActive !== false && (
          <button
            onClick={book}
            className="w-full text-left rounded-[14px] bg-viv-maroon-900 border border-viv-gold/30 px-5 py-4 flex items-center gap-4 hover:brightness-110 transition-all"
          >
            <span className="w-11 h-11 rounded-full border border-viv-gold/45 flex items-center justify-center shrink-0">
              <VivahMark size={26} tone="cream" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="display block text-[16px] text-viv-cream leading-snug">
                Want a Vedacharya from Kashi?
              </span>
              <span className="block text-[12.5px] text-viv-cream/65 mt-0.5">
                You can invite one at checkout for{" "}
                <span className="font-semibold text-viv-gold-lt">
                  {fmtINR(kashi.premiumPrice)}
                </span>
                .
              </span>
            </span>
            <ChevronRight className="w-5 h-5 text-viv-cream/60 shrink-0" />
          </button>
        )}

        {/* ── Booking panel: the loudest thing on the page ── */}
        <Reveal>
          <div
            id="book"
            className="relative rounded-[18px] overflow-hidden border-2 border-viv-orange bg-white shadow-[0_20px_50px_-28px_rgba(192,74,1,0.85)]"
          >
            <div className="bg-gradient-to-r from-viv-orange-lt to-viv-orange px-5 py-3 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-white shrink-0" />
              <p className="text-[13px] font-bold tracking-[0.08em] uppercase text-white">
                Ready to book your {pkg.name}?
              </p>
            </div>

            <div className="p-5 lg:p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13.5px] text-viv-ink">Package price (all-inclusive)</span>
                <span className="text-[19px] font-semibold text-viv-ink whitespace-nowrap">
                  {fmtINR(pkg.price)}
                </span>
              </div>
              <div className="h-px bg-viv-hair my-3.5" />
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13.5px] font-semibold text-viv-ink">
                  Pay now to reserve ({advPct}% advance)
                </span>
                <span className="text-[26px] font-bold text-viv-orange whitespace-nowrap leading-none">
                  {fmtINR(advAmount)}
                </span>
              </div>
              <p className="text-[11.5px] text-viv-muted mt-2 leading-relaxed">
                The balance of {fmtINR(Math.max(0, pkg.price - advAmount))} is collected before the
                ceremony. Free reschedule &amp; cancellation as per policy.
              </p>

              <motion.div {...tap} className="mt-4">
                <Btn variant="orange" size="lg" onClick={book} className="w-full text-[15px] py-4">
                  Book {pkg.name} — pay {fmtINR(advAmount)}
                  <ArrowRight className="w-4 h-4" />
                </Btn>
              </motion.div>

              <Stagger className="grid grid-cols-3 gap-2 mt-4" gap={0.05}>
                {[
                  [ShieldCheck, "Verified Pandit Ji"],
                  [Lock, "Secure payment"],
                  [RotateCcw, "Free reschedule"],
                ].map(([Icon, label]: any) => (
                  <RevealItem
                    key={label}
                    className="flex flex-col items-center gap-1.5 text-center bg-viv-sheet border border-viv-hair rounded-xl px-2 py-2.5"
                  >
                    <Icon className="w-4 h-4 text-viv-gold" />
                    <span className="text-[10px] text-viv-muted leading-tight">{label}</span>
                  </RevealItem>
                ))}
              </Stagger>

              <button
                onClick={() => navigate("/vedic-vivah#packages")}
                className="w-full text-[12px] font-semibold text-viv-muted py-3 hover:text-viv-maroon transition-colors"
              >
                Compare with the other packages
              </button>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-viv-ivory/97 backdrop-blur border-t border-viv-hair">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <div className="min-w-0">
            <p className="text-[18px] font-semibold text-viv-ink leading-tight">
              {fmtINR(pkg.price)}
            </p>
            <p className="text-[11.5px] text-viv-muted leading-tight">
              Reserve with {fmtINR(advAmount)} advance
            </p>
          </div>
          <motion.div {...tap} className="flex-1 max-w-[420px] ml-auto">
            <Btn variant="orange" size="lg" onClick={book} className="w-full">
              Book {pkg.name} <ArrowRight className="w-4 h-4" />
            </Btn>
          </motion.div>
        </div>
      </div>
    </VivahScope>
  );
}
