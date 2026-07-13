import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Seo from "../components/seo/Seo";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Phone,
    Video,
    MessageSquare,
    Flame,
    Flower2,
    Menu,
    X,
    User,
    ShieldCheck,
    Users,
    PackageCheck,
} from "lucide-react";
import API_URL from "../utils/apiConfig";
import { DURGA_MATA_PUJA_SLUG, durgaMataPuja } from "../data/durgaMataPuja";
import { useAuth } from "../context/AuthContext";
import OurServices from "../components/home/OurServices";
import SacredChadhavaSewa from "../components/home/SacredChadhavaSewa";
import VerifiedPanditJi from "../components/home/VerifiedPanditJi";
import PoojaByProblem from "../components/home/PoojaByProblem";
import Testimonials from "../components/booking/Testimonials";
import FAQSection from "../components/home/FAQSection";
import TrustSanatanSection from "../components/home/TrustSanatanSection";
import CTASection from "../components/home/CTASection";
import LiveNowSection from "../components/home/LiveNowSection";
import BookByNeedRow from "../components/home/BookByNeedRow";
import HowItWorksSection from "../components/booking/HowItWorksSection";
import { LIVE_MANDIR_PUJAS } from "../components/booking/LiveMandirPujas/liveMandirData";

const LOGO =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/pjar_logo-removebg-preview.png";

// Featured "Maa Chintpurni Pooja" promo banner shown below Book Puja.
// 👉 Paste the banner image URL here:
const FEATURED_PUJA_BANNER = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/WhatsApp%20Image%202026-07-06%20at%207.12.44%20PM.jpeg";

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

const CONSULTATIONS = [
    { icon: Phone, label: "Talk on Call", sub: "Speak Directly", path: "/paid-consultation?type=voice", tint: "bg-orange-100 text-orange-600" },
    { icon: Video, label: "Video Call", sub: "Face to Face", path: "/paid-consultation?type=video", tint: "bg-green-100 text-green-600" },
    { icon: MessageSquare, label: "Chat", sub: "Instant Answers", path: "/free-consultation", tint: "bg-sky-100 text-sky-600" },
];

// Desktop hero's "I want to book" quick-jump select.
const HERO_BOOK_OPTIONS = [
    { label: "Puja", to: "/book-puja" },
    { label: "Chadhava", to: "/chadhava" },
    { label: "Consultation", to: "/paid-consultation" },
    { label: "Puja Samagri", to: "/shop" },
];

// Desktop hero trust row — reuses the same "50,000+ Devotees" figure already
// used elsewhere in this codebase (pages/BookPujaPage.tsx) for consistency.
const HERO_TRUST_ITEMS = [
    { icon: ShieldCheck, label: "Verified Pandits", sub: "Authentic & Trusted" },
    { icon: Video, label: "Live Video Proof", sub: "Watch Real-time" },
    { icon: Users, label: "50,000+ Devotees", sub: "Trust & Faith" },
    { icon: PackageCheck, label: "Prasad Included", sub: "Delivered to You" },
];

