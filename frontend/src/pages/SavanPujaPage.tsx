import { useState, useEffect, useId } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft, Check, ShieldCheck, Gift, Calendar, Sparkles,
    Star, Lock, ChevronDown, MessageCircle, Phone, Flame, BadgeCheck,
    Video, Mountain, Share2, HelpCircle, Droplets, Leaf, Moon,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import PujaEnquiryModal from "../components/booking/PujaEnquiryModal";
import API_URL from "../utils/apiConfig";
import { decryptData } from "../utils/encryption";
import { kashiMahadevPuja, KASHI_MAHADEV_PUJA_SLUG } from "../data/kashiMahadevPuja";

// ── analytics (Meta Pixel — the project's existing convention) ──
function track(event: string, params?: Record<string, unknown>, custom = false) {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq(custom ? "trackCustom" : "track", event, params);
    }
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Savan rainfall across the whole page. Generated once at module load from a
 * fixed seed — not on every render — so the drops keep their positions and
 * the rain doesn't reshuffle when the countdown ticks each second.
 *
 * Nearer drops fall faster and are longer, wider and brighter; farther ones
 * are slower and fainter. That depth spread is what stops it reading as a
 * marching row of identical ticks. Durations are tuned for a full-viewport
 * fall (~112vh), so they are far longer than a banner-height drop would need.
 */
const SAVAN_RAINDROPS = (() => {
    let h = 0x9e3779b9;
    const rand = () => {
        h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
        return ((h >>> 0) % 10000) / 10000;
    };
    return Array.from({ length: 60 }, () => {
        const depth = rand(); // 0 = far/slow/faint, 1 = near/fast/bright
        return {
            left: +(rand() * 100).toFixed(2),
            delay: +(rand() * 4).toFixed(2),           // staggered over 4s
            dur: +(4.2 - depth * 1.9).toFixed(2),      // 2.30s – 4.20s
            h: Math.round(12 + depth * 16),            // 12px – 28px
            w: +(1.1 + depth * 0.9).toFixed(1),        // 1.1px – 2.0px
            opacity: +(0.35 + depth * 0.45).toFixed(2), // 0.35 – 0.80
        };
    });
})();

