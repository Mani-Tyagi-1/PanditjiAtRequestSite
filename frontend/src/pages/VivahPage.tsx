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
  VIVAH_PANDITS,
  VIVAH_TESTIMONIALS,
  initialsOf,
} from "../data/vivahContent";
import { fmtINR, VIVAH_IMG, type Ritual, type VivahPackage } from "../data/vivahCatalog";
import { useVivahCatalog, useDwellNudge, currentUser } from "../data/vivahApi";
import { useVivahLang, hreflangLinks, tfmt } from "../i18n/vivah";
import VivahPackageCards from "../components/vivah/VivahPackageCards";
import Shloka, { VIVAH_SHLOKAS } from "../components/vivah/Shloka";
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

/** Hero proof band — the comps' four stats, carrying our own published numbers.
    Labels are dictionary keys, resolved with t() at render. */
const HERO_STATS = [
  { Icon: Users, value: "1,800+", label: "hero.stat.pandits" },
  { Icon: Flower2, value: "15,000+", label: "hero.stat.vivahs" },
  { Icon: Star, value: "4.9★", label: "hero.stat.families" },
  { Icon: ShieldCheck, value: "100%", label: "hero.stat.purity" },
];

/* Dictionary keys, resolved with t() at render. */
const TRUST_FIVE = [
  { Icon: Landmark, title: "trust.f1t", sub: "trust.f1d" },
  { Icon: BadgeCheck, title: "trust.f2t", sub: "trust.f2d" },
  { Icon: Flower2, title: "trust.f3t", sub: "trust.f3d" },
  { Icon: CalendarCheck, title: "trust.f4t", sub: "trust.f4d" },
  { Icon: HeartHandshake, title: "trust.f5t", sub: "trust.f5d" },
];

const ELITE_ICON = [Gem, Sparkles, Flower2, Award];

/* How much of the long lists a phone opens with, before its "show all". */
const ELITE_ON_PHONE = 4;
const FAQ_ON_PHONE = 5;

const KNOW_TILES = [
  { Icon: LibraryBig, title: "know.1t", sub: "know.1s" },
  { Icon: BookOpen, title: "know.2t", sub: "know.2s" },
  { Icon: Sparkles, title: "know.3t", sub: "know.3s" },
];