export default function HomePage() {
    const navigate = useNavigate();
    const { user, openLoginModal } = useAuth();
    const isLoggedIn = !!user;
    const [poojas, setPoojas] = useState<Pooja[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [allPoojas, setAllPoojas] = useState<Pooja[]>([]);
    const [searchResults, setSearchResults] = useState<Pooja[]>([]);

    useEffect(() => {
        const fetchPoojas = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/fetch-all-poojas`);
                const list: Pooja[] = data?.poojas || [];
                setAllPoojas(list);
                // Featured poojas first, ordered by featuredRank (1 = highest).
                // Poojas without a rank fall to the end of the featured group.
                const rankOf = (p: Pooja) =>
                    typeof p.featuredRank === "number" ? p.featuredRank : Number.POSITIVE_INFINITY;
                const featured = list
                    .filter((p) => p.isFeatured)
                    .sort((a, b) => rankOf(a) - rankOf(b));
                const ordered = [...featured, ...list.filter((p) => !p.isFeatured)];
                setPoojas(ordered.slice(0, 8));
            } catch (err) {
                console.error("Error fetching poojas:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPoojas();
    }, []);

    // Loose token matching for search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const queryTokens = searchQuery
            .toLowerCase()
            .replace(/[^\w\sऀ-ॿ]/g, "") // support English and Devanagari/Hindi chars
            .split(/\s+/)
            .filter(Boolean);

        const filtered = allPoojas.filter((p) => {
            const nameEng = p.poojaNameEng.toLowerCase();
            const nameHindi = (p.poojaNameHindi || "").toLowerCase();
            return queryTokens.every((token) => nameEng.includes(token) || nameHindi.includes(token));
        });

        setSearchResults(filtered.slice(0, 5));
    }, [searchQuery, allPoojas]);

    const priceOf = (p: Pooja) => p.poojaPriceOnline || p.poojaPriceOffline || 0;

    // Desktop hero search: jump straight to the first live match, else the
    // full Book Puja catalog (reuses the same search state as the dropdown).
    const handleHeroSearch = () => {
        if (searchResults.length > 0) {
            navigate(`/puja/${searchResults[0]._id}`);
        } else {
            navigate("/book-puja");
        }
    };

    // Desktop "Trending Today" carousel: nudge the row by ~2 card widths.
    const trendingRowRef = useRef<HTMLDivElement>(null);
    const scrollTrending = (dir: -1 | 1) => {
        const row = trendingRowRef.current;
        if (!row) return;
        const card = row.firstElementChild as HTMLElement | null;
        const step = card ? (card.offsetWidth + 24) * 2 : row.clientWidth;
        row.scrollBy({ left: dir * step, behavior: "smooth" });
    };

    return (
        <div
            className="font-sans"
            style={{
                backgroundImage: 'url("/images/bg_main.png")',
                backgroundSize: "cover",
                backgroundPosition: "center top",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
                backgroundColor: "#FFFAF3",
            }}
        >
            <Seo
                title="Book Verified Pandit Online for Puja, Havan & Chadhava | PanditJiAtRequest"
                description="Book verified pandits for Satyanarayan Katha, Griha Pravesh, Havan & all Hindu ceremonies at home. Live video proof, transparent pricing from ₹799, free consultation before booking. Doorstep service across India."
                path="/"
            />


            {/* ── Header (mobile only — DesktopHeader from AppLayout takes over at md+) ── */}
            <div
                className="md:hidden sticky top-0 z-30 px-4 pt-3 pb-4 bg-[#FFFAF3]/95 backdrop-blur-md border-b border-orange-100/30"
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <img src={LOGO} alt="Pandit Ji At Request" className="h-11 w-auto object-contain" />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (isLoggedIn) {
                                    navigate("/account");
                                } else {
                                    openLoginModal();
                                }
                            }}
                            className="p-1.5 rounded-xl hover:bg-orange-50 active:scale-95 transition-transform cursor-pointer"
                            title="Profile / Account"
                        >
                            <User className="w-6 h-6 text-stone-700" />
                        </button>
                         <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-1.5 rounded-xl hover:bg-orange-50 active:scale-95 transition-transform cursor-pointer"
                        >
                            <Menu className="w-6 h-6 text-stone-700" />
                        </button>
                    </div>
                </div>

                {/* Interactive Search Bar */}
                <div className="relative mt-3">
                    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-orange-100/30">
                        <Search className="w-5 h-5 text-stone-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search here..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-[13.5px] text-stone-800 placeholder-stone-400 outline-hidden"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-stone-400 hover:text-stone-600 text-[13.5px] font-semibold shrink-0 cursor-pointer"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Search Dropdown Overlay */}
                    <AnimatePresence>
                        {searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-orange-100/50 max-h-64 overflow-y-auto z-40 p-2"
                            >
                                {searchResults.map((p) => (
                                    <button
                                        key={p._id}
                                        onClick={() => {
                                            setSearchQuery("");
                                            navigate(`/puja/${p._id}`);
                                        }}
                                        className="w-full flex items-center gap-3 p-2 hover:bg-orange-50/50 rounded-xl transition-colors text-left"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-orange-100 overflow-hidden shrink-0">
                                            {p.poojaCardImage ? (
                                                <img src={p.poojaCardImage} alt={p.poojaNameEng} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="w-full h-full flex items-center justify-center text-lg">🪔</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[13px] font-bold text-stone-800 truncate">{p.poojaNameEng}</h4>
                                            {p.poojaNameHindi && (
                                                <p className="text-[11px] text-stone-400 truncate mt-0.5">{p.poojaNameHindi}</p>
                                            )}
                                        </div>
                                        <span className="text-[13.5px] font-bold text-orange-600 shrink-0">
                                            ₹{priceOf(p)}
                                        </span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                        {searchQuery.trim() && searchResults.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-orange-100/50 z-40 p-4 text-center"
                            >
                                <p className="text-[12.5px] text-stone-500 font-medium">No results found for "{searchQuery}"</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Hero (md+ only — supersedes the mobile sticky search header above) ── */}
            <section className="hidden md:block md:w-full md:px-8 lg:px-10 md:pt-10 lg:pt-14 md:pb-16 lg:pb-20">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
                    {/* Left: headline, search, trust row */}
                    <div>
                        <p className="mb-3 text-[13px] lg:text-sm font-semibold">
                            <span className="font-bold text-orange-600">From Sacred Temples.</span>{" "}
                            <span className="text-stone-500">For Your Peace.</span>
                        </p>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-stone-900 leading-tight tracking-tight">
                            Book <span className="text-orange-600">Divine Seva</span> from Sacred Temples
                        </h1>
                        <p className="mt-4 text-stone-500 text-base lg:text-lg leading-relaxed max-w-md">
                            Verified Pandits will perform Pujas &amp; Chadhavas with your name and gotra. Watch Live or get Video Proof.
                        </p>

                        {/* Search row */}
                        <p className="mt-7 mb-2 text-[13px] font-semibold text-stone-600">— What would you like to book today?</p>
                        <div className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-lg border border-orange-100">
                            <select
                                defaultValue=""
                                onChange={(e) => {
                                    const to = e.target.value;
                                    if (to) navigate(to);
                                }}
                                aria-label="I want to book"
                                className="h-12 shrink-0 px-3 rounded-xl bg-orange-50 text-[13.5px] font-semibold text-stone-700 border-none outline-none cursor-pointer"
                            >
                                <option value="" disabled>I want to book</option>
                                {HERO_BOOK_OPTIONS.map((opt) => (
                                    <option key={opt.to} value={opt.to}>{opt.label}</option>
                                ))}
                            </select>
                            <div className="flex-1 flex items-center gap-2 px-2 min-w-0">
                                <Search className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search puja, temple, or seva…"
                                    className="w-full bg-transparent text-[13.5px] text-stone-800 placeholder-stone-400 outline-hidden"
                                />
                            </div>
                            <button
                                onClick={handleHeroSearch}
                                className="h-12 shrink-0 flex items-center gap-1.5 bg-[#E05A10] hover:bg-[#C94D0C] text-white font-bold text-[13.5px] px-5 rounded-xl shadow-md transition-all duration-200 cursor-pointer"
                            >
                                <Search className="w-4 h-4" /> Search
                            </button>
                        </div>

                        {/* Trust row */}
                        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {HERO_TRUST_ITEMS.map(({ icon: Icon, label, sub }) => (
                                <div key={label} className="flex items-center gap-2.5">
                                    <span className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                        <Icon className="w-5 h-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[12.5px] font-bold text-stone-800 leading-tight truncate">{label}</p>
                                        <p className="text-[11px] text-stone-400 truncate">{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: hero image + floating Chintpurni promo card */}
                    <div className="hidden md:block relative mt-10 lg:mt-0">
                        <div className="relative rounded-[32px] overflow-hidden shadow-xl h-[380px] lg:h-[440px]">
                            <img
                                src={LIVE_MANDIR_PUJAS[0].image}
                                alt="Sacred puja at a temple"
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>

                        <button
                            onClick={() => navigate(`/${DURGA_MATA_PUJA_SLUG}`)}
                            aria-label={`Book ${durgaMataPuja.poojaNameEng}`}
                            className="absolute -bottom-6 left-6 lg:left-8 flex items-center gap-3 bg-white rounded-2xl shadow-xl border border-orange-100 p-3 max-w-[260px] cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                        >
                            <img
                                src={durgaMataPuja.poojaCardImage}
                                alt={durgaMataPuja.poojaNameEng}
                                className="w-14 h-14 rounded-xl object-cover shrink-0"
                                loading="lazy"
                                decoding="async"
                            />
                            <div className="min-w-0 text-left">
                                <p className="text-[12.5px] font-bold text-stone-800 leading-tight truncate">
                                    {durgaMataPuja.poojaNameEng}
                                </p>
                                <p className="text-orange-600 font-extrabold text-[15px] mt-0.5">
                                    ₹{durgaMataPuja.poojaPriceOnline}
                                </p>
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-orange-600 mt-0.5">
                                    Book Now <ChevronRight className="w-3 h-3" />
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Book Puja ── */}
            <section className="px-4 md:w-full md:px-8 lg:px-10 md:pt-8 lg:pt-10">
                <div className="flex items-center gap-2 md:gap-3">
                    <h2 className="text-[22px] font-bold text-stone-900 shrink-0 md:hidden">Book Puja</h2>
                    <Flower2 className="w-5 h-5 text-orange-500 shrink-0 md:hidden" />
                    <span className="h-px w-6 bg-orange-300 shrink-0 md:hidden" />
                    <span className="text-[12.5px] text-stone-500 font-medium truncate md:hidden">Poojas just for you</span>
                    <div className="hidden md:flex items-center gap-3.5 min-w-0">
                        <span className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-orange-600 shadow-sm flex items-center justify-center shrink-0">
                            <Flame className="w-5 h-5 lg:w-6 lg:h-6 text-white fill-white" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight leading-tight">Trending Today</h2>
                            <p className="mt-1 text-sm text-stone-500 truncate">Most booked pujas, chadhavas &amp; live pujas</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/book-puja")}
                        className="ml-auto flex items-center gap-0.5 text-[14px] font-bold text-orange-600 active:scale-95 transition-transform shrink-0 md:hover:text-orange-700"
                    >
                        View All <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="relative">
                <div ref={trendingRowRef} className="mt-3 pb-2 flex gap-3 overflow-x-auto scrollbar-hide snap-x scroll-px-2 [&>*:last-child]:mr-1 md:mt-4 md:py-2 md:gap-5 lg:gap-6">
                    {loading
                        ? Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="shrink-0 w-[38%] bg-white rounded-3xl p-2 shadow-sm animate-pulse md:w-[225px] lg:w-[240px]">
                                <div className="h-28 bg-stone-200 rounded-2xl md:h-44 lg:h-48" />
                                <div className="px-1 pt-3 pb-2 space-y-2">
                                    <div className="h-3 bg-stone-200 rounded w-3/4 mx-auto" />
                                    <div className="h-3.5 bg-stone-200 rounded w-1/2 mx-auto" />
                                </div>
                            </div>
                        ))
                        : poojas.map((p) => (
                            <button
                                key={p._id}
                                onClick={() => navigate(`/puja/${p._id}`)}
                                className="shrink-0 w-[38%] bg-white rounded-3xl border border-orange-100 shadow-sm text-center active:scale-[0.98] transition-transform snap-start md:w-[225px] lg:w-[240px] md:shrink-0 md:snap-none md:transition-all md:duration-300 md:hover:shadow-xl md:hover:-translate-y-1"
                            >
                                <div className="relative h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-300 via-orange-300 to-orange-400 md:h-44 lg:h-48">
                                    {p.poojaCardImage && (
                                        <img src={p.poojaCardImage} alt={p.poojaNameEng} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                    )}
                                    {p.isFeatured && (
                                        <span className="absolute top-2 left-2 flex items-center gap-1 bg-white text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm md:hidden">
                                            <Flame className="w-3 h-3 fill-orange-500 text-orange-500" /> Popular
                                        </span>
                                    )}
                                    {p.isFeatured && (
                                        <span className="hidden md:flex absolute top-2.5 left-2.5 items-center gap-1 bg-white text-orange-600 text-[10.5px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                                            <Flame className="w-3 h-3 fill-orange-500 text-orange-500" /> Most Booked
                                        </span>
                                    )}
                                </div>
                                <div className="px-1 pt-3 pb-2">
                                    <h3 className="text-[13px] font-bold text-stone-800 leading-tight line-clamp-2 min-h-[32px] md:text-[15px]">
                                        {p.poojaNameEng}
                                    </h3>
                                    <p className="mt-1 text-[14px] font-bold text-orange-600 md:text-[16px]">
                                        ₹{priceOf(p).toLocaleString("en-IN")}
                                    </p>
                                    <span className="hidden md:inline-flex mt-2 items-center justify-center bg-[#E05A10] text-white text-[11.5px] font-bold px-3.5 py-1 rounded-full">
                                        Book Seva
                                    </span>
                                </div>
                            </button>
                        ))}
                    {!loading && poojas.length === 0 && (
                        <p className="text-[13px] text-stone-400 py-6 md:text-sm">No poojas available right now.</p>
                    )}
                </div>
                <button
                    type="button"
                    aria-label="Scroll trending pujas left"
                    onClick={() => scrollTrending(-1)}
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white border border-orange-100 shadow-md text-stone-600 transition-all duration-200 hover:text-orange-600 hover:shadow-lg cursor-pointer"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    aria-label="Scroll trending pujas right"
                    onClick={() => scrollTrending(1)}
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white border border-orange-100 shadow-md text-stone-600 transition-all duration-200 hover:text-orange-600 hover:shadow-lg cursor-pointer"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
                </div>
            </section>

            {/* ── Live Now / Upcoming Live Pujas (md+ only) ── */}
            <LiveNowSection />

            {/* ── Book by Need (md+ only) ── */}
            <BookByNeedRow />

            {/* ── Featured Puja banner (Maa Chintpurni) ── */}
            {FEATURED_PUJA_BANNER && (
                <section className="px-4 pt-6 md:w-full md:px-8 lg:px-10 md:pt-14 lg:pt-16">
                    <button
                        onClick={() => navigate(`/${DURGA_MATA_PUJA_SLUG}`)}
                        aria-label="Book Maa Chintpurni Pooja"
                        className="block w-full active:scale-[0.99] transition-transform cursor-pointer md:max-w-3xl md:mx-auto md:transition-all md:duration-300 md:hover:-translate-y-1 md:hover:shadow-2xl"
                    >
                        <img
                            src={FEATURED_PUJA_BANNER}
                            alt="Maa Chintpurni Pooja — Book Now"
                            className="w-full h-auto rounded-2xl shadow-md md:rounded-3xl"
                            loading="lazy"
                        />
                    </button>
                </section>
            )}

             {/* ── Our Services ── */}
            <OurServices />

            {/* ── Sacred Chadhava Sewa ── */}
            <SacredChadhavaSewa />

            {/* ── Consultation ── */}
            <section className="px-4 pt-6 md:w-full md:px-8 lg:px-10 md:pt-14 lg:pt-16">
                <div className="flex items-center gap-2">
                    <h2 className="text-[22px] font-bold text-stone-900 shrink-0 md:text-3xl lg:text-4xl md:tracking-tight">Consultation</h2>
                    <MessageSquare className="w-5 h-5 text-orange-500 shrink-0 md:w-6 md:h-6" />
                    <span className="h-px w-6 bg-orange-300 shrink-0 md:w-10" />
                    <span className="text-[12.5px] text-stone-500 font-medium truncate md:text-sm">Talk to experienced pandit ji</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 md:mt-6 md:gap-5">
                    {CONSULTATIONS.map(({ icon: Icon, label, sub, path, tint }) => (
                        <button
                            key={label}
                            onClick={() => {
                                if (label === "Chat") {
                                    if (window.fbq) {
                                        window.fbq("track", "Instant Chat Request", {
                                            content_name: "Instant Chat",
                                            content_type: "consultation",
                                        });
                                    }
                                    window.open("https://play.google.com/store/apps/details?id=com.panditJiAtReqapp&hl=en_IN", "_blank");
                                } else {
                                    navigate(path);
                                }
                            }}
                            className="bg-white rounded-2xl py-2 px-2 flex flex-col items-center gap-1 border border-orange-100 shadow-sm active:scale-95 transition-transform cursor-pointer md:py-8 md:px-6 md:gap-2 md:transition-all md:duration-300 md:hover:shadow-lg md:hover:-translate-y-1"
                        >
                            <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${tint} md:w-14 md:h-14 md:rounded-2xl`}>
                                <Icon className="w-5 h-5 md:w-7 md:h-7" />
                            </span>
                            <span className="text-[13px] font-bold text-stone-800 md:text-lg">{label}</span>
                            <span className="text-[10.5px] font-medium text-stone-400 md:text-[13px]">{sub}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Verified Pandit Ji ── */}
            <VerifiedPanditJi />

            {/* ── Pooja by Problem ── */}
            <PoojaByProblem />

            {/* ── Available Cities ── */}
            {/* <AvailableCities /> */}

            {/* ── Devotee Testimonials ── */}
            <Testimonials />

            {/* ── Frequently Asked Questions ── */}
            <FAQSection />

            {/* ── Why Devotees Trust Us & Sanatan App ── */}
            <TrustSanatanSection />

            {/* ── How It Works (md+ only) ── */}
            <div className="hidden md:block md:w-full md:px-8 lg:px-10 md:pt-12 lg:pt-16">
                <HowItWorksSection />
            </div>

            {/* ── Call To Action Banner ── */}
            <CTASection />

            <footer className="px-4 pt-1 pb-6 text-center md:hidden">
                <p className="text-[13px] font-medium text-stone-400">
                    &copy; {new Date().getFullYear()} VEDICVAIBHAV DOT COM PRIVATE LIMITED. All Rights Reserved.
                </p>
            </footer>

            {/* Mobile Nav Menu Drawer Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99] max-w-md mx-auto md:max-w-none"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 h-full w-[300px] bg-[#FFFAF3] shadow-2xl z-[100] flex flex-col max-w-md"
                        >
                            {/* Drawer Header */}
                            <div
                                className="relative px-5 pt-6 pb-5"
                                style={{
                                    background: "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)",
                                }}
                            >
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-3 mb-3">
                                    <img
                                        src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
                                        alt="Logo"
                                        className="w-12 h-12 object-contain rounded-xl bg-white/20 p-1"
                                        loading="lazy"
                                    />
                                    <div>
                                        <h2 className="text-base font-bold text-white leading-tight">
                                            Pandit Ji At Request
                                        </h2>
                                        <p className="text-[11px] text-orange-100 font-medium mt-0.5">
                                            शुभ मुहूर्त • पूजा • मार्गदर्शन
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Links */}
                            <nav className="flex-1 px-4 py-4 overflow-y-auto">
                                <ul className="flex flex-col gap-1">
                                    {!isLoggedIn && (
                                        <li>
                                            <button
                                                onClick={() => { setIsMenuOpen(false); openLoginModal(); }}
                                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 hover:bg-orange-50 hover:text-orange-700 transition-colors text-left cursor-pointer"
                                            >
                                                <span className="text-lg">🔐</span>
                                                <span className="text-sm font-medium">Login / Register</span>
                                            </button>
                                        </li>
                                    )}
                                    {[
                                        // { label: "Profile", href: "/account", icon: "👤" },
                                        { label: "My Bookings", href: "/account?tab=bookings", icon: "📖" },
                                        { label: "Book Puja Now", href: "/book-puja", icon: "🪔" },
                                        // { label: "Free consultation", href: "/free-consultation", icon: "🙏" },
                                        { label: "Paid consultation", href: "/paid-consultation", icon: "📞" },
                                    ]
                                    .filter(link => isLoggedIn || (link.label !== "Profile" && link.label !== "My Bookings"))
                                    .map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                to={link.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                                            >
                                                <span className="text-base">{link.icon}</span>
                                                <span className="text-sm font-medium">{link.label}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>

                            {/* Footer */}
                            <div className="p-4 border-t border-orange-100">
                                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 flex flex-col items-center gap-3">
                                    <p className="text-[11px] text-stone-500 text-center font-medium">
                                        Download Pandit Ji At Request App
                                    </p>
                                    <a
                                        href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp&hl=en_IN"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm text-center shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        Download Now
                                    </a>
                                    <Link
                                        to="/privacypolicy"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-[11.5px] font-semibold text-stone-500 hover:text-orange-700 transition-colors"
                                    >
                                        Privacy Policy
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
