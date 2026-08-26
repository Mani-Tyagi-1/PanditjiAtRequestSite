import { useState, useEffect, useId } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft, Check, ShieldCheck, Gift, Calendar, Sparkles,
    Star, Lock, ChevronDown, MessageCircle, Phone, Flame, BadgeCheck,
    Video, Mountain, Share2, HelpCircle, Shield, Dog, Moon,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import PujaEnquiryModal from "../components/booking/PujaEnquiryModal";
import API_URL from "../utils/apiConfig";
import { decryptData } from "../utils/encryption";
import { kaalBhairavPuja, KAAL_BHAIRAV_PUJA_SLUG, DEFAULT_PACKAGE_ID, getPackage, type PujaPackageId } from "../data/kaalBhairavPuja";
import PujaPackages from "../components/kaalBhairav/PujaPackages";
import { money } from "../utils/currency";
import analytics from "../utils/analytics";

// ── analytics (Meta Pixel — the project's existing convention) ──
function track(event: string, params?: Record<string, unknown>, custom = false) {
    // Delegates to utils/analytics: Meta receives exactly what this helper
    // always sent, and GA4 / Google Ads receive a mapped equivalent. The
    // signature is unchanged, so every call site on this page still works.
    analytics.metaBridge(event, params, custom);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Decorative image flanking the mantra strip — mirrored on the left side. */
const MANTRA_SIDE_IMAGE = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/trishul%20(1).png";

/**
 * Decorative image beside the hero value-props card. Paste the image URL here.
 * It is allowed to spill outside the card edges for a premium, layered look.
 * Leave as "" to hide it entirely (the card falls back to full-width text).
 */
const HERO_VALUE_IMAGE = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/KAAL%20BHAIRAV%20DOG.webp";

// Kashi Kaal Bhairav online-puja devotee reviews (auto-scrolling marquee).
type Review = { name: string; rating: number; date: string; text: string; verified: boolean };
const PLACEHOLDER_REVIEWS: Review[] = [
    { name: "Sunita Devi", rating: 5, date: "1 week ago", text: "Kaal Bhairav puja ka video WhatsApp pe mil gaya, pandit ji ne mera naam aur gotra se sankalp kiya. 🙏", verified: true },
    { name: "Rakesh Kumar", rating: 5, date: "3 weeks ago", text: "Ghar mein bahut pareshani thi, Bhairav Baba ki puja ke baad mann shaant hai. ₹1100 mein easy tha.", verified: true },
    { name: "Pooja Sharma", rating: 5, date: "2 weeks ago", text: "Prasad 5 din mein ghar aa gaya. Nazar utarne ke liye karwaya tha, satisfied hoon. 🙏", verified: true },
    { name: "Amit Verma", rating: 4, date: "1 month ago", text: "Puja theek se hui, video bhi mil gaya. Kaal Bhairav Ashtakam ka paath sunke accha laga.", verified: true },
    { name: "Deepak Yadav", rating: 5, date: "5 days ago", text: "Kalashtami pe parents ke naam se book kiya. Pandit ji ne aarti mein naam liya. Family khush.", verified: true },
    { name: "Anjali Nair", rating: 5, date: "2 months ago", text: "Booked from Dubai. Bhairav Baba ki raksha chahiye thi. Simple aur genuine process.", verified: false },
    { name: "Manoj Tiwari", rating: 4, date: "3 weeks ago", text: "Sankalp naam aur gotra se hua. Shani aur Rahu ke liye karwaya. Booking aasan thi.", verified: true },
    { name: "Kavita Singh", rating: 5, date: "1 month ago", text: "Kashi ke Kotwal Baba Kaal Bhairav ke darbar se puja karwa ke bahut suraksha mehsoos hui. 🙏", verified: true },
    { name: "Ramesh Patel", rating: 5, date: "2 weeks ago", text: "Genuine service. Koi extra paisa nahi maanga. Video proof bhi diya jaisa bola tha.", verified: true },
    { name: "Neha Joshi", rating: 4, date: "6 days ago", text: "Achhi service. Puja ki timing WhatsApp pe confirm kar di thi. Recommend karungi.", verified: false },
    { name: "Suresh Gupta", rating: 5, date: "1 month ago", text: "Business mein rukawat ke liye Bhairav puja karwayi. Sab time pe aur proper hua. 🙏", verified: true },
    { name: "Priya Reddy", rating: 5, date: "3 weeks ago", text: "Pehli baar online puja book ki thi, dar tha par sab genuine nikla. Phir se karwaungi.", verified: true },
];

function seededReviews(seed: string, count: number): Review[] {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    const rand = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
    const a = [...PLACEHOLDER_REVIEWS];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, Math.min(count, a.length));
}

