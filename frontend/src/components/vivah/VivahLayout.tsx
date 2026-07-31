import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Users,
  X,
  Youtube,
} from "lucide-react";
import { Btn, Wrap } from "./ui";
import { useVivahLang, VivahLangProvider, VIV_LANGS } from "../../i18n/vivah";
import { Globe } from "lucide-react";

/**
 * Chrome for the three Vedic Vivah pages — built to the approved comps
 * (ivory header + maroon finale band + maroon footer) but carrying real
 * Pandit Ji At Request branding and contact details rather than the comps'
 * placeholder studio name.
 */

export const PJAR = {
  name: "Pandit Ji At Request",
  /** The site's own logo lockup — identical to the one the home header uses. */
  logo:
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/pjar_logo-removebg-preview.png",
  phoneDisplay: "+91 90569 55311",
  phoneHref: "tel:+919056955311",
  whatsapp:
    "https://wa.me/919056955311?text=" +
    encodeURIComponent(
      "🙏 Namaste! I would like guidance about the Vedic Vivah Sanskar booking."
    ),
  email: "support@panditjiatrequest.com",
  city: "Zirakpur, Punjab, India",
};

/* ── The mark ─────────────────────────────────────────────────────────────── */

/** Gold mandala medallion used as the Vivah mark. Pure SVG — no asset fetch. */
export function VivahMark({ size = 38, tone = "gold" }: { size?: number; tone?: "gold" | "cream" }) {
  const c = tone === "cream" ? "#F5E6C8" : "#BF8B34";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="shrink-0"
      fill="none"
    >
      <circle cx="24" cy="24" r="22.5" stroke={c} strokeWidth="1.1" opacity="0.55" />
      <circle cx="24" cy="24" r="18" stroke={c} strokeWidth="0.9" opacity="0.8" />
      {Array.from({ length: 12 }).map((_, i) => (
        <ellipse
          key={i}
          cx="24"
          cy="11.5"
          rx="3.1"
          ry="6.4"
          stroke={c}
          strokeWidth="0.85"
          opacity="0.75"
          transform={`rotate(${i * 30} 24 24)`}
        />
      ))}
      <circle cx="24" cy="24" r="6.4" fill={c} opacity="0.16" />
      <circle cx="24" cy="24" r="6.4" stroke={c} strokeWidth="1" />
      <path
        d="M24 20.4c1.9 0 3.4 1.5 3.4 3.4S25.9 27.2 24 27.2 20.6 25.7 20.6 23.8s1.5-3.4 3.4-3.4Z"
        fill={c}
      />
    </svg>
  );
}

/**
 * The Pandit Ji At Request logo — the same asset the site header uses, so the
 * Vivah pages read as part of the one brand. On the dark maroon surfaces it
 * sits on a light chip, because the lockup is drawn for a light background.
 */
export function PjarLogo({
  className = "h-10",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const img = (
    <img
      src={PJAR.logo}
      alt={PJAR.name}
      className={`${className} w-auto object-contain`}
      loading="eager"
      decoding="async"
    />
  );
  if (!onDark) return img;
  return (
    <span className="inline-flex items-center rounded-lg bg-viv-ivory/95 px-2.5 py-1.5">{img}</span>
  );
}

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/vedic-vivah"
      className="flex items-center gap-3 shrink-0 cursor-pointer"
      aria-label={`${PJAR.name} — Vedic Vivah Sanskar`}
    >
      <PjarLogo className="h-9 sm:h-10" onDark={light} />
      <span className="hidden sm:flex flex-col gap-1 pl-3 border-l border-viv-gold/35">
        <span
          className={`text-[9.5px] font-semibold tracking-[0.2em] uppercase whitespace-nowrap ${
            light ? "text-viv-gold-lt" : "text-viv-gold"
          }`}
        >
          Vedic Vivah
        </span>
        <span
          className={`text-[9.5px] font-semibold tracking-[0.2em] uppercase whitespace-nowrap ${
            light ? "text-viv-cream/70" : "text-viv-muted"
          }`}
        >
          Sanskar
        </span>
      </span>
    </Link>
  );
}

/* ── Header ───────────────────────────────────────────────────────────────── */

const NAV = [
  { key: "nav.packages", href: "#packages" },
  { key: "nav.rituals", href: "#rituals" },
  { key: "nav.pandits", href: "#pandits" },
  { key: "nav.how", href: "#how-it-works" },
  { key: "nav.reviews", href: "#reviews" },
  { key: "nav.faqs", href: "#faqs" },
];

