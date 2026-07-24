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
import { kaalBhairavPuja, KAAL_BHAIRAV_PUJA_SLUG } from "../data/kaalBhairavPuja";

// ── analytics (Meta Pixel — the project's existing convention) ──
function track(event: string, params?: Record<string, unknown>, custom = false) {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq(custom ? "trackCustom" : "track", event, params);
    }
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
            content_name: puja.poojaNameEng,
            content_ids: [pujaId],
            content_type: "product",
            value: price,
            currency: "INR",
        });
        navigate(`/${KAAL_BHAIRAV_PUJA_SLUG}/booking`);
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
                className="pointer-events-none absolute -top-5 -right-6 w-40 h-40 object-contain drop-shadow-xl z-10"
              />
            )}
            <div className={`space-y-1.5 ${HERO_VALUE_IMAGE ? "pr-24" : ""}`}>
              {[
                "Kaal Bhairav puja on Kalashtami at Kashi",
                "Personalized Sankalp in your name & gotra",
                "Puja video shared on WhatsApp",
                "Optional prasad delivered at home",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2 text-[12.5px] text-[#1A1A1A]">
                  <Check className="w-3.5 h-3.5 text-[#B8860B] shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Countdown to the puja date ── */}
          <div className="flex flex-col items-center gap-2 bg-white border border-[#E7DAC0] rounded-xl px-3 py-2.5 shadow-sm">
            <span className="text-[11px] font-bold text-[#8B0000] leading-tight text-center">
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
                    <div className="min-w-[40px] bg-[#F3E9D2] border border-[#E7DAC0] rounded-lg px-1.5 py-1 text-center">
                      <div className="text-[16px] leading-none font-bold text-[#1A1A1A] tabular-nums">
                        {pad2(u.v)}
                      </div>
                      <div className="text-[8px] uppercase tracking-wide text-[#6E6257] mt-0.5">
                        {u.l}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <span className="text-[#E7DAC0] font-semibold text-xs">:</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[12px] text-[#6E6257]">Booking open</span>
            )}
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
                  Total
                </span>
                <span className="text-[19px] font-extrabold text-[#8B0000]">
                  ₹{price.toLocaleString("en-IN")}
                </span>
              </div>
              <button
                onClick={openBooking}
                className="flex-1 bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] text-[#D4AF37] font-bold text-[15px] py-3 rounded-xl shadow-md border border-[#B8860B]/40 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#B8860B] outline-none"
              >
                Book Kaal Bhairav Puja for ₹{price.toLocaleString("en-IN")}
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
