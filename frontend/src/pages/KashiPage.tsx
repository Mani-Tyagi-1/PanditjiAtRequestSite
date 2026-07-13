import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    Check,
    ShieldCheck,
    BookOpen,
    Zap,
    Video,
    Users,
    Flame,
    Sparkles,
    ChevronRight,
    MessageCircle,
    CheckCircle2,
    Send,
} from "lucide-react";
import API_URL from "../utils/apiConfig";
import { useAuth } from "../context/AuthContext";
import SectionHeader from "../components/home/SectionHeader";

const KASHI_BG =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/ChatGPT%20Image%20Jun%2015,%202026,%2012_15_58%20PM%20(1).png";

// Click-to-chat support line (same number used across the site).
const WHATSAPP_URL =
    "https://wa.me/919056955311?text=" +
    encodeURIComponent("🙏 Namaste! I would like guidance on booking a Puja / Pandit Ji from Kashi.");

const normalizeIndianPhone = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (digits.length > 10 && digits.startsWith("91")) {
        digits = digits.slice(2);
    }
    return digits.slice(0, 10);
};

// Same shape already used by HomePage.tsx / BookPujaPage.tsx for `/fetch-all-poojas`.
type Pooja = {
    _id: string;
    poojaNameEng: string;
    poojaNameHindi?: string;
    poojaCardImage?: string;
    poojaPriceOnline?: number;
    poojaPriceOffline?: number;
    isFeatured?: boolean;
    featuredRank?: number;
};

// Same shape already used by PoojaByProblem.tsx for `/fetch-all-pooja-category`.
type Category = {
    _id: string;
    category_id: string;
    category_name_en: string;
    category_name_hin?: string;
    category_image?: string;
    isActive?: boolean;
};

// Same shape already used by Testimonials.tsx for `/fetch-all-testimonials`.
type Testimonial = {
    _id: string;
    user_name: string;
    user_testimonial: string;
    rating: number;
    address: string;
    image: string;
    isActive?: boolean;
};

const priceOf = (p: Pooja) => p.poojaPriceOnline || p.poojaPriceOffline || 0;

// Keyword match for Kashi-relevant sevas (case-insensitive).
const KASHI_SEVA_RE = /rudrabhishek|kaal sarp|mrityunjay|pitra|pitru|dosh|ganga aarti|abhishek|kashi|vishwanath/i;

// Desktop dark-hero content (md+ only). Stats are honest: one real figure
// ("50,000+ Devotees", already used across this codebase) + qualitative tiles.
const HERO_TRUST = [
    { icon: ShieldCheck, top: "Verified", bottom: "Kashi Pandits" },
    { icon: BookOpen, top: "Authentic", bottom: "Vedic Vidhi" },
    { icon: Zap, top: "Fast", bottom: "Confirmation" },
    { icon: Video, top: "Live", bottom: "Video Proof" },
];

const HERO_STATS = [
    { icon: Users, title: "50,000+ Devotees", sub: "Trust & Faith" },
    { icon: ShieldCheck, title: "Verified Pandits", sub: "100% Authentic" },
    { icon: Video, title: "Live or Video Proof", sub: "Every Ceremony" },
];

const HOW_IT_WORKS = [
    { step: "1", title: "Share Request", desc: "Tell us the puja or Pandit Ji you need from Kashi, along with name & gotra." },
    { step: "2", title: "Pandit Assigned", desc: "A verified Kashi Pandit Ji is matched to your ritual requirement." },
    { step: "3", title: "Puja Performed", desc: "The puja is performed with complete Vedic vidhi at the sacred temple." },
    { step: "4", title: "Proof Delivered", desc: "Watch live or receive video proof of your puja soon after completion." },
    { step: "5", title: "Prasad & Blessings", desc: "Sacred prasad from Kashi is delivered to your home." },
];

const WHY_CHOOSE = [
    "Verified Kashi Pandits, background checked & experienced",
    "Authentic Vedic Vidhi performed exactly per shastra",
    "Live or Video Proof of your puja, shared with you",
    "Sacred Prasad from Kashi delivered to your home",
    "Your name & gotra used in every sankalp",
];

