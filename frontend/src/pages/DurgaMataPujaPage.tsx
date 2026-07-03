import { useState, useEffect, useId } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft, Check, ShieldCheck, Gift, Calendar, Sparkles,
    Star, Clock, Lock, ChevronDown, MessageCircle, Phone, Flame, BadgeCheck,
    Home, HandHeart, Share2,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import PujaEnquiryModal from "../components/booking/PujaEnquiryModal";
import API_URL from "../utils/apiConfig";
import { decryptData } from "../utils/encryption";
import { durgaMataPuja, DURGA_MATA_PUJA_SLUG } from "../data/durgaMataPuja";

// ── analytics (Meta Pixel — the project's existing convention) ──
function track(event: string, params?: Record<string, unknown>, custom = false) {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq(custom ? "trackCustom" : "track", event, params);
    }
}

const pad2 = (n: number) => String(n).padStart(2, "0");

// Home-puja specific devotee reviews (auto-scrolling marquee).
type Review = { name: string; rating: number; date: string; text: string; verified: boolean };
const PLACEHOLDER_REVIEWS: Review[] = [
    { name: "Ramesh Iyer", rating: 5, date: "2 weeks ago", text: "Pandit ji came home on time and performed the Durga puja with full devotion. Truly blessed. 🙏", verified: true },
    { name: "Anjali Sharma", rating: 5, date: "1 month ago", text: "All samagri was arranged by them, we didn't have to worry about anything. Beautiful puja.", verified: true },
    { name: "Suresh Patel", rating: 5, date: "3 weeks ago", text: "Booking was smooth and the Durga Saptashati path was recited perfectly. Highly recommend.", verified: true },
    { name: "Lakshmi Menon", rating: 4, date: "2 months ago", text: "Booked for our new home. Pandit ji explained each ritual patiently. Very satisfied.", verified: true },
    { name: "Vikram Reddy", rating: 5, date: "1 month ago", text: "Transparent pricing and a very knowledgeable pandit. Felt the positive energy at home.", verified: true },
    { name: "Priya Nair", rating: 5, date: "1 week ago", text: "Got photos and video of the puja on WhatsApp. Felt very authentic and genuine.", verified: true },
    { name: "Arjun Deshmukh", rating: 5, date: "2 months ago", text: "First time booking a pandit online and it was completely worth it. Will book again.", verified: false },
    { name: "Meena Gupta", rating: 4, date: "3 weeks ago", text: "Good experience overall. Pandit ji was punctual and the aarti was lovely.", verified: true },
    { name: "Karthik Subramaniam", rating: 5, date: "1 month ago", text: "Sankalp was done in our name & gotra. Whole family felt blessed. 🙏", verified: true },
    { name: "Neha Joshi", rating: 5, date: "5 days ago", text: "Simple booking, timely updates on WhatsApp. Thank you for the smooth service.", verified: false },
    { name: "Rajesh Kumar", rating: 5, date: "2 months ago", text: "Did the Durga puja for family well-being. Everything was on time and proper.", verified: true },
    { name: "Divya Pillai", rating: 5, date: "2 weeks ago", text: "The whole setup and vidhi was beautiful. Our home felt peaceful after the puja.", verified: true },
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

// ── Small UI pieces (mirror LiveMandirPujaDetailPage) ──────────
function Stars({ value, className = "w-3.5 h-3.5" }: { value: number; className?: string }) {
    const full = Math.round(value);
    return (
        <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`${className} ${i <= full ? "text-amber-400 fill-amber-400" : "text-stone-300"}`} />
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
        <div className={`bg-white border rounded-2xl overflow-hidden transition-colors ${open ? "border-orange-300" : "border-orange-100"}`}>
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => {
                    const next = !open;
                    setOpen(next);
                    if (next) track("puja_accordion_open", { section: title }, true);
                }}
                className="w-full px-3.5 py-3 flex items-center justify-between text-left focus-visible:ring-2 focus-visible:ring-orange-400 outline-none"
            >
                <span className="flex items-center gap-2 text-[14px] font-bold text-stone-800">
                    {icon}{title}
                </span>
                <ChevronDown className={`w-4 h-4 text-orange-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <div id={panelId} hidden={!open} className="px-3.5 pb-3.5 pt-1 text-[12.5px] text-stone-600 leading-relaxed border-t border-orange-50">
                {children}
            </div>
        </div>
    );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
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
                    <div key={i} className="shrink-0 w-56 bg-white border border-orange-100 rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-800 text-[12px]">{r.name}</span>
                            {r.verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            <span className="ml-auto text-[9px] text-stone-400">{r.date}</span>
                        </div>
                        <Stars value={r.rating} className="w-3 h-3" />
                        <p className="text-[11.5px] text-stone-600 mt-1 leading-snug line-clamp-3">{r.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────
// FRONTEND-ONLY Durga Mata Puja — styled to match LiveMandirPujaDetailPage,
// adapted for a home-visit puja. All data comes from src/data/durgaMataPuja.ts.
// Booking + enquiry keep working because the real backend `_id` is used.
export default function DurgaMataPujaPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const puja = durgaMataPuja;
    const pujaId = durgaMataPuja._id;

    const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    // ViewContent on load
    useEffect(() => {
        track("ViewContent", {
            content_name: puja.poojaNameEng,
            content_ids: [pujaId],
            content_type: "product",
            value: puja.poojaPriceOffline,
            currency: "INR",
        });
    }, []);

    const image = puja.poojaImages?.[0] || puja.poojaMainImage || puja.poojaCardImage;
    const price = puja.poojaPriceOffline;
    const reviews = seededReviews(pujaId, 9);

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
        { icon: Home, title: "Pandit Ji at your home", sub: "Performed in your name & gotra" },
        { icon: HandHeart, title: "Complete samagri", sub: "All puja items arranged for you" },
        { icon: Gift, title: "Prasad & guidance", sub: "Blessed prasad + post-puja guidance" },
    ];

    const openBooking = () => {
        // No pixels here — AddToCart / InitiateCheckout fire only when the user
        // taps "Offer With Devotion" on the booking page.
        navigate(`/${DURGA_MATA_PUJA_SLUG}/booking`);
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
      <div className="min-h-screen bg-[#FFFAF3] pb-24 font-sans w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100">
        <Helmet>
          <title>{`${puja.poojaNameEng} at Home | Pandit Ji At Request`}</title>
          <meta
            name="description"
            content={`Book ${puja.poojaNameEng} (${puja.poojaNameHindi}) at your home. ${puja.benefits.slice(0, 3).join(", ")}. Verified pandits, complete samagri arranged.`}
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
        <div className="sticky top-0 z-50 bg-[#FFFAF3]/90 backdrop-blur-md border-b border-orange-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() =>
              location.key !== "default" ? navigate(-1) : navigate("/")
            }
            aria-label="Go back"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-orange-200/50 shadow-sm active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-stone-700" />
          </button>
          <h1 className="text-sm font-bold text-stone-800 truncate flex-1">
            {puja.poojaNameEng}
          </h1>
          <button
            onClick={handleShare}
            disabled={isSharing}
            aria-label="Share"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-orange-200/50 shadow-sm active:scale-90 transition-transform disabled:opacity-60"
          >
            {shareCopied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Share2 className="w-4 h-4 text-stone-700" />
            )}
          </button>
        </div>

        {/* ── Hero banner ── */}
        <div className="relative h-52 overflow-hidden p-2 rounded-[10px]">
          <img
            src={image}
            width={432}
            height={192}
            alt={puja.poojaNameEng}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover rounded-[10px]"
          />
          <span className="absolute top-3 left-3 bg-orange-600 text-white text-[9.5px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase shadow-sm">
            Home Puja
          </span>
        </div>

        <div className="px-4 pt-3 pb-4 space-y-4">
          {/* ── Puja name + meta ── */}
          <div>
            <h2 className="text-xl font-bold font-serif text-stone-900 leading-tight">
              {puja.poojaNameEng}
            </h2>
            <p className="text-[13px] text-orange-500 font-medium mt-0.5">
              {puja.poojaNameHindi}
            </p>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
              <span className="bg-orange-100 text-orange-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {puja.deity}
              </span>
              <span className="flex items-center gap-1 text-[12px]">
                <Stars value={puja.rating} />
                <span className="font-bold text-stone-700">{puja.rating}</span>
                <span className="text-stone-400">
                  · {puja.devoteesLabel} devotees
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[12px] text-stone-500">
              <span className="flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-orange-500" />
                At your home
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                2-3 hrs
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                {puja.pujaDate}
              </span>
            </div>
          </div>

          {/* ── Countdown to the puja date — compact single row ── */}
          <div className="flex items-center justify-center gap-6 bg-white border border-orange-100 rounded-xl px-3 py-2 shadow-sm">
            <span className="text-[10.5px] font-bold text-orange-600 leading-tight shrink-0">
              Bookings close soon
            </span>
            {cd ? (
              <div className="flex items-center gap-1">
                {[
                  { v: cd.days, l: "Days" },
                  { v: cd.hrs, l: "Hrs" },
                  { v: cd.min, l: "Min" },
                  { v: cd.sec, l: "Sec" },
                ].map((u, i, arr) => (
                  <div key={u.l} className="flex items-center gap-1">
                    <div className="min-w-[32px] bg-stone-50 border border-stone-100 rounded-lg px-1 py-0.5 text-center">
                      <div className="text-[15px] leading-none font-bold text-stone-900 tabular-nums">
                        {pad2(u.v)}
                      </div>
                      <div className="text-[8px] uppercase tracking-wide text-stone-400 mt-0.5">
                        {u.l}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <span className="text-stone-300 font-semibold text-xs">
                        :
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[12px] text-stone-500">Booking open</span>
            )}
          </div>

          {/* ── Home-visit reassurance line ── */}
          <div className="flex items-center justify-center gap-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-center">
            <Home className="w-3.5 h-3.5 text-green-600 shrink-0" />
            Pandit ji will come to your home with all samagri to perform this
            puja
          </div>

          {/* ── Auto-scrolling devotee reviews ── */}
          <div>
            <SectionTitle
              icon={<Star className="w-3.5 h-3.5 text-amber-400" />}
            >
              Loved by devotees
            </SectionTitle>
            <ReviewMarquee reviews={reviews} />
          </div>

          {/* ── Why perform this puja ── */}
          <div className="rounded-2xl border border-orange-100 bg-white p-3 shadow-sm">
            <SectionTitle
              icon={<Sparkles className="w-3.5 h-3.5 text-orange-400" />}
            >
              Why perform this puja
            </SectionTitle>
            <div className="grid grid-cols-1 gap-1.5">
              {puja.benefits.slice(0, 4).map((b, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-[12.5px] text-stone-700"
                >
                  <Check
                    className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5"
                    strokeWidth={3}
                  />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Enquiry CTA ── */}
          <button
            onClick={() => setIsEnquiryOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-[14px] py-3 rounded-xl shadow-md active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Enquire Now for {puja.poojaNameEng}
          </button>

          {/* ── Puja details (accordions from poojaDescription) ── */}
          <div>
            <SectionTitle
              icon={<Flame className="w-3.5 h-3.5 text-orange-400" />}
            >
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
            <SectionTitle
              icon={<Gift className="w-3.5 h-3.5 text-orange-400" />}
            >
              What you'll get
            </SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {whatYouGet.map(({ icon: Icon, title, sub }) => (
                <div
                  key={title}
                  className="bg-white border border-orange-100 rounded-xl p-2.5 text-center shadow-sm"
                >
                  <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-orange-200/70 flex items-center justify-center mb-1.5">
                    <Icon className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-[11px] font-bold text-stone-800 leading-tight">
                    {title}
                  </p>
                  <p className="text-[9.5px] text-stone-400 leading-tight mt-0.5">
                    {sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Trust row ── */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: ShieldCheck, label: "Verified Pandit" },
              { icon: HandHeart, label: "Samagri Included" },
              { icon: Home, label: "At Your Home" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-white border border-stone-100 rounded-xl py-2.5 flex flex-col items-center gap-1 shadow-sm"
              >
                <Icon className="w-4 h-4 text-orange-500" />
                <span className="text-[9.5px] font-semibold text-stone-500 leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Footer / ecosystem ── */}
          <footer className="pt-3 mt-2 border-t border-orange-100 text-[11px] text-stone-500 space-y-2">
            <p className="font-bold text-stone-700">PanditJiAtRequest</p>
            <p>1031, Tricity Trade Tower, Zirakpur, Punjab 140603, India</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <button
                onClick={() => navigate("/privacypolicy")}
                className="underline"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigate("/termsandconditions")}
                className="underline"
              >
                Terms
              </button>
              <a
                href="tel:+919056955311"
                className="inline-flex items-center gap-1"
              >
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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-100 max-w-md mx-auto shadow-lg">
          <div className="px-4 pt-2 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <span className="text-[9.5px] text-stone-400 font-semibold uppercase block leading-none">
                  Starting
                </span>
                <span className="text-[19px] font-extrabold text-orange-600">
                  ₹{price.toLocaleString("en-IN")}
                </span>
              </div>
              <button
                onClick={openBooking}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-[15px] py-3 rounded-xl shadow-md active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-orange-400 outline-none"
              >
                Book Pandit Ji
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] text-stone-400">
              <Lock className="w-3 h-3 text-emerald-500" />
              100% secure payment
            </div>
          </div>
        </div>
      </div>
    );
}
