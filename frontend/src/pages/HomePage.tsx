import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Seo from "../components/seo/Seo";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    ChevronRight,
    Phone,
    Video,
    MessageSquare,
    Flame,
    Flower2,
    Menu,
    X,
    User,
} from "lucide-react";
import API_URL from "../utils/apiConfig";
import { useAuth } from "../context/AuthContext";
// import { kashiMahadevPuja, KASHI_MAHADEV_PUJA_SLUG } from "../data/kashiMahadevPuja";
// import { kaalBhairavPuja, KAAL_BHAIRAV_PUJA_SLUG } from "../data/kaalBhairavPuja";
// import { hanumanPuja, HANUMAN_PUJA_SLUG } from "../data/hanumanPuja";
import {
    bankeBihariPuja, BANKE_BIHARI_PUJA_SLUG, BANKE_BIHARI_POOJA_ID, BANNER_IMG,
} from "../data/bankeBihariPuja";
import { optimizedImg } from "../utils/img";
import OurServices from "../components/home/OurServices";
import SacredChadhavaSewa from "../components/home/SacredChadhavaSewa";
import VerifiedPanditJi from "../components/home/VerifiedPanditJi";
import PoojaByProblem from "../components/home/PoojaByProblem";
import Testimonials from "../components/booking/Testimonials";
import FAQSection from "../components/home/FAQSection";
import TrustSanatanSection from "../components/home/TrustSanatanSection";
import CTASection from "../components/home/CTASection";

const LOGO =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/pjar_logo-removebg-preview.png";

// ── Featured puja banner (Home, between "Book Puja" and "Our Services") ──
// 👉 PASTE THE CREATIVE URL HERE. Defaults to the Kashi banner so the slot is
//    never broken; swap the string for your own artwork when it's ready.
// CAMPAIGN STOPPED (Savan 2026 / Kashi Rudrabhishek) — the banner section below
// is commented out along with these constants and the route in App.tsx.
// const FEATURED_PUJA_BANNER =
//     "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Kashi%20banner1.png";

// Where the banner sends the devotee. Kept next to the image so the creative and
// its destination can never drift apart.
// const FEATURED_PUJA_HREF = `/${KASHI_MAHADEV_PUJA_SLUG}`;

// Intrinsic size of the creative, used only to reserve the right amount of
// vertical space while it loads so the sections below don't jump (CLS).
// const FEATURED_PUJA_BANNER_W = 1080;
// const FEATURED_PUJA_BANNER_H = 566;

// ── Second featured puja banner: Kaal Bhairav Kalashtami campaign ──
// 👉 PASTE THE CREATIVE URL HERE. Defaults to the Kaal Bhairav banner so the
//    slot is never broken; swap the string for your own artwork when ready.
// const FEATURED_PUJA_2_BANNER =
//     "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Kaal%20Bhairava%20Banner.webp";
// const FEATURED_PUJA_2_HREF = `/${KAAL_BHAIRAV_PUJA_SLUG}`;

// ── Third featured puja banner: Hanuman Garhi Savan Mangalwar campaign ──
// 👉 PASTE THE CREATIVE URL HERE. Defaults to the Hanuman Garhi banner so the
//    slot is never broken; swap the string for your own artwork when ready.
// const FEATURED_PUJA_3_BANNER =
//     "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Hanuman%20gari%20ji%20banner.webp";
// const FEATURED_PUJA_3_HREF = `/${HANUMAN_PUJA_SLUG}`;

// ── LIVE featured puja banner: Banke Bihari Ji Janmashtami campaign ──
// 👉 PASTE A DEDICATED HOME CREATIVE HERE. It defaults to the puja page's own
//    hero banner, so the slot is never broken.
const JANMASHTAMI_BANNER = BANNER_IMG;

// Where the banner sends the devotee. Kept next to the image so the creative and
// its destination can never drift apart.
const JANMASHTAMI_HREF = `/${BANKE_BIHARI_PUJA_SLUG}`;

// Intrinsic size of the creative, used only to reserve the right amount of
// vertical space while it loads so the sections below don't jump (CLS). Read off
// the actual file — change these together with the URL above.
const JANMASHTAMI_BANNER_W = 1672;
const JANMASHTAMI_BANNER_H = 941;


