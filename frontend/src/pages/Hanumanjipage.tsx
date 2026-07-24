import { useState, useEffect, useId } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft, Check, ShieldCheck, Gift, Calendar, Sparkles,
    Star, Lock, ChevronDown, MessageCircle, Phone, Flame, BadgeCheck,
    Video, Mountain, Share2, HelpCircle, BookOpen, Flag, Leaf,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import PujaEnquiryModal from "../components/booking/PujaEnquiryModal";
import API_URL from "../utils/apiConfig";
import { decryptData } from "../utils/encryption";
import { hanumanPuja, HANUMAN_PUJA_SLUG, DEFAULT_PACKAGE_ID, getPackage, type PujaPackageId } from "../data/hanumanPuja";
import PujaPackages from "../components/hanuman/PujaPackages";

// ── analytics (Meta Pixel — the project's existing convention) ──
function track(event: string, params?: Record<string, unknown>, custom = false) {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq(custom ? "trackCustom" : "track", event, params);
    }
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Decorative image flanking the mantra strip — mirrored on the left side. */
const MANTRA_SIDE_IMAGE = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Gada.webp";

// Hanuman Garhi online-puja devotee reviews (auto-scrolling marquee).
type Review = { name: string; rating: number; date: string; text: string; verified: boolean };
const PLACEHOLDER_REVIEWS: Review[] = [
    { name: "Sunita Devi", rating: 5, date: "1 week ago", text: "Hanuman ji ki puja ka video WhatsApp pe mil gaya, pandit ji ne mera naam aur gotra se sankalp kiya. जय हनुमान 🙏", verified: true },
    { name: "Rakesh Kumar", rating: 5, date: "3 weeks ago", text: "Ghar mein bahut pareshani thi, Bajrangbali ki puja ke baad mann shaant hai. ₹1100 mein easy tha.", verified: true },
    { name: "Pooja Sharma", rating: 5, date: "2 weeks ago", text: "Prasad 5 din mein ghar aa gaya, boondi laddoo bhi tha. Nazar utarne ke liye karwaya tha. 🙏", verified: true },
    { name: "Amit Verma", rating: 4, date: "1 month ago", text: "Puja theek se hui, video bhi mil gaya. Sundarkand ka paath sunke bahut accha laga.", verified: true },
    { name: "Deepak Yadav", rating: 5, date: "5 days ago", text: "Savan Mangalwar pe parents ke naam se book kiya. Pandit ji ne aarti mein naam liya. Family khush.", verified: true },
    { name: "Anjali Nair", rating: 5, date: "2 months ago", text: "Booked from Dubai. Hanuman ji ki raksha chahiye thi. Simple aur genuine process.", verified: false },
    { name: "Manoj Tiwari", rating: 4, date: "3 weeks ago", text: "Sankalp naam aur gotra se hua. Shani aur Mangal ke liye karwaya. Booking aasan thi.", verified: true },
    { name: "Kavita Singh", rating: 5, date: "1 month ago", text: "Ayodhya ke Hanuman Garhi se puja karwa ke bahut suraksha mehsoos hui. जय श्री राम! 🙏", verified: true },
    { name: "Ramesh Patel", rating: 5, date: "2 weeks ago", text: "Genuine service. Koi extra paisa nahi maanga. Video proof bhi diya jaisa bola tha.", verified: true },
    { name: "Neha Joshi", rating: 4, date: "6 days ago", text: "Achhi service. Puja ki timing WhatsApp pe confirm kar di thi. Recommend karungi.", verified: false },
    { name: "Suresh Gupta", rating: 5, date: "1 month ago", text: "Business mein rukawat ke liye Hanuman puja karwayi. Sab time pe aur proper hua. 🙏", verified: true },
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

// ── Small UI pieces (Royal Hanuman Bhakti palette: saffron, temple gold, sindoor) ──
function Stars({ value, className = "w-3.5 h-3.5" }: { value: number; className?: string }) {
    const full = Math.round(value);
    return (
        <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`${className} ${i <= full ? "text-[#D4A017] fill-[#D4A017]" : "text-[#EAD9B5]"}`} />
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
        <div className={`bg-white border rounded-2xl overflow-hidden transition-colors ${open ? "border-[#E65A00]/45" : "border-[#EAD9B5]"}`}>
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => {
                    const next = !open;
                    setOpen(next);
                    if (next) track("puja_accordion_open", { section: title }, true);
                }}
                className="w-full px-3.5 py-3 flex items-center justify-between text-left focus-visible:ring-2 focus-visible:ring-[#E65A00] outline-none"
            >
                <span className="flex items-center gap-2 text-[14px] font-bold text-[#4E342E]">
                    {icon}{title}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#C63D00] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <div id={panelId} hidden={!open} className="px-3.5 pb-3.5 pt-1 text-[12.5px] text-[#7A5A3A] leading-relaxed border-t border-[#EAD9B5]">
                {children}
            </div>
        </div>
    );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <h3 className="flex items-center gap-1.5 text-[12.5px] font-extrabold uppercase tracking-wider text-[#C63D00] mb-2.5">
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
                    <div key={i} className="shrink-0 w-56 bg-white border border-[#EAD9B5] rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#4E342E] text-[12px]">{r.name}</span>
                            {r.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />}
                            <span className="ml-auto text-[9px] text-[#7A5A3A]">{r.date}</span>
                        </div>
                        <Stars value={r.rating} className="w-3 h-3" />
                        <p className="text-[11.5px] text-[#7A5A3A] mt-1 leading-snug line-clamp-3">{r.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Live countdown pill for the hero banner's bottom-right corner.
 *
 * Deliberately its OWN component with its OWN interval + state, so the 1-second
 * tick re-renders only this tiny pill — not the whole (large) page. Ticking the
 * parent every second would re-reconcile the entire tree (packages, reviews,
 * accordions, FAQ…) and stall the review auto-scroll animation each second.
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
        <div className="absolute bottom-2 right-2 z-10 rounded-lg bg-[#FFF8ED]/90 backdrop-blur-sm border border-[#D4A017]/50 px-2.5 py-1.5 shadow-lg text-right">
            <p className="text-[7.5px] font-bold uppercase tracking-wider text-[#7A5A3A] leading-none mb-0.5">
                Puja slot closes in
            </p>
            <p className="text-[12px] font-bold text-[#B71C1C] tabular-nums leading-none">
                {days}d {pad2(hrs)}h {pad2(min)}m {pad2(sec)}s
            </p>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────
// FRONTEND-ONLY Shree Hanuman Garhi Mahapuja — an online puja performed on the
// devotee's behalf at Shri Hanuman Garhi Mandir, Ayodhya on Savan Mangalwar.
// Renders entirely from frontend data but carries a distinct Royal Hanuman
// Bhakti theme (the saffron / temple-gold / sindoor palette, Hanuman offerings).
// All data comes from src/data/hanumanPuja.ts.
export default function Hanumanjipage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const puja = hanumanPuja;
    const pujaId = hanumanPuja._id;

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

    // Gentle one-time nudge: ~2s after landing, if the devotee hasn't scrolled
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

    // The sacred offerings made during the Hanuman Garhi puja.
    const offerings = [
        { icon: Flame, label: "Sindoor Chola", sub: "Chameli oil" },
        { icon: BookOpen, label: "Sundarkand", sub: "Chalisa paath" },
        { icon: Flag, label: "Hanuman Dhwaj", sub: "Vijay pataka" },
        { icon: Leaf, label: "Boondi Bhog", sub: "Laddoo & paan" },
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
    // HanumanBookingPage and by the server CAPI Purchase — read those, not
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
        navigate(`/${HANUMAN_PUJA_SLUG}/booking`, { state: { packageId } });
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
      <div className="hg-page min-h-screen bg-gradient-to-b from-[#FFF8ED] via-[#FDF3E2] to-[#FFF8ED] pb-24 w-full max-w-md mx-auto shadow-xl relative border-x border-[#EAD9B5]">
        {/* Royal Hanuman Bhakti fonts — Cormorant Garamond for royal, temple-like
            headings; DM Sans for easy-to-read body copy. */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
          .hg-page{font-family:'DM Sans',sans-serif}
          .hg-serif{font-family:'Cormorant Garamond',serif}
          @media (prefers-reduced-motion: reduce){.review-track{animation:none}}
        `}</style>

        <Helmet>
          <title>{`${puja.poojaNameEng} at ${puja.templeName}, Ayodhya | Pandit Ji At Request`}</title>
          <meta
            name="description"
            content={`Book online ${puja.poojaNameEng} (${puja.poojaNameHindi}) — Hanuman puja performed on your behalf at ${mandirName} on Savan Mangalwar, ${puja.pujaDate}. ${puja.benefits.slice(0, 2).join(", ")}. Verified pandits, puja video on WhatsApp.`}
          />
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
        <div className="sticky top-0 z-50 bg-[#FFF8ED]/90 backdrop-blur-md border-b border-[#EAD9B5] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() =>
              location.key !== "default" ? navigate(-1) : navigate("/")
            }
            aria-label="Go back"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#EAD9B5] shadow-sm active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-[#4E342E]" />
          </button>
          <h1 className="text-sm font-bold text-[#4E342E] truncate flex-1">
            {puja.poojaNameEng}
          </h1>
          <button
            onClick={handleShare}
            disabled={isSharing}
            aria-label="Share"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#EAD9B5] shadow-sm active:scale-90 transition-transform disabled:opacity-60"
          >
            {shareCopied ? (
              <Check className="w-4 h-4 text-[#2E7D32]" />
            ) : (
              <Share2 className="w-4 h-4 text-[#4E342E]" />
            )}
          </button>
        </div>

        {/* ── Savan Mangalwar occasion ribbon ── */}
        <div className="bg-gradient-to-r from-[#E65A00] via-[#C63D00] to-[#E65A00] text-center py-1.5 px-4">
          <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-white">
            सावन मंगलवार 2026 · जय श्री राम · जय हनुमान
          </p>
        </div>

        {/* ── Hero banner ── */}
        <div className="relative h-52 overflow-hidden bg-[#C63D00]">
          <img
            src={image}
            width={432}
            height={192}
            alt={puja.poojaNameEng}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
          {/* Warm saffron vignette — grounds the artwork and ties the hero to the
              saffron/gold theme without covering the banner's own icons. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#4E342E]/45 via-transparent to-[#C63D00]/10" />
          {/* Compact live countdown, tucked into the hero's bottom-right. */}
          <HeroCountdown target={targetTs} />
        </div>

        <div className="px-4 pt-3 pb-4 space-y-4">
          {/* ── Puja name + meta ── */}
          <div>
            <h2 className="text-xl font-bold hg-serif text-[#4E342E] leading-tight">
              {puja.poojaNameEng}
            </h2>
            <p className="text-[13px] text-[#C63D00] font-medium mt-0.5">
              {puja.poojaNameHindi}
            </p>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
              <span className="bg-[#FBE7CE] text-[#C63D00] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {puja.deity}
              </span>
              <span className="flex items-center gap-1 text-[12px]">
                <Stars value={puja.rating} />
                <span className="font-bold text-[#4E342E]">{puja.rating}</span>
                <span className="text-[#7A5A3A]">
                  · {puja.devoteesLabel} devotees
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-1 mt-2 text-[12px] text-[#7A5A3A]">
              <span className="flex items-start gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-[#C63D00] shrink-0 mt-0.5" />
                <span className="leading-snug">{mandirName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C63D00] shrink-0" />
                {puja.pujaDate} · {puja.occasion}
              </span>
            </div>
          </div>

          {/* ── Hero value props ── */}
          <div className="rounded-2xl border border-[#EAD9B5] bg-gradient-to-br from-[#FFF5E6] via-[#FDF0DC] to-[#FFE0B2]/70 p-3.5 shadow-sm">
            <div className="space-y-1.5">
              {[
                "Hanuman puja on Savan Mangalwar at Hanuman Garhi, Ayodhya",
                "Personalized Sankalp in your name & gotra",
                "Puja video shared on WhatsApp",
                "Laddoo bhog, Chalisa & Raksha Kavach in premium packages",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2 text-[12.5px] text-[#4E342E]">
                  <Check className="w-3.5 h-3.5 text-[#D4A017] shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Choose your package (comparison) ── */}
          <div id="packages">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />}>
              Choose your package
            </SectionTitle>
            <PujaPackages selectedId={packageId} onSelect={setPackageId} />
            <p className="mt-2 text-[10.5px] text-[#7A5A3A] leading-snug text-center">
              Extra family members can be added at ₹151 each on the next step.
            </p>
          </div>


          {/* ── Mantra strip ── */}
          {/*
            The flanking images are absolutely positioned and vertically
            centred, so they can be scaled past the strip's own height and
            spill over its top/bottom edges without pushing it taller.
          */}
          <div className="relative rounded-2xl bg-gradient-to-r from-[#C63D00] via-[#E65A00] to-[#C63D00] px-16 py-3 text-center shadow-md border border-[#D4A017]/40">
            {MANTRA_SIDE_IMAGE && (
              <img
                src={MANTRA_SIDE_IMAGE}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -left-6 top-1/2 -translate-y-1/2 w-32 h-32 object-contain -scale-x-100 drop-shadow-lg"
              />
            )}
            <p className="text-[15px] hg-serif font-bold text-white tracking-wide">
              ॐ हं हनुमते नमः
            </p>
            <p className="text-[10.5px] text-[#FFE0B2] mt-0.5">
              Chanted through your puja at Hanuman Garhi, Ayodhya
            </p>
            {MANTRA_SIDE_IMAGE && (
              <img
                src={MANTRA_SIDE_IMAGE}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 w-32 h-32 object-contain drop-shadow-lg"
              />
            )}
          </div>

          {/* ── Auto-scrolling devotee reviews ── */}
          <div>
            <SectionTitle icon={<Star className="w-3.5 h-3.5 text-[#D4A017]" />}>
              Loved by devotees
            </SectionTitle>
            <ReviewMarquee reviews={reviews} />
          </div>

          {/* ── Online-puja reassurance line ── */}
          <div className="flex items-center justify-center gap-1.5 bg-[#FBE7CE] border border-[#EAD9B5] text-[#C63D00] rounded-lg px-3 py-1.5 text-[12px] font-semibold text-center">
            <MessageCircle className="w-3.5 h-3.5 text-[#E65A00] shrink-0" />
            Puja performed at {puja.templeName} · receive the video with your
            name &amp; gotra on WhatsApp
          </div>

          {/* ── Hanuman offerings ── */}
          <div>
            <SectionTitle icon={<Flame className="w-3.5 h-3.5 text-[#D4A017]" />}>
              What is offered in your name
            </SectionTitle>
            <div className="grid grid-cols-4 gap-2">
              {offerings.map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="bg-white border border-[#EAD9B5] rounded-xl p-2 text-center shadow-sm"
                >
                  <div className="w-7 h-7 mx-auto rounded-full bg-gradient-to-br from-[#FBE7CE] to-[#E65A00]/20 flex items-center justify-center mb-1">
                    <Icon className="w-3.5 h-3.5 text-[#C63D00]" />
                  </div>
                  <p className="text-[10.5px] font-bold text-[#4E342E] leading-tight">{label}</p>
                  <p className="text-[8.5px] text-[#7A5A3A] leading-tight mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>


          {/* ── How it works ── */}
          <div className="rounded-2xl border border-[#EAD9B5] bg-gradient-to-br from-[#FFF8ED] via-[#FDF3E2] to-[#FBE7CE]/70 p-3.5 shadow-sm">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />}>
              How your puja will happen
            </SectionTitle>
            <div className="space-y-2.5">
              {[
                "Enter your name, gotra and phone number",
                `Pandit ji performs the Hanuman puja at ${puja.templeName}`,
                "Sankalp is taken in your name & gotra",
                "Puja video is shared with you on WhatsApp",
                "Optional prasad is delivered to your home",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#FBE7CE] text-[#C63D00] flex items-center justify-center text-[11px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] text-[#4E342E] leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Why perform this puja ── */}
          <div className="rounded-2xl border border-[#EAD9B5] bg-gradient-to-br from-[#FFF8ED] via-[#FDF3E2] to-[#FBE7CE]/70 p-3 shadow-sm">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />}>
              Why perform this puja
            </SectionTitle>
            <div className="grid grid-cols-1 gap-1.5">
              {puja.benefits.slice(0, 4).map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-[12.5px] text-[#4E342E]">
                  <Check className="w-3.5 h-3.5 text-[#D4A017] shrink-0 mt-0.5" strokeWidth={3} />
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
            className="w-full flex items-center justify-center gap-1.5 text-[#7A5A3A] hover:text-[#C63D00] font-semibold text-[12.5px] py-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Need help? Chat on WhatsApp
          </button>

          {/* ── Puja details (accordions from poojaDescription) ── */}
          <div>
            <SectionTitle icon={<Flame className="w-3.5 h-3.5 text-[#D4A017]" />}>
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
            <SectionTitle icon={<Gift className="w-3.5 h-3.5 text-[#D4A017]" />}>
              What you'll get
            </SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {whatYouGet.map(({ icon: Icon, title, sub }) => (
                <div
                  key={title}
                  className="bg-white border border-[#EAD9B5] rounded-xl p-2.5 text-center shadow-sm"
                >
                  <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-[#FBE7CE] to-[#E65A00]/20 flex items-center justify-center mb-1.5">
                    <Icon className="w-4 h-4 text-[#C63D00]" />
                  </div>
                  <p className="text-[11px] font-bold text-[#4E342E] leading-tight">{title}</p>
                  <p className="text-[9.5px] text-[#7A5A3A] leading-tight mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ ── */}
          {puja.faqs.length > 0 && (
            <div>
              <SectionTitle icon={<HelpCircle className="w-3.5 h-3.5 text-[#D4A017]" />}>
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
                className="bg-white border border-[#EAD9B5] rounded-xl py-2.5 flex flex-col items-center gap-1 shadow-sm"
              >
                <Icon className="w-4 h-4 text-[#2E7D32]" />
                <span className="text-[9.5px] font-semibold text-[#7A5A3A] leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Footer / ecosystem ── */}
          <footer className="pt-3 mt-2 border-t border-[#EAD9B5] text-[11px] text-[#7A5A3A] space-y-2">
            <p className="font-bold text-[#4E342E]">PanditJiAtRequest</p>
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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#EAD9B5] max-w-md mx-auto shadow-lg">
          <div className="px-4 pt-2 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <span className="text-[9.5px] text-[#7A5A3A] font-semibold uppercase block leading-none">
                  {selectedPkg.name}
                </span>
                <span className="text-[19px] font-extrabold text-[#C63D00]">
                  ₹{price.toLocaleString("en-IN")}
                </span>
              </div>
              <button
                onClick={openBooking}
                className="flex-1 bg-gradient-to-r from-[#E65A00] via-[#C63D00] to-[#E65A00] text-white font-bold text-[15px] py-3 rounded-xl shadow-md active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#E65A00] outline-none"
              >
                Book for ₹{price.toLocaleString("en-IN")}
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] text-[#7A5A3A]">
              <Lock className="w-3 h-3 text-[#2E7D32]" />
              100% secure payment
            </div>
          </div>
        </div>
      </div>
    );
}