function StarRow({ rating }: { rating: number }) {
    const stars = Math.min(Math.max(Math.floor(rating || 5), 0), 5);
    return (
        <div className="flex gap-0.5 shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
                <svg
                    key={i}
                    viewBox="0 0 20 20"
                    fill={i < stars ? "#FFB93A" : "none"}
                    stroke={i < stars ? "#FFB93A" : "#E2E8F0"}
                    strokeWidth={1.5}
                    className="w-3.5 h-3.5"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

export default function KashiPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [form, setForm] = useState({
        devoteeName: "",
        mobileNumber: normalizeIndianPhone(user?.phone || ""),
        email: user?.email || "",
        ritualDetails: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    // ── Desktop-only enrichment data (md:/lg: sections below the form) ──
    const [poojas, setPoojas] = useState<Pooja[]>([]);
    const [loadingPoojas, setLoadingPoojas] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loadingTestimonials, setLoadingTestimonials] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/fetch-all-poojas`)
            .then((res) => res.json())
            .then((data) => setPoojas(data?.poojas || []))
            .catch(() => { })
            .finally(() => setLoadingPoojas(false));

        fetch(`${API_URL}/fetch-all-pooja-category`)
            .then((res) => res.json())
            .then((data) => {
                const list: Category[] = Array.isArray(data?.poojaCategory)
                    ? data.poojaCategory
                    : Array.isArray(data)
                        ? data
                        : [];
                setCategories(list.filter((c) => c.isActive !== false && c.category_id !== "cat-9"));
            })
            .catch(() => { })
            .finally(() => setLoadingCategories(false));

        fetch(`${API_URL}/fetch-all-testimonials`)
            .then((res) => res.json())
            .then((data) => {
                const all: Testimonial[] = data?.success ? data.data : [];
                setTestimonials(all.filter((t) => t.isActive !== false));
            })
            .catch(() => { })
            .finally(() => setLoadingTestimonials(false));
    }, []);

    // Popular Kashi Sevas: keyword match on the real pooja catalog, padded with
    // isFeatured items so the row never looks broken if fewer than 3 match.
    const popularKashiSevas = useMemo(() => {
        const matches = poojas.filter(
            (p) => KASHI_SEVA_RE.test(p.poojaNameEng) || (p.poojaNameHindi ? KASHI_SEVA_RE.test(p.poojaNameHindi) : false)
        );
        let result = matches.slice(0, 6);
        if (result.length < 3) {
            const seen = new Set(result.map((p) => p._id));
            const padding = poojas.filter((p) => p.isFeatured && !seen.has(p._id));
            result = [...result, ...padding].slice(0, 6);
        }
        return result;
    }, [poojas]);

    const intentionCategories = useMemo(() => categories.slice(0, 7), [categories]);
    const kashiTestimonials = useMemo(() => testimonials.slice(0, 3), [testimonials]);

    const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        setError("");
        if (!form.devoteeName.trim()) {
            setError("Please enter the devotee's name.");
            return;
        }
        const mobileNumber = normalizeIndianPhone(form.mobileNumber);
        if (mobileNumber.length !== 10) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/kashi-requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    devoteeName: form.devoteeName.trim(),
                    mobileNumber,
                    email: form.email.trim(),
                    ritualDetails: form.ritualDetails.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to submit request.");

            // Meta Pixel Tracking
            if (window.fbq) {
                window.fbq("track", "Kashi Pandit Pooja Request", {
                    content_name: "Kashi Vishwanath Dham",
                    content_type: "kashi_request",
                });
            }

            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen font-sans overflow-hidden">
            <Helmet>
                <title>Kashi Vishwanath Dham | Pandit Ji At Request</title>
            </Helmet>

            {/* Sacred backdrop */}
            <div className="absolute inset-0 z-0">
                <img src={KASHI_BG} alt="Kashi" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#FBEAD0]/65 via-[#FFF6E9]/55 to-[#FFFAF3]/95" />
            </div>

            {/* Content above backdrop */}
            <div className="relative z-10">

            {/* Hero region — full-bleed dark photo hero at md+ (wrapper is style-inert on mobile) */}
            <div className="md:relative md:pb-12 lg:pb-16">

            {/* Desktop-only dark hero backdrop, self-contained so the sections below stay light */}
            <img
                src={KASHI_BG}
                alt=""
                aria-hidden="true"
                className="hidden md:block absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
            />
            <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 md:px-8 lg:px-10 md:pt-8 md:relative">
                <button
                    onClick={() => navigate("/home")}
                    className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer md:w-11 md:h-11 md:bg-white/15 md:border md:border-white/25 md:backdrop-blur-sm md:hover:bg-white/30"
                >
                    <ArrowLeft className="w-4.5 h-4.5 text-stone-700 md:w-5 md:h-5 md:text-white" />
                </button>
                <h1 className="text-[20px] font-bold text-stone-800 md:text-2xl md:tracking-tight md:text-white">Kashi Vishwanath Dham</h1>
                <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm text-orange-600 text-xl font-bold md:bg-white/15 md:border md:border-white/25 md:backdrop-blur-sm md:text-orange-300">
                    ॐ
                </span>
            </div>

            {/* Desktop split: mantra hero left, form right (style-inert on mobile) */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center lg:px-10 lg:w-full lg:mt-12 md:relative">

            {/* Desktop hero copy — replaces the mantra block at md+ */}
            <div className="hidden md:block md:mt-10 md:px-4 md:max-w-xl md:mx-auto md:w-full lg:mt-0 lg:px-0 lg:max-w-none lg:mx-0">
                <p className="text-[13px] lg:text-sm font-bold text-orange-300">
                    From the Holy Abode of Lord Kashi Vishwanath
                </p>
                <h2
                    className="mt-3 text-4xl lg:text-5xl font-bold text-white leading-tight"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                    Bring Kashi&apos;s <span className="text-orange-400">Divine Blessings</span> Home
                </h2>
                <p className="mt-4 text-[15px] text-white/85 leading-relaxed max-w-md">
                    Request authentic Vedic Pujas and Sevas in the sacred shrine of Kashi Vishwanath Dham.
                    Performed by verified Kashi Pandits with traditional vidhi, live darshan or video proof
                    and complete devotion.
                </p>

                {/* Trust chip bar */}
                <div className="mt-7 flex items-stretch divide-x divide-white/10 bg-black/40 border border-white/15 backdrop-blur rounded-2xl overflow-hidden">
                    {HERO_TRUST.map(({ icon: Icon, top, bottom }) => (
                        <div key={top} className="flex-1 flex items-center gap-2 px-3 lg:px-4 py-3">
                            <Icon className="w-4.5 h-4.5 text-orange-400 shrink-0" />
                            <span className="leading-tight min-w-0">
                                <span className="block text-[12px] font-bold text-white">{top}</span>
                                <span className="block text-[11px] text-white/70">{bottom}</span>
                            </span>
                        </div>
                    ))}
                </div>

                {/* Stats band — one real figure + qualitative tiles (no invented percentages) */}
                <div className="mt-4 grid grid-cols-3 divide-x divide-stone-100 bg-white rounded-2xl shadow-lg overflow-hidden">
                    {HERO_STATS.map(({ icon: Icon, title, sub }) => (
                        <div key={title} className="px-3 lg:px-4 py-3.5 flex flex-col items-center gap-1 text-center">
                            <Icon className="w-4.5 h-4.5 text-orange-500" />
                            <span className="text-[13px] font-bold text-stone-800 leading-tight">{title}</span>
                            <span className="text-[11px] text-stone-500 font-medium">{sub}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mantra (mobile — hidden at md+ where the desktop hero copy above renders) */}
            <div className="text-center px-6 mt-4 md:mt-8 lg:mt-0 lg:px-0 lg:text-left md:hidden">
                <h2 className="text-[30px] font-bold text-orange-700 md:text-4xl lg:text-[44px] xl:text-5xl md:tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    || हर हर महादेव ||
                </h2>
                <div className="flex items-center justify-center gap-2 my-2 text-amber-500 md:my-3 lg:justify-start">
                    <span className="h-px w-16 bg-amber-300 md:w-20" />◆<span className="h-px w-16 bg-amber-300 md:w-20" />
                </div>
                <p className="text-[13.5px] text-stone-600 leading-relaxed md:text-[15px] md:max-w-2xl md:mx-auto lg:mx-0 lg:text-base">
                    Bring the sacred blessings of Mahadev to your home. Invite verified Vedic Pandits from Kashi Ji
                    or book holy Poojas to be performed directly in Kashi.
                </p>
            </div>

            {/* Form card */}
            <div className="px-4 mt-5 md:mt-8 md:max-w-xl md:mx-auto md:w-full lg:mt-0 lg:max-w-none lg:px-0">
                {submitted ? (
                    <div className="bg-white rounded-3xl shadow-lg border border-orange-100 p-8 text-center md:p-10 md:rounded-[28px] md:shadow-xl">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                            <Check className="w-8 h-8 text-emerald-600" strokeWidth={3} />
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-stone-800" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            Request Received 🙏
                        </h3>
                        <p className="mt-2 text-[13px] text-stone-500 leading-relaxed">
                            Har Har Mahadev! Our team will contact you shortly on{" "}
                            <span className="font-semibold text-stone-700">+91 {form.mobileNumber}</span> to arrange your
                            Pooja / Pandit Ji from Kashi.
                        </p>
                        <button
                            onClick={() => navigate("/account?tab=direct")}
                            className="mt-6 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform cursor-pointer md:transition-all md:hover:shadow-lg md:hover:brightness-105"
                        >
                            View My Booking
                        </button>
                    </div>
                ) : (
                    <div className="bg-white/45 rounded-3xl shadow-lg border border-white/60 p-5 md:p-8 md:rounded-[28px] md:backdrop-blur-md md:shadow-xl md:bg-white/95">
                        {/* Card title */}
                        <div className="flex items-center justify-center gap-2">
                            <span className="w-9 h-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">🪔</span>
                            <h3 className="text-[18px] font-bold text-stone-800 md:text-[20px]">✦ Pooja &amp; Pandit Request ✦</h3>
                        </div>
                        <div className="flex items-center justify-center gap-2 my-3 text-amber-400">
                            <span className="h-px w-20 bg-amber-200" />◆<span className="h-px w-20 bg-amber-200" />
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            <Field icon={<User className="w-5 h-5 text-orange-500" />} label="Devotee Name">
                                <input
                                    value={form.devoteeName}
                                    onChange={(e) => update("devoteeName", e.target.value)}
                                    placeholder="Enter your full name"
                                    className={INPUT}
                                />
                            </Field>

                            <Field icon={<Phone className="w-5 h-5 text-orange-500" />} label="Mobile Number">
                                <input
                                    value={form.mobileNumber}
                                    onChange={(e) => update("mobileNumber", normalizeIndianPhone(e.target.value))}
                                    placeholder="10-digit mobile number"
                                    inputMode="numeric"
                                    className={INPUT}
                                />
                            </Field>

                            <Field icon={<Mail className="w-5 h-5 text-orange-500" />} label="Email Address (Optional)">
                                <input
                                    value={form.email}
                                    onChange={(e) => update("email", e.target.value)}
                                    placeholder="Enter email address"
                                    className={INPUT}
                                />
                            </Field>

                            <Field icon={<span className="text-orange-500 text-lg leading-none">🔱</span>} label="Ritual & Pooja Details">
                                <textarea
                                    value={form.ritualDetails}
                                    onChange={(e) => update("ritualDetails", e.target.value)}
                                    placeholder="Describe your ritual requirements (e.g., invite Kashi Pandit Ji to your home, or perform a specific Pooja in Kashi Ji)"
                                    rows={3}
                                    className={`${INPUT} resize-none`}
                                />
                            </Field>
                        </div>

                        {error && <p className="text-red-500 text-[12.5px] font-semibold text-center mt-3">{error}</p>}

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200/70 active:scale-95 transition-transform disabled:opacity-60 cursor-pointer md:mt-6 md:transition-all md:hover:shadow-xl md:hover:brightness-[1.03]"
                        >
                            🔱 {submitting ? "Submitting…" : "Request Pandit / Pooja Booking"}
                        </button>

                        <p className="hidden md:block mt-3 text-[11.5px] text-stone-400 text-center">
                            🔒 Your details are secure &amp; confidential
                        </p>
                    </div>
                )}
            </div>

            {/* end desktop split wrapper */}
            </div>

            {/* end hero region wrapper */}
            </div>

            {/* ── Popular Kashi Sevas ── */}
            <section className="hidden md:block md:px-8 lg:px-10 mt-14 lg:mt-20">
                <SectionHeader title="Popular Kashi Sevas" icon={Flame} subtitle="Widely requested rituals from the holy city" />
                <div className="mt-6 grid grid-cols-3 lg:grid-cols-6 gap-5">
                    {loadingPoojas
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden animate-pulse">
                                <div className="h-28 bg-stone-200" />
                                <div className="p-3 space-y-2">
                                    <div className="h-3 bg-stone-200 rounded w-3/4" />
                                    <div className="h-3.5 bg-stone-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))
                        : popularKashiSevas.map((p) => (
                            <button
                                key={p._id}
                                onClick={() => navigate(`/puja/${p._id}`)}
                                className="bg-white rounded-3xl border border-orange-100 shadow-sm text-left overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                            >
                                <div className="relative h-28 bg-gradient-to-br from-amber-300 via-orange-300 to-orange-400">
                                    {p.poojaCardImage && (
                                        <img src={p.poojaCardImage} alt={p.poojaNameEng} className="w-full h-full object-cover" loading="lazy" />
                                    )}
                                    {p.isFeatured && (
                                        <span className="absolute top-2 left-2 flex items-center gap-1 bg-white text-orange-600 text-[10.5px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            <Flame className="w-3 h-3 fill-orange-500 text-orange-500" /> Popular
                                        </span>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="text-[13px] font-bold text-stone-800 leading-tight line-clamp-2 min-h-[32px]">
                                        {p.poojaNameEng}
                                    </h3>
                                    <p className="mt-1 text-[14px] font-bold text-orange-600">₹{priceOf(p).toLocaleString("en-IN")}</p>
                                </div>
                            </button>
                        ))}
                    {!loadingPoojas && popularKashiSevas.length === 0 && (
                        <p className="col-span-full text-center text-stone-400 text-sm py-10">
                            No Kashi sevas found right now — check back soon!
                        </p>
                    )}
                </div>
            </section>

            {/* ── Book by Intention ── */}
            <section className="hidden md:block md:px-8 lg:px-10 mt-14 lg:mt-20">
                <SectionHeader title="Book by Intention" icon={Sparkles} subtitle="Choose the purpose of your Kashi seva" />
                <div className="mt-6 grid grid-cols-4 lg:grid-cols-7 gap-4">
                    {loadingCategories
                        ? Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 flex flex-col items-center gap-2 animate-pulse h-[100px]">
                                <div className="w-10 h-10 rounded-xl bg-stone-100" />
                                <div className="h-2.5 bg-stone-100 rounded w-3/4" />
                            </div>
                        ))
                        : intentionCategories.map((category) => (
                            <button
                                key={category._id}
                                onClick={() => navigate(`/category/${category._id}`, { state: { category } })}
                                className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 flex flex-col items-center gap-2 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-orange-200 cursor-pointer"
                            >
                                <span className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {category.category_image ? (
                                        <img
                                            src={category.category_image}
                                            alt={category.category_name_en}
                                            className="w-8 h-8 object-contain"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/category-images/category-images_1771234666851.png";
                                            }}
                                        />
                                    ) : (
                                        <Sparkles className="w-5 h-5 text-orange-500" />
                                    )}
                                </span>
                                <span className="text-[12.5px] font-bold text-stone-800 leading-tight line-clamp-2">
                                    {category.category_name_en}
                                </span>
                            </button>
                        ))}
                    {!loadingCategories && intentionCategories.length === 0 && (
                        <p className="col-span-full text-center text-stone-400 text-sm py-10">No categories found.</p>
                    )}
                </div>
            </section>

            {/* ── How It Works ── */}
            <section className="hidden md:block md:px-8 lg:px-10 mt-14 lg:mt-20">
                <SectionHeader title="How It Works" icon={Send} subtitle="From request to blessings, in 5 simple steps" />
                <div className="mt-6 grid grid-cols-5 gap-5">
                    {HOW_IT_WORKS.map((s, i) => (
                        <div key={s.step} className="relative bg-white rounded-2xl border border-orange-100 shadow-sm p-5 text-center">
                            <span className="w-9 h-9 mx-auto rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold flex items-center justify-center text-sm">
                                {s.step}
                            </span>
                            <h3 className="mt-3 text-[14px] font-bold text-stone-800">{s.title}</h3>
                            <p className="mt-1.5 text-[12px] text-stone-500 leading-relaxed">{s.desc}</p>
                            {i < HOW_IT_WORKS.length - 1 && (
                                <ChevronRight className="hidden lg:block absolute top-1/2 -right-3.5 -translate-y-1/2 w-4 h-4 text-orange-200" />
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Why Choose Kashi Pandits + What Devotees Say ── */}
            <section className="hidden md:block md:px-8 lg:px-10 mt-14 lg:mt-20">
                <SectionHeader title="Why Choose Kashi Pandits" icon={ShieldCheck} subtitle="What devotees can always expect" />
                <div className="mt-6 grid grid-cols-2 gap-8 lg:gap-12 items-start">
                    {/* Checklist */}
                    <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 lg:p-8 space-y-4">
                        {WHY_CHOOSE.map((item) => (
                            <div key={item} className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-[14px] text-stone-700 leading-relaxed">{item}</p>
                            </div>
                        ))}
                    </div>

                    {/* Testimonials — real fetch, sliced to 3, no invented reviewers */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-stone-800">What Devotees Say</h3>
                        {loadingTestimonials ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="bg-white border border-orange-100 rounded-2xl p-4 h-24 animate-pulse" />
                            ))
                        ) : kashiTestimonials.length > 0 ? (
                            kashiTestimonials.map((t) => {
                                const initials = t.user_name
                                    ? t.user_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                                    : "D";
                                return (
                                    <div key={t._id} className="bg-white border border-orange-200/50 rounded-2xl p-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {t.image ? (
                                                    <img
                                                        src={t.image}
                                                        alt={t.user_name}
                                                        className="w-9 h-9 rounded-full object-cover shrink-0"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = "none";
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="w-9 h-9 rounded-full bg-[#FFEAD8] flex items-center justify-center text-[#E25800] font-bold text-[13px] shrink-0">
                                                        {initials}
                                                    </span>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-[13.5px] font-bold text-stone-800 truncate">{t.user_name}</p>
                                                    <p className="text-[11px] text-stone-400 truncate">{t.address}</p>
                                                </div>
                                            </div>
                                            <StarRow rating={t.rating} />
                                        </div>
                                        <p className="mt-2 text-[13px] text-stone-600 leading-relaxed line-clamp-3">{t.user_testimonial}</p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-stone-400 text-sm">Devotee reviews coming soon.</p>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Closing CTA banner ── */}
            <section className="hidden md:block md:px-8 lg:px-10 mt-14 lg:mt-20">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-[32px] p-8 lg:p-12 flex items-center justify-between gap-8 shadow-xl shadow-orange-200/50">
                    <div>
                        <h3
                            className="text-xl lg:text-2xl font-bold text-white"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            Need Guidance? Consult a Kashi Expert Pandit Ji
                        </h3>
                        <p className="mt-1.5 text-[13.5px] text-white/85">
                            Get personalised remedies &amp; rituals guidance directly from our Pandit Ji.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => navigate("/paid-consultation")}
                            className="bg-white text-orange-600 font-bold px-6 py-3 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                        >
                            Consult Now
                        </button>
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                                if (window.fbq) {
                                    window.fbq("track", "Contact", {
                                        content_name: "WhatsApp Chat",
                                        content_type: "kashi_page",
                                    });
                                }
                            }}
                            className="flex items-center gap-2 bg-white/15 border border-white/40 text-white font-bold px-6 py-3 rounded-2xl transition-all duration-300 hover:bg-white/25 cursor-pointer"
                        >
                            <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
                        </a>
                    </div>
                </div>
            </section>

            <div className="h-6 md:h-16 lg:h-24" />
            </div>
        </div>
    );
}

const INPUT =
    "w-full bg-transparent text-[15px] font-bold text-stone-800 placeholder:text-[14px] placeholder:font-medium placeholder:text-stone-400 focus:outline-none md:text-base";

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 bg-white border border-stone-200 rounded-2xl px-4 py-3 md:px-5 md:py-3.5 md:transition-colors md:hover:border-orange-200 md:focus-within:border-orange-300">
            <span className="mt-1 shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
                <span className="block text-[11.5px] font-semibold text-stone-400 md:text-xs">{label}</span>
                {children}
            </div>
        </div>
    );
}
