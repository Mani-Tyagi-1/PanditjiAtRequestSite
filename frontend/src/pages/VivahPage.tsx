import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import axios from "axios";
import {
  Award,
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Flower2,
  Gem,
  HeartHandshake,
  Landmark,
  LibraryBig,
  Lock,
  MessageCircle,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import API_URL from "../utils/apiConfig";
import {
  VIVAH_ABOUT,
  VIVAH_ELITE,
  VIVAH_FAQ,
  VIVAH_HERO,
  VIVAH_PANDITS,
  VIVAH_TESTIMONIALS,
  initialsOf,
} from "../data/vivahContent";
import { fmtINR, VIVAH_IMG, type Ritual, type VivahPackage } from "../data/vivahCatalog";
import { useVivahCatalog, useDwellNudge, currentUser } from "../data/vivahApi";
import VivahPackageCards from "../components/vivah/VivahPackageCards";
import VivahRitualCards from "../components/vivah/VivahRitualCards";
import VivahKashi from "../components/vivah/VivahKashi";
import RitualDrawer from "../components/vivah/RitualDrawer";
import VivahConsultModal from "../components/vivah/VivahConsultModal";
import { Btn, Card, Head, Medallion, Orn, Section, Wrap } from "../components/vivah/ui";
import {
  AnimatePresence,
  AnimatedTotal,
  Reveal,
  RevealItem,
  Stagger,
  barUp,
  collapse,
  motion,
  useLift,
  useTap,
} from "../components/vivah/motion";
import { PJAR, VivahFooter, VivahHeader, VivahScope } from "../components/vivah/VivahLayout";
import SafeSection, {
  StaticGuidesBackup,
  StaticPackagesBackup,
} from "../components/vivah/SafeSection";
import BLOG_DATA from "../data/vivahBlogs.json";
import { Link } from "react-router-dom";

/* ========================================================================== */
/*                            LOCAL PAGE CONTENT                              */
/* ========================================================================== */

/** Hero proof band — the comps' four stats, carrying our own published numbers. */
const HERO_STATS = [
  { Icon: Users, value: "1,800+", label: "Verified Pandits" },
  { Icon: Flower2, value: "15,000+", label: "Sacred Vivahs" },
  { Icon: Star, value: "4.9★", label: "Trusted by Families" },
  { Icon: ShieldCheck, value: "100%", label: "Ritual Purity" },
];

const TRUST_FIVE = [
  { Icon: Landmark, title: "Authentic Vedic Rituals", sub: "As per Shastras" },
  { Icon: BadgeCheck, title: "Verified Pandits", sub: "Background Checked" },
  { Icon: Flower2, title: "Clean & Pure Samagri", sub: "Premium Quality" },
  { Icon: CalendarCheck, title: "On-time Muhurat", sub: "Precision & Punctuality" },
  { Icon: HeartHandshake, title: "Satisfaction Guaranteed", sub: "100% Happiness" },
];

const ELITE_ICON = [Gem, Sparkles, Flower2, Award];

const KNOW_TILES = [
  { Icon: LibraryBig, title: "Meaning of Vivah Sanskar", sub: "Spiritual significance" },
  { Icon: BookOpen, title: "Rituals & Their Importance", sub: "Step-by-step explanation" },
  { Icon: Sparkles, title: "Benefits of Vedic Vivah", sub: "Blessings for life" },
];

const HELP_TILES = [
  { Icon: MessageCircle, title: "Need Help?", sub: "Chat with our support team", action: "consult" },
  { Icon: Users, title: "Custom Requests", sub: "Share your special needs", action: "consult" },
  { Icon: RefreshCcw, title: "Reschedule / Cancel", sub: "Flexible with policy", action: "account" },
  { Icon: CalendarCheck, title: "Do You Have a Date?", sub: "Check availability now", action: "packages" },
];

type Pandit = {
  _id: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  experienceInYears?: number;
  isVerified?: boolean;
  isActive?: boolean;
  location?: { city?: string; state?: string };
};

type PanditCard = {
  id: string;
  name: string;
  years: number;
  note: string;
  image?: string;
};

/** Local showcase profiles, used only until the live roster loads (or if it fails). */
const FALLBACK_PANDITS: PanditCard[] = VIVAH_PANDITS.slice(0, 5).map((p) => ({
  id: p.id,
  name: p.name,
  years: p.experienceYears,
  note: p.specialities?.slice(0, 2).join(" & ") || p.title,
  image: p.image,
}));

/** Top guides surfaced on the landing page — static JSON, cannot fail. */
const FEATURED_GUIDES = (BLOG_DATA as any).posts.slice(0, 4) as {
  slug: string;
  title: string;
  hindiTitle?: string;
  category: string;
  minutes: number;
  cover: string;
  coverAlt: string;
  intro: string;
}[];

const scrollTo = (sel: string) =>
  document.querySelector(sel)?.scrollIntoView({ behavior: "smooth", block: "start" });

/* ========================================================================== */
/*                                   PAGE                                     */
/* ========================================================================== */

export default function VivahPage() {
  const navigate = useNavigate();
  const catalog = useVivahCatalog();
  const user = currentUser();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerRitual, setDrawerRitual] = useState<Ritual | null>(null);
  const [consultOpen, setConsultOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [allReviews, setAllReviews] = useState(false);
  const [pandits, setPandits] = useState<PanditCard[]>(FALLBACK_PANDITS);

  /**
   * Kashi seva chosen up here on the landing page. Both values travel into
   * checkout as `preInviteKashi` / `preKashiPanditName`, where the premium is
   * added to the package price and the server re-prices it before charging.
   */
  const [kashiPanditName, setKashiPanditName] = useState("");
  const [kashiPackageId, setKashiPackageId] = useState("");
  const inviteKashi = kashiPanditName.length > 0;

  const lift = useLift();
  const tap = useTap();

  // 5-minute dwell → WhatsApp nudge, cancelled the moment the family converts.
  const cancelNudge = useDwellNudge(
    user?.name || "",
    String(user?.phone || "").replace(/\D/g, "").slice(-10)
  );

  // Verified Pandit Jis — same endpoint & filtering the rest of the site uses.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/pandits`);
        if (!data?.success || !Array.isArray(data.data)) return;
        const live: PanditCard[] = data.data
          .filter((p: Pandit) => {
            if (p.isActive === false || p.isVerified !== true) return false;
            const n = `${p.prefix || ""} ${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
            return !n.includes("nirmanyu thakur") && !n.includes("vansh bhandari");
          })
          .slice(0, 5)
          .map((p: Pandit) => ({
            id: p._id,
            name: `${p.prefix || "Pandit"} ${p.firstName || ""} ${p.lastName || ""}`
              .replace(/\s+/g, " ")
              .trim(),
            years: Number(p.experienceInYears) || 0,
            note: [p.location?.city, p.location?.state].filter(Boolean).join(", "),
            image: p.profileImage,
          }));
        if (live.length) setPandits(live);
      } catch {
        /* keep the showcase profiles */
      }
    })();
  }, []);

  const selectedList = useMemo(
    () => catalog.rituals.filter((r) => selected.has(r.slug)),
    [catalog.rituals, selected]
  );
  const selectedTotal = useMemo(
    () => selectedList.reduce((s, r) => s + (r.price || 0), 0),
    [selectedList]
  );

  const toggleRitual = (slug: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  /** A display ritual, flattened to the shape the checkout books with. */
  const asSelected = (r: (typeof catalog.rituals)[number]) => ({
    slug: r.slug,
    name: r.titleEng,
    price: r.price || 0,
    samagriPrice: r.samagriPrice || 0,
    ...(r.componentSlugs?.length ? { componentSlugs: r.componentSlugs } : {}),
  });

  /**
   * Which rituals a package actually covers.
   *
   * The checkout needs this to ask the family for a DATE PER RITUAL — a vivah
   * is not one appointment, and a package buyer has just as many ceremonies to
   * schedule as someone who picked them one by one. `includesAllRituals` and an
   * empty `ritualSlugs` both mean "everything".
   */
  const coverageFor = (pkg: VivahPackage) => {
    const wanted =
      !pkg.includesAllRituals && pkg.ritualSlugs?.length ? new Set(pkg.ritualSlugs) : null;
    return catalog.rituals
      .filter(
        (r) =>
          !wanted ||
          wanted.has(r.slug) ||
          (r.componentSlugs || []).some((c) => wanted.has(c))
      )
      .map(asSelected);
  };

  /** Shared catalog context every checkout entry point must carry. */
  const catalogContext = {
    crossSell: catalog.crossSell,
    advancePercent: catalog.advancePercent,
    supportedLanguages: catalog.supportedLanguages,
    temples: catalog.temples,
    kashi: catalog.kashi,
    muhurats: catalog.muhurats,
    // Kashi seva picked on this page — checkout starts with it already on.
    // "ANY" means "assign one for us", so no specific name travels across.
    preInviteKashi: inviteKashi,
    preKashiPanditName: kashiPanditName === "ANY" ? "" : kashiPanditName,
  };

  const kashiPremium = inviteKashi ? catalog.kashi?.premiumPrice || 0 : 0;

  const bookSelectedRituals = () => {
    if (selectedList.length === 0) return;
    cancelNudge();
    navigate("/vedic-vivah/checkout", {
      state: {
        rituals: selectedList.map((r) => ({
          slug: r.slug,
          name: r.titleEng,
          price: r.price || 0,
          samagriPrice: r.samagriPrice || 0,
          ...(r.componentSlugs?.length ? { componentSlugs: r.componentSlugs } : {}),
        })),
        isSampooranPackage: false,
        samagriNeeded: true,
        ...catalogContext,
      },
    });
  };

  const bookPackage = (pkg: VivahPackage) => {
    cancelNudge();
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
        packageRituals: coverageFor(pkg),
        ...catalogContext,
      },
    });
  };

  const openPackageDetail = (pkg: VivahPackage) =>
    navigate(`/vedic-vivah/package/${pkg.packageId}`, {
      state: { pkg, ritualNames: catalog.rituals.map((r) => r.titleEng), ...catalogContext },
    });

  /**
   * Terminal step of the Kashi chain. Both answers are already in hand, so this
   * goes straight to checkout with the package AND the Acharya attached —
   * nothing is asked twice.
   */
  const continueWithKashi = (pkg: VivahPackage) => bookPackage(pkg);

  const seoTitle =
    catalog.seo?.metaTitle ||
    "Vedic Vivah — Book a Verified Marriage Pandit Ji Online | Pandit Ji At Request";
  const seoDesc =
    catalog.seo?.metaDescription ||
    "Book verified Vedic Pandit Jis for your complete Hindu marriage — Kundali Milan, Muhurat, Haldi, Pheras & after-marriage live temple darshan. Transparent packages, pan-India, in your language.";

  const kashi = catalog.kashi;

  return (
    <VivahScope>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href="https://panditjiatrequest.com/vedic-vivah" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:image" content={catalog.seo?.ogImage || VIVAH_IMG.banner} />
        {/* Service + Offers + FAQ — the three types answer engines look for. */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Service",
                serviceType: "Vedic Vivah — Hindu Marriage Pandit Booking",
                name: seoTitle,
                description: seoDesc,
                provider: {
                  "@type": "Organization",
                  name: "Pandit Ji At Request",
                  url: "https://panditjiatrequest.com",
                },
                areaServed: "India",
                url: "https://panditjiatrequest.com/vedic-vivah",
                offers: catalog.packages.map((p) => ({
                  "@type": "Offer",
                  name: `${p.name} — Vedic Vivah Package`,
                  price: p.price,
                  priceCurrency: "INR",
                  availability: "https://schema.org/InStock",
                  url: `https://panditjiatrequest.com/vedic-vivah/package/${p.packageId}`,
                })),
              },
              {
                "@type": "FAQPage",
                mainEntity: VIVAH_FAQ.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              },
            ],
          })}
        </script>
      </Helmet>

      <VivahHeader onBook={() => scrollTo("#packages")} />

      {/* ───────────────────────────── HERO ───────────────────────────── */}
      <section className="relative">
        <div className="relative bg-viv-deep aspect-[1000/694] sm:aspect-[2244/701] w-full flex items-center overflow-hidden">
          {/* Two crops from the supplied artwork: the tall one frames the havan
              on a phone, the wide one keeps the mandap in view on a desktop. */}
          <div
            className="viv-art-hero-mobile absolute inset-0 bg-cover bg-center sm:hidden"
          />
          <div
            className="viv-art-hero-desktop absolute inset-0 bg-cover bg-center hidden sm:block"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(33,9,8,0.9)_0%,rgba(33,9,8,0.42)_46%,rgba(33,9,8,0.88)_100%)] sm:bg-[linear-gradient(100deg,rgba(33,9,8,0.96)_0%,rgba(33,9,8,0.9)_34%,rgba(33,9,8,0.45)_58%,rgba(33,9,8,0.12)_78%)]" />
          <Wrap className="relative py-12 lg:py-16">
            <div className="max-w-[620px]">
              <h1 className="text-[38px] sm:text-[50px] lg:text-[62px] text-viv-cream leading-[1.02]">
                Vedic Vivah
                <br />
                Sanskar
              </h1>
              <p className="display text-[19px] sm:text-[22px] text-viv-gold-lt mt-3">
                Sacred. Authentic. Eternal.
              </p>
              <p className="text-[13px] sm:text-[14px] text-viv-cream/75 mt-3.5 leading-relaxed max-w-[440px]">
                {VIVAH_HERO.tagline}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
                {HERO_STATS.map(({ Icon, value, label }, i) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2.5 ${
                      i > 0 ? "sm:pl-6 sm:border-l sm:border-viv-gold/25" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5 text-viv-gold-lt shrink-0" />
                    <span>
                      <span className="block text-[17px] sm:text-[19px] font-semibold text-viv-cream leading-none">
                        {value}
                      </span>
                      <span className="block text-[10.5px] text-viv-cream/60 mt-1">{label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Wrap>
        </div>
      </section>

      {/* ───────────────────── HOW WOULD YOU LIKE TO BEGIN ───────────────────── */}
      <Wrap className="relative -mt-8 lg:-mt-10 z-10">
        <Reveal y={30}>
        <Card className="viv-mandala bg-[position:center] px-5 sm:px-8 py-6 lg:py-8 !bg-viv-sheet">
          <p className="display text-center text-[14px] sm:text-[16px] italic text-viv-maroon/85 leading-relaxed max-w-[760px] mx-auto">
            Begin your sacred union with divine blessings. Share a few details and our verified
            Pandit Ji will guide every ritual with devotion. 🙏
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="h-px flex-1 max-w-[160px] bg-gradient-to-r from-transparent to-viv-gold/50" />
            <h2 className="text-[20px] sm:text-[24px] text-viv-ink text-center">
              How would you like to begin?
            </h2>
            <span className="h-px flex-1 max-w-[160px] bg-gradient-to-l from-transparent to-viv-gold/50" />
          </div>

          <Stagger className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3" gap={0.06}>
            {[
              {
                Icon: BookOpen,
                title: "View Packages",
                sub: "Explore & choose",
                run: () => scrollTo("#packages"),
              },
              {
                Icon: MessageCircle,
                title: "Talk to a Pandit",
                sub: "Get guidance",
                run: () => setConsultOpen(true),
              },
              {
                Icon: CalendarCheck,
                title: "I know my date",
                sub: "Check availability",
                run: () => scrollTo("#packages"),
              },
              {
                Icon: ClipboardCheck,
                title: "Start booking",
                sub: "Fill details & proceed",
                run: () => scrollTo("#rituals"),
              },
            ].map(({ Icon, title, sub, run }) => (
              <RevealItem key={title} className="h-full">
                <motion.button
                  onClick={run}
                  {...lift}
                  className="w-full h-full bg-white border border-viv-hair rounded-xl px-3 py-4 flex items-center justify-center gap-2.5 text-left hover:border-viv-gold hover:shadow-[0_8px_20px_-14px_rgba(90,40,10,0.45)] transition-colors"
                >
                  <Icon className="w-5 h-5 text-viv-gold shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-viv-ink leading-snug">
                      {title}
                    </span>
                    <span className="block text-[11px] text-viv-muted leading-snug">{sub}</span>
                  </span>
                </motion.button>
              </RevealItem>
            ))}
          </Stagger>
        </Card>
        </Reveal>
      </Wrap>

      {/* Both catalog attempts failed → every price below is the bundled fallback,
          which can lag what the admin has since published. Say so rather than
          quoting a number we can't stand behind. (Checkout also re-checks the
          amount against the server before taking any money.) */}
      {catalog.loadError && (
        <Wrap className="mt-5">
          <div
            role="status"
            className="text-[12px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 leading-relaxed"
          >
            We couldn't reach our live pricing just now, so the amounts below are indicative. Your
            final amount is confirmed before any payment — or{" "}
            <button onClick={() => setConsultOpen(true)} className="font-bold underline">
              request a free callback
            </button>{" "}
            and we'll walk you through it.
          </div>
        </Wrap>
      )}

      {/* ─────────────────────────── PACKAGES ─────────────────────────── */}
      <Section id="packages">
        <SafeSection
          name="packages"
          fallback={<StaticPackagesBackup onBook={() => setConsultOpen(true)} />}
        >
          <VivahPackageCards
            packages={catalog.packages}
            onSelect={bookPackage}
            onDetails={openPackageDetail}
            advancePercent={catalog.advancePercent}
            ritualNames={catalog.rituals.map((r) => r.titleEng)}
          />
        </SafeSection>
      </Section>

      {/* ── The fork: one package, or hand-picked rituals ── */}
      <Wrap>
        <Reveal>
          <div className="flex items-center gap-4 py-2">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-viv-gold/45" />
            <span className="text-center">
              <span className="display block text-[15px] text-viv-maroon">
                …or build your own
              </span>
              <span className="block text-[11.5px] text-viv-muted mt-0.5">
                Every package above already covers all {catalog.rituals.length} rituals. Prefer
                just a few? Pick them below.
              </span>
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-viv-gold/45" />
          </div>
        </Reveal>
      </Wrap>

      {/* ────────────────────── RITUAL JOURNEY ────────────────────── */}
      <Section id="rituals">
        <SafeSection name="rituals">
        <VivahRitualCards
          rituals={catalog.rituals}
          selected={selected}
          onView={setDrawerRitual}
          onToggle={toggleRitual}
        />
        </SafeSection>
      </Section>

      {/* ───────────────────────── KASHI SEVA ───────────────────────── */}
      {kashi && kashi.enabled !== false && kashi.isActive !== false && (
        <Section id="kashi" className="bg-viv-tint/40">
          <SafeSection name="kashi">
          <VivahKashi
            kashi={kashi}
            packages={catalog.packages}
            advancePercent={catalog.advancePercent}
            panditName={kashiPanditName}
            onPanditNameChange={setKashiPanditName}
            packageId={kashiPackageId}
            onPackageIdChange={setKashiPackageId}
            onContinue={continueWithKashi}
          />
          </SafeSection>
        </Section>
      )}

      {/* ───────────────────────── PANDITS ───────────────────────── */}
      <Section id="pandits" className="bg-viv-tint/50">
        <Wrap>
          <Reveal>
            <Head title="Our Verified Vedic Pandits" sub="Experienced. Trusted. Devoted." />
            <Orn className="mb-6" />
          </Reveal>

          <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pandits.map((p) => (
              <RevealItem key={p.id} className="h-full">
                <motion.div
                  {...lift}
                  className="h-full bg-white border border-viv-hair rounded-2xl shadow-[0_2px_14px_-8px_rgba(90,40,10,0.16)] hover:border-viv-gold transition-colors p-4 text-center"
                >
                <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border border-viv-hair bg-viv-gold-pale flex items-center justify-center">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="display text-[18px] text-viv-maroon">
                      {initialsOf(p.name)}
                    </span>
                  )}
                </div>
                <p className="display text-[14px] text-viv-ink mt-2.5 leading-snug">{p.name}</p>
                {p.years > 0 && (
                  <p className="text-[11px] text-viv-muted mt-0.5">{p.years}+ years experience</p>
                )}
                {p.note && (
                  <p className="text-[10.5px] text-viv-muted-2 mt-1 leading-snug line-clamp-2">
                    {p.note}
                  </p>
                )}
                <p className="text-[11px] font-semibold text-viv-gold mt-2 inline-flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified
                </p>
                </motion.div>
              </RevealItem>
            ))}
          </Stagger>

          <div className="text-center mt-6">
            <Btn variant="maroon" size="md" to="/all-pandits">
              View All Pandits <ChevronRight className="w-3.5 h-3.5" />
            </Btn>
          </div>
        </Wrap>
      </Section>

      {/* ────────────────────── ELITE EXPERIENCE ────────────────────── */}
      <Wrap className="py-2">
        <Reveal>
        <div
          className="viv-art-elite relative rounded-[18px] overflow-hidden bg-viv-maroon-900 bg-cover bg-center"
        >
          <div className="absolute inset-0 bg-[linear-gradient(95deg,rgba(50,17,16,0.97)_0%,rgba(50,17,16,0.94)_42%,rgba(50,17,16,0.4)_64%,rgba(50,17,16,0.2)_100%)]" />
          <div className="relative p-6 lg:p-9 max-w-[720px]">
            <h2 className="text-[26px] lg:text-[32px] text-viv-cream">The Elite Vivah Experience</h2>
            <p className="text-[12.5px] text-viv-cream/65 mt-1.5">
              Crafted for families who seek the finest in tradition and service.
            </p>
            <Stagger className="mt-5 grid sm:grid-cols-2 gap-3" gap={0.06}>
              {VIVAH_ELITE.map((e, i) => {
                const Icon = ELITE_ICON[i % ELITE_ICON.length];
                return (
                  <RevealItem
                    key={e.title}
                    className="flex gap-3 border border-viv-gold/22 bg-black/25 rounded-lg p-3.5"
                  >
                    <Icon className="w-5 h-5 text-viv-gold-lt shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-viv-cream leading-snug">
                        {e.title}
                      </p>
                      <p className="text-[11px] text-viv-cream/60 mt-1 leading-snug">{e.text}</p>
                    </div>
                  </RevealItem>
                );
              })}
            </Stagger>
          </div>
        </div>
        </Reveal>
      </Wrap>

      {/* ─────────────────────── WHY FAMILIES TRUST US ─────────────────────── */}
      <Section id="how-it-works" tight>
        <Wrap>
          <Reveal>
          <Card className="!bg-viv-sheet px-5 sm:px-7 py-7">
            <h2 className="text-[22px] sm:text-[26px] text-viv-ink text-center">
              Why Families Trust Us with Their Most Sacred Day
            </h2>
            <Orn className="mb-5" />
            <Stagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" gap={0.05}>
              {TRUST_FIVE.map(({ Icon, title, sub }) => (
                <RevealItem key={title} className="flex items-center gap-3 px-1 py-2">
                  <Medallion size={42}>
                    <Icon className="w-5 h-5" />
                  </Medallion>
                  <span className="min-w-0">
                    <span className="display block text-[13px] text-viv-ink leading-snug">
                      {title}
                    </span>
                    <span className="block text-[11px] text-viv-muted leading-snug">{sub}</span>
                  </span>
                </RevealItem>
              ))}
            </Stagger>
          </Card>
          </Reveal>
        </Wrap>
      </Section>

      {/* ──────────────────────── TESTIMONIALS ──────────────────────── */}
      <Section id="reviews" tight>
        <Wrap>
          <Reveal>
            <Head
              title="Stories of Blessed Unions"
              sub="Real experiences from families who celebrated their Vivah with us."
            />
            <Orn className="mb-6" />
          </Reveal>

          <Stagger className="grid md:grid-cols-3 gap-4">
            {(allReviews ? VIVAH_TESTIMONIALS : VIVAH_TESTIMONIALS.slice(0, 3)).map((t) => (
              <RevealItem key={t.id} className="h-full">
                <motion.div
                  {...lift}
                  className="h-full bg-viv-sheet border border-viv-hair rounded-2xl shadow-[0_2px_14px_-8px_rgba(90,40,10,0.16)] p-5"
                >
                <span className="display text-[34px] leading-none text-viv-gold/60">“</span>
                <p className="text-[12.5px] italic text-viv-ink/85 leading-relaxed -mt-3">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center display text-[13px] text-white shrink-0"
                    style={{ backgroundColor: t.accent }}
                  >
                    {initialsOf(t.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-viv-maroon leading-snug">
                      {t.name}
                    </span>
                    <span className="block text-[11px] text-viv-muted leading-snug">
                      {t.ritual}
                    </span>
                  </span>
                </div>
                </motion.div>
              </RevealItem>
            ))}
          </Stagger>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            {VIVAH_TESTIMONIALS.length > 3 && (
              <Btn variant="maroon" size="sm" onClick={() => setAllReviews((v) => !v)}>
                {allReviews ? "Show fewer reviews" : "View More Reviews"}
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${allReviews ? "rotate-90" : ""}`}
                />
              </Btn>
            )}
            <span className="inline-flex items-center gap-1.5 text-[12px] text-viv-muted">
              <span className="text-[15px] font-semibold text-viv-ink">4.9</span>
              <span className="text-viv-gold">★★★★★</span>
              from 2,400+ families
            </span>
          </div>
        </Wrap>
      </Section>

      {/* ──────────────────────────── FAQ ──────────────────────────── */}
      <Section id="faqs" tight>
        <Wrap>
          <Reveal>
            <Head title="Frequently Asked Questions" />
            <Orn className="mb-6" />
          </Reveal>
          <div className="grid md:grid-cols-2 gap-x-5 gap-y-2.5">
            {VIVAH_FAQ.map((f, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={f.q}
                  className={`bg-white border rounded-xl overflow-hidden h-fit transition-colors ${
                    open ? "border-viv-gold" : "border-viv-hair"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="w-full flex items-center gap-3 text-left px-4 py-3"
                  >
                    <span className="flex-1 text-[12.5px] font-medium text-viv-ink leading-snug">
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
                      <motion.div key="a" {...collapse}>
                        <p className="px-4 pb-4 -mt-0.5 text-[12px] text-viv-muted leading-relaxed">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Wrap>
      </Section>

      {/* ─────────────────── TALK TO A PANDIT JI ─────────────────── */}
      <Wrap className="py-2">
        <Reveal>
        <div className="rounded-[18px] border border-viv-hair bg-gradient-to-r from-viv-tint to-viv-tint-2 px-5 sm:px-7 py-6 grid lg:grid-cols-[1fr_auto_1fr] items-center gap-5">
          <div>
            <h2 className="text-[22px] text-viv-maroon">Talk to a Pandit Ji — Free Guidance</h2>
            <p className="text-[12.5px] text-viv-muted mt-1.5 leading-relaxed">
              Have questions about rituals, muhurat or packages? Our Pandit Jis are here to guide
              you.
            </p>
          </div>
          <Btn variant="maroon" size="lg" onClick={() => setConsultOpen(true)}>
            <MessageCircle className="w-4 h-4" /> Connect on WhatsApp →
          </Btn>
          <div className="flex flex-wrap justify-start lg:justify-end gap-x-6 gap-y-2">
            {["Quick Response", "Expert Guidance", "No Obligation"].map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-2 text-[11.5px] text-viv-ink/80"
              >
                <span className="w-5 h-5 rounded-full border border-viv-gold/50 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-viv-gold" />
                </span>
                {l}
              </span>
            ))}
          </div>
        </div>
        </Reveal>
      </Wrap>

      {/* ─────────────────── KNOW MORE ABOUT VEDIC VIVAH ─────────────────── */}
      <Section id="about" tight>
        <Wrap>
          <Reveal>
          <Card className="!bg-viv-sheet p-5 sm:p-7 grid lg:grid-cols-[1.15fr_1fr] gap-6">
            <div className="flex gap-4">
              <Medallion size={46} className="hidden sm:inline-flex">
                <Landmark className="w-5 h-5" />
              </Medallion>
              <div className="min-w-0">
                <h2 className="text-[22px] sm:text-[25px] text-viv-ink">{VIVAH_ABOUT.title}</h2>
                <p className="text-[12.5px] text-viv-muted mt-2 leading-relaxed">
                  {VIVAH_ABOUT.intro}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                  <button
                    onClick={() => setAboutOpen((v) => !v)}
                    className="text-[12.5px] font-semibold text-viv-orange inline-flex items-center gap-1 hover:underline"
                  >
                    {aboutOpen ? "Show less" : "Read the full guide"}
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${aboutOpen ? "rotate-90" : ""}`}
                    />
                  </button>
                  <Btn variant="ghost" size="sm" to="/vedic-vivah/guides">
                    Vivah Guides
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Btn>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-1 gap-2.5 content-start">
              {KNOW_TILES.map(({ Icon, title, sub }) => (
                <button
                  key={title}
                  onClick={() => setAboutOpen(true)}
                  className="flex items-center gap-3 bg-white border border-viv-hair rounded-xl px-3.5 py-3 text-left hover:border-viv-gold transition-colors"
                >
                  <Medallion size={38}>
                    <Icon className="w-4 h-4" />
                  </Medallion>
                  <span className="min-w-0">
                    <span className="display block text-[13px] text-viv-ink leading-snug">
                      {title}
                    </span>
                    <span className="block text-[11px] text-viv-muted">{sub}</span>
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence initial={false}>
              {aboutOpen && (
              <motion.div key="about" {...collapse} className="lg:col-span-2">
              <div className="border-t border-viv-hair pt-5 space-y-5 mt-1">
                {VIVAH_ABOUT.sections.map((s) => (
                  <div key={s.heading}>
                    <h3 className="display text-[17px] text-viv-maroon">{s.heading}</h3>
                    <p className="text-[12.5px] text-viv-muted mt-1.5 leading-relaxed">{s.body}</p>
                    {s.shloka && (
                      <div className="mt-3 bg-viv-tint border border-viv-hair rounded-xl p-4">
                        <p className="text-[14.5px] text-viv-ink leading-relaxed">
                          {s.shloka.devanagari}
                        </p>
                        <p className="text-[12px] italic text-viv-muted mt-1.5">
                          {s.shloka.transliteration}
                        </p>
                        <p className="text-[12px] text-viv-muted mt-1.5">{s.shloka.meaning}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              </motion.div>
              )}
            </AnimatePresence>
          </Card>
          </Reveal>
        </Wrap>
      </Section>

      {/* ─────────────────────── VIVAH GUIDES ─────────────────────── */}
      <Section id="guides" tight>
        <SafeSection name="guides" fallback={<StaticGuidesBackup />}>
          <Wrap>
            <Reveal>
              <Head
                title="Vivah Gyan — Guides for Your Journey"
                sub="Muhurat, rituals, kundali, samagri — हर सवाल का जवाब, from verified Vedic Pandits."
              />
              <Orn className="mb-6" />
            </Reveal>

            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" gap={0.05}>
              {FEATURED_GUIDES.map((g) => (
                <RevealItem key={g.slug} className="h-full">
                  <motion.article {...lift} className="h-full">
                    <Link
                      to={`/vedic-vivah/guides/${g.slug}`}
                      className="flex flex-col h-full bg-white border border-viv-hair rounded-2xl overflow-hidden shadow-[0_10px_26px_-22px_rgba(90,40,10,0.6)] hover:border-viv-gold transition-colors"
                    >
                      <div className="relative h-[120px] overflow-hidden bg-viv-maroon-900">
                        <img
                          src={g.cover}
                          srcSet={`${g.cover} 1x, ${g.cover.replace(/\.(webp|jpg)$/, "@2x.$1")} 2x`}
                          alt={g.coverAlt}
                          loading="lazy"
                          decoding="async"
                          width={640}
                          height={240}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute left-2.5 top-2.5 text-[9px] font-bold tracking-[0.12em] uppercase bg-viv-ivory/95 text-viv-maroon rounded-full px-2.5 py-1">
                          {g.category}
                        </span>
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col">
                        <h3 className="display text-[15px] text-viv-ink leading-snug line-clamp-2">
                          {g.title}
                        </h3>
                        {g.hindiTitle && (
                          <p className="text-[11px] text-viv-maroon/80 mt-0.5">{g.hindiTitle}</p>
                        )}
                        <span className="flex items-center justify-between mt-auto pt-3 text-[11px]">
                          <span className="text-viv-muted-2">{g.minutes} min read</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-viv-orange">
                            Read <ChevronRight className="w-3 h-3" />
                          </span>
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                </RevealItem>
              ))}
            </Stagger>

            <div className="text-center mt-6">
              <Btn variant="maroon" size="md" to="/vedic-vivah/guides">
                See all {String((BLOG_DATA as any).posts.length)} guides
                <ChevronRight className="w-3.5 h-3.5" />
              </Btn>
            </div>
          </Wrap>
        </SafeSection>
      </Section>

      {/* ───────────────────────── HELP TILES ───────────────────────── */}
      <Wrap className="pb-10">
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-3" gap={0.05}>
          {HELP_TILES.map(({ Icon, title, sub, action }) => (
            <RevealItem key={title} className="h-full">
            <motion.button
              {...lift}
              onClick={() => {
                if (action === "consult") setConsultOpen(true);
                else if (action === "account") navigate("/account?tab=vivah");
                else scrollTo("#packages");
              }}
              className="flex items-center gap-3 bg-white border border-viv-hair rounded-xl px-3.5 py-3.5 text-left hover:border-viv-gold transition-colors"
            >
              <Medallion size={38}>
                <Icon className="w-4 h-4" />
              </Medallion>
              <span className="min-w-0">
                <span className="display block text-[13px] text-viv-ink leading-snug">{title}</span>
                <span className="block text-[11px] text-viv-muted leading-snug">{sub}</span>
              </span>
            </motion.button>
            </RevealItem>
          ))}
        </Stagger>
      </Wrap>

      <VivahFooter onBook={() => scrollTo("#packages")} />

      {/* ── Selected-rituals bar (only when the family has built their own) ── */}
      <AnimatePresence>
        {selectedList.length > 0 && (
          <motion.div
            key="ritual-bar"
            {...barUp}
            className="fixed bottom-0 inset-x-0 z-50 bg-viv-maroon-900/97 backdrop-blur border-t border-viv-gold/30 shadow-[0_-14px_40px_-20px_rgba(0,0,0,0.8)]"
          >
            <Wrap className="py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] text-viv-cream/70 truncate">
                  {selectedList.length} ritual{selectedList.length > 1 ? "s" : ""} added
                  {kashiPremium > 0 ? " · Kashi Acharya" : ""}
                </p>
                <p className="text-[18px] font-semibold text-viv-cream leading-tight">
                  <AnimatedTotal value={selectedTotal + kashiPremium} format={fmtINR} />
                </p>
              </div>
              <motion.div {...tap}>
                <Btn variant="orange" size="md" onClick={bookSelectedRituals}>
                  Continue <ChevronRight className="w-4 h-4" />
                </Btn>
              </motion.div>
            </Wrap>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating call pill — the comps' header phone, kept reachable on scroll. */}
      <a
        href={PJAR.phoneHref}
        aria-label={`Call ${PJAR.phoneDisplay}`}
        className={`fixed right-4 z-40 w-12 h-12 rounded-full bg-viv-maroon text-viv-cream flex items-center justify-center shadow-lg shadow-black/25 lg:hidden ${
          selectedList.length > 0 ? "bottom-24" : "bottom-5"
        }`}
      >
        <Phone className="w-5 h-5" />
      </a>

      <RitualDrawer
        ritual={drawerRitual}
        totalSteps={catalog.rituals.length}
        selected={!!drawerRitual && selected.has(drawerRitual.slug)}
        onToggle={toggleRitual}
        onClose={() => setDrawerRitual(null)}
      />

      <VivahConsultModal
        open={consultOpen}
        onClose={() => setConsultOpen(false)}
        onSubmitted={cancelNudge}
      />

      {/* Hidden lock glyph keeps the trust vocabulary consistent for a11y tools. */}
      <span className="sr-only">
        <Lock className="w-3 h-3" /> Payments are processed securely by Razorpay.
      </span>
    </VivahScope>
  );
}
