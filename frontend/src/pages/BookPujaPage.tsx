import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
    ArrowLeft,
    Home as HomeIcon,
    Landmark,
    Star,
    MapPin,
    ShieldCheck,
    Video,
    Users,
    MessageCircle,
    Sparkles,
    Search,
    ChevronLeft,
    ChevronRight,
    Phone,
    Gift,
    IndianRupee,
    SlidersHorizontal,
    CalendarDays,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    Flame,
    Radio,
} from "lucide-react";
import API_URL from "../utils/apiConfig";

// Click-to-chat support line (same number used across the site / schema).
const WHATSAPP_URL =
    "https://wa.me/919056955311?text=" +
    encodeURIComponent("🙏 Namaste! I have a question about a Live Mandir Puja booking.");

// Same support number, distinct pre-filled message — same pattern used across
// this codebase (AppLayout.tsx / SiteFooter.tsx / DesktopHeader.tsx each keep
// their own page-relevant WhatsApp text with the identical number).
const HELP_WHATSAPP_URL =
    "https://wa.me/919056955311?text=" +
    encodeURIComponent("🙏 Namaste! I need help choosing the right puja for my needs.");
const SUPPORT_TEL = "tel:+919056955311";

type CategoryRef = { name?: string };
type Pooja = {
    _id: string;
    poojaNameEng: string;
    poojaNameHindi?: string;
    poojaCardImage?: string;
    poojaPriceOnline?: number;
    poojaPriceOffline?: number;
    mainCategories?: CategoryRef[];
    subCategories?: CategoryRef[];
    isFeatured?: boolean;
    featuredRank?: number;
};
type Category = {
    _id: string;
    category_id: string;
    category_name_en: string;
    category_name_hin?: string;
    category_image?: string;
};
type LivePuja = {
    id: string;
    pujaName: string;
    pujaNameHindi?: string;
    templeName: string;
    templeLocation?: string;
    deity?: string;
    image: string;
    status: "live" | "upcoming" | "daily";
    scheduledDate?: string;
    scheduledTime?: string;
    price: number;
    originalPrice?: number;
    rating?: number;
    devoteesJoined?: number;
    benefits?: string[];
};

type Tab = "home" | "mandir" | "problem" | "festival";
const VALID_TABS: readonly Tab[] = ["home", "mandir", "problem", "festival"];
function normalizeTab(value: string | null): Tab {
    return (VALID_TABS as readonly string[]).includes(value || "") ? (value as Tab) : "home";
}

// Small, honest, generic puja FAQ — copied verbatim from the same 4 questions
// already shown in components/home/FAQSection.tsx (kept in sync there).
const COMMON_QUESTIONS = [
    {
        question: "Do you provide puja samagri (materials) along with the priest?",
        answer: "Yes. If your booking includes samagri, our team will arrange it and the priest will bring it.",
    },
    {
        question: "What are the payment options available?",
        answer: "We accept various payment methods including UPI, credit/debit cards, net banking, and cash on delivery.",
    },
    {
        question: "How much advance notice is required for booking?",
        answer: "We recommend booking at least 24-48 hours in advance to ensure availability of priests and materials.",
    },
    {
        question: "Can I reschedule my booking?",
        answer: "Yes, you can reschedule your booking up to 6 hours before the scheduled time without any additional charges.",
    },
];