const HELP_TILES = [
  { Icon: MessageCircle, title: "help.1t", sub: "help.1s", action: "consult" },
  { Icon: Users, title: "help.2t", sub: "help.2s", action: "consult" },
  { Icon: RefreshCcw, title: "help.3t", sub: "help.3s", action: "account" },
  { Icon: CalendarCheck, title: "help.4t", sub: "help.4s", action: "packages" },
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
  const { t, tc, lang } = useVivahLang();
  const catalog = useVivahCatalog();
  const user = currentUser();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerRitual, setDrawerRitual] = useState<Ritual | null>(null);
  const [consultOpen, setConsultOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [allReviews, setAllReviews] = useState(false);
  /* Phone-only folds. Both lists render in full from sm up; on a narrow screen
     they stack into a very long column, so we open with a readable slice. */
  const [allElite, setAllElite] = useState(false);
  const [allFaq, setAllFaq] = useState(false);
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
        {hreflangLinks("/vedic-vivah").map((l) => (
          <link key={l.hrefLang} rel="alternate" hrefLang={l.hrefLang} href={l.href} />
        ))}
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
        {/* On a phone the stacked copy is taller than a 1000/694 box, and a
            fixed aspect-ratio would clip the top of the headline. Let the
            content set the height there and keep the drawn ratio from sm up. */}
        <div className="relative bg-viv-deep min-h-[480px] sm:min-h-0 sm:aspect-[2244/701] w-full flex items-center overflow-hidden">
          {/* Two crops from the supplied artwork: the tall one frames the havan
              on a phone, the wide one keeps the mandap in view on a desktop. */}
          <div
            className="viv-art-hero-mobile absolute inset-0 bg-cover bg-center sm:hidden"
          />
          <div
            className="viv-art-hero-desktop absolute inset-0 bg-cover bg-center hidden sm:block"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(33,9,8,0.9)_0%,rgba(33,9,8,0.42)_46%,rgba(33,9,8,0.88)_100%)] sm:bg-[linear-gradient(100deg,rgba(33,9,8,0.96)_0%,rgba(33,9,8,0.9)_34%,rgba(33,9,8,0.45)_58%,rgba(33,9,8,0.12)_78%)]" />
          <Wrap className="relative py-10 sm:py-12 lg:py-16">
            <div className="max-w-[620px]">
              <h1 className="text-[30px] sm:text-[50px] lg:text-[62px] text-viv-cream leading-[1.06] sm:leading-[1.02]">
                {t("hero.title1")}
                <br />
                {t("hero.title2")}
              </h1>
              <p className="display text-[16px] sm:text-[22px] text-viv-gold-lt mt-2 sm:mt-3">
                {t("hero.tag")}
              </p>
              {/* The Mangalacharan — the blessing every shubh karya opens with.
                  Its translation is dropped on a phone; the mantra itself is
                  the part that has to be there. */}
              <div className="mt-3 sm:mt-4 max-w-[480px]">
                <blockquote lang="sa" className="display viv-shloka-cream text-[13px] sm:text-[16px] leading-[1.65] sm:leading-[1.7]">
                  {VIVAH_SHLOKAS.mangal.deva}
                </blockquote>
                <p className="hidden sm:block text-[10.5px] text-viv-cream/55 italic mt-1.5">
                  {VIVAH_SHLOKAS.mangal.meaning}
                </p>
              </div>
              <p className="text-[12.5px] sm:text-[14px] text-viv-cream/75 mt-3 sm:mt-3.5 leading-relaxed max-w-[440px]">
                {t("hero.para")}
              </p>

              {/* Four stats: a tidy 2×2 on a phone, one proof row from sm up. */}
              <div className="mt-6 sm:mt-7 grid grid-cols-2 gap-x-4 gap-y-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6">
                {HERO_STATS.map(({ Icon, value, label }, i) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 sm:gap-2.5 ${
                      i > 0 ? "sm:pl-6 sm:border-l sm:border-viv-gold/25" : ""
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-viv-gold-lt shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-[16px] sm:text-[19px] font-semibold text-viv-cream leading-none">
                        {value}
                      </span>
                      <span className="block text-[10px] sm:text-[10.5px] text-viv-cream/60 mt-1 leading-snug">
                        {t(label)}
                      </span>
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
        <Card className="viv-mandala bg-[position:center] px-4 sm:px-8 py-5 sm:py-6 lg:py-8 !bg-viv-sheet">
          <p className="display text-center text-[12.5px] sm:text-[16px] italic text-viv-maroon/85 leading-relaxed max-w-[760px] mx-auto">
            {t("begin.reassure")}
          </p>

          <Shloka
            compact
            deva={VIVAH_SHLOKAS.ganesh.deva}
            translit={VIVAH_SHLOKAS.ganesh.translit}
            meaning={VIVAH_SHLOKAS.ganesh.meaning}
          />
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="h-px flex-1 max-w-[160px] bg-gradient-to-r from-transparent to-viv-gold/50" />
            <h2 className="text-[17px] sm:text-[24px] text-viv-ink text-center leading-tight">
              {t("begin.title")}
            </h2>
            <span className="h-px flex-1 max-w-[160px] bg-gradient-to-l from-transparent to-viv-gold/50" />
          </div>

          <Stagger className="mt-4 sm:mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3" gap={0.06}>
            {[
              {
                Icon: BookOpen,
                title: t("begin.viewPkg"),
                sub: t("begin.viewPkgSub"),
                run: () => scrollTo("#packages"),
              },
              {
                Icon: MessageCircle,
                title: t("begin.talk"),
                sub: t("begin.talkSub"),
                run: () => setConsultOpen(true),
              },
              {
                Icon: CalendarCheck,
                title: t("begin.date"),
                sub: t("begin.dateSub"),
                run: () => scrollTo("#packages"),
              },
              {
                Icon: ClipboardCheck,
                title: t("begin.start"),
                sub: t("begin.startSub"),
                run: () => scrollTo("#rituals"),
              },
            ].map(({ Icon, title, sub, run }, fi) => (
              <RevealItem key={fi} className="h-full">
                <motion.button
                  onClick={run}
                  {...lift}
                  className="w-full h-full bg-white border border-viv-hair rounded-xl px-2.5 sm:px-3 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 text-center sm:text-left hover:border-viv-gold hover:shadow-[0_8px_20px_-14px_rgba(90,40,10,0.45)] transition-colors"
                >
                  <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-viv-gold shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[12px] sm:text-[12.5px] font-semibold text-viv-ink leading-snug">
                      {title}
                    </span>
                    {/* Two lines per tile don't fit two-up on a phone — the
                        label already says where each choice leads. */}
                    <span className="hidden sm:block text-[11px] text-viv-muted leading-snug">
                      {sub}
                    </span>
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
            {t("notice.pricing")}{" "}
            <button onClick={() => setConsultOpen(true)} className="font-bold underline">
              {t("notice.callback")}
            </button>{" "}
            {t("notice.walk")}
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
                {t("packages.fork1")}
              </span>
              <span className="block text-[11.5px] text-viv-muted mt-0.5">
                {tfmt(t("packages.fork2"), { n: catalog.rituals.length })}
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
            <Head title={t("pandits.title")} sub={t("pandits.sub")} />
            <Orn className="mb-6" />
          </Reveal>

          <Stagger
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3"
            dep={pandits.map((p) => p.id).join("|")}
          >
            {pandits.map((p) => (
              <RevealItem key={p.id} className="h-full">
                <motion.div
                  {...lift}
                  className="h-full bg-white border border-viv-hair rounded-2xl shadow-[0_2px_14px_-8px_rgba(90,40,10,0.16)] hover:border-viv-gold transition-colors p-3 sm:p-4 text-center"
                >
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full overflow-hidden border border-viv-hair bg-viv-gold-pale flex items-center justify-center">
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
                <p className="display text-[13px] sm:text-[14px] text-viv-ink mt-2 sm:mt-2.5 leading-snug">
                  {p.name}
                </p>
                {p.years > 0 && (
                  <p className="text-[11px] text-viv-muted mt-0.5">{tfmt(t("pandits.years"), { n: p.years })}</p>
                )}
                {p.note && (
                  <p className="text-[10.5px] text-viv-muted-2 mt-1 leading-snug line-clamp-2">
                    {p.note}
                  </p>
                )}
                <p className="text-[11px] font-semibold text-viv-gold mt-2 inline-flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" /> {t("pandits.verified")}
                </p>
                </motion.div>
              </RevealItem>
            ))}
          </Stagger>

          <div className="text-center mt-6">
            <Btn variant="maroon" size="md" to="/all-pandits">
              {t("pandits.viewAll")} <ChevronRight className="w-3.5 h-3.5" />
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
          <div className="relative p-5 sm:p-6 lg:p-9 max-w-[720px]">
            <h2 className="text-[21px] sm:text-[26px] lg:text-[32px] text-viv-cream leading-tight">
              {t("elite.title")}
            </h2>
            <p className="text-[12px] sm:text-[12.5px] text-viv-cream/65 mt-1.5">{t("elite.sub")}</p>
            {/* Two shlokas already open the page; this one is decorative, so a
                phone doesn't need a third block of Sanskrit. */}
            <blockquote lang="sa" className="hidden sm:block display viv-shloka-cream text-[14px] leading-[1.7] mt-3 max-w-[520px]">
              {VIVAH_SHLOKAS.blessing.deva}
            </blockquote>
            <Stagger className="mt-4 sm:mt-5 grid sm:grid-cols-2 gap-2.5 sm:gap-3" gap={0.06}>
              {VIVAH_ELITE.map((e, i) => {
                const Icon = ELITE_ICON[i % ELITE_ICON.length];
                return (
                  <RevealItem
                    key={e.title}
                    className={`gap-3 border border-viv-gold/22 bg-black/25 rounded-lg p-3 sm:p-3.5 ${
                      i < ELITE_ON_PHONE || allElite ? "flex" : "hidden sm:flex"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-viv-gold-lt shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[12.5px] sm:text-[13px] font-semibold text-viv-cream leading-snug">
                        {i < 4 ? t(`elite.f${i + 1}t`) : e.title}
                      </p>
                      <p className="text-[11px] text-viv-cream/60 mt-1 leading-snug">
                        {i < 4 ? t(`elite.f${i + 1}d`) : e.text}
                      </p>
                    </div>
                  </RevealItem>
                );
              })}
            </Stagger>
            {VIVAH_ELITE.length > ELITE_ON_PHONE && !allElite && (
              <button
                onClick={() => setAllElite(true)}
                className="sm:hidden mt-3 text-[12px] font-semibold text-viv-gold-lt inline-flex items-center gap-1"
              >
                {tfmt(t("elite.showAll"), { n: VIVAH_ELITE.length - ELITE_ON_PHONE })}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        </Reveal>
      </Wrap>

      {/* ─────────────────────── WHY FAMILIES TRUST US ─────────────────────── */}
      <Section id="how-it-works" tight>
        <Wrap>
          <Reveal>
          <Card className="!bg-viv-sheet px-4 sm:px-7 py-5 sm:py-7">
            <h2 className="text-[18px] sm:text-[26px] text-viv-ink text-center leading-tight">
              {t("trust.title")}
            </h2>
            <Orn className="mb-4 sm:mb-6" />
            <Stagger
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-2.5 gap-y-1 sm:gap-3"
              gap={0.05}
            >
              {TRUST_FIVE.map(({ Icon, title, sub }) => (
                <RevealItem
                  key={title}
                  className="flex items-center gap-2.5 sm:gap-3 px-0.5 sm:px-1 py-2"
                >
                  <Medallion size={38} className="sm:!w-[42px] sm:!h-[42px]">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Medallion>
                  <span className="min-w-0">
                    <span className="display block text-[12px] sm:text-[13px] text-viv-ink leading-snug">
                      {t(title)}
                    </span>
                    <span className="block text-[10.5px] sm:text-[11px] text-viv-muted leading-snug">
                      {t(sub)}
                    </span>
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
            <Head title={t("stories.title")} sub={t("stories.sub")} />
            <Orn className="mb-6" />
          </Reveal>

          <Stagger className="grid md:grid-cols-3 gap-3 sm:gap-4" dep={allReviews}>
            {(allReviews ? VIVAH_TESTIMONIALS : VIVAH_TESTIMONIALS.slice(0, 3)).map((tm, ti) => (
              <RevealItem key={tm.id} className="h-full">
                <motion.div
                  {...lift}
                  className="h-full bg-viv-sheet border border-viv-hair rounded-2xl shadow-[0_2px_14px_-8px_rgba(90,40,10,0.16)] p-4 sm:p-5"
                >
                <span className="display text-[34px] leading-none text-viv-gold/60">“</span>
                <p className="text-[12.5px] italic text-viv-ink/85 leading-relaxed -mt-3">
                  {ti < 5 ? t(`story.${ti + 1}.q`) : tm.quote}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center display text-[13px] text-white shrink-0"
                    style={{ backgroundColor: tm.accent }}
                  >
                    {initialsOf(tm.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-viv-maroon leading-snug">
                      {tm.name}
                    </span>
                    <span className="block text-[11px] text-viv-muted leading-snug">
                      {tc(tm.ritual)}
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
                {allReviews ? t("stories.fewer") : t("stories.more")}
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${allReviews ? "rotate-90" : ""}`}
                />
              </Btn>
            )}
            <span className="inline-flex items-center gap-1.5 text-[12px] text-viv-muted">
              <span className="text-[15px] font-semibold text-viv-ink">4.9</span>
              <span className="text-viv-gold">★★★★★</span>
              {t("stories.from")}
            </span>
          </div>
        </Wrap>
      </Section>

      {/* ──────────────────────────── FAQ ──────────────────────────── */}
      <Section id="faqs" tight>
        <Wrap>
          <Reveal>
            <Head title={t("faq.title")} />
            <Orn className="mb-6" />
          </Reveal>
          <div className="grid md:grid-cols-2 gap-x-5 gap-y-2 sm:gap-y-2.5">
            {VIVAH_FAQ.map((f, i) => {
              const open = openFaq === i;
              const q = i < 9 ? t(`faq.q${i + 1}`) : f.q;
              const a = i < 9 ? t(`faq.a${i + 1}`) : f.a;
              return (
                <div
                  key={f.q}
                  className={`bg-white border rounded-xl overflow-hidden h-fit transition-colors ${
                    open ? "border-viv-gold" : "border-viv-hair"
                  } ${i < FAQ_ON_PHONE || allFaq ? "block" : "hidden md:block"}`}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="w-full flex items-center gap-3 text-left px-3.5 sm:px-4 py-3"
                  >
                    <span className="flex-1 text-[12.5px] font-medium text-viv-ink leading-snug">
                      {q}
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
                        <p className="px-3.5 sm:px-4 pb-4 -mt-0.5 text-[12px] text-viv-muted leading-relaxed">
                          {a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {VIVAH_FAQ.length > FAQ_ON_PHONE && !allFaq && (
            <div className="md:hidden text-center mt-4">
              <Btn variant="ghost" size="sm" onClick={() => setAllFaq(true)}>
                {tfmt(t("faq.showAll"), { n: VIVAH_FAQ.length - FAQ_ON_PHONE })}
                <ChevronDown className="w-3.5 h-3.5" />
              </Btn>
            </div>
          )}
        </Wrap>
      </Section>

      {/* ─────────────────── TALK TO A PANDIT JI ─────────────────── */}
      <Wrap className="py-2">
        <Reveal>
        <div className="rounded-[18px] border border-viv-hair bg-gradient-to-r from-viv-tint to-viv-tint-2 px-4 sm:px-7 py-5 sm:py-6 grid lg:grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-5">
          <div>
            <h2 className="text-[19px] sm:text-[22px] text-viv-maroon leading-tight">
              {t("talk.title")}
            </h2>
            <p className="text-[12px] sm:text-[12.5px] text-viv-muted mt-1.5 leading-relaxed">
              {t("talk.sub")}
            </p>
          </div>
          <Btn variant="maroon" size="lg" onClick={() => setConsultOpen(true)} className="w-full lg:w-auto">
            <MessageCircle className="w-4 h-4" /> {t("talk.cta")} →
          </Btn>
          <div className="flex flex-wrap justify-start lg:justify-end gap-x-4 sm:gap-x-6 gap-y-2">
            {[t("talk.chip1"), t("talk.chip2"), t("talk.chip3")].map((l) => (
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
          <Card className="!bg-viv-sheet p-4 sm:p-7 grid lg:grid-cols-[1.15fr_1fr] gap-4 sm:gap-6">
            <div className="flex gap-4">
              <Medallion size={46} className="hidden sm:inline-flex">
                <Landmark className="w-5 h-5" />
              </Medallion>
              <div className="min-w-0">
                <h2 className="text-[19px] sm:text-[25px] text-viv-ink leading-tight">
                  {t("about.title")}
                </h2>
                <p className="text-[12px] sm:text-[12.5px] text-viv-muted mt-2 leading-relaxed line-clamp-4 sm:line-clamp-none">
                  {t("about.intro")}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                  <button
                    onClick={() => setAboutOpen((v) => !v)}
                    className="text-[12.5px] font-semibold text-viv-orange inline-flex items-center gap-1 hover:underline"
                  >
                    {aboutOpen ? t("about.less") : t("about.more")}
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${aboutOpen ? "rotate-90" : ""}`}
                    />
                  </button>
                  <Btn variant="ghost" size="sm" to="/vedic-vivah/guides">
                    {t("about.guidesBtn")}
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
                      {t(title)}
                    </span>
                    <span className="block text-[11px] text-viv-muted">{t(sub)}</span>
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence initial={false}>
              {aboutOpen && (
              <motion.div key="about" {...collapse} className="lg:col-span-2">
              <div className="border-t border-viv-hair pt-5 space-y-5 mt-1">
                {VIVAH_ABOUT.sections.map((s, si) => (
                  <div key={s.heading}>
                    <h3 className="display text-[17px] text-viv-maroon">
                      {si < 4 ? t(`about.s${si + 1}h`) : s.heading}
                    </h3>
                    <p className="text-[12.5px] text-viv-muted mt-1.5 leading-relaxed">
                      {si < 4 ? t(`about.s${si + 1}b`) : s.body}
                    </p>
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
              <Head title={t("guides.title")} sub={t("guides.sub")} />
              <Orn className="mb-6" />
            </Reveal>

            <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5" gap={0.05}>
              {FEATURED_GUIDES.map((g) => (
                <RevealItem key={g.slug} className="h-full">
                  <motion.article {...lift} className="h-full">
                    <Link
                      to={`/vedic-vivah/guides/${g.slug}`}
                      className="flex flex-col h-full bg-white border border-viv-hair rounded-2xl overflow-hidden shadow-[0_10px_26px_-22px_rgba(90,40,10,0.6)] hover:border-viv-gold transition-colors"
                    >
                      <div className="relative h-[92px] sm:h-[120px] overflow-hidden bg-viv-maroon-900">
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
                      <div className="p-3 sm:p-3.5 flex-1 flex flex-col">
                        <h3 className="display text-[13px] sm:text-[15px] text-viv-ink leading-snug line-clamp-2">
                          {lang === "hi" && g.hindiTitle ? g.hindiTitle : g.title}
                        </h3>
                        {/* Two titles in a half-width card is one too many. */}
                        {g.hindiTitle && lang !== "hi" && (
                          <p className="hidden sm:block text-[11px] text-viv-maroon/80 mt-0.5">
                            {g.hindiTitle}
                          </p>
                        )}
                        <span className="flex items-center justify-between mt-auto pt-2.5 sm:pt-3 text-[10.5px] sm:text-[11px]">
                          <span className="text-viv-muted-2">{g.minutes} {t("blog.min")}</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-viv-orange">
                            {t("blog.read")} <ChevronRight className="w-3 h-3" />
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
                {tfmt(t("guides.seeAll"), { n: String((BLOG_DATA as any).posts.length) })}
                <ChevronRight className="w-3.5 h-3.5" />
              </Btn>
            </div>
          </Wrap>
        </SafeSection>
      </Section>

      {/* ───────────────────────── HELP TILES ───────────────────────── */}
      <Wrap className="pb-8 sm:pb-10">
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3" gap={0.05}>
          {HELP_TILES.map(({ Icon, title, sub, action }) => (
            <RevealItem key={title} className="h-full">
            <motion.button
              {...lift}
              onClick={() => {
                if (action === "consult") setConsultOpen(true);
                else if (action === "account") navigate("/account?tab=vivah");
                else scrollTo("#packages");
              }}
              className="w-full h-full flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 bg-white border border-viv-hair rounded-xl px-2.5 sm:px-3.5 py-3 sm:py-3.5 text-center sm:text-left hover:border-viv-gold transition-colors"
            >
              <Medallion size={34} className="sm:!w-[38px] sm:!h-[38px]">
                <Icon className="w-4 h-4" />
              </Medallion>
              <span className="min-w-0">
                <span className="display block text-[12px] sm:text-[13px] text-viv-ink leading-snug">
                  {t(title)}
                </span>
                <span className="block text-[10.5px] sm:text-[11px] text-viv-muted leading-snug">
                  {t(sub)}
                </span>
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
                  {tfmt(t(selectedList.length > 1 ? "bar.addedN" : "bar.added1"), { n: selectedList.length })}
                  {kashiPremium > 0 ? ` ${t("bar.kashi")}` : ""}
                </p>
                <p className="text-[18px] font-semibold text-viv-cream leading-tight">
                  <AnimatedTotal value={selectedTotal + kashiPremium} format={fmtINR} />
                </p>
              </div>
              <motion.div {...tap}>
                <Btn variant="orange" size="md" onClick={bookSelectedRituals}>
                  {t("common.continue")} <ChevronRight className="w-4 h-4" />
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