type Pooja = {
    _id: string;
    /** Stable catalog key. Present in the list projection; used to route the
     *  handful of poojas that have their own themed page. */
    poojaID?: string;
    poojaNameEng: string;
    poojaNameHindi?: string;
    poojaCardImage?: string;
    poojaPriceOnline?: number;
    poojaPriceOffline?: number;
    isFeatured?: boolean;
    featuredRank?: number;
};

/**
 * Where a catalog card should go.
 *
 * Poojas normally open the generic `/puja/:id` page, but Banke Bihari Ji has its
 * own themed page with its own packages and prasad boxes. Without this the card
 * in "Book Puja" would quietly route around all of that to a page that knows
 * nothing about them. Falls back to the generic route, so an older API response
 * without `poojaID` behaves exactly as before.
 */
const poojaHref = (p: Pooja) =>
    p.poojaID === BANKE_BIHARI_POOJA_ID ? `/${BANKE_BIHARI_PUJA_SLUG}` : `/puja/${p._id}`;

const CONSULTATIONS = [
    { icon: Phone, label: "Talk on Call", sub: "Speak Directly", path: "/paid-consultation?type=voice", tint: "bg-orange-100 text-orange-600" },
    { icon: Video, label: "Video Call", sub: "Face to Face", path: "/paid-consultation?type=video", tint: "bg-green-100 text-green-600" },
    { icon: MessageSquare, label: "Chat", sub: "Instant Answers", path: "/free-consultation", tint: "bg-sky-100 text-sky-600" },
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
            .replace(/[^\w\s\u0900-\u097F]/g, "") // support English and Devanagari/Hindi chars
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


            {/* ── Header ── */}
            <div
                className="sticky top-0 z-30 px-4 pt-3 pb-4 bg-[#FFFAF3]/95 backdrop-blur-md border-b border-orange-100/30"
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
                                            navigate(poojaHref(p));
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

            {/* ── Book Puja ── */}
            <section className="px-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-[22px] font-bold text-stone-900 shrink-0">Book Puja</h2>
                    <Flower2 className="w-5 h-5 text-orange-500 shrink-0" />
                    <span className="h-px w-6 bg-orange-300 shrink-0" />
                    <span className="text-[12.5px] text-stone-500 font-medium truncate">Poojas just for you</span>
                    <button
                        onClick={() => navigate("/book-puja")}
                        className="ml-auto flex items-center gap-0.5 text-[14px] font-bold text-orange-600 active:scale-95 transition-transform shrink-0"
                    >
                        View All <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="mt-3 pb-2 flex gap-3 overflow-x-auto scrollbar-hide snap-x scroll-px-2 [&>*:last-child]:mr-1">
                    {loading
                        ? Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="shrink-0 w-[38%] bg-white rounded-3xl p-2 shadow-sm animate-pulse">
                                <div className="h-28 bg-stone-200 rounded-2xl" />
                                <div className="px-1 pt-3 pb-2 space-y-2">
                                    <div className="h-3 bg-stone-200 rounded w-3/4 mx-auto" />
                                    <div className="h-3.5 bg-stone-200 rounded w-1/2 mx-auto" />
                                </div>
                            </div>
                        ))
                        : poojas.map((p) => (
                            <button
                                key={p._id}
                                onClick={() => navigate(poojaHref(p))}
                                className="shrink-0 w-[38%] bg-white rounded-3xl border border-orange-100 shadow-sm text-center active:scale-[0.98] transition-transform snap-start"
                            >
                                <div className="relative h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-300 via-orange-300 to-orange-400">
                                    {p.poojaCardImage && (
                                        <img src={p.poojaCardImage} alt={p.poojaNameEng} className="w-full h-full object-cover" loading="lazy" />
                                    )}
                                    {p.isFeatured && (
                                        <span className="absolute top-2 left-2 flex items-center gap-1 bg-white text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            <Flame className="w-3 h-3 fill-orange-500 text-orange-500" /> Popular
                                        </span>
                                    )}
                                </div>
                                <div className="px-1 pt-3 pb-2">
                                    <h3 className="text-[13px] font-bold text-stone-800 leading-tight line-clamp-2 min-h-[32px]">
                                        {p.poojaNameEng}
                                    </h3>
                                    <p className="mt-1 text-[14px] font-bold text-orange-600">
                                        ₹{priceOf(p).toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </button>
                        ))}
                    {!loading && poojas.length === 0 && (
                        <p className="text-[13px] text-stone-400 py-6">No poojas available right now.</p>
                    )}
                </div>
            </section>

            {/* ── Featured puja banner ── CAMPAIGN STOPPED (Savan 2026).
                A single tappable creative promoting the Savan Rudrabhishek page.
                Swap FEATURED_PUJA_BANNER at the top of this file to change the
                artwork; the destination lives next to it.
            <section className="px-4">
                <button
                    onClick={() => {
                        if (window.fbq) {
                            window.fbq("track", "ViewContent", {
                                content_name: kashiMahadevPuja.poojaNameEng,
                                content_ids: [kashiMahadevPuja._id],
                                content_type: "product",
                                value: kashiMahadevPuja.poojaPriceOnline,
                                currency: "INR",
                            });
                        }
                        navigate(FEATURED_PUJA_HREF);
                    }}
                    aria-label={`Book ${kashiMahadevPuja.poojaNameEng} at ${kashiMahadevPuja.templeName}`}
                    className="block w-full rounded-3xl overflow-hidden border border-orange-100 shadow-sm active:scale-[0.98] transition-transform"
                >
                    <img
                        src={FEATURED_PUJA_BANNER}
                        width={FEATURED_PUJA_BANNER_W}
                        height={FEATURED_PUJA_BANNER_H}
                        alt={`${kashiMahadevPuja.poojaNameEng} — ${kashiMahadevPuja.occasion} at ${kashiMahadevPuja.templeName}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-auto object-cover"
                    />
                </button>
            </section>
            */}

            {/* ── Featured puja banner ── Banke Bihari Ji Janmashtami.
                One tappable creative into the themed puja page. ViewContent
                fires here as well as on the puja page itself, so the home
                banner's own contribution to the funnel is measurable. */}
            <section className="px-4">
                <button
                    onClick={() => {
                        window.fbq?.("track", "ViewContent", {
                            content_name: bankeBihariPuja.poojaNameEng,
                            content_ids: [bankeBihariPuja._id],
                            content_type: "product",
                            value: bankeBihariPuja.poojaPriceOnline,
                            currency: "INR",
                            source: "home_banner",
                        });
                        navigate(JANMASHTAMI_HREF);
                    }}
                    aria-label={`Book ${bankeBihariPuja.poojaNameEng} at ${bankeBihariPuja.templeName}`}
                    className="block w-full rounded-3xl overflow-hidden border border-orange-100 shadow-sm active:scale-[0.98] transition-transform"
                >
                    <img
                        src={optimizedImg(JANMASHTAMI_BANNER, 900)}
                        onError={(e) => { e.currentTarget.src = JANMASHTAMI_BANNER; }}
                        width={JANMASHTAMI_BANNER_W}
                        height={JANMASHTAMI_BANNER_H}
                        alt={`${bankeBihariPuja.poojaNameEng} — ${bankeBihariPuja.occasion} at ${bankeBihariPuja.templeName}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-auto object-cover"
                    />
                </button>
            </section>

             {/* ── Our Services ── */}
            <OurServices />

            {/* ── Sacred Chadhava Sewa ── */}
            <SacredChadhavaSewa />

            {/* ── Consultation ── */}
            <section className="px-4 pt-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-[22px] font-bold text-stone-900 shrink-0">Consultation</h2>
                    <MessageSquare className="w-5 h-5 text-orange-500 shrink-0" />
                    <span className="h-px w-6 bg-orange-300 shrink-0" />
                    <span className="text-[12.5px] text-stone-500 font-medium truncate">Talk to experienced pandit ji</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
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
                            className="bg-white rounded-2xl py-2 px-2 flex flex-col items-center gap-1 border border-orange-100 shadow-sm active:scale-95 transition-transform cursor-pointer"
                        >
                            <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${tint}`}>
                                <Icon className="w-5 h-5" />
                            </span>
                            <span className="text-[13px] font-bold text-stone-800">{label}</span>
                            <span className="text-[10.5px] font-medium text-stone-400">{sub}</span>
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

            {/* ── Call To Action Banner ── */}
            <CTASection />

            <footer className="px-4 pt-1 pb-6 text-center">
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
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99] max-w-md mx-auto"
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