export default function BookPujaPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tab, setTab] = useState<Tab>(() => normalizeTab(searchParams.get("tab")));

    // The desktop header's "Book Puja ▾" dropdown links to /book-puja?tab=...
    // via client-side <Link> navigation, which updates the query string WITHOUT
    // remounting this page (same route element). Reacting to searchParams here
    // (not just reading it once in the initializer above) is what makes those
    // dropdown links actually switch the visible tab when already on this page.
    useEffect(() => {
        const next = normalizeTab(searchParams.get("tab"));
        setTab((prev) => (prev === next ? prev : next));
    }, [searchParams]);

    const goToTab = (next: Tab) => {
        setSearchParams(
            (prev) => {
                const params = new URLSearchParams(prev);
                params.set("tab", next);
                return params;
            },
            { replace: true }
        );
    };

    const [poojas, setPoojas] = useState<Pooja[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCat, setActiveCat] = useState<string>("All");
    const [loadingHome, setLoadingHome] = useState(true);

    const [livePujas, setLivePujas] = useState<LivePuja[]>([]);
    const [loadingLive, setLoadingLive] = useState(true);

    // Desktop-only additive UI state (hero search, sidebar filters, carousel, FAQ).
    // None of this affects the mobile tree — everything built from it below is
    // wrapped in hidden md:.../hidden lg:... containers.
    const [heroSearch, setHeroSearch] = useState("");
    const [maxPrice, setMaxPrice] = useState<number | null>(null);
    const [heroIndex, setHeroIndex] = useState(0);
    const [faqOpen, setFaqOpen] = useState<number | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    // Set by the hero search when it needs to switch to the "home" tab before
    // scrolling — goToTab() only schedules the tab change (via searchParams),
    // so the grid isn't mounted yet on this render pass. See the effect below.
    const pendingGridScrollRef = useRef(false);

    useEffect(() => {
        (async () => {
            try {
                const [pRes, cRes] = await Promise.all([
                    axios.get(`${API_URL}/fetch-all-poojas`),
                    axios.get(`${API_URL}/fetch-all-pooja-category`),
                ]);
                setPoojas(pRes.data?.poojas || []);
                setCategories(cRes.data?.poojaCategory || []);
            } catch (err) {
                console.error("Error loading poojas/categories:", err);
            } finally {
                setLoadingHome(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get(`${API_URL}/live-mandir-pujas`);
                setLivePujas(res.data?.data || []);
            } catch (err) {
                console.error("Error loading live mandir pujas:", err);
            } finally {
                setLoadingLive(false);
            }
        })();
    }, []);

    // Real ceiling for the price-range slider, derived from the fetched catalog
    // (falls back to a sane default only while poojas are still loading).
    const priceCeiling = useMemo(() => {
        const max = poojas.reduce((m, p) => Math.max(m, p.poojaPriceOnline || p.poojaPriceOffline || 0), 0);
        return max > 0 ? max : 5000;
    }, [poojas]);

    const filteredPoojas = useMemo(() => {
        let list = poojas;
        if (activeCat !== "All") {
            const match = (p: Pooja) =>
                (p.mainCategories || []).some((c) => c.name === activeCat) ||
                (p.subCategories || []).some((c) => c.name === activeCat);
            list = list.filter(match);
        }
        if (heroSearch.trim()) {
            const q = heroSearch.trim().toLowerCase();
            list = list.filter(
                (p) =>
                    p.poojaNameEng.toLowerCase().includes(q) ||
                    (p.poojaNameHindi || "").toLowerCase().includes(q)
            );
        }
        if (maxPrice !== null) {
            list = list.filter((p) => (p.poojaPriceOnline ?? p.poojaPriceOffline ?? 0) <= maxPrice);
        }
        return list;
    }, [poojas, activeCat, heroSearch, maxPrice]);

    // isFeatured is the same real field the Home page already trusts for
    // "Popular"/"Featured" — reused here for the hero carousel, Trending Today
    // box and the Festival Specials tab, sorted by featuredRank.
    const featuredPoojas = useMemo(
        () =>
            poojas
                .filter((p) => p.isFeatured)
                .slice()
                .sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999)),
        [poojas]
    );

    useEffect(() => {
        if (heroIndex >= featuredPoojas.length) setHeroIndex(0);
    }, [featuredPoojas, heroIndex]);

    const scrollToGrid = () => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    // Fires once `tab` has actually become "home" (after the searchParams ->
    // tab sync effect runs), so the grid section is mounted and gridRef is set
    // before we try to scroll to it.
    useEffect(() => {
        if (pendingGridScrollRef.current && tab === "home") {
            pendingGridScrollRef.current = false;
            scrollToGrid();
        }
    }, [tab]);

    // Hero search "Enter"/Search button: if already on the "home" tab, scroll
    // immediately; otherwise switch to "home" and let the effect above finish
    // the scroll once the grid has mounted.
    const handleHeroSearch = () => {
        if (tab === "home") {
            scrollToGrid();
        } else {
            pendingGridScrollRef.current = true;
            goToTab("home");
        }
    };

    return (
        <div className="font-sans min-h-screen">
            <Helmet>
                <title>Book Puja | Pandit Ji At Request</title>
            </Helmet>

            {/* ── Header ── */}
            <div className="relative px-4 pt-3 pb-5 bg-gradient-to-b from-[#f7d9ad] to-[#FFFAF3] md:px-8 md:pt-10 md:pb-9 lg:pt-12">
                <button
                    onClick={() => navigate("/home")}
                    className="absolute left-4 top-3 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm active:scale-90 transition-transform md:hidden"
                >
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>

                {/* lg+: two-column hero (heading/search/tabs left, featured carousel right).
                    This wrapper carries ONLY lg:-prefixed classes, so below `lg` it is an
                    inert block and every child below renders exactly as before. */}
                <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10 lg:items-center">
                    <div>
                        <h1 className="text-center text-[26px] font-bold text-orange-600 md:text-4xl lg:text-[42px] md:tracking-tight lg:text-left" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            Book Puja
                        </h1>
                        <p className="text-center text-[12.5px] text-stone-500 -mt-0.5 md:text-[15px] md:mt-1 lg:text-left">Find the right ritual for your intention</p>

                        {/* Desktop-only hero search row (new, additive) */}
                        <div className="hidden md:flex items-center gap-2.5 mt-5 md:mt-6 max-w-xl mx-auto lg:mx-0">
                            <div className="flex-1 flex items-center gap-2 bg-white border border-orange-100 rounded-full px-4 py-2.5 shadow-sm">
                                <Search className="w-4 h-4 text-stone-400 shrink-0" />
                                <input
                                    type="text"
                                    value={heroSearch}
                                    onChange={(e) => setHeroSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleHeroSearch();
                                        }
                                    }}
                                    placeholder="Search puja, deity, temple, or purpose…"
                                    className="w-full bg-transparent text-[13.5px] text-stone-800 placeholder-stone-400 outline-none"
                                />
                            </div>
                            <button
                                onClick={handleHeroSearch}
                                className="shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[13px] font-bold px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
                            >
                                Search
                            </button>
                        </div>

                        {/* Segmented tabs — mobile keeps the original 2 pills exactly as
                            before (same labels/order); the 2 new "By Problem"/"Festival
                            Specials" pills are additive, desktop-only (hidden md:flex),
                            so mobile never renders more than the original 2 buttons. */}
                        <div className="mt-4 bg-white rounded-2xl p-1.5 flex gap-1.5 shadow-sm border border-orange-100 md:mt-7 md:max-w-lg md:mx-auto lg:mx-0 md:p-2 md:shadow-md md:shadow-orange-100/60">
                            {([
                                { key: "home", label: "Pooja for Home", icon: HomeIcon },
                                { key: "mandir", label: "Live Mandir Pooja", icon: Landmark },
                            ] as const).map(({ key, label, icon: Icon }) => {
                                const active = tab === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => goToTab(key)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold transition-colors cursor-pointer md:py-3 md:text-sm ${active ? "bg-orange-50 text-orange-600 shadow-sm" : "text-stone-500 md:hover:text-orange-600 md:hover:bg-orange-50/60"}`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </button>
                                );
                            })}
                            {/* md+ only: additional pills for the new tabs, kept out of the
                                mobile flex row entirely via `hidden md:flex`. */}
                            {([
                                { key: "problem", label: "By Problem", icon: Sparkles },
                                { key: "festival", label: "Festival Specials", icon: Flame },
                            ] as const).map(({ key, label, icon: Icon }) => {
                                const active = tab === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => goToTab(key)}
                                        className={`hidden md:flex flex-1 items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold transition-colors cursor-pointer md:py-3 md:text-sm ${active ? "bg-orange-50 text-orange-600 shadow-sm" : "text-stone-500 md:hover:text-orange-600 md:hover:bg-orange-50/60"}`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* lg+ featured-puja carousel card */}
                    {featuredPoojas.length > 0 && (
                        <aside className="hidden lg:block mt-8 lg:mt-0">
                            {(() => {
                                const p = featuredPoojas[heroIndex] || featuredPoojas[0];
                                const price = p.poojaPriceOnline ?? p.poojaPriceOffline;
                                return (
                                    <div className="bg-white rounded-3xl border border-orange-100 shadow-xl shadow-orange-200/30 overflow-hidden">
                                        <div className="relative h-44 bg-orange-50">
                                            {p.poojaCardImage && (
                                                <img src={p.poojaCardImage} alt={p.poojaNameEng} className="w-full h-full object-cover" loading="lazy" />
                                            )}
                                            <span className="absolute top-2.5 left-2.5 bg-orange-600 text-white text-[10.5px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                                                Featured
                                            </span>
                                            {featuredPoojas.length > 1 && (
                                                <>
                                                    <button
                                                        aria-label="Previous featured puja"
                                                        onClick={() => setHeroIndex((i) => (i - 1 + featuredPoojas.length) % featuredPoojas.length)}
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center cursor-pointer hover:bg-white"
                                                    >
                                                        <ChevronLeft className="w-4 h-4 text-stone-700" />
                                                    </button>
                                                    <button
                                                        aria-label="Next featured puja"
                                                        onClick={() => setHeroIndex((i) => (i + 1) % featuredPoojas.length)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center cursor-pointer hover:bg-white"
                                                    >
                                                        <ChevronRight className="w-4 h-4 text-stone-700" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-[15px] font-bold text-stone-800 leading-tight line-clamp-2">{p.poojaNameEng}</h3>
                                            <div className="mt-2.5 flex items-center justify-between">
                                                {price != null && <span className="text-lg font-black text-orange-600">₹{price.toLocaleString("en-IN")}</span>}
                                                <button
                                                    onClick={() => {
                                                        if (window.fbq) {
                                                            window.fbq("track", "Book Pandit Ji", {
                                                                content_name: p.poojaNameEng,
                                                                content_ids: [p._id],
                                                                content_type: "pooja",
                                                                value: p.poojaPriceOnline,
                                                                currency: "INR",
                                                            });
                                                        }
                                                        navigate(`/puja/${p._id}`);
                                                    }}
                                                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[12.5px] font-bold px-4 py-2 rounded-full cursor-pointer hover:shadow-md transition-all"
                                                >
                                                    Book Now →
                                                </button>
                                            </div>
                                            {featuredPoojas.length > 1 && (
                                                <div className="mt-3 flex items-center justify-center gap-1.5">
                                                    {featuredPoojas.map((fp, i) => (
                                                        <button
                                                            key={fp._id}
                                                            aria-label={`Show featured puja ${i + 1}`}
                                                            onClick={() => setHeroIndex(i)}
                                                            className={`h-1.5 rounded-full transition-all cursor-pointer ${i === heroIndex ? "w-5 bg-orange-500" : "w-1.5 bg-orange-200"}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </aside>
                    )}
                </div>
            </div>

            {/* ── 5-icon trust row (desktop only, new). Skipped on the "mandir" tab,
                  which already shows its own trust strip below. ── */}
            {tab !== "mandir" && (
                <div className="hidden md:grid md:grid-cols-5 md:gap-3 lg:gap-4 md:px-8 lg:px-10 md:mt-6">
                    {[
                        { icon: ShieldCheck, label: "Verified Pandits" },
                        { icon: Video, label: "Live Video Proof" },
                        { icon: IndianRupee, label: "Transparent Pricing" },
                        { icon: Gift, label: "Prasad Included" },
                        { icon: Users, label: "50,000+ Devotees" },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="bg-white border border-orange-100 rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 text-center shadow-sm">
                            <Icon className="w-5 h-5 text-orange-500" />
                            <span className="text-[12px] font-bold text-stone-600 leading-tight">{label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Trending Today + Live Now (desktop only, new; only on the "home" tab) ── */}
            {tab === "home" && (
                <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 lg:px-10 lg:mt-8">
                    {/* Trending Today */}
                    <div className="bg-white rounded-3xl border border-orange-100 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[16px] font-bold text-stone-800 flex items-center gap-2">
                                <Flame className="w-4.5 h-4.5 text-orange-500" /> Trending Today
                            </h2>
                            <button onClick={scrollToGrid} className="text-[12px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer">
                                View All
                            </button>
                        </div>
                        <div className="space-y-2.5">
                            {(loadingHome ? Array.from({ length: 3 }) : featuredPoojas.slice(0, 3)).map((p: any, i) => (
                                <TrendingRow key={p?._id ?? i} pooja={p} loading={loadingHome} onClick={() => p && navigate(`/puja/${p._id}`)} />
                            ))}
                            {!loadingHome && featuredPoojas.length === 0 && (
                                <p className="text-center text-stone-400 text-[12.5px] py-4">No trending poojas right now.</p>
                            )}
                        </div>
                    </div>

                    {/* Live Now */}
                    <div className="bg-white rounded-3xl border border-orange-100 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[16px] font-bold text-stone-800 flex items-center gap-2">
                                <Radio className="w-4.5 h-4.5 text-red-500" /> Live Now
                                {!loadingLive && livePujas.length > 0 && (
                                    <span className="text-[11px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">{livePujas.length}</span>
                                )}
                            </h2>
                            <button onClick={() => goToTab("mandir")} className="text-[12px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer">
                                View All
                            </button>
                        </div>
                        <div className="space-y-2.5">
                            {(loadingLive ? Array.from({ length: 3 }) : livePujas.slice(0, 3)).map((puja: any, i) => (
                                <LiveNowRow key={puja?.id ?? i} puja={puja} loading={loadingLive} onClick={() => goToTab("mandir")} />
                            ))}
                            {!loadingLive && livePujas.length === 0 && (
                                <p className="text-center text-stone-400 text-[12.5px] py-4">No live mandir pujas scheduled right now.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tab content ── */}
            {tab === "home" && (
                <section className="px-4 pt-3 md:w-full md:px-8 lg:px-10 md:pt-8">
                    <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 lg:items-start">
                        {/* lg+ sidebar filters (new, additive) */}
                        <aside className="hidden lg:block space-y-5">
                            <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
                                <h3 className="text-[14px] font-bold text-stone-800 flex items-center gap-2 mb-4">
                                    <SlidersHorizontal className="w-4 h-4 text-orange-500" /> Filters
                                </h3>

                                <div className="mb-4">
                                    <label className="block text-[11.5px] font-bold text-stone-500 uppercase tracking-wide mb-1.5">Purpose</label>
                                    <select
                                        value={activeCat}
                                        onChange={(e) => setActiveCat(e.target.value)}
                                        className="w-full bg-orange-50/60 border border-orange-100 rounded-xl px-3 py-2.5 text-[13px] text-stone-700 cursor-pointer outline-none"
                                    >
                                        <option value="All">All Purposes</option>
                                        {categories.map((c) => (
                                            <option key={c._id} value={c.category_name_en}>
                                                {c.category_name_en}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-[11.5px] font-bold text-stone-500 uppercase tracking-wide mb-1.5">
                                        Price Range — up to ₹{(maxPrice ?? priceCeiling).toLocaleString("en-IN")}
                                    </label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={priceCeiling}
                                        step={Math.max(1, Math.round(priceCeiling / 100))}
                                        value={maxPrice ?? priceCeiling}
                                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                                        className="w-full accent-orange-500 cursor-pointer"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-[11.5px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                        <CalendarDays className="w-3.5 h-3.5" /> Preferred Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full bg-orange-50/60 border border-orange-100 rounded-xl px-3 py-2.5 text-[13px] text-stone-700 cursor-pointer outline-none"
                                    />
                                    <p className="text-[10.5px] text-stone-400 mt-1.5">For browsing only — you'll pick your exact date during booking.</p>
                                </div>

                                <button
                                    onClick={scrollToGrid}
                                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[13px] font-bold py-2.5 rounded-xl cursor-pointer hover:shadow-md transition-all"
                                >
                                    Show {filteredPoojas.length} Pujas
                                </button>
                            </div>

                            <div className="bg-[#FFF6EC] rounded-2xl border border-orange-100 p-5">
                                <h3 className="text-[14px] font-bold text-stone-800 mb-1">Need Help Choosing?</h3>
                                <p className="text-[12px] text-stone-500 mb-3.5">Talk to our team — we'll help you pick the right puja.</p>
                                <a
                                    href={HELP_WHATSAPP_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 bg-[#25D366] text-white text-[13px] font-bold py-2.5 rounded-xl mb-2.5 cursor-pointer hover:brightness-105 transition-all"
                                >
                                    <MessageCircle className="w-4 h-4" /> WhatsApp Us
                                </a>
                                <a
                                    href={SUPPORT_TEL}
                                    className="flex items-center justify-center gap-2 bg-white border border-orange-200 text-orange-600 text-[13px] font-bold py-2.5 rounded-xl cursor-pointer hover:bg-orange-50 transition-all"
                                >
                                    <Phone className="w-4 h-4" /> Call Now
                                </a>
                            </div>
                        </aside>

                        <div>
                            {/* Category chips */}
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 md:flex-wrap md:overflow-visible md:mx-0 md:px-0 md:gap-2.5">
                                {["All", ...categories.map((c) => c.category_name_en)].map((name) => {
                                    const active = activeCat === name;
                                    return (
                                        <button
                                            key={name}
                                            onClick={() => setActiveCat(name)}
                                            className={`shrink-0 px-5 py-2 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer md:text-sm md:px-6 md:py-2.5 ${active ? "bg-orange-500 text-white border-orange-500 md:hover:bg-orange-600" : "bg-white text-stone-600 border-orange-100 md:hover:border-orange-300 md:hover:text-orange-600"}`}
                                        >
                                            {name}
                                        </button>
                                    );
                                })}
                            </div>

                            {!loadingHome && (
                                <p className="text-orange-600 font-bold text-[14px] mt-4 md:text-base md:mt-6">
                                    Found Result: {filteredPoojas.length}
                                </p>
                            )}

                            {/* Grid */}
                            <div ref={gridRef} className="mt-3 grid grid-cols-2 gap-3 pb-4 md:grid-cols-3 lg:grid-cols-3 md:gap-6 md:mt-5 md:pb-16">
                                {loadingHome
                                    ? Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="bg-white rounded-2xl border border-orange-100 overflow-hidden animate-pulse md:rounded-3xl">
                                            <div className="h-36 bg-stone-200 md:h-48 lg:h-52" />
                                            <div className="p-3 space-y-2">
                                                <div className="h-4 bg-stone-200 rounded w-3/4" />
                                                <div className="h-9 bg-stone-200 rounded-xl" />
                                            </div>
                                        </div>
                                    ))
                                    : filteredPoojas.map((p) => {
                                        const tags = (p.mainCategories || []).map((c) => c.name).filter(Boolean).slice(0, 2) as string[];
                                        return (
                                            <div key={p._id} className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm flex flex-col group md:rounded-3xl md:transition-all md:duration-300 md:hover:shadow-xl md:hover:-translate-y-1 md:hover:border-orange-200">
                                                <button onClick={() => navigate(`/puja/${p._id}`)} className="relative h-36 bg-orange-50 text-left cursor-pointer md:h-48 lg:h-52 md:overflow-hidden">
                                                    {p.poojaCardImage && (
                                                        <img src={p.poojaCardImage} alt={p.poojaNameEng} className="w-full h-full object-cover md:transition-transform md:duration-500 md:group-hover:scale-105" loading="lazy" />
                                                    )}
                                                    <span className="absolute top-2 right-2 flex items-center gap-0.5 bg-emerald-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md">
                                                        4.3 <Star className="w-3 h-3 fill-white text-white" />
                                                    </span>
                                                    {p.isFeatured && (
                                                        <span className="hidden md:flex absolute top-2 left-2 items-center gap-1 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                                                            Popular
                                                        </span>
                                                    )}
                                                    <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                                                        {tags.map((t) => (
                                                            <span key={t} className="bg-white/95 text-stone-700 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </button>
                                                <div className="p-3 pt-2.5 flex flex-col flex-1 md:p-4 md:pt-3">
                                                    <h3 className="text-[14px] font-bold text-orange-600 leading-tight line-clamp-2 min-h-[36px] md:text-[15.5px] md:min-h-[42px]">
                                                        {p.poojaNameEng}
                                                    </h3>
                                                    <button
                                                        onClick={() => {
                                                            if (window.fbq) {
                                                                window.fbq("track", "Book Pandit Ji", {
                                                                    content_name: p.poojaNameEng,
                                                                    content_ids: [p._id],
                                                                    content_type: "pooja",
                                                                    value: p.poojaPriceOnline,
                                                                    currency: "INR",
                                                                });
                                                            }
                                                            navigate(`/puja/${p._id}`);
                                                        }}
                                                        className="mt-2 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[13px] font-bold py-2.5 rounded-xl active:scale-95 transition-transform cursor-pointer md:text-sm md:py-3 md:transition-all md:hover:shadow-lg md:hover:shadow-orange-300/50 md:hover:brightness-105"
                                                    >
                                                        Book Pandit Ji
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                            {!loadingHome && filteredPoojas.length === 0 && (
                                <p className="text-center text-stone-400 text-[13px] py-10 md:text-sm md:py-16">No poojas found in this category.</p>
                            )}
                        </div>
                    </div>

                    {/* Need by Need row (desktop only, new — same category data, navigates to /category/:id) */}
                    {categories.length > 0 && (
                        <div className="hidden md:block md:mt-12 md:pb-16">
                            <h2 className="text-[18px] lg:text-[20px] font-bold text-stone-800 mb-4">Book by Need</h2>
                            <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                                {categories.slice(0, 8).map((cat) => (
                                    <button
                                        key={cat._id}
                                        onClick={() => navigate(`/category/${cat._id}`, { state: { category: cat } })}
                                        className="bg-white rounded-2xl border border-orange-100 shadow-sm p-3.5 flex items-center gap-2.5 text-left cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-orange-200 transition-all"
                                    >
                                        <span className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                                            {cat.category_image ? (
                                                <img src={cat.category_image} alt={cat.category_name_en} className="w-8 h-8 object-contain" />
                                            ) : (
                                                <Sparkles className="w-5 h-5 text-orange-500" />
                                            )}
                                        </span>
                                        <span className="text-[13px] font-bold text-stone-700 leading-tight truncate">{cat.category_name_en}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {tab === "mandir" && (
                <section className="px-4 space-y-4 pb-4 md:w-full md:px-8 lg:px-10 md:pt-6 md:pb-16 md:space-y-8">
                    {/* ── Trust strip (above the fold) ── */}
                    <div className="grid grid-cols-3 gap-2 md:gap-5">
                        {[
                            { icon: ShieldCheck, label: "Verified Temples" },
                            { icon: Video, label: "Live Video Proof" },
                            { icon: Users, label: "50,000+ Devotees" },
                        ].map(({ icon: Icon, label }) => (
                            <div
                                key={label}
                                className="bg-white border border-orange-100 rounded-2xl py-2.5 px-1 flex flex-col items-center gap-1 text-center shadow-sm md:flex-row md:justify-center md:gap-2 md:py-4"
                            >
                                <Icon className="w-4.5 h-4.5 text-orange-500 md:w-5 md:h-5" />
                                <span className="text-[10px] font-bold text-stone-600 leading-tight md:text-[13px]">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Instant help via WhatsApp ── */}
                    <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Chat with Pandit Ji on WhatsApp"
                        onClick={() => {
                            if (window.fbq) {
                                window.fbq("track", "Contact", {
                                    content_name: "WhatsApp Chat",
                                    content_type: "live_mandir_puja",
                                });
                            }
                        }}
                        className="flex items-center gap-3 bg-[#E7F8EE] border border-[#25D366]/30 rounded-2xl px-4 py-3 active:scale-[0.99] transition-transform md:px-6 md:py-4 md:transition-all md:hover:shadow-md md:hover:border-[#25D366]/50"
                    >
                        <span className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-sm md:w-10 md:h-10">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[13px] font-bold text-[#1c8a4e] leading-tight md:text-[14.5px]">Have a question? Chat with Pandit Ji</p>
                            <p className="text-[11px] text-stone-500 leading-tight md:text-[12.5px]">Muhurat, availability or anything else — reply in minutes</p>
                        </div>
                    </a>

                    {/* Card list: vertical stack on mobile, grid at md+ (wrapper keeps mobile spacing identical) */}
                    <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 lg:gap-7">
                        {loadingLive
                            ? Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-3xl border border-orange-100 overflow-hidden animate-pulse">
                                    <div className="h-44 bg-stone-200" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-5 bg-stone-200 rounded w-1/2" />
                                        <div className="h-4 bg-stone-200 rounded w-3/4" />
                                        <div className="h-10 bg-stone-200 rounded-xl" />
                                    </div>
                                </div>
                            ))
                            : livePujas.map((puja) => <LiveMandirVerticalCard key={puja.id} puja={puja} onBook={() => navigate(`/live-mandir-puja/${puja.id}`)} />)}
                        {!loadingLive && livePujas.length === 0 && (
                            <p className="text-center text-stone-400 text-[13px] py-10 md:col-span-full md:text-sm md:py-16">No live mandir pujas scheduled right now. 🙏</p>
                        )}
                    </div>
                </section>
            )}

            {tab === "problem" && (
                <section className="px-4 pt-3 pb-4 md:w-full md:px-8 lg:px-10 md:pt-8 md:pb-16">
                    <h2 className="text-[16px] md:text-[20px] font-bold text-stone-800 mb-1">By Problem</h2>
                    <p className="text-[12.5px] md:text-[14px] text-stone-500 mb-4 md:mb-6">Choose a category to find the right puja for your intention.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                        {loadingHome
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-3 flex items-center gap-2.5 animate-pulse h-[68px] md:p-4 md:h-[80px]">
                                    <div className="w-10 h-10 rounded-xl bg-stone-100 shrink-0" />
                                    <div className="flex-1 space-y-1.5 min-w-0">
                                        <div className="h-3.5 bg-stone-100 rounded w-3/4" />
                                        <div className="h-2.5 bg-stone-100 rounded w-1/2" />
                                    </div>
                                </div>
                            ))
                            : categories.length > 0
                            ? categories.map((cat) => (
                                <button
                                    key={cat._id}
                                    onClick={() => navigate(`/category/${cat._id}`, { state: { category: cat } })}
                                    className="bg-white rounded-2xl border border-orange-100 shadow-sm p-3 flex items-center gap-2.5 text-left cursor-pointer active:scale-95 transition-transform md:p-4 md:gap-3 md:transition-all md:duration-300 md:hover:shadow-lg md:hover:-translate-y-0.5 md:hover:border-orange-200"
                                >
                                    <span className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 overflow-hidden md:w-12 md:h-12">
                                        {cat.category_image ? (
                                            <img src={cat.category_image} alt={cat.category_name_en} className="w-8 h-8 object-contain md:w-9 md:h-9" />
                                        ) : (
                                            <Sparkles className="w-5 h-5 text-orange-500 md:w-6 md:h-6" />
                                        )}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-stone-800 leading-tight truncate md:text-[15px]">{cat.category_name_en}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-stone-300 shrink-0 md:w-5 md:h-5" />
                                </button>
                            ))
                            : (
                                <div className="col-span-2 md:col-span-3 lg:col-span-4 text-center text-stone-400 text-[13px] py-10 md:text-sm md:py-16">
                                    No categories found.
                                </div>
                            )}
                    </div>
                </section>
            )}

            {tab === "festival" && (
                <section className="px-4 pt-3 pb-4 md:w-full md:px-8 lg:px-10 md:pt-8 md:pb-16">
                    <h2 className="text-[16px] md:text-[20px] font-bold text-stone-800 mb-1 flex items-center gap-2">
                        <Flame className="w-4.5 h-4.5 text-orange-500" /> Festival Specials
                    </h2>
                    <p className="text-[12.5px] md:text-[14px] text-stone-500 mb-4 md:mb-6">Featured seva for the current festival season.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {loadingHome
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-orange-100 overflow-hidden animate-pulse md:rounded-3xl">
                                    <div className="h-36 bg-stone-200 md:h-48" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-4 bg-stone-200 rounded w-3/4" />
                                        <div className="h-9 bg-stone-200 rounded-xl" />
                                    </div>
                                </div>
                            ))
                            : featuredPoojas.map((p) => (
                                <div key={p._id} className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm flex flex-col group md:rounded-3xl md:transition-all md:duration-300 md:hover:shadow-xl md:hover:-translate-y-1 md:hover:border-orange-200">
                                    <button onClick={() => navigate(`/puja/${p._id}`)} className="relative h-36 bg-orange-50 text-left cursor-pointer md:h-48 md:overflow-hidden">
                                        {p.poojaCardImage && (
                                            <img src={p.poojaCardImage} alt={p.poojaNameEng} className="w-full h-full object-cover md:transition-transform md:duration-500 md:group-hover:scale-105" loading="lazy" />
                                        )}
                                        <span className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                                            Festival Special
                                        </span>
                                    </button>
                                    <div className="p-3 pt-2.5 flex flex-col flex-1 md:p-4 md:pt-3">
                                        <h3 className="text-[14px] font-bold text-orange-600 leading-tight line-clamp-2 min-h-[36px] md:text-[15.5px] md:min-h-[42px]">
                                            {p.poojaNameEng}
                                        </h3>
                                        {(p.poojaPriceOnline ?? p.poojaPriceOffline) != null && (
                                            <p className="text-[13px] font-bold text-stone-700 mt-1.5">₹{(p.poojaPriceOnline ?? p.poojaPriceOffline)!.toLocaleString("en-IN")}</p>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (window.fbq) {
                                                    window.fbq("track", "Book Pandit Ji", {
                                                        content_name: p.poojaNameEng,
                                                        content_ids: [p._id],
                                                        content_type: "pooja",
                                                        value: p.poojaPriceOnline,
                                                        currency: "INR",
                                                    });
                                                }
                                                navigate(`/puja/${p._id}`);
                                            }}
                                            className="mt-2 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[13px] font-bold py-2.5 rounded-xl active:scale-95 transition-transform cursor-pointer md:text-sm md:py-3 md:transition-all md:hover:shadow-lg md:hover:shadow-orange-300/50 md:hover:brightness-105"
                                        >
                                            Book Pandit Ji
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                    {!loadingHome && featuredPoojas.length === 0 && (
                        <p className="text-center text-stone-400 text-[13px] py-10 md:text-sm md:py-16">No festival specials right now — check back soon!</p>
                    )}
                </section>
            )}

            {/* ── Common Questions (desktop only, new) ── */}
            <div className="hidden md:block md:px-8 lg:px-10 md:pb-16">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[18px] lg:text-[20px] font-bold text-stone-800 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-orange-500" /> Common Questions
                    </h2>
                    <a href="/#faq" className="text-[12.5px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer">
                        View All FAQs
                    </a>
                </div>
                <div className="space-y-3">
                    {COMMON_QUESTIONS.map((faq, index) => {
                        const isOpen = faqOpen === index;
                        return (
                            <div key={faq.question} className="bg-white border border-orange-100 rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setFaqOpen(isOpen ? null : index)}
                                    className="w-full flex items-center justify-between text-left px-5 py-4 cursor-pointer hover:bg-orange-50/30 transition-colors"
                                >
                                    <span className="text-[13.5px] font-bold text-stone-800 leading-snug">{faq.question}</span>
                                    {isOpen ? (
                                        <ChevronUp className="w-4.5 h-4.5 text-stone-500 shrink-0 ml-3" />
                                    ) : (
                                        <ChevronDown className="w-4.5 h-4.5 text-stone-500 shrink-0 ml-3" />
                                    )}
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-4 pt-0">
                                        <p className="text-[12.5px] text-stone-500 leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function TrendingRow({ pooja, loading, onClick }: { pooja: Pooja | undefined; loading: boolean; onClick: () => void }) {
    if (loading || !pooja) {
        return (
            <div className="flex items-center gap-3 animate-pulse">
                <div className="w-14 h-14 rounded-xl bg-stone-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-stone-100 rounded w-3/4" />
                    <div className="h-3 bg-stone-100 rounded w-1/3" />
                </div>
            </div>
        );
    }
    const price = pooja.poojaPriceOnline ?? pooja.poojaPriceOffline;
    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 text-left cursor-pointer group">
            <span className="w-14 h-14 rounded-xl bg-orange-50 overflow-hidden shrink-0">
                {pooja.poojaCardImage && (
                    <img src={pooja.poojaCardImage} alt={pooja.poojaNameEng} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                )}
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-stone-800 truncate">{pooja.poojaNameEng}</span>
                {price != null && <span className="block text-[12px] font-bold text-orange-600">₹{price.toLocaleString("en-IN")}</span>}
            </span>
            <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
        </button>
    );
}

function LiveNowRow({ puja, loading, onClick }: { puja: LivePuja | undefined; loading: boolean; onClick: () => void }) {
    if (loading || !puja) {
        return (
            <div className="flex items-center gap-3 animate-pulse">
                <div className="w-14 h-14 rounded-xl bg-stone-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-stone-100 rounded w-3/4" />
                    <div className="h-3 bg-stone-100 rounded w-1/3" />
                </div>
            </div>
        );
    }
    const isLive = puja.status === "live";
    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 text-left cursor-pointer group">
            <span className="relative w-14 h-14 rounded-xl bg-orange-50 overflow-hidden shrink-0">
                <img src={puja.image} alt={puja.pujaName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                <span className={`absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold py-0.5 ${isLive ? "bg-red-600 text-white" : "bg-stone-700/85 text-white"}`}>
                    {isLive ? "LIVE" : puja.scheduledDate}
                </span>
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-stone-800 truncate">{puja.pujaName}</span>
                <span className="block text-[11.5px] text-stone-500 truncate">{puja.templeName}</span>
                {typeof puja.devoteesJoined === "number" && (
                    <span className="block text-[11px] font-semibold text-orange-600">{puja.devoteesJoined.toLocaleString("en-IN")} joined</span>
                )}
            </span>
            <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
        </button>
    );
}

function LiveMandirVerticalCard({ puja, onBook }: { puja: LivePuja; onBook: () => void }) {
    const discount = puja.originalPrice
        ? Math.round(((puja.originalPrice - puja.price) / puja.originalPrice) * 100)
        : 0;
    return (
        <div
            onClick={onBook}
            className="bg-[#FFFDF9] rounded-[24px] border border-[#FFEFE2] overflow-hidden shadow-[0_12px_36px_-12px_rgba(224,90,16,0.08)] hover:shadow-[0_16px_40px_-10px_rgba(224,90,16,0.14)] active:scale-[0.99] hover:scale-[1.005] transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
            {/* Image & Badges */}
            <div className="relative h-48 bg-stone-100 overflow-hidden">
                <img src={puja.image} alt={puja.pujaName} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2E1F15]/90 via-transparent to-black/20" />


                 <span className=" absolute top-2 right-2 flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md self-start shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {(puja.rating ?? 4.9).toFixed(1)}
                        </span>

                {discount > 0 && (
                    <span className="absolute top-3.5 right-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                        {discount}% OFF
                    </span>
                )}

                <div className="absolute bottom-3.5 left-4 right-4 text-white">
                    {puja.deity && (
                        <span className="block text-[10.5px] font-bold tracking-widest text-orange-200 uppercase mb-0.5">{puja.deity}</span>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="px-4 py-2 flex flex-col justify-between flex-1 md:px-5 md:py-4">
                <div>
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[17px] font-bold text-[#2E1F15] leading-tight md:text-[18px]">{puja.pujaName}</h3>
                    </div>

                    {puja.templeLocation && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-stone-500">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {puja.templeLocation}
                        </p>
                    )}
                </div>

                {/* Footer Section */}
                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between md:mt-3 md:pt-3 md:gap-3">
                    <div>
                        <span className="text-[9.5px] text-stone-400 font-bold uppercase tracking-wider block">Starting at</span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-2xl font-black text-[#D85C0E]">₹{puja.price.toLocaleString("en-IN")}</span>
                            {puja.originalPrice && (
                                <span className="text-[13px] text-stone-400 line-through">₹{puja.originalPrice.toLocaleString("en-IN")}</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.fbq) {
                                window.fbq("track", "Live Mandir Book Seva", {
                                    content_name: puja.pujaName,
                                    content_ids: [puja.id],
                                    content_type: "live_mandir_puja",
                                    value: puja.price,
                                    currency: "INR",
                                });
                            }
                            onBook();
                        }}
                        className="bg-[#E05A10] hover:bg-[#C94D0C] text-white font-bold text-[16px] px-14 py-3 rounded-full shadow-lg shadow-orange-200/50 hover:shadow-orange-300/40 active:scale-95 transition-all duration-200 cursor-pointer md:px-8 md:text-[15px] md:shrink-0"
                    >
                        Book Seva
                    </button>
                </div>
            </div>
        </div>
    );
}