/**
 * Language switcher — a gold globe pill. The current language shows in its own
 * script; the menu lists all eight the same way, because a reader hunting for
 * their language recognises "தமிழ்" long before they recognise "Tamil".
 */
export function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useVivahLang();
  const [open, setOpen] = useState(false);
  const current = VIV_LANGS.find((l) => l.code === lang) || VIV_LANGS[0];

  // Click-away close.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className={`inline-flex items-center gap-1.5 rounded-full border border-viv-gold/45 bg-white/70 text-viv-maroon font-semibold hover:border-viv-gold transition-colors ${
          compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-[12px]"
        }`}
      >
        <Globe className="w-3.5 h-3.5 text-viv-gold" />
        <span lang={lang}>{current.native}</span>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[168px] rounded-2xl border border-viv-hair bg-viv-ivory shadow-[0_18px_44px_-18px_rgba(60,20,5,0.45)] overflow-hidden"
        >
          {VIV_LANGS.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === lang}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-[12.5px] transition-colors ${
                l.code === lang
                  ? "bg-viv-tint text-viv-maroon font-bold"
                  : "text-viv-ink/85 hover:bg-viv-tint/60"
              }`}
            >
              <span lang={l.code}>{l.native}</span>
              {l.code === lang && <span className="text-viv-gold">✦</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function VivahHeader({ onBook }: { onBook?: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useVivahLang();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* The bar starts tall and airy over the hero, then condenses to a compact
     glass strip once the family begins to read — luxury on arrival, zero
     intrusion while scrolling. rAF-throttled so scroll stays 60fps.

     The two thresholds are deliberate hysteresis: condensing removes ~54px of
     header, which shifts the page content up by the same amount. With a single
     cut-off, a reader resting right on it would see the header expand and
     collapse in a loop — the "shaking" bug. The 80px gap between condense
     (120) and expand (36) is wider than the height the header gives up, so the
     flip can never re-trigger itself. */
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled((prev) => (prev ? y > 36 : y > 120));
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Never leave the sheet open behind a resize into the desktop nav.
  useEffect(() => {
    const onResize = () => window.innerWidth >= 1100 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* Anchor nav that works from EVERY Vivah page: on the landing page the
     section is right there — scroll to it; from a guide or package page it
     isn't, so route back to the landing page carrying the hash (VivahScope
     finishes the scroll once the section exists). Before this, the nav
     buttons silently did nothing outside the landing page. */
  const go = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (pathname !== "/vedic-vivah") navigate(`/vedic-vivah${href}`);
  };

  return (
    <header className="sticky top-0 z-50">
      {/* ── Maroon whisper strip — mantra left, promise right ── */}
      <div
        className={`viv-topstrip overflow-hidden transition-[max-height,opacity] duration-300 ${
          scrolled ? "max-h-0 opacity-0" : "max-h-9 opacity-100"
        }`}
      >
        <Wrap className="flex items-center justify-center sm:justify-between gap-3 py-[7px]">
          <span className="display text-[11.5px] tracking-wide text-viv-gold-pale/95 whitespace-nowrap">
            ॐ श्री गणेशाय नमः
          </span>
          <span className="hidden sm:block text-[10.5px] text-viv-cream/70 truncate">
            {t("nav.strip")}
          </span>
          <a
            href={PJAR.phoneHref}
            className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-viv-gold-lt hover:text-viv-gold-pale transition-colors whitespace-nowrap"
          >
            <Phone className="w-3 h-3" /> {PJAR.phoneDisplay}
          </a>
        </Wrap>
      </div>

      {/* ── Main bar — ivory glass with a live gold hairline ── */}
      <div
        className={`viv-navbar border-b transition-all duration-300 ${
          scrolled
            ? "bg-viv-ivory/88 border-viv-gold/30 shadow-[0_14px_34px_-24px_rgba(80,30,8,0.55)] backdrop-blur-xl"
            : "bg-viv-ivory/96 border-viv-hair backdrop-blur"
        }`}
      >
        <Wrap
          className={`flex items-center justify-between gap-4 transition-[height] duration-300 ${
            scrolled ? "h-[58px]" : "h-[66px] lg:h-[76px]"
          }`}
        >
          <Wordmark />

          <nav className="hidden xl:flex items-center gap-7" aria-label="Vivah sections">
            {NAV.map((n) => (
              <button key={n.href} onClick={() => go(n.href)} className="viv-navlink">
                {t(n.key)}
              </button>
            ))}
            <Link to="/vedic-vivah/guides" className="viv-navlink">
              {t("nav.guides")}
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-2.5">
            <LangSwitcher />
            <a
              href={PJAR.phoneHref}
              aria-label={`Call ${PJAR.phoneDisplay}`}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-viv-maroon bg-white border border-viv-hair hover:border-viv-gold transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
            <button onClick={onBook} className="viv-cta-gold">
              <span className="relative z-[1] inline-flex items-center gap-2">
                {t("nav.book")}
              </span>
            </button>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <LangSwitcher compact />
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="w-10 h-10 rounded-full bg-viv-maroon text-viv-cream flex items-center justify-center active:scale-95 transition-transform shadow-[0_10px_22px_-12px_rgba(97,26,27,0.8)]"
            >
              {open ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </Wrap>

        {/* gold hairline that breathes */}
        <div aria-hidden="true" className="viv-nav-hairline" />
      </div>

      {/* ── Mobile sheet ── */}
      {open && (
        <div className="lg:hidden border-t border-viv-hair bg-viv-ivory/98 backdrop-blur-xl shadow-[0_30px_50px_-30px_rgba(60,20,5,0.5)]">
          <Wrap className="py-4">
            <div className="grid grid-cols-2 gap-x-5">
              {NAV.map((n, i) => (
                <button
                  key={n.href}
                  onClick={() => go(n.href)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="viv-sheet-item text-left text-[13.5px] text-viv-ink/90 py-3 border-b border-viv-hair/60 flex items-center justify-between"
                >
                  {t(n.key)}
                  <span className="text-viv-gold/70 text-[10px]">❈</span>
                </button>
              ))}
              <Link
                to="/vedic-vivah/guides"
                onClick={() => setOpen(false)}
                className="viv-sheet-item text-left text-[13.5px] text-viv-ink/90 py-3 border-b border-viv-hair/60 flex items-center justify-between"
              >
                {t("nav.guides")}
                <span className="text-viv-gold/70 text-[10px]">❈</span>
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
              <Btn variant="ghost" size="sm" href={PJAR.phoneHref} className="flex-1">
                <Phone className="w-3.5 h-3.5" /> {PJAR.phoneDisplay}
              </Btn>
              <Btn
                variant="maroon"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  onBook?.();
                }}
                className="flex-1"
              >
                {t("nav.book")}
              </Btn>
            </div>
          </Wrap>
        </div>
      )}
    </header>
  );
}


/* ── Footer ───────────────────────────────────────────────────────────────── */

/* Labels are dictionary keys, resolved with t() at render. */
const QUICK = [
  { label: "nav.packages", href: "#packages" },
  { label: "nav.rituals", href: "#rituals" },
  { label: "nav.pandits", href: "#pandits" },
  { label: "nav.how", href: "#how-it-works" },
  { label: "nav.about", href: "#about" },
];

const SUPPORT: { label: string; to: string }[] = [
  { label: "footer.help", to: "/free-consultation" },
  { label: "footer.contactUs", to: "/free-consultation" },
  { label: "footer.reschedule", to: "/account?tab=vivah" },
  { label: "footer.privacy", to: "/privacypolicy" },
  { label: "footer.terms", to: "/termsandconditions" },
];

const TRUST = [
  { Icon: Lock, label: "footer.securePay" },
  { Icon: ShieldCheck, label: "footer.privacyProtected" },
  { Icon: Users, label: "footer.trustedBy" },
];

const SOCIAL = [
  { Icon: Facebook, href: "https://www.facebook.com/panditjiatrequest", label: "Facebook" },
  { Icon: Instagram, href: "https://www.instagram.com/panditjiatrequest", label: "Instagram" },
  { Icon: Youtube, href: "https://www.youtube.com/@panditjiatrequest", label: "YouTube" },
  { Icon: MessageCircle, href: PJAR.whatsapp, label: "WhatsApp" },
];

export function VivahFooter({ onBook }: { onBook?: () => void }) {
  const { t } = useVivahLang();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  /* Same cross-page rule as the header: scroll if the section exists here,
     otherwise route to the landing page with the hash. */
  const go = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else if (pathname !== "/vedic-vivah") navigate(`/vedic-vivah${href}`);
  };

  return (
    <footer>
      {/* Finale band */}
      <div className="bg-viv-maroon-800 viv-mandala bg-[position:right_-120px_top_-140px]">
        <Wrap className="py-9 lg:py-10 flex flex-col lg:flex-row items-center justify-between gap-5 text-center lg:text-left">
          <div>
            <h2 className="text-[24px] lg:text-[30px] text-viv-cream">
              {t("footer.finaleTitle")}
            </h2>
            <p className="text-[12.5px] lg:text-[13.5px] text-viv-cream/70 mt-1.5">
              {t("footer.finaleSub")}
            </p>
          </div>
          <Btn variant="gold" size="lg" onClick={onBook} className="w-full sm:w-auto min-w-[240px]">
            {t("footer.finaleCta")} →
          </Btn>
        </Wrap>
      </div>

      {/* Columns */}
      <div className="bg-viv-maroon-900 text-viv-cream/70">
        <Wrap className="py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Wordmark light />
            <p className="text-[12px] leading-relaxed mt-3.5 max-w-[240px]">
              {t("footer.blurb")}
            </p>
            <div className="flex gap-2 mt-4">
              {SOCIAL.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-full border border-viv-gold/35 flex items-center justify-center text-viv-gold-lt hover:bg-viv-gold/15 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[14px] text-viv-cream mb-3">{t("footer.quick")}</h3>
            <ul className="space-y-2">
              {QUICK.map((q) => (
                <li key={q.label}>
                  <button
                    onClick={() => go(q.href)}
                    className="text-[12.5px] hover:text-viv-gold-lt transition-colors"
                  >
                    {t(q.label)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[14px] text-viv-cream mb-3">{t("footer.support")}</h3>
            <ul className="space-y-2">
              {SUPPORT.map((s) => (
                <li key={s.label}>
                  <Link to={s.to} className="text-[12.5px] hover:text-viv-gold-lt transition-colors">
                    {t(s.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[14px] text-viv-cream mb-3">{t("footer.contact")}</h3>
            <ul className="space-y-2.5 text-[12.5px]">
              <li>
                <a href={PJAR.phoneHref} className="flex items-start gap-2 hover:text-viv-gold-lt">
                  <Phone className="w-3.5 h-3.5 mt-0.5 text-viv-gold-lt shrink-0" />
                  {PJAR.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${PJAR.email}`}
                  className="flex items-start gap-2 hover:text-viv-gold-lt"
                >
                  <Mail className="w-3.5 h-3.5 mt-0.5 text-viv-gold-lt shrink-0" />
                  <span className="text-[11.5px] leading-[1.45] break-words">{PJAR.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-viv-gold-lt shrink-0" />
                {PJAR.city}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[14px] text-viv-cream mb-3">{t("footer.trust")}</h3>
            <ul className="space-y-2.5 text-[12.5px]">
              {TRUST.map(({ Icon, label }) => (
                <li key={label} className="flex items-start gap-2">
                  <Icon className="w-3.5 h-3.5 mt-0.5 text-viv-gold-lt shrink-0" />
                  {t(label)}
                </li>
              ))}
            </ul>
          </div>
        </Wrap>

        <div className="border-t border-viv-gold/15">
          <Wrap className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11.5px]">
              © {new Date().getFullYear()} {PJAR.name}. {t("footer.rights")}
            </p>
            <div className="flex items-center gap-2">
              {["UPI", "Visa", "Mastercard", "Razorpay"].map((b) => (
                <span
                  key={b}
                  className="text-[10px] font-semibold tracking-wide text-viv-cream/75 border border-viv-gold/25 rounded px-2 py-1"
                >
                  {b}
                </span>
              ))}
            </div>
          </Wrap>
        </div>
      </div>
    </footer>
  );
}

/* ── Page scope ───────────────────────────────────────────────────────────── */

/**
 * Finish a cross-page anchor jump (e.g. header "Packages" clicked from a guide
 * page → /vedic-vivah#packages). The catalog sections mount asynchronously, so
 * retry briefly until the target exists rather than scrolling into nothing.
 */
function useHashScroll() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const attempt = () => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (tries++ < 12) timer = setTimeout(attempt, 150);
    };
    // Let the first paint land, then chase the anchor.
    timer = setTimeout(attempt, 60);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [hash, pathname]);
}

/**
 * Wraps a Vivah page in the `.viv` type/colour scope and paints the shared
 * light canvas — warm ivory with two soft marigold blooms — behind every page
 * in the section, so the landing page, the package spread and the checkout all
 * sit on the same paper.
 */
export function VivahScope({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  useHashScroll();
  return (
    <VivahLangProvider>
      <div className={`viv relative min-h-screen ${className}`}>
        <div className="viv-canvas" aria-hidden="true" />
        {children}
      </div>
    </VivahLangProvider>
  );
}