// Kashi Mahadev Savan online-puja devotee reviews (auto-scrolling marquee).
type Review = { name: string; rating: number; date: string; text: string; verified: boolean };
const PLACEHOLDER_REVIEWS: Review[] = [
    { name: "Sunita Devi", rating: 5, date: "1 week ago", text: "Rudrabhishek ka video WhatsApp pe mil gaya, pandit ji ne mera naam aur gotra se sankalp kiya. 🙏", verified: true },
    { name: "Rakesh Kumar", rating: 5, date: "3 weeks ago", text: "₹1100 mein Kashi Vishwanath se puja karwana bahut easy tha. Sab update WhatsApp pe mila.", verified: true },
    { name: "Pooja Sharma", rating: 5, date: "2 weeks ago", text: "Prasad 5 din mein ghar aa gaya, bhasma aur bel patra bhi tha. Thank you team. 🙏", verified: true },
    { name: "Amit Verma", rating: 4, date: "1 month ago", text: "Puja theek se hui, video bhi mil gaya. Video thoda lamba hota to aur acha tha, par satisfied hoon.", verified: true },
    { name: "Deepak Yadav", rating: 5, date: "5 days ago", text: "Savan Somwar pe parents ke naam se book kiya. Pandit ji ne aarti mein naam liya. Family khush ho gayi.", verified: true },
    { name: "Anjali Nair", rating: 5, date: "2 months ago", text: "Booked from Dubai. Kashi nahi ja paayi par connected feel hua. Simple process.", verified: false },
    { name: "Manoj Tiwari", rating: 4, date: "3 weeks ago", text: "Sankalp naam aur gotra se hua. Booking aasan thi. Overall accha experience raha.", verified: true },
    { name: "Kavita Singh", rating: 5, date: "1 month ago", text: "Baba Vishwanath ke darbar se abhishek karwa ke mann ko shanti mili. Har Har Mahadev! 🙏", verified: true },
    { name: "Ramesh Patel", rating: 5, date: "2 weeks ago", text: "Genuine service. Koi extra paisa nahi maanga. Video proof bhi diya jaisa bola tha.", verified: true },
    { name: "Neha Joshi", rating: 4, date: "6 days ago", text: "Achhi service. Puja ki timing WhatsApp pe confirm kar di thi. Recommend karungi.", verified: false },
    { name: "Suresh Gupta", rating: 5, date: "1 month ago", text: "Parivaar ki sukh-shanti ke liye Rudrabhishek karwaya. Sab time pe aur proper hua. 🙏", verified: true },
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

// ── Small UI pieces (Savan palette: emerald, light aqua, temple gold) ────
function Stars({ value, className = "w-3.5 h-3.5" }: { value: number; className?: string }) {
    const full = Math.round(value);
    return (
        <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`${className} ${i <= full ? "text-[#C89B3C] fill-[#C89B3C]" : "text-[#DDEBE6]"}`} />
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
        <div className={`bg-white border rounded-2xl overflow-hidden transition-colors ${open ? "border-[#086B50]/45" : "border-[#DDEBE6]"}`}>
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => {
                    const next = !open;
                    setOpen(next);
                    if (next) track("puja_accordion_open", { section: title }, true);
                }}
                className="w-full px-3.5 py-3 flex items-center justify-between text-left focus-visible:ring-2 focus-visible:ring-[#008C68] outline-none"
            >
                <span className="flex items-center gap-2 text-[14px] font-bold text-[#17211D]">
                    {icon}{title}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#086B50] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <div id={panelId} hidden={!open} className="px-3.5 pb-3.5 pt-1 text-[12.5px] text-[#66736E] leading-relaxed border-t border-[#DDEBE6]">
                {children}
            </div>
        </div>
    );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <h3 className="flex items-center gap-1.5 text-[12.5px] font-extrabold uppercase tracking-wider text-[#086B50] mb-2.5">
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
                    <div key={i} className="shrink-0 w-56 bg-white border border-[#DDEBE6] rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#17211D] text-[12px]">{r.name}</span>
                            {r.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#008C68] shrink-0" />}
                            <span className="ml-auto text-[9px] text-[#66736E]">{r.date}</span>
                        </div>
                        <Stars value={r.rating} className="w-3 h-3" />
                        <p className="text-[11.5px] text-[#66736E] mt-1 leading-snug line-clamp-3">{r.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────
// FRONTEND-ONLY Shree Kashi Rudrabhishek Mahapuja — an online Rudrabhishek
// performed on the devotee's behalf at Shree Kashi Vishwanath Temple,
// Varanasi on the first Savan Somwar. Renders entirely from frontend data
// but carries a distinct Savan/Shiv theme (the emerald / light-aqua / temple-gold palette, abhishek
// droplets, bel patra, the four-Somwar calendar).
// All data comes from src/data/kashiMahadevPuja.ts.
export default function SavanPujaPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const puja = kashiMahadevPuja;
    const pujaId = kashiMahadevPuja._id;

    const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    // ViewContent on load
    useEffect(() => {
        track("ViewContent", {
            content_name: puja.poojaNameEng,
            content_ids: [pujaId],
            content_type: "product",
            value: puja.poojaPriceOnline,
            currency: "INR",
        });
    }, []);

    const image = puja.poojaImages?.[0] || puja.poojaMainImage || puja.poojaCardImage;
    const price = puja.poojaPriceOnline;
    const reviews = seededReviews(pujaId, 9);
    const mandirName = `${puja.templeName}, ${puja.templeLocation}`;

    // ── Countdown to the puja date ──
    const targetTs = new Date(puja.pujaDate).getTime();
    const [remaining, setRemaining] = useState(() =>
        Number.isNaN(targetTs) ? 0 : Math.max(0, targetTs - Date.now())
    );
    useEffect(() => {
        if (Number.isNaN(targetTs)) return;
        const tick = () => setRemaining(Math.max(0, targetTs - Date.now()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetTs]);
    const cd = remaining > 0 ? {
        days: Math.floor(remaining / 86400000),
        hrs: Math.floor((remaining % 86400000) / 3600000),
        min: Math.floor((remaining % 3600000) / 60000),
        sec: Math.floor((remaining % 60000) / 1000),
    } : null;

    const whatYouGet = [
        { icon: BadgeCheck, title: "Personalized offering", sub: "Performed in your name & gotra" },
        { icon: Video, title: "Puja video on WhatsApp", sub: "Full recording delivered to you" },
        { icon: Gift, title: "Prasad at your home", sub: "Sacred prasad couriered to you" },
    ];

    // The sacred offerings poured during the Rudrabhishek.
    const offerings = [
        { icon: Droplets, label: "Gangajal", sub: "Abhishek jal" },
        { icon: Leaf, label: "Bel Patra", sub: "Shiv's favourite" },
        { icon: Flame, label: "Rudri Path", sub: "Vedic chanting" },
        { icon: Moon, label: "Panchamrit", sub: "Five nectars" },
    ];

    // Main CTA goes straight to the booking page. The optional prasad add-on
    // lives inside the booking page only (no pre-booking upsell interruption).
    // AddToCart marks intent at the CTA tap (same convention as PujaPage.tsx);
    // InitiateCheckout / Purchase then fire on the booking page itself, so the
    // three funnel steps stay distinct instead of collapsing onto one trigger.
    const openBooking = () => {
        track("AddToCart", {
            content_name: puja.poojaNameEng,
            content_ids: [pujaId],
            content_type: "product",
            value: price,
            currency: "INR",
        });
        navigate(`/${KASHI_MAHADEV_PUJA_SLUG}/booking`);
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
      <div className="min-h-screen bg-gradient-to-b from-[#FFFDF8] via-[#F0FAF7] to-[#FFFDF8] pb-24 font-sans w-full max-w-md mx-auto shadow-xl relative border-x border-[#DDEBE6]">
        {/* Savan rain — falls across the entire page, not just the hero. Drops
            are tinted Primary Emerald rather than white, since the page sits on
            Main Background / Alternate Section, where white would vanish. */}
        <style>{`
          @keyframes savanDrop{0%{transform:translateY(-6vh);opacity:0}10%{opacity:var(--drop-opacity,.7)}88%{opacity:var(--drop-opacity,.7)}100%{transform:translateY(106vh);opacity:0}}
          .savan-rain{position:fixed;top:0;bottom:0;width:100%;max-width:28rem;overflow:hidden;pointer-events:none;z-index:30}
          .savan-drop{position:absolute;top:0;width:var(--drop-w,1.5px);height:var(--drop-h,14px);border-radius:9999px;background:linear-gradient(to bottom,rgba(8,107,80,0),rgba(8,107,80,.55));animation:savanDrop var(--drop-dur,3s) linear infinite;will-change:transform}
          @media (prefers-reduced-motion: reduce){.savan-rain{display:none}.review-track{animation:none}}
        `}</style>

        {/* Page-wide rainfall. `fixed` so it keeps falling while the devotee
            scrolls, clipped to the max-w-md column, and pointer-events-none so
            it never intercepts a tap. z-30 sits above the cards but below the
            sticky header and bottom CTA (both z-50), which stay fully crisp. */}
        <div className="savan-rain" aria-hidden="true">
          {SAVAN_RAINDROPS.map((d, i) => (
            <span
              key={i}
              className="savan-drop"
              style={{
                left: `${d.left}%`,
                animationDelay: `${d.delay}s`,
                ["--drop-dur" as string]: `${d.dur}s`,
                ["--drop-h" as string]: `${d.h}px`,
                ["--drop-w" as string]: `${d.w}px`,
                ["--drop-opacity" as string]: `${d.opacity}`,
              }}
            />
          ))}
        </div>

        <Helmet>
          <title>{`${puja.poojaNameEng} at ${puja.templeName}, Varanasi | Pandit Ji At Request`}</title>
          <meta
            name="description"
            content={`Book online ${puja.poojaNameEng} (${puja.poojaNameHindi}) — Rudrabhishek performed on your behalf at ${mandirName} on the first Savan Somwar, ${puja.pujaDate}. ${puja.benefits.slice(0, 2).join(", ")}. Verified pandits, puja video on WhatsApp.`}
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
        <div className="sticky top-0 z-50 bg-[#FFFDF8]/90 backdrop-blur-md border-b border-[#DDEBE6] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() =>
              location.key !== "default" ? navigate(-1) : navigate("/")
            }
            aria-label="Go back"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#DDEBE6] shadow-sm active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-[#17211D]" />
          </button>
          <h1 className="text-sm font-bold text-[#17211D] truncate flex-1">
            {puja.poojaNameEng}
          </h1>
          <button
            onClick={handleShare}
            disabled={isSharing}
            aria-label="Share"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#DDEBE6] shadow-sm active:scale-90 transition-transform disabled:opacity-60"
          >
            {shareCopied ? (
              <Check className="w-4 h-4 text-[#008C68]" />
            ) : (
              <Share2 className="w-4 h-4 text-[#17211D]" />
            )}
          </button>
        </div>

        {/* ── Savan occasion ribbon ── */}
        <div className="bg-gradient-to-r from-[#086B50] via-[#008C68] to-[#086B50] text-center py-1.5 px-4">
          <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-white">
            सावन 2026 · {puja.occasion} · हर हर महादेव
          </p>
        </div>

        {/* ── Hero banner (the page-wide rain layer falls over this too) ── */}
        <div className="relative h-52 overflow-hidden bg-[#086B50]">
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
          {/* Only the date is overlaid — the banner artwork already carries the
              puja name, location and value props, so repeating them here just
              covered the artwork's own icons. */}
        </div>

        <div className="px-4 pt-3 pb-4 space-y-4">
          {/* ── Puja name + meta ── */}
          <div>
            <h2 className="text-xl font-bold font-serif text-[#17211D] leading-tight">
              {puja.poojaNameEng}
            </h2>
            <p className="text-[13px] text-[#086B50] font-medium mt-0.5">
              {puja.poojaNameHindi}
            </p>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
              <span className="bg-[#DFF5EF] text-[#086B50] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {puja.deity}
              </span>
              <span className="flex items-center gap-1 text-[12px]">
                <Stars value={puja.rating} />
                <span className="font-bold text-[#17211D]">{puja.rating}</span>
                <span className="text-[#66736E]">
                  · {puja.devoteesLabel} devotees
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-1 mt-2 text-[12px] text-[#66736E]">
              <span className="flex items-start gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-[#086B50] shrink-0 mt-0.5" />
                <span className="leading-snug">{mandirName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#086B50] shrink-0" />
                {puja.pujaDate} · {puja.occasion}
              </span>
            </div>
          </div>

          {/* ── Hero value props ── */}
          <div className="rounded-2xl border border-[#DDEBE6] bg-gradient-to-br from-[#FFFDF8] via-[#F0FAF7] to-[#DFF5EF]/70 p-3.5 shadow-sm">
            <div className="space-y-1.5">
              {[
                "Rudrabhishek on the first Savan Somwar",
                "Personalized Sankalp in your name & gotra",
                "Puja video shared on WhatsApp",
                "Optional prasad delivered at home",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2 text-[12.5px] text-[#17211D]">
                  <Check className="w-3.5 h-3.5 text-[#008C68] shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Countdown to the puja date ── */}
          <div className="flex flex-col items-center gap-2 bg-white border border-[#DDEBE6] rounded-xl px-3 py-2.5 shadow-sm">
            <span className="text-[11px] font-bold text-[#086B50] leading-tight text-center">
              Limited slots for {puja.pujaDate}
            </span>
            {cd ? (
              <div className="flex items-center justify-center gap-1.5">
                {[
                  { v: cd.days, l: "Days" },
                  { v: cd.hrs, l: "Hrs" },
                  { v: cd.min, l: "Min" },
                  { v: cd.sec, l: "Sec" },
                ].map((u, i, arr) => (
                  <div key={u.l} className="flex items-center gap-1.5">
                    <div className="min-w-[40px] bg-[#DFF5EF] border border-[#DDEBE6] rounded-lg px-1.5 py-1 text-center">
                      <div className="text-[16px] leading-none font-bold text-[#17211D] tabular-nums">
                        {pad2(u.v)}
                      </div>
                      <div className="text-[8px] uppercase tracking-wide text-[#66736E] mt-0.5">
                        {u.l}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <span className="text-[#DDEBE6] font-semibold text-xs">:</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[12px] text-[#66736E]">Booking open</span>
            )}
          </div>

          {/* ── Online-puja reassurance line ── */}
          <div className="flex items-center justify-center gap-1.5 bg-[#DFF5EF] border border-[#DDEBE6] text-[#086B50] rounded-lg px-3 py-1.5 text-[12px] font-semibold text-center">
            <MessageCircle className="w-3.5 h-3.5 text-[#008C68] shrink-0" />
            Puja performed at {puja.templeName} · receive the video with your
            name &amp; gotra on WhatsApp
          </div>

          {/* ── Rudrabhishek offerings ── */}
          <div>
            <SectionTitle icon={<Droplets className="w-3.5 h-3.5 text-[#C89B3C]" />}>
              What is offered in your name
            </SectionTitle>
            <div className="grid grid-cols-4 gap-2">
              {offerings.map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="bg-white border border-[#DDEBE6] rounded-xl p-2 text-center shadow-sm"
                >
                  <div className="w-7 h-7 mx-auto rounded-full bg-gradient-to-br from-[#DFF5EF] to-[#086B50]/20 flex items-center justify-center mb-1">
                    <Icon className="w-3.5 h-3.5 text-[#086B50]" />
                  </div>
                  <p className="text-[10.5px] font-bold text-[#17211D] leading-tight">{label}</p>
                  <p className="text-[8.5px] text-[#66736E] leading-tight mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Mantra strip ── */}
          <div className="rounded-2xl bg-gradient-to-r from-[#086B50] via-[#008C68] to-[#086B50] px-4 py-3 text-center shadow-md">
            <p className="text-[15px] font-serif font-bold text-white tracking-wide">
              ॐ नमः शिवाय
            </p>
            <p className="text-[10.5px] text-[#DFF5EF] mt-0.5">
              Chanted through your Rudrabhishek at Kashi Vishwanath
            </p>
          </div>

          {/* ── Auto-scrolling devotee reviews ── */}
          <div>
            <SectionTitle icon={<Star className="w-3.5 h-3.5 text-[#C89B3C]" />}>
              Loved by devotees
            </SectionTitle>
            <ReviewMarquee reviews={reviews} />
          </div>

          {/* ── How it works ── */}
          <div className="rounded-2xl border border-[#DDEBE6] bg-gradient-to-br from-[#FFFDF8] via-[#F0FAF7] to-[#DFF5EF]/70 p-3.5 shadow-sm">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />}>
              How your puja will happen
            </SectionTitle>
            <div className="space-y-2.5">
              {[
                "Enter your name, gotra and phone number",
                `Pandit ji performs the Rudrabhishek at ${puja.templeName}`,
                "Sankalp is taken in your name & gotra",
                "Puja video is shared with you on WhatsApp",
                "Optional prasad is delivered to your home",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#DFF5EF] text-[#086B50] flex items-center justify-center text-[11px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] text-[#17211D] leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Why perform this puja ── */}
          <div className="rounded-2xl border border-[#DDEBE6] bg-gradient-to-br from-[#FFFDF8] via-[#F0FAF7] to-[#DFF5EF]/70 p-3 shadow-sm">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />}>
              Why perform this puja
            </SectionTitle>
            <div className="grid grid-cols-1 gap-1.5">
              {puja.benefits.slice(0, 4).map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-[12.5px] text-[#17211D]">
                  <Check className="w-3.5 h-3.5 text-[#008C68] shrink-0 mt-0.5" strokeWidth={3} />
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
            className="w-full flex items-center justify-center gap-1.5 text-[#66736E] hover:text-[#086B50] font-semibold text-[12.5px] py-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Need help? Chat on WhatsApp
          </button>

          {/* ── Puja details (accordions from poojaDescription) ── */}
          <div>
            <SectionTitle icon={<Flame className="w-3.5 h-3.5 text-[#C89B3C]" />}>
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
            <SectionTitle icon={<Gift className="w-3.5 h-3.5 text-[#C89B3C]" />}>
              What you'll get
            </SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {whatYouGet.map(({ icon: Icon, title, sub }) => (
                <div
                  key={title}
                  className="bg-white border border-[#DDEBE6] rounded-xl p-2.5 text-center shadow-sm"
                >
                  <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-[#DFF5EF] to-[#086B50]/20 flex items-center justify-center mb-1.5">
                    <Icon className="w-4 h-4 text-[#086B50]" />
                  </div>
                  <p className="text-[11px] font-bold text-[#17211D] leading-tight">{title}</p>
                  <p className="text-[9.5px] text-[#66736E] leading-tight mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ ── */}
          {puja.faqs.length > 0 && (
            <div>
              <SectionTitle icon={<HelpCircle className="w-3.5 h-3.5 text-[#C89B3C]" />}>
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
                className="bg-white border border-[#DDEBE6] rounded-xl py-2.5 flex flex-col items-center gap-1 shadow-sm"
              >
                <Icon className="w-4 h-4 text-[#008C68]" />
                <span className="text-[9.5px] font-semibold text-[#66736E] leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Footer / ecosystem ── */}
          <footer className="pt-3 mt-2 border-t border-[#DDEBE6] text-[11px] text-[#66736E] space-y-2">
            <p className="font-bold text-[#17211D]">PanditJiAtRequest</p>
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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#DDEBE6] max-w-md mx-auto shadow-lg">
          <div className="px-4 pt-2 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <span className="text-[9.5px] text-[#66736E] font-semibold uppercase block leading-none">
                  Total
                </span>
                <span className="text-[19px] font-extrabold text-[#086B50]">
                  ₹{price.toLocaleString("en-IN")}
                </span>
              </div>
              <button
                onClick={openBooking}
                className="flex-1 bg-gradient-to-r from-[#086B50] via-[#008C68] to-[#086B50] text-white font-bold text-[15px] py-3 rounded-xl shadow-md active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#008C68] outline-none"
              >
                Book Savan Puja for ₹{price.toLocaleString("en-IN")}
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] text-[#66736E]">
              <Lock className="w-3 h-3 text-[#008C68]" />
              100% secure payment
            </div>
          </div>
        </div>
      </div>
    );
}