// ── Small UI pieces (Kaal Bhairav palette: charcoal, antique gold, deep maroon) ──
function Stars({ value, className = "w-3.5 h-3.5" }: { value: number; className?: string }) {
    const full = Math.round(value);
    return (
        <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`${className} ${i <= full ? "text-[#B8860B] fill-[#B8860B]" : "text-[#E7DAC0]"}`} />
            ))}
        </span>
    );
}

function Accordion({ title, icon, defaultOpen = false, children }: {
    title: string; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const panelId = useId();
    return (
        <div className={`bg-white border rounded-2xl overflow-hidden transition-colors ${open ? "border-[#8B0000]/45" : "border-[#E7DAC0]"}`}>
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => {
                    const next = !open;
                    setOpen(next);
                    if (next) track("puja_accordion_open", { section: title }, true);
                }}
                className="w-full px-3.5 py-3 flex items-center justify-between text-left focus-visible:ring-2 focus-visible:ring-[#B8860B] outline-none"
            >
                <span className="flex items-center gap-2 text-[14px] font-bold text-[#1A1A1A]">
                    {icon}{title}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#8B0000] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <div id={panelId} hidden={!open} className="px-3.5 pb-3.5 pt-1 text-[12.5px] text-[#6E6257] leading-relaxed border-t border-[#E7DAC0]">
                {children}
            </div>
        </div>
    );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <h3 className="flex items-center gap-1.5 text-[12.5px] font-extrabold uppercase tracking-wider text-[#8B0000] mb-2.5">
            {icon}{children}
        </h3>
    );
}

