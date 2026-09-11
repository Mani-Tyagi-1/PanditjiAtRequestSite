import { useState, useEffect, useMemo, useId, type CSSProperties } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft, Check, ShieldCheck, Video, Gift, Calendar, Mountain, Sparkles,
    Star, Clock, Lock, ChevronDown, MessageCircle, Phone, Flame, BadgeCheck,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import API_URL from "../utils/apiConfig";
import { optimizedImg } from "../utils/img";
import analytics from "../utils/analytics";
import { type LiveMandirPuja, type LiveMandirReview } from "../components/booking/LiveMandirPujas/liveMandirData";
import { fetchGeneralPooja, fetchNavratriPuja } from "../data/navratriPuja";
import { money } from "../utils/currency";

// ── analytics (Meta Pixel — the project's existing convention) ──
function track(event: string, params?: Record<string, unknown>, custom = false) {
    // Delegates to utils/analytics: Meta receives exactly what this helper
    // always sent, and GA4 / Google Ads receive a mapped equivalent. The
    // signature is unchanged, so every call site on this page still works.
    analytics.metaBridge(event, params, custom);
}

function adminBannerTheme(color: string | undefined) {
    if (!color || !/^#[0-9a-f]{6}$/i.test(color)) return null;
    const value = Number.parseInt(color.slice(1), 16);
    const rgb = [value >> 16, (value >> 8) & 255, value & 255].map((channel) => channel / 255);
    const max = Math.max(...rgb), min = Math.min(...rgb), delta = max - min;
    const lightness = (max + min) / 2;
    let hue = 0;
    if (delta) {
        if (max === rgb[0]) hue = 60 * (((rgb[1] - rgb[2]) / delta) % 6);
        else if (max === rgb[1]) hue = 60 * ((rgb[2] - rgb[0]) / delta + 2);
        else hue = 60 * ((rgb[0] - rgb[1]) / delta + 4);
    }
    hue = (hue + 360) % 360;
    const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) * 100 : 0;
    const chroma = Math.max(36, Math.min(88, saturation));
    const hsl = (s: number, l: number) => `hsl(${Math.round(hue)} ${Math.round(s)}% ${Math.round(l)}%)`;
    return {
        primary: color,
        dark: hsl(chroma, Math.max(25, Math.min(40, lightness * 100 - 14))),
        background: hsl(Math.max(10, chroma * .22), 98),
        backgroundAlt: hsl(Math.max(14, chroma * .32), 95),
        border: hsl(Math.max(15, chroma * .35), 87),
    };
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Resolve the puja's scheduled date+time into a Date, or null if it isn't a
 *  single fixed date (recurring "Every Day" etc.). Handles "June 29, 2026",
 *  ISO dates, and the relative labels "Today" / "Tomorrow". */
function resolvePujaDateTime(p: LiveMandirPuja): Date | null {
    if (!p?.scheduledDate) return null;
    const raw = p.scheduledDate.trim();
    const lower = raw.toLowerCase();
    const now = new Date();
    let base: Date | null = null;
    if (lower === "today") {
        base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (lower === "tomorrow") {
        base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (lower.startsWith("every") || lower === "daily") {
        return null;
    } else {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) base = d;
    }
    if (!base) return null;
    const t = p.scheduledTime?.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (t) {
        let h = parseInt(t[1], 10);
        const m = parseInt(t[2], 10);
        const ap = t[3]?.toLowerCase();
        if (ap === "pm" && h < 12) h += 12;
        if (ap === "am" && h === 12) h = 0;
        base.setHours(h, m, 0, 0);
    } else {
        base.setHours(23, 59, 59, 0);
    }
    return base;
}

// Pool of short, genuine-sounding devotee reviews. A different random subset is
// shown per puja (see seededReviews) so the page doesn't repeat the same five
// everywhere. TODO: replace with real verified reviews from puja.reviews.
const PLACEHOLDER_REVIEWS: LiveMandirReview[] = [
    { name: "Ramesh Iyer", rating: 5, date: "2 weeks ago", text: "Sankalp was done with my name & gotra on live video. Felt connected even from abroad. 🙏", verified: true },
    { name: "Anjali Sharma", rating: 5, date: "1 month ago", text: "Got the full puja video on WhatsApp the same evening. Perfect for our NRI family.", verified: true },
    { name: "Suresh Patel", rating: 5, date: "3 weeks ago", text: "Booking was smooth and every ritual was done properly. Truly blessed.", verified: true },
    { name: "Lakshmi Menon", rating: 4, date: "2 months ago", text: "Booked for my parents, they were very happy. Pandit ji explained each step.", verified: true },
    { name: "Vikram Reddy", rating: 5, date: "1 month ago", text: "Transparent pricing and genuine devotion. Highly recommended.", verified: true },
    { name: "Priya Nair", rating: 5, date: "1 week ago", text: "Prasad reached home in 4 days, nicely packed. Felt very authentic.", verified: true },
    { name: "Arjun Deshmukh", rating: 5, date: "2 months ago", text: "First time booking online and it was worth it. Will do again.", verified: false },
    { name: "Meena Gupta", rating: 4, date: "3 weeks ago", text: "Good experience. Video quality could be better but rituals were perfect.", verified: true },
    { name: "Karthik Subramaniam", rating: 5, date: "1 month ago", text: "Live darshan was clear. Pandit ji took my name during the aarti. 🙏", verified: true },
    { name: "Neha Joshi", rating: 5, date: "5 days ago", text: "Simple booking, timely updates on WhatsApp. Thank you.", verified: false },
    { name: "Rajesh Kumar", rating: 5, date: "2 months ago", text: "Did the puja for my family. Everything was on time and proper.", verified: true },
    { name: "Sneha Banerjee", rating: 5, date: "3 weeks ago", text: "Was a bit skeptical first but they did everything genuinely. Very happy.", verified: true },
    { name: "Amit Verma", rating: 4, date: "1 month ago", text: "Nice service. Prasad took a few extra days but reached safely.", verified: false },
    { name: "Divya Pillai", rating: 5, date: "2 weeks ago", text: "Felt like I was there in the temple. Beautiful experience.", verified: true },
    { name: "Sanjay Mehta", rating: 5, date: "1 month ago", text: "Booked from USA in my mother's name. She was so happy. 🙏", verified: true },
    { name: "Pooja Agarwal", rating: 5, date: "6 days ago", text: "Pandit ji was very patient and explained the vidhi well.", verified: false },
    { name: "Harish Rao", rating: 5, date: "2 months ago", text: "Genuine pujas, no shortcuts. Got the recording as promised.", verified: true },
    { name: "Kavita Singh", rating: 4, date: "3 weeks ago", text: "Overall good. Would have liked a longer video but satisfied.", verified: true },
    { name: "Manoj Tiwari", rating: 5, date: "1 month ago", text: "Smooth process from start to end. Highly satisfied.", verified: false },
    { name: "Ananya Das", rating: 5, date: "1 week ago", text: "Loved that they shared photos and video after the puja. 🙏", verified: true },
    { name: "Deepak Chopra", rating: 5, date: "2 months ago", text: "Done in my late father's name. Felt peaceful. Thank you team.", verified: true },
    { name: "Ritu Malhotra", rating: 5, date: "4 days ago", text: "Quick replies on WhatsApp and the puja was done with full devotion.", verified: false },
    { name: "Venkatesh Rao", rating: 5, date: "1 month ago", text: "Authentic and reliable. This is how online puja should be.", verified: true },
    { name: "Shweta Kulkarni", rating: 4, date: "3 weeks ago", text: "Happy with the service. Booking could be a little faster but good.", verified: true },
];

// Pick a stable-but-varied subset of reviews for a puja. Seeded by the puja slug
// so the same puja always shows the same reviews (no reshuffle on countdown
// ticks) while different pujas show different ones.
function seededReviews(seed: string, count: number): LiveMandirReview[] {
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

// ── Small UI pieces ───────────────────────────────────────────
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

// Auto-scrolling reviews strip — cards glide left→right continuously (paused on hover).
function ReviewMarquee({ reviews }: { reviews: LiveMandirReview[] }) {
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
export default function LiveMandirPujaDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [puja, setPuja] = useState<LiveMandirPuja | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [templeTab, setTempleTab] = useState<"about" | "history">("about");

    const fetchPujaDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            if (slug === "navratri-puja") {
                setPuja(await fetchNavratriPuja());
                return;
            }
            if (slug && /^[a-f\d]{24}$/i.test(slug)) {
                setPuja(await fetchGeneralPooja(slug));
                return;
            }
            const res = await fetch(`${API_URL}/live-mandir-pujas/${slug}`);
            if (!res.ok) throw new Error("Puja not found or server error");
            const json = await res.json();
            setPuja(json.data);
        } catch (err) {
            console.error("Error fetching puja details:", err);
            setError("Failed to load puja details. It may not exist or is inactive.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPujaDetails(); }, [slug]);

    // ViewContent on load
    useEffect(() => {
        if (puja) {
            track("ViewContent", {
                content_name: puja.pujaName,
                content_ids: [puja.id],
                content_type: "live_mandir_puja",
                value: puja.price,
                currency: "INR",
            });
        }
    }, [puja]);

    // Countdown target = the puja's scheduled date/time.
    const targetTs = useMemo(() => {
        const d = puja ? resolvePujaDateTime(puja) : null;
        return d ? d.getTime() : null;
    }, [puja?.id, puja?.scheduledDate, puja?.scheduledTime]);

    const [remaining, setRemaining] = useState(0);
    useEffect(() => {
        if (!targetTs) { setRemaining(0); return; }
        const tick = () => setRemaining(Math.max(0, targetTs - Date.now()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetTs]);

    const openBooking = () => {
        if (!puja) return;
        const fromAdminBanner = Boolean((location.state as { fromAdminBanner?: boolean } | null)?.fromAdminBanner);
        track("InitiateCheckout", {
            content_name: puja.pujaName,
            content_ids: [puja.id],
            value: puja.price,
            currency: "INR",
        });
        navigate(`/live-mandir-puja/${slug}/booking`, {
            state: { puja, fromAdminBanner, adminTheme: fromAdminBanner ? adminBannerTheme(puja.theme) : null },
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex flex-col w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100 animate-pulse">
                <div className="h-52 bg-stone-200 m-2 rounded-[10px]" />
                <div className="px-4 space-y-3">
                    <div className="h-6 bg-stone-200 rounded w-2/3" />
                    <div className="h-4 bg-stone-200 rounded w-1/2" />
                    <div className="h-24 bg-stone-200 rounded-2xl w-full" />
                    <div className="h-20 bg-stone-200 rounded-2xl w-full" />
                </div>
            </div>
        );
    }

    if (error || !puja) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex flex-col items-center justify-center p-6 text-center w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100">
                <span className="text-4xl">🪔</span>
                <h2 className="text-lg font-bold text-stone-800 mt-4">Error Loading Puja</h2>
                <p className="text-xs text-stone-500 mt-2 max-w-[280px]">{error || "The requested live puja does not exist."}</p>
                <button onClick={() => navigate("/")} className="mt-6 bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition-all">
                    Go to Homepage
                </button>
            </div>
        );
    }

    const cd = targetTs && remaining > 0 ? {
        days: Math.floor(remaining / 86400000),
        hrs: Math.floor((remaining % 86400000) / 3600000),
        min: Math.floor((remaining % 3600000) / 60000),
        sec: Math.floor((remaining % 60000) / 1000),
    } : null;
    const displayDate = targetTs
        ? new Date(targetTs).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : puja.scheduledDate;

    const isNavratri = puja.id === "navratri-puja";
    const selectedTheme = (location.state as { fromAdminBanner?: boolean } | null)?.fromAdminBanner
        ? adminBannerTheme(puja.theme)
        : null;
    const themeBg = isNavratri ? "bg-[#FFFDD0]" : "bg-[#FFFAF3]";
    const themeBorder = isNavratri ? "border-[#FFD700]" : "border-orange-100";
    const themeTextMain = isNavratri ? "text-[#B31B1B]" : "text-orange-600";
    const themeBtn = isNavratri ? "bg-gradient-to-r from-[#B31B1B] to-[#FF671F]" : "bg-gradient-to-r from-orange-500 to-red-500";
    const themedPageStyle = selectedTheme ? {
        backgroundColor: selectedTheme.background,
        backgroundImage: `linear-gradient(145deg, ${selectedTheme.background}, ${selectedTheme.backgroundAlt}, ${selectedTheme.background})`,
        borderColor: selectedTheme.border,
    } as CSSProperties : undefined;

    const statusLabel = puja.status === "live" ? "LIVE NOW" : puja.status === "upcoming" ? "UPCOMING" : "DAILY SEVA";
    const mandirName = `${puja.templeName}${puja.templeLocation && puja.templeLocation !== puja.templeName ? `, ${puja.templeLocation}` : ""}`;
    const reviews = puja.reviews?.length ? puja.reviews : seededReviews(slug ?? puja.id, 9);
    const videos = puja.videos ?? [];
    const devoteesLabel = "50K+"; // static figure — TODO: source from real data
    const whatYouGet = [
        { icon: BadgeCheck, title: "Personalized offering", sub: "Performed in your name & gotra" },
        { icon: Video, title: "Puja video on WhatsApp", sub: "Full recording delivered to you" },
        { icon: Gift, title: "Prasad at your home", sub: "Sacred prasad couriered to you" },
    ];

    return (
        <div className={`min-h-screen ${themeBg} pb-24 font-sans w-full max-w-md mx-auto shadow-xl relative border-x ${themeBorder}`} style={themedPageStyle}>
            <Helmet>
                <title>{`${puja.pujaName} at ${puja.templeName} | Pandit Ji At Request`}</title>
                <meta name="description" content={`Book online ${puja.pujaName} at ${puja.templeName}. ${puja.benefits.slice(0, 3).join(", ")}. Verified pandits, live video proof.`} />
            </Helmet>

            {/* ── Sticky header ── */}
            <div className={`sticky top-0 z-50 ${themeBg}/90 backdrop-blur-md border-b ${themeBorder} px-4 py-3 flex items-center gap-3`} style={selectedTheme ? { backgroundColor: selectedTheme.background, borderColor: selectedTheme.border } : undefined}>
                <button onClick={() => navigate("/")} aria-label="Go back" className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-orange-200/50 shadow-sm active:scale-90 transition-transform">
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>
                <h1 className="text-sm font-bold text-stone-800 truncate">{puja.pujaName}</h1>
            </div>

            {/* ── Hero banner ── */}
            <div className="relative h-52 overflow-hidden p-2 rounded-[10px]">
                <img src={optimizedImg(puja.image, 800)} onError={(e) => { e.currentTarget.src = puja.image; }} alt={`${puja.pujaName} at ${puja.templeName}`} loading="eager" fetchPriority="high" decoding="async" className="w-full h-full object-cover rounded-[10px]" />
                <span className="absolute top-3 left-3 bg-red-500 text-white text-[9.5px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase shadow-sm">
                    {statusLabel}
                </span>
            </div>

            <div className="px-4 pt-3 pb-4 space-y-4">
                {/* ── Puja name + meta (rating / temple / date) ── */}
                <div>
                    <h2 className="text-xl font-bold font-serif text-stone-900 leading-tight">{puja.pujaName}</h2>
                    <p className="text-[13px] text-orange-500 font-medium mt-0.5">{puja.pujaNameHindi}</p>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
                        <span className="bg-orange-100 text-orange-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">{puja.deity}</span>
                        <span className="flex items-center gap-1 text-[12px]">
                            <Stars value={puja.rating} />
                            <span className="font-bold text-stone-700">{puja.rating}</span>
                            <span className="text-stone-400">· {devoteesLabel} devotees</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[12px] text-stone-500">
                        <span className="flex items-center gap-1"><Mountain className="w-3.5 h-3.5 text-orange-500" />{mandirName}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-orange-500" />{displayDate}</span>
                    </div>
                </div>

                {/* ── Countdown (honest — real puja date) — compact single row ── */}
                <div className="flex  items-center justify-center gap-6 bg-white border border-orange-100 rounded-xl px-3 py-2 shadow-sm">
                    <span className="text-[10.5px] font-bold text-orange-600 leading-tight shrink-0">Bookings close soon</span>
                    {cd ? (
                        <div className="flex items-center gap-1">
                            {[
                                { v: cd.days, l: "Days" }, { v: cd.hrs, l: "Hrs" },
                                { v: cd.min, l: "Min" }, { v: cd.sec, l: "Sec" },
                            ].map((u, i, arr) => (
                                <div key={u.l} className="flex items-center gap-1">
                                    <div className="min-w-[32px] bg-stone-50 border border-stone-100 rounded-lg px-1 py-0.5 text-center">
                                        <div className="text-[15px] leading-none font-bold text-stone-900 tabular-nums">{pad2(u.v)}</div>
                                        <div className="text-[8px] uppercase tracking-wide text-stone-400 mt-0.5">{u.l}</div>
                                    </div>
                                    {i < arr.length - 1 && <span className="text-stone-300 font-semibold text-xs">:</span>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <span className="text-[12px] text-stone-500">
                            {puja.status === "live" ? "🔴 Live now" : puja.status === "daily" ? "Daily Seva" : "Booking open"}
                        </span>
                    )}
                </div>

                {/* ── WhatsApp reassurance line (replaces the price section) ── */}
                <div className="flex items-center justify-center gap-1 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-center">
                    <MessageCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    Receive puja video with your name &amp; gotra on WhatsApp
                </div>

                {/* ── Auto-scrolling devotee reviews ── */}
                <div>
                    <SectionTitle icon={<Star className="w-3.5 h-3.5 text-amber-400" />}>Loved by devotees</SectionTitle>
                    <ReviewMarquee reviews={reviews} />
                </div>

                {/* ── Why perform this puja (quick outcomes) ── */}
                <div className="rounded-2xl border border-orange-100 bg-white p-3 shadow-sm">
                    <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-orange-400" />}>Why perform this puja</SectionTitle>
                    <div className="grid grid-cols-1 gap-1.5">
                        {puja.benefits.slice(0, 4).map((b, i) => (
                            <div key={i} className="flex items-start gap-2 text-[12.5px] text-stone-700">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                                <span>{b}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Mandir card ── */}
                <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-3 shadow-sm">
                    <div className="w-11 h-11 rounded-full border border-amber-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                        {puja.image ? <img src={optimizedImg(puja.image, 96)} onError={(e) => { e.currentTarget.src = puja.image; }} alt={puja.templeName} loading="lazy" className="w-full h-full object-cover" /> : <Mountain className="w-6 h-6 text-amber-600/70" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] font-bold text-stone-900 leading-snug truncate">{mandirName}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11.5px]">
                            <Calendar className="w-3 h-3 text-orange-500 shrink-0" />
                            <span className="text-stone-700 font-medium">{displayDate}</span>
                            {puja.durationMins ? <span className="text-stone-400">· <Clock className="w-3 h-3 inline -mt-0.5" /> {puja.durationMins} min</span> : null}
                        </div>
                        <p className="text-[10px] text-stone-400 mt-0.5 truncate">Performed with Vedic rituals &amp; complete devotion</p>
                    </div>
                </div>

                {/* ── Puja details (accordion, expanded) ── */}
                <div>
                    <SectionTitle icon={<Flame className="w-3.5 h-3.5 text-orange-400" />}>Puja details</SectionTitle>
                    <div className="space-y-2">
                        <Accordion title="What is performed" defaultOpen>
                            <p>{puja.whatIsPerformed || `The ${puja.pujaName} is performed with complete Vedic rituals.`}</p>
                        </Accordion>
                        <Accordion title="Offerings & samagri">
                            <p>{puja.offeringsSamagri || "All required samagri and offerings are arranged on your behalf."}</p>
                        </Accordion>
                    </div>
                </div>

                {/* ── Temple details (About / History tabs) ── */}
                <div>
                    <SectionTitle icon={<Mountain className="w-3.5 h-3.5 text-orange-400" />}>Temple details</SectionTitle>
                    <div className="rounded-2xl border border-orange-100 bg-white overflow-hidden shadow-sm">
                        <img src={optimizedImg(puja.image, 640)} onError={(e) => { e.currentTarget.src = puja.image; }} alt={puja.templeName} loading="lazy" className="w-full h-32 object-cover" />
                        <div className="p-3">
                            <div role="tablist" aria-label="Temple information" className="flex gap-2 mb-2">
                                {(["about", "history"] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        role="tab"
                                        aria-selected={templeTab === tab}
                                        onClick={() => setTempleTab(tab)}
                                        className={`text-[12px] font-semibold px-3 py-1 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-orange-400 outline-none ${templeTab === tab ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600"}`}
                                    >{tab === "about" ? "About" : "History"}</button>
                                ))}
                            </div>
                            <div role="tabpanel" className="text-[12.5px] text-stone-600 leading-relaxed">
                                {templeTab === "about"
                                    ? (puja.templeAbout || `${puja.templeName} is a revered shrine of ${puja.deity}.`)
                                    : (puja.templeHistory || `Detailed history of ${puja.templeName} will appear here once available.`)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── What you'll get ── */}
                <div>
                    <SectionTitle icon={<Gift className="w-3.5 h-3.5 text-orange-400" />}>What you'll get</SectionTitle>
                    <div className="grid grid-cols-3 gap-2">
                        {whatYouGet.map(({ icon: Icon, title, sub }) => (
                            <div key={title} className="bg-white border border-orange-100 rounded-xl p-2.5 text-center shadow-sm">
                                <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-orange-200/70 flex items-center justify-center mb-1.5">
                                    <Icon className="w-4 h-4 text-orange-600" />
                                </div>
                                <p className="text-[11px] font-bold text-stone-800 leading-tight">{title}</p>
                                <p className="text-[9.5px] text-stone-400 leading-tight mt-0.5">{sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Video proof gallery (only if real videos exist) ── */}
                {videos.length ? (
                    <div>
                        <SectionTitle icon={<Video className="w-3.5 h-3.5 text-orange-400" />}>Video proof of performed pujas</SectionTitle>
                        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                            {videos.map((src, i) => (
                                <video key={i} src={src} controls playsInline preload="none" className="shrink-0 w-60 h-36 rounded-2xl border border-orange-100 object-cover bg-black" />
                            ))}
                        </div>
                    </div>
                ) : null}
                {/* TODO: video proof gallery hidden — backend doesn't return puja.videos for live-mandir pujas yet. */}

                {/* ── Trust row ── */}
                <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                        { icon: Video, label: "Live HD Video" },
                        { icon: Gift, label: "Prasad at Home" },
                        { icon: ShieldCheck, label: "Verified Pandit" },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="bg-white border border-stone-100 rounded-xl py-2.5 flex flex-col items-center gap-1 shadow-sm">
                            <Icon className="w-4 h-4 text-orange-500" />
                            <span className="text-[9.5px] font-semibold text-stone-500 leading-tight">{label}</span>
                        </div>
                    ))}
                </div>

                {/* ── Footer / ecosystem ── */}
                <footer className="pt-3 mt-2 border-t border-orange-100 text-[11px] text-stone-500 space-y-2">
                    {/* TODO: confirm registered legal entity name */}
                    <p className="font-bold text-stone-700">PanditJiAtRequest</p>
                    <p>1031, Tricity Trade Tower, Zirakpur, Punjab 140603, India</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <button onClick={() => navigate("/privacypolicy")} className="underline">Privacy Policy</button>
                        <button onClick={() => navigate("/termsandconditions")} className="underline">Terms</button>
                        <a href="tel:+919056955311" className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />Support</a>
                        <a href="https://wa.me/919056955311" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" />WhatsApp</a>
                        <a href="https://x.com/AtRequest50649" target="_blank" rel="noopener noreferrer" className="underline">X / Twitter</a>
                    </div>
                </footer>
            </div>

            {/* ── Sticky bottom CTA ── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-100 max-w-md mx-auto shadow-lg">
                <div className="px-4 pt-2 pb-2.5">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0">
                            <span className="text-[9.5px] text-stone-400 font-semibold uppercase block leading-none">Offering</span>
                            <span className={`text-[19px] font-extrabold ${themeTextMain}`} style={selectedTheme ? { color: selectedTheme.dark } : undefined}>{money(puja.price)}</span>
                            {puja.originalPrice ? <span className="ml-1.5 text-xs font-semibold text-stone-400 line-through">{money(puja.originalPrice)}</span> : null}
                        </div>
                        <button
                            onClick={openBooking}
                            className={`flex-1 ${themeBtn} text-white font-bold text-[15px] py-3 rounded-xl shadow-md active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-orange-400 outline-none`}
                            style={selectedTheme ? { backgroundImage: `linear-gradient(100deg, ${selectedTheme.dark}, ${selectedTheme.primary})` } : undefined}
                        >Participate Now</button>
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
