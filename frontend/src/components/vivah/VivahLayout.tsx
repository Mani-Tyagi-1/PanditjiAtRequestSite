import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  { label: "Packages", href: "#packages" },
  { label: "Rituals", href: "#rituals" },
  { label: "Pandits", href: "#pandits" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "About Us", href: "#about" },
  { label: "Reviews", href: "#reviews" },
  { label: "FAQs", href: "#faqs" },
];

export function VivahHeader({ onBook }: { onBook?: () => void }) {
  const [open, setOpen] = useState(false);

  // Never leave the sheet open behind a resize into the desktop nav.
  useEffect(() => {
    const onResize = () => window.innerWidth >= 1100 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-50 bg-viv-ivory/95 backdrop-blur border-b border-viv-hair">
      <Wrap className="h-[62px] lg:h-[70px] flex items-center justify-between gap-4">
        <Wordmark />

        <nav className="hidden xl:flex items-center gap-6">
          {NAV.map((n) => (
            <button
              key={n.href}
              onClick={() => go(n.href)}
              className="text-[13px] text-viv-ink/80 hover:text-viv-maroon transition-colors"
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2.5">
          <a
            href={PJAR.phoneHref}
            className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-viv-maroon bg-white border border-viv-hair rounded-full px-3.5 py-2 hover:border-viv-gold transition-colors whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5" />
            {PJAR.phoneDisplay}
          </a>
          <Btn variant="maroon" size="sm" onClick={onBook} className="rounded-full">
            Book a Vivah
          </Btn>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="lg:hidden w-10 h-10 rounded-full bg-viv-maroon text-viv-cream flex items-center justify-center active:scale-95 transition-transform"
        >
          {open ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
        </button>
      </Wrap>

      {open && (
        <div className="lg:hidden border-t border-viv-hair bg-viv-ivory">
          <Wrap className="py-3">
            <div className="grid grid-cols-2 gap-x-4">
              {NAV.map((n) => (
                <button
                  key={n.href}
                  onClick={() => go(n.href)}
                  className="text-left text-[13px] text-viv-ink/85 py-2.5 border-b border-viv-hair/60"
                >
                  {n.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 mt-3.5">
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
                Book a Vivah
              </Btn>
            </div>
          </Wrap>
        </div>
      )}
    </header>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────────── */

const QUICK = [
  { label: "Packages", href: "#packages" },
  { label: "Rituals", href: "#rituals" },
  { label: "Pandits", href: "#pandits" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "About Us", href: "#about" },
];

const SUPPORT: { label: string; to: string }[] = [
  { label: "Help Center", to: "/free-consultation" },
  { label: "Contact Us", to: "/free-consultation" },
  { label: "Reschedule / Cancel", to: "/account?tab=vivah" },
  { label: "Privacy Policy", to: "/privacypolicy" },
  { label: "Terms & Conditions", to: "/termsandconditions" },
];

const TRUST = [
  { Icon: Lock, label: "100% Secure Payments" },
  { Icon: ShieldCheck, label: "Privacy Protected" },
  { Icon: Users, label: "Trusted by 15,000+ Families" },
];

const SOCIAL = [
  { Icon: Facebook, href: "https://www.facebook.com/panditjiatrequest", label: "Facebook" },
  { Icon: Instagram, href: "https://www.instagram.com/panditjiatrequest", label: "Instagram" },
  { Icon: Youtube, href: "https://www.youtube.com/@panditjiatrequest", label: "YouTube" },
  { Icon: MessageCircle, href: PJAR.whatsapp, label: "WhatsApp" },
];

export function VivahFooter({ onBook }: { onBook?: () => void }) {
  const go = (href: string) => document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });

  return (
    <footer>
      {/* Finale band */}
      <div className="bg-viv-maroon-800 viv-mandala bg-[position:right_-120px_top_-140px]">
        <Wrap className="py-9 lg:py-10 flex flex-col lg:flex-row items-center justify-between gap-5 text-center lg:text-left">
          <div>
            <h2 className="text-[24px] lg:text-[30px] text-viv-cream">
              Begin Your Sacred Journey Today
            </h2>
            <p className="text-[12.5px] lg:text-[13.5px] text-viv-cream/70 mt-1.5">
              Book your Vedic Vivah Sanskar and make your union truly divine.
            </p>
          </div>
          <Btn variant="gold" size="lg" onClick={onBook} className="w-full sm:w-auto min-w-[240px]">
            Book Your Vivah Now →
          </Btn>
        </Wrap>
      </div>

      {/* Columns */}
      <div className="bg-viv-maroon-900 text-viv-cream/70">
        <Wrap className="py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Wordmark light />
            <p className="text-[12px] leading-relaxed mt-3.5 max-w-[240px]">
              Preserving traditions. Creating blessed unions — verified Pandit Jis, pure samagri and
              end-to-end care.
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
            <h3 className="text-[14px] text-viv-cream mb-3">Quick Links</h3>
            <ul className="space-y-2">
              {QUICK.map((q) => (
                <li key={q.label}>
                  <button
                    onClick={() => go(q.href)}
                    className="text-[12.5px] hover:text-viv-gold-lt transition-colors"
                  >
                    {q.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[14px] text-viv-cream mb-3">Support</h3>
            <ul className="space-y-2">
              {SUPPORT.map((s) => (
                <li key={s.label}>
                  <Link to={s.to} className="text-[12.5px] hover:text-viv-gold-lt transition-colors">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[14px] text-viv-cream mb-3">Contact Us</h3>
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
            <h3 className="text-[14px] text-viv-cream mb-3">Trust &amp; Security</h3>
            <ul className="space-y-2.5 text-[12.5px]">
              {TRUST.map(({ Icon, label }) => (
                <li key={label} className="flex items-start gap-2">
                  <Icon className="w-3.5 h-3.5 mt-0.5 text-viv-gold-lt shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </Wrap>

        <div className="border-t border-viv-gold/15">
          <Wrap className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11.5px]">
              © {new Date().getFullYear()} {PJAR.name}. All rights reserved.
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
  return (
    <div className={`viv relative min-h-screen ${className}`}>
      <div className="viv-canvas" aria-hidden="true" />
      {children}
    </div>
  );
}