function ReviewMarquee({ reviews }: { reviews: Review[] }) {
    const items = [...reviews, ...reviews]; // duplicated for a seamless loop
    return (
        <div className="overflow-hidden -mx-4 px-4">
            <style>{`@keyframes reviewMarquee{from{transform:translateX(-50%)}to{transform:translateX(0)}}.review-track{animation:reviewMarquee 32s linear infinite;width:max-content}.review-track:hover{animation-play-state:paused}`}</style>
            <div className="review-track flex gap-2.5">
                {items.map((r, i) => (
                    <div key={i} className="shrink-0 w-56 bg-white border border-[#E7DAC0] rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#1A1A1A] text-[12px]">{r.name}</span>
                            {r.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />}
                            <span className="ml-auto text-[9px] text-[#6E6257]">{r.date}</span>
                        </div>
                        <Stars value={r.rating} className="w-3 h-3" />
                        <p className="text-[11.5px] text-[#6E6257] mt-1 leading-snug line-clamp-3">{r.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Live countdown pill for the hero's bottom-right corner.
 *
 * Deliberately its OWN component with its OWN interval + state, so the 1-second
 * tick re-renders only this tiny pill — not the whole (large) page. Ticking the
 * parent every second was re-reconciling the entire tree (packages, reviews,
 * accordions, FAQ…) and stalling the auto-scroll animation each second.
 */
function HeroCountdown({ target }: { target: number }) {
    const [remaining, setRemaining] = useState(() =>
        Number.isNaN(target) ? 0 : Math.max(0, target - Date.now())
    );
    useEffect(() => {
        if (Number.isNaN(target)) return;
        const tick = () => setRemaining(Math.max(0, target - Date.now()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [target]);

    if (remaining <= 0) return null;
    const days = Math.floor(remaining / 86400000);
    const hrs = Math.floor((remaining % 86400000) / 3600000);
    const min = Math.floor((remaining % 3600000) / 60000);
    const sec = Math.floor((remaining % 60000) / 1000);
    return (
        <div className="absolute bottom-2 right-2 z-10 rounded-lg bg-[#F8F4EC]/90 backdrop-blur-sm border border-[#B8860B]/50 px-2.5 py-1.5 shadow-lg text-right">
            <p className="text-[7.5px] font-bold uppercase tracking-wider text-[#6E6257] leading-none mb-0.5">
                Puja slot closes in
            </p>
            <p className="text-[12px] font-bold text-[#8B0000] tabular-nums leading-none">
                {days}d {pad2(hrs)}h {pad2(min)}m {pad2(sec)}s
            </p>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────
// FRONTEND-ONLY Shree Kashi Kaal Bhairav Mahapuja — an online puja performed
// on the devotee's behalf at Shri Kaal Bhairav Mandir, Kashi (Varanasi) on
// Kalashtami. Renders entirely from frontend data but carries a distinct
// luxury-temple theme (charcoal / antique-gold / deep-maroon palette, gold
// aura flecks, Bhairav offerings).
// All data comes from src/data/kaalBhairavPuja.ts.
export default function KaalBhairavPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const puja = kaalBhairavPuja;
    const pujaId = kaalBhairavPuja._id;

    const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    // Chosen booking package — drives the sticky-CTA price and is handed to the
    // booking page as navigation state so it opens pre-selected.
    const [packageId, setPackageId] = useState<PujaPackageId>(DEFAULT_PACKAGE_ID);
    const selectedPkg = getPackage(packageId);
    const price = selectedPkg.price;

    // ViewContent on load
    useEffect(() => {
        track("ViewContent", {
            content_name: puja.poojaNameEng,
            content_ids: [pujaId],
            content_type: "product",
            value: getPackage(DEFAULT_PACKAGE_ID).price,
            currency: "INR",
        });
    }, []);

    const image = puja.poojaImages?.[0] || puja.poojaMainImage || puja.poojaCardImage;
    const reviews = seededReviews(pujaId, 9);
    const mandirName = `${puja.templeName}, ${puja.templeLocation}`;

    // ── Countdown to the puja date ── (rendered by the isolated HeroCountdown
    // component so its 1s tick never re-renders this whole page).
    const targetTs = new Date(puja.pujaDate).getTime();

    // Gentle one-time nudge: ~4.5s after landing, if the devotee hasn't scrolled
    // yet, glide the page down so the package comparison is on screen. We run our
    // own eased rAF tween (easeInOutCubic over ~1.4s) rather than native smooth
    // scroll for a buttery, consistent glide — and bail the instant they
    // interact, so it never fights a user who's already reading.
    useEffect(() => {
        let interacted = false;
        let rafId = 0;
        const mark = () => { interacted = true; cancelAnimationFrame(rafId); };
        window.addEventListener("wheel", mark, { passive: true });
        window.addEventListener("touchmove", mark, { passive: true });
        window.addEventListener("keydown", mark);

        const timeoutId = setTimeout(() => {
            if (interacted || window.scrollY > 40) return;
            const el = document.getElementById("packages");
            if (!el) return;

            const startY = window.scrollY;
            // Offset for the sticky header so the "Choose your package" title
            // isn't tucked underneath it.
            const targetY = Math.max(0, el.getBoundingClientRect().top + startY - 68);
            const distance = targetY - startY;
            if (Math.abs(distance) < 4) return;

            // Respect reduced-motion: jump straight there, no animation.
            if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
                window.scrollTo(0, targetY);
                return;
            }

            const duration = 1400;
            const startT = performance.now();
            const easeInOutCubic = (t: number) =>
                t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const step = (now: number) => {
                if (interacted) return;
                const t = Math.min(1, (now - startT) / duration);
                window.scrollTo(0, startY + distance * easeInOutCubic(t));
                if (t < 1) rafId = requestAnimationFrame(step);
            };
            rafId = requestAnimationFrame(step);
            track("puja_packages_autoscroll", {}, true);
        }, 2000);

        return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(rafId);
            window.removeEventListener("wheel", mark);
            window.removeEventListener("touchmove", mark);
            window.removeEventListener("keydown", mark);
        };
    }, []);

    const whatYouGet = [
        { icon: BadgeCheck, title: "Personalized offering", sub: "Performed in your name & gotra" },
        { icon: Video, title: "Puja video on WhatsApp", sub: "Full recording delivered to you" },
        { icon: Gift, title: "Prasad at your home", sub: "Sacred prasad couriered to you" },
    ];

    // The sacred offerings made during the Kaal Bhairav puja.
    const offerings = [
        { icon: Flame, label: "Sarson Deepam", sub: "Mustard-oil lamp" },
        { icon: Shield, label: "Raksha", sub: "Kotwal's shield" },
        { icon: Dog, label: "Shvan Seva", sub: "Feeding his vahana" },
        { icon: Moon, label: "Bhairav Ashtakam", sub: "Vedic chanting" },
    ];

    // Main CTA goes straight to the booking page. The optional prasad add-on
    // lives inside the booking page only (no pre-booking upsell interruption).
    // AddToCart marks intent at the CTA tap (same convention as PujaPage.tsx);
    // InitiateCheckout / Purchase then fire on the booking page itself, so the
    // three funnel steps stay distinct instead of collapsing onto one trigger.
    //
    // ViewContent / AddToCart here necessarily report the ₹1100 base seva: the
    // prasad box and extra Sankalp names are chosen on the booking page, so no
    // add-on exists yet at this point in the funnel. The booking's real value
    // (base + add-ons) is reported by InitiateCheckout / Purchase from
    // KaalBhairavBookingPage and by the server CAPI Purchase — read those, not
    // these, when reconciling revenue in Events Manager.
    const openBooking = () => {
        track("AddToCart", {
            content_name: `${puja.poojaNameEng} — ${selectedPkg.name}`,
            content_ids: [pujaId],
            content_type: "product",
            value: price,
            currency: "INR",
        });
        // Hand the chosen package to the booking page so it opens pre-selected.
        navigate(`/${KAAL_BHAIRAV_PUJA_SLUG}/booking`, { state: { packageId } });
    };

    const handleShare = async () => {
        if (isSharing) return;
        const baseUrl = `${window.location.origin}${location.pathname}`;
        if (!user) {
            try {
                if (navigator.share) await navigator.share({ title: puja.poojaNameEng, url: baseUrl });
                else { await navigator.clipboard.writeText(baseUrl); setShareCopied(true); setTimeout(() => setShareCopied(false), 2500); }
            } catch { /* cancelled */ }
            return;
        }
        setIsSharing(true);
        try {
            const token = localStorage.getItem("user_token");
            const stored = localStorage.getItem("user_data");
            if (!token || !stored) throw new Error("not logged in");
            const userId = JSON.parse(stored)._id;
            const res = await fetch(`${API_URL}/users/${userId}/my-referral`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            const decrypted = json?.encrypted ? decryptData(json.encrypted) : null;
            const code: string | undefined = decrypted?.userReferralCode;
            const shareUrl = code ? `${baseUrl}?intref=${code}` : baseUrl;
            const shareText = `Book ${puja.poojaNameEng} with PanditJi At Request!\n${shareUrl}`;
            if (navigator.share) await navigator.share({ title: puja.poojaNameEng, text: shareText, url: shareUrl });
            else { await navigator.clipboard.writeText(shareUrl); setShareCopied(true); setTimeout(() => setShareCopied(false), 2500); }
        } catch { /* cancelled */ }
        finally { setIsSharing(false); }
    };

    return (
      <div className="min-h-screen bg-[#F8F4EC] pb-24 font-sans w-full max-w-md mx-auto shadow-xl relative border-x border-[#E7DAC0]">
        <style>{`@media (prefers-reduced-motion: reduce){.review-track{animation:none}}`}</style>

        <Helmet>
          <title>{`${puja.poojaNameEng} at ${puja.templeName}, Varanasi | Pandit Ji At Request`}</title>
          <meta
            name="description"
            content={`Book online ${puja.poojaNameEng} (${puja.poojaNameHindi}) — Kaal Bhairav puja performed on your behalf at ${mandirName} on Kalashtami, ${puja.pujaDate}. ${puja.benefits.slice(0, 2).join(", ")}. Verified pandits, puja video on WhatsApp.`}
          />
          <link rel="canonical" href={`https://panditjiatrequest.com/${KAAL_BHAIRAV_PUJA_SLUG}`} />
          {/* Social share preview (WhatsApp / Facebook / X) for ad & organic shares. */}
          <meta property="og:type" content="product" />
          <meta property="og:site_name" content="Pandit Ji At Request" />
          <meta property="og:title" content={`${puja.poojaNameEng} — Kalashtami Puja at ${puja.templeName}, Kashi`} />
          <meta property="og:description" content={`Kaal Bhairav Kalashtami puja performed on your behalf at ${mandirName}. Sankalp in your name & gotra, puja video on WhatsApp. Packages from ₹501.`} />
          <meta property="og:image" content={image} />
          <meta property="og:url" content={`https://panditjiatrequest.com/${KAAL_BHAIRAV_PUJA_SLUG}`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${puja.poojaNameEng} — Kalashtami Puja at Kashi`} />
          <meta name="twitter:description" content={`Kaal Bhairav Kalashtami puja at ${mandirName}. Packages from ₹501, puja video on WhatsApp.`} />
          <meta name="twitter:image" content={image} />
          {/* Preload the LCP hero (direct CDN webp) at highest priority. */}
          <link rel="preload" as="image" href={image} fetchPriority="high" />
        </Helmet>

        <PujaEnquiryModal
          isOpen={isEnquiryOpen}
          onClose={() => setIsEnquiryOpen(false)}
          pujaId={pujaId}
          pujaName={puja.poojaNameEng}
          prefillName={user?.name || (user as any)?.fullName || ""}
          prefillPhone={user?.phone || (user as any)?.mobileNumber || ""}
          prefillCity={(user as any)?.city || ""}
        />

        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-50 bg-[#F8F4EC]/90 backdrop-blur-md border-b border-[#E7DAC0] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() =>
              location.key !== "default" ? navigate(-1) : navigate("/")
            }
            aria-label="Go back"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#E7DAC0] shadow-sm active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-[#1A1A1A]" />
          </button>
          <h1 className="text-sm font-bold text-[#1A1A1A] truncate flex-1">
            {puja.poojaNameEng}
          </h1>
          <button
            onClick={handleShare}
            disabled={isSharing}
            aria-label="Share"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#E7DAC0] shadow-sm active:scale-90 transition-transform disabled:opacity-60"
          >
            {shareCopied ? (
              <Check className="w-4 h-4 text-[#B8860B]" />
            ) : (
              <Share2 className="w-4 h-4 text-[#1A1A1A]" />
            )}
          </button>
        </div>

       

        {/* ── Hero banner ── */}
        <div className="relative h-56 overflow-hidden bg-[#1A1A1A] border-b border-[#B8860B]/30">
          <img
            src={image}
            width={432}
            height={202}
            alt={puja.poojaNameEng}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
          {/* Premium charcoal vignette — grounds the artwork and ties the hero
              to the black/gold theme without covering the banner's own icons. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/60 via-transparent to-[#1A1A1A]/15" />
          {/* Compact live countdown, tucked into the hero's bottom-right. */}
          <HeroCountdown target={targetTs} />
        </div>

        <div className="px-4 pt-3 pb-4 space-y-4">
          {/* ── Puja name + meta ── */}
          <div>
            <h2 className="text-xl font-bold font-serif text-[#1A1A1A] leading-tight">
              {puja.poojaNameEng}
            </h2>
            <p className="text-[13px] text-[#8B0000] font-medium mt-0.5">
              {puja.poojaNameHindi}
            </p>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
              <span className="bg-[#F3E9D2] text-[#8B0000] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {puja.deity}
              </span>
              <span className="flex items-center gap-1 text-[12px]">
                <Stars value={puja.rating} />
                <span className="font-bold text-[#1A1A1A]">{puja.rating}</span>
                <span className="text-[#6E6257]">
                  · {puja.devoteesLabel} devotees
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-1 mt-2 text-[12px] text-[#6E6257]">
              <span className="flex items-start gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-[#8B0000] shrink-0 mt-0.5" />
                <span className="leading-snug">{mandirName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#8B0000] shrink-0" />
                {puja.pujaDate}
              </span>
            </div>
          </div>

          {/* ── Hero value props ──
              `relative` + `overflow-visible` so the decorative image is free to
              spill past the card's top/right edges for a layered, premium look.
              When HERO_VALUE_IMAGE is empty the image is skipped and the text
              spans the full width. `pt-8` gives the overflowing image room. */}
          <div className="relative overflow-visible rounded-2xl border border-[#E7DAC0] bg-gradient-to-br from-[#F8F4EC] via-[#F3ECDC] to-[#F3E9D2]/70 p-3.5 shadow-sm">
            {HERO_VALUE_IMAGE && (
              <img
                src={HERO_VALUE_IMAGE}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute -top-5 -right-6 w-40 h-40 object-contain drop-shadow-xl z-10"
              />
            )}
            <div className={`space-y-1.5 ${HERO_VALUE_IMAGE ? "pr-24" : ""}`}>
              {[
                "Kaal Bhairav puja on Kalashtami at Kashi",
                "Personalized Sankalp in your name & gotra",
                "Puja video shared on WhatsApp",
                "Prasad & Rudraksh in premium packages",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2 text-[12.5px] text-[#1A1A1A]">
                  <Check className="w-3.5 h-3.5 text-[#B8860B] shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Choose your package (comparison) ── */}
          <div id="packages">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />}>
              Choose your package
            </SectionTitle>
            <PujaPackages selectedId={packageId} onSelect={setPackageId} />
            <p className="mt-2 text-[10.5px] text-[#6E6257] leading-snug text-center">
              Extra family members can be added at ₹151 each on the next step.
            </p>
          </div>

          {/* ── Mantra strip ── */}
          {/*
            The flanking images are absolutely positioned and vertically
            centred, so they can be scaled past the strip's own height and
            spill over its top/bottom edges without pushing it taller.
          */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#1A1A1A] via-[#262626] to-[#1A1A1A] px-16 py-3.5 text-center shadow-lg border border-[#B8860B]/30">
            {MANTRA_SIDE_IMAGE && (
              <img
                src={MANTRA_SIDE_IMAGE}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 w-22 h-22 object-contain -scale-x-100 drop-shadow-lg"
              />
            )}
            <p className="text-[16px] font-serif font-bold text-[#D4AF37] tracking-wide">
              ॐ कालभैरवाय नमः
            </p>
            <p className="text-[10.5px] text-[#C9BFA6] mt-0.5">
              Chanted through your Kaal Bhairav puja at Kashi
            </p>
            {MANTRA_SIDE_IMAGE && (
              <img
                src={MANTRA_SIDE_IMAGE}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-22 h-22 object-contain drop-shadow-lg"
              />
            )}
          </div>

          {/* ── Auto-scrolling devotee reviews ── */}
          <div>
            <SectionTitle icon={<Star className="w-3.5 h-3.5 text-[#B8860B]" />}>
              Loved by devotees
            </SectionTitle>
            <ReviewMarquee reviews={reviews} />
          </div>

          {/* ── Online-puja reassurance line ── */}
          <div className="flex items-center justify-center gap-1.5 bg-[#F3E9D2] border border-[#E7DAC0] text-[#8B0000] rounded-lg px-3 py-1.5 text-[12px] font-semibold text-center">
            <MessageCircle className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
            Puja performed at {puja.templeName} · receive the video with your
            name &amp; gotra on WhatsApp
          </div>

          {/* ── Bhairav offerings ── */}
          <div>
            <SectionTitle icon={<Shield className="w-3.5 h-3.5 text-[#B8860B]" />}>
              What is offered in your name
            </SectionTitle>
            <div className="grid grid-cols-4 gap-2">
              {offerings.map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="bg-white border border-[#E7DAC0] rounded-xl p-2 text-center shadow-sm"
                >
                  <div className="w-7 h-7 mx-auto rounded-full bg-gradient-to-br from-[#F3E9D2] to-[#8B0000]/20 flex items-center justify-center mb-1">
                    <Icon className="w-3.5 h-3.5 text-[#8B0000]" />
                  </div>
                  <p className="text-[10.5px] font-bold text-[#1A1A1A] leading-tight">{label}</p>
                  <p className="text-[8.5px] text-[#6E6257] leading-tight mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          

          {/* ── How it works ── */}
          <div className="rounded-2xl border border-[#E7DAC0] bg-gradient-to-br from-[#F8F4EC] via-[#F3ECDC] to-[#F3E9D2]/70 p-3.5 shadow-sm">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />}>
              How your puja will happen
            </SectionTitle>
            <div className="space-y-2.5">
              {[
                "Enter your name, gotra and phone number",
                `Pandit ji performs the Kaal Bhairav puja at ${puja.templeName}`,
                "Sankalp is taken in your name & gotra",
                "Puja video is shared with you on WhatsApp",
                "Optional prasad is delivered to your home",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#F3E9D2] text-[#8B0000] flex items-center justify-center text-[11px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] text-[#1A1A1A] leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Why perform this puja ── */}
          <div className="rounded-2xl border border-[#E7DAC0] bg-gradient-to-br from-[#F8F4EC] via-[#F3ECDC] to-[#F3E9D2]/70 p-3 shadow-sm">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />}>
              Why perform this puja
            </SectionTitle>
            <div className="grid grid-cols-1 gap-1.5">
              {puja.benefits.slice(0, 4).map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-[12.5px] text-[#1A1A1A]">
                  <Check className="w-3.5 h-3.5 text-[#B8860B] shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Support link (low-emphasis — keeps direct booking as the main path) ── */}
          <button
            onClick={() => {
              track("Contact", {
                content_name: puja.poojaNameEng,
                content_type: "consultation",
              });
              setIsEnquiryOpen(true);
            }}
            className="w-full flex items-center justify-center gap-1.5 text-[#6E6257] hover:text-[#8B0000] font-semibold text-[12.5px] py-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Need help? Chat on WhatsApp
          </button>

          {/* ── Puja details (accordions from poojaDescription) ── */}
          <div>
            <SectionTitle icon={<Flame className="w-3.5 h-3.5 text-[#B8860B]" />}>
              Puja details
            </SectionTitle>
            <div className="space-y-2">
              {puja.poojaDescription.map((d, i) => (
                <Accordion
                  key={d.headingId || d.heading}
                  title={d.heading}
                  defaultOpen={i < 2}
                >
                  <div dangerouslySetInnerHTML={{ __html: d.description }} />
                </Accordion>
              ))}
            </div>
          </div>

          {/* ── What you'll get ── */}
          <div>
            <SectionTitle icon={<Gift className="w-3.5 h-3.5 text-[#B8860B]" />}>
              What you'll get
            </SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {whatYouGet.map(({ icon: Icon, title, sub }) => (
                <div
                  key={title}
                  className="bg-white border border-[#E7DAC0] rounded-xl p-2.5 text-center shadow-sm"
                >
                  <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-[#F3E9D2] to-[#8B0000]/20 flex items-center justify-center mb-1.5">
                    <Icon className="w-4 h-4 text-[#8B0000]" />
                  </div>
                  <p className="text-[11px] font-bold text-[#1A1A1A] leading-tight">{title}</p>
                  <p className="text-[9.5px] text-[#6E6257] leading-tight mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ ── */}
          {puja.faqs.length > 0 && (
            <div>
              <SectionTitle icon={<HelpCircle className="w-3.5 h-3.5 text-[#B8860B]" />}>
                Frequently asked questions
              </SectionTitle>
              <div className="space-y-2">
                {puja.faqs.map((f, i) => (
                  <Accordion key={i} title={f.question}>
                    <p>{f.answer}</p>
                  </Accordion>
                ))}
              </div>
            </div>
          )}

          {/* ── Trust row ── */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Video, label: "Puja Video Proof" },
              { icon: Gift, label: "Prasad at Home" },
              { icon: ShieldCheck, label: "Verified Pandit" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-white border border-[#E7DAC0] rounded-xl py-2.5 flex flex-col items-center gap-1 shadow-sm"
              >
                <Icon className="w-4 h-4 text-[#B8860B]" />
                <span className="text-[9.5px] font-semibold text-[#6E6257] leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Footer / ecosystem ── */}
          <footer className="pt-3 mt-2 border-t border-[#E7DAC0] text-[11px] text-[#6E6257] space-y-2">
            <p className="font-bold text-[#1A1A1A]">PanditJiAtRequest</p>
            <p>1031, Tricity Trade Tower, Zirakpur, Punjab 140603, India</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <button onClick={() => navigate("/privacypolicy")} className="underline">
                Privacy Policy
              </button>
              <button onClick={() => navigate("/termsandconditions")} className="underline">
                Terms
              </button>
              <a href="tel:+919056955311" className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Support
              </a>
              <a
                href="https://wa.me/919056955311"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </a>
            </div>
          </footer>
        </div>

        {/* ── Sticky bottom CTA ── */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E7DAC0] max-w-md mx-auto shadow-lg">
          <div className="px-4 pt-2 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <span className="text-[9.5px] text-[#6E6257] font-semibold uppercase block leading-none">
                  {selectedPkg.name}
                </span>
                <span className="text-[19px] font-extrabold text-[#8B0000]">
                  {money(price)}
                </span>
              </div>
              <button
                onClick={openBooking}
                className="flex-1 bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] text-[#D4AF37] font-bold text-[15px] py-3 rounded-xl shadow-md border border-[#B8860B]/40 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#B8860B] outline-none"
              >
                Book for {money(price)}
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] text-[#6E6257]">
              <Lock className="w-3 h-3 text-[#B8860B]" />
              100% secure payment
            </div>
          </div>
        </div>
      </div>
    );
}
