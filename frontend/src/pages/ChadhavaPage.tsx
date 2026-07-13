import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
    ArrowLeft, MapPin, CalendarDays, Share2,
    ShieldCheck, Video, Users, Gift, Phone, MessageCircle, ChevronRight,
} from "lucide-react";
import API_URL from "../utils/apiConfig";
// Devshayani Ekadashi combo (frontend-only campaign card — remove this import
// and the <DevshayaniComboCard/> below to disable the whole feature)
import { DevshayaniComboCard } from "../components/DevshayaniComboCard";
import { HOLY_PANDITS } from "../components/booking/KashiVrindavanPandits/kashiVrindavanData";

// Support contacts — same number used across the site (AppLayout/SiteFooter/DesktopHeader).
const SUPPORT_PHONE = "919056955311";
const WHATSAPP_URL =
    `https://wa.me/${SUPPORT_PHONE}?text=` +
    encodeURIComponent("🙏 Namaste! I have a question about Chadhava Seva.");

type Chadhava = {
    id: string;
    slug: string;
    deity: string;
    deityHindi?: string;
    templeName: string;
    templeLocation?: string;
    image: string;
    offeringDay?: string;
    startingPrice: number;
    originalPrice?: number;
    rating?: number;
    devoteesOffered?: number;
    benefits?: string[];
    tags?: string[];
    availableDates?: string[];
    description?: string;
};

function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const calculateTime = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();
            if (difference <= 0) {
                setTimeLeft("Offerings Closed");
                return;
            }
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            const hh = String(hours).padStart(2, "0");
            const mm = String(minutes).padStart(2, "0");
            const ss = String(seconds).padStart(2, "0");

            setTimeLeft(`${days}d ${hh}:${mm}:${ss}`);
        };

        calculateTime();
        const timer = setInterval(calculateTime, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <span className="text-[11.5px] font-bold text-stone-700 tabular-nums">
            {timeLeft}
        </span>
    );
}

const getEventTag = (c: any) => {
    const match = c.deity.match(/\(([^)]+)\)/);
    if (match?.[1]) {
        return match[1].trim();
    }
    if (c.tags && c.tags.length > 0) {
        return c.tags[0];
    }
    return "Seva Booking";
};

const handleShare = async (e: React.MouseEvent, c: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/chadhava/${c.id}`;
    if (navigator.share) {
        try {
            await navigator.share({
                title: c.deity,
                text: `Offer sacred Chadhava at ${c.templeName}`,
                url: url
            });
        } catch (err) {
            console.error("Share failed:", err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
        } catch (err) {
            console.error("Clipboard copy failed:", err);
        }
    }
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });
};

const isTodayOrFutureDate = (value: unknown): boolean => {
    if (!value) return false;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date.getTime() >= today.getTime();
};

// New PJAR chadhavas store `description` as a Quill delta JSON string
// (`{"ops":[{"insert":"..."}]}`); convert to plain text. Legacy/site docs are
// already plain and pass through unchanged.
const toPlainDescription = (value?: string): string => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed.startsWith("{") || !trimmed.includes("\"ops\"")) return value;
    try {
        const delta = JSON.parse(trimmed);
        if (Array.isArray(delta?.ops)) {
            return delta.ops
                .map((op: any) => (typeof op?.insert === "string" ? op.insert : ""))
                .join("")
                .trim();
        }
    } catch {
        /* not valid JSON — return original */
    }
    return value;
};

const normalizeChadhavaItem = (item: any): Chadhava => {
    const id = item._id || item.id || "";

    // If it's already fully normalized
    if (item.deity && item.image && typeof item.startingPrice === "number") {
        return {
            id,
            slug: item.slug || id,
            deity: item.deity,
            deityHindi: item.deityHindi || "",
            templeName: item.templeName,
            templeLocation: item.templeLocation || "",
            image: item.image,
            offeringDay: item.offeringDay || "",
            startingPrice: item.startingPrice,
            originalPrice: item.originalPrice,
            rating: item.rating || 5,
            devoteesOffered: item.devoteesOffered || 0,
            benefits: item.benefits || [],
            tags: item.tags || [],
            availableDates: item.availableDates || [],
            description: toPlainDescription(item.description)
        };
    }

    const deity = item.deity || item.chadhavaName || "";
    const mandir = item.selectedMandirs?.[0];
    let templeName = item.templeName || "";
    let templeLocation = item.templeLocation || "";
    if (mandir) {
        if (!templeName) templeName = mandir.nameEnglish || "";
        if (!templeLocation) templeLocation = mandir.city || "";
    }

    // Images may be plain URL strings (new PJAR format) or upload objects (legacy VV).
    const imgLoc = (v: any): string => (v && typeof v === "object" ? v.location : v) || "";
    const image = item.image || imgLoc(item.chadhavaWebCardImage) || imgLoc(item.chadhavaAppImage) || "";

    // Calculate sections & items
    const rawSections = item.chadhavaSections || item.sections || [];
    const prices: number[] = [];
    if (Array.isArray(rawSections)) {
        for (const sec of rawSections) {
            if (Array.isArray(sec.items)) {
                for (const it of sec.items) {
                    const pr = it.discountedPrice || it.itemPrice || it.chadhavaPrice;
                    if (pr) prices.push(Number(pr));
                }
            }
        }
    }
    const rawItems = item.chadhavaItems || item.items;
    if (Array.isArray(rawItems)) {
        for (const it of rawItems) {
            const pr = Number(it.chadhavaPrice || it.itemPrice || it.discountedPrice);
            if (!isNaN(pr)) prices.push(pr);
        }
    }

    let startingPrice = item.startingPrice || 501;
    let originalPrice = item.originalPrice;
    if (prices.length > 0) {
        startingPrice = Math.min(...prices);
        if (item.offer?.offerStartPrice) {
            originalPrice = Number(item.offer.offerStartPrice);
        } else if (!originalPrice) {
            originalPrice = Math.round(startingPrice * 2.2);
        }
    }

    const tags = item.isFeatured ? ["Most Booked"] : (item.isExclusive ? ["New Offerings"] : (item.tags || []));
    const benefits = Array.isArray(item.benefits)
        ? item.benefits.map((b: any) => (typeof b === "object" ? b.description : b))
        : [];

    return {
        id,
        slug: item.slug || id,
        deity,
        deityHindi: item.deityHindi || "",
        templeName,
        templeLocation,
        image,
        offeringDay: item.offeringDay || (item.availableDates?.length ? "Available on: " + item.availableDates.join(", ") : ""),
        startingPrice,
        originalPrice,
        rating: item.rating || 5,
        devoteesOffered: item.devoteesOffered || 0,
        benefits,
        tags,
        availableDates: item.availableDates || [],
        description: toPlainDescription(item.description)
    };
};

// ── Desktop-only: tab / temple-select / purpose-filter helpers ──
// (Header "Chadhava ▾" dropdown links to /chadhava?tab=<value> using exactly
// these 5 values — see components/layout/DesktopHeader.tsx.)
const CHADHAVA_TABS: { value: "festival" | "temple" | "upcoming" | "live" | "value"; label: string }[] = [
    { value: "festival", label: "Festival Specials" },
    { value: "temple", label: "Temple-wise" },
    { value: "upcoming", label: "Upcoming" },
    { value: "live", label: "Live Chadhava" },
    { value: "value", label: "Best Value" },
];
type ChadhavaTab = typeof CHADHAVA_TABS[number]["value"];

const PURPOSE_FILTERS: { label: string; keywords: string[] }[] = [
    { label: "Health & Wellness", keywords: ["health", "wellness", "heal", "illness", "disease"] },
    { label: "Prosperity & Wealth", keywords: ["wealth", "prosper", "money", "finance", "business"] },
    { label: "Marriage & Relationships", keywords: ["marriage", "relationship", "love", "vivah"] },
    { label: "Career & Success", keywords: ["career", "success", "job", "growth"] },
    { label: "Protection & Peace", keywords: ["protection", "peace", "shanti", "negative", "evil"] },
    { label: "Education & Knowledge", keywords: ["education", "knowledge", "study", "vidya", "exam"] },
];

const parseDateMs = (v?: string): number => {
    if (!v) return Number.POSITIVE_INFINITY;
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
};

const earliestAvailableMs = (c: Chadhava): number => {
    const dates = (c.availableDates || []).map(parseDateMs);
    return dates.length ? Math.min(...dates) : Number.POSITIVE_INFINITY;
};

const isLiveTagged = (c: Chadhava): boolean => (c.tags || []).some((t) => /\blive\b/i.test(t));

export default function ChadhavaPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [items, setItems] = useState<Chadhava[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedTemple, setSelectedTemple] = useState("");
    const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_URL}/config/get-all-new-chadhava-proxy`);
                if (!res.ok) throw new Error("Failed");
                const json = await res.json();

                const rawItems = Array.isArray(json?.data)
                    ? json.data
                    : Array.isArray(json?.items)
                        ? json.items
                        : Array.isArray(json)
                            ? json
                            : [];

                const activeItems = rawItems.filter(
                    (item: any) =>
                        item?.isActive !== false &&
                        (Array.isArray(item?.availableDates) ? item.availableDates.some(isTodayOrFutureDate) : true)
                );

                setItems(activeItems.map(normalizeChadhavaItem));
            } catch (err) {
                console.error("Error loading chadhavas:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Desktop tab contract: read ?tab=, default to "festival" when absent/unrecognized.
    const tabParam = searchParams.get("tab");
    const tab: ChadhavaTab = CHADHAVA_TABS.some((t) => t.value === tabParam)
        ? (tabParam as ChadhavaTab)
        : "festival";

    const goToTab = (value: ChadhavaTab) => {
        const next = new URLSearchParams(searchParams);
        next.set("tab", value);
        setSearchParams(next);
    };

    const templeOptions = useMemo(
        () => Array.from(new Set(items.map((c) => c.templeName).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
        [items]
    );

    // "festival" (default) = all items — kept unfiltered so the default (no
    // query param) view is identical to the original, always-shown list.
    const tabFilteredItems = useMemo(() => {
        switch (tab) {
            case "temple":
                return selectedTemple ? items.filter((c) => c.templeName === selectedTemple) : items;
            case "upcoming":
                return [...items].sort((a, b) => earliestAvailableMs(a) - earliestAvailableMs(b));
            case "live":
                return items.filter(isLiveTagged);
            case "value":
                return [...items].sort((a, b) => a.startingPrice - b.startingPrice);
            case "festival":
            default:
                return items;
        }
    }, [items, tab, selectedTemple]);

    const filteredItems = useMemo(() => {
        if (!selectedPurpose) return tabFilteredItems;
        const purpose = PURPOSE_FILTERS.find((p) => p.label === selectedPurpose);
        if (!purpose) return tabFilteredItems;
        return tabFilteredItems.filter((c) => {
            const haystack = [c.deity, c.templeName, ...(c.tags || []), ...(c.benefits || []), c.description || ""]
                .join(" ")
                .toLowerCase();
            return purpose.keywords.some((k) => haystack.includes(k));
        });
    }, [tabFilteredItems, selectedPurpose]);

    const trendingItems = useMemo(() => {
        const mostBooked = items.filter((c) => (c.tags || []).includes("Most Booked"));
        return (mostBooked.length > 0 ? mostBooked : items).slice(0, 4);
    }, [items]);

    // Honest devotee-trust line: real sum of devoteesOffered across the fetched
    // chadhavas when it's large enough to read credibly, else the same
    // "50,000+ Devotees" copy already used elsewhere on the site (BookPujaPage).
    const totalDevotees = useMemo(() => items.reduce((sum, c) => sum + (c.devoteesOffered || 0), 0), [items]);
    const trustLine = totalDevotees >= 1000
        ? `${totalDevotees.toLocaleString("en-IN")}+ Devotees Trust Us`
        : "50,000+ Devotees Trust Us";

    const needHelpPandit = HOLY_PANDITS[0];

    return (
        <div className="font-sans min-h-screen bg-[#FFFDF9]/60">
            <Helmet>
                <title>Chadhava Seva | Pandit Ji At Request</title>
            </Helmet>

            {/* ── Header (mobile — unchanged; desktop hero below replaces it) ── */}
            <div className="relative px-4 pt-3 pb-5 bg-gradient-to-b from-[#f7d9ad] to-[#FFFAF3] shadow-sm md:pt-12 md:pb-12 lg:pt-16 lg:pb-14 md:hidden">
                <button
                    onClick={() => navigate("/home")}
                    className="absolute left-4 top-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm active:scale-90 transition-transform md:hidden"
                >
                    <ArrowLeft className="w-4 h-4 text-stone-700" strokeWidth={2.5} />
                </button>
                <h1 className="text-center text-[26px] font-bold text-orange-600 tracking-tight md:text-4xl lg:text-5xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Chadhava Seva
                </h1>
                <p className="text-center text-[12.5px] text-stone-500 -mt-0.5 md:text-[15px] md:mt-2 lg:text-base">
                    Offer prayers &amp; prasad directly at sacred temples
                </p>
            </div>

            {/* ── Desktop Hero split ── */}
            <section className="hidden md:block bg-gradient-to-b from-[#f7d9ad]/70 to-[#FFFAF3] border-b border-[#FFEFE2]">
                <div className="md:px-8 lg:px-10 md:py-10 lg:py-14 md:flex md:flex-col lg:flex-row lg:items-center lg:gap-12">
                    <div className="lg:flex-1 lg:max-w-sm lg:min-w-0">
                        <h1 className="text-4xl lg:text-5xl font-bold text-orange-600 tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            Chadhava Seva
                        </h1>
                        <p className="mt-2 text-[15px] lg:text-base text-stone-600 font-medium">
                            Offer prayers &amp; prasad directly at sacred temples
                        </p>
                        <p className="mt-4 text-[14px] lg:text-[15px] text-stone-500 leading-relaxed">
                            Every Chadhava is performed by verified temple priests in your name and gotra, with photo and video proof shared with you after the seva is complete.
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 bg-white/80 border border-orange-100 rounded-full px-4 py-2 shadow-sm">
                            <Users className="w-4 h-4 text-orange-500" />
                            <span className="text-[13px] font-bold text-stone-700">{trustLine}</span>
                        </div>
                    </div>
                    <div className="mt-8 lg:mt-0 lg:w-[58%] lg:shrink-0">
                        <DevshayaniComboCard />
                    </div>
                </div>
            </section>

            {/* ── Desktop Tabs ── */}
            <section className="hidden md:block bg-[#FFFAF3] border-b border-[#FFEFE2]">
                <div className="md:px-8 lg:px-10 md:py-5 flex flex-wrap items-center gap-2.5">
                    {CHADHAVA_TABS.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => goToTab(t.value)}
                            className={`px-4 py-2 rounded-full text-[13.5px] font-bold transition-colors cursor-pointer ${
                                tab === t.value
                                    ? "bg-[#E05A10] text-white shadow-sm"
                                    : "bg-white text-stone-600 border border-orange-100 hover:bg-orange-50"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}

                    {tab === "temple" && (
                        <select
                            value={selectedTemple}
                            onChange={(e) => setSelectedTemple(e.target.value)}
                            className="ml-1 px-3.5 py-2 rounded-full text-[13px] font-semibold text-stone-600 bg-white border border-orange-100 cursor-pointer focus:outline-none focus:border-orange-300"
                        >
                            <option value="">All Temples</option>
                            {templeOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </section>

            {/* ── Desktop Trust row ── */}
            <section className="hidden md:block md:px-8 lg:px-10 md:pt-8">
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { icon: ShieldCheck, label: "Verified Temples & Pandits" },
                        { icon: Video, label: "Live Video Proof" },
                        { icon: Users, label: trustLine },
                        { icon: Gift, label: "Prasad Delivered Home" },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="bg-white border border-orange-100 rounded-2xl py-4 px-3 flex flex-col items-center gap-1.5 text-center shadow-sm">
                            <Icon className="w-5 h-5 text-orange-500" />
                            <span className="text-[12.5px] font-bold text-stone-600 leading-tight">{label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Desktop Trending Chadhavas row ── */}
            {trendingItems.length > 0 && (
                <section className="hidden md:block md:px-8 lg:px-10 md:pt-10">
                    <h2 className="text-2xl lg:text-[28px] font-bold text-[#2E1F15]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        Trending Chadhavas
                    </h2>
                    <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-5">
                        {trendingItems.map((c) => {
                            const cleanTitle = c.deity.replace(/\s*\([^)]*\)\s*$/, "").trim();
                            const isMostBooked = (c.tags || []).includes("Most Booked");
                            return (
                                <div
                                    key={`trending-${c.id}`}
                                    onClick={() => navigate(`/chadhava/${c.id}`)}
                                    className="bg-[#FFFDF9] rounded-2xl overflow-hidden border border-[#FFEFE2] shadow-sm cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-14px_rgba(224,90,16,0.24)]"
                                >
                                    <div className="relative h-32 overflow-hidden">
                                        <img src={c.image} alt={c.deity} className="w-full h-full object-cover" loading="lazy" />
                                        {isMostBooked && (
                                            <span className="absolute top-2 left-2 bg-[#E05A10] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                Most Booked
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-3.5">
                                        <p className="text-[11px] font-bold text-orange-500 uppercase tracking-wide truncate">{c.templeName}</p>
                                        <h3 className="mt-0.5 text-[15px] font-bold text-[#2E1F15] truncate">{cleanTitle}</h3>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-[14px] font-bold text-stone-800">₹{c.startingPrice.toLocaleString("en-IN")}</span>
                                            <ChevronRight className="w-4 h-4 text-orange-500" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── List / Main grid (+ "Need Help?" sidebar at lg+) ── */}
            <section className="px-4 pt-4 space-y-5 pb-8 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 lg:gap-7 md:space-y-0 md:items-stretch md:w-full md:px-8 lg:px-10 md:pt-10 lg:pt-12 md:pb-16 lg:pb-20">
                {/* Devshayani Ekadashi combo — frontend-only campaign card (removable).
                    Shown pinned to the top on mobile only (unchanged); on desktop the
                    Hero above already carries this card as the big combo banner. */}
                <div className="md:hidden">
                    {tab === "festival" && <DevshayaniComboCard />}
                </div>

                {/* "Need Help?" sidebar — lg+ only. Reserved as a real grid item
                    (col 3, rows 1-2) so the rest of the grid naturally reflows
                    around it without needing to wrap/restyle the section itself. */}
                <aside className="hidden lg:flex lg:flex-col lg:col-start-3 lg:row-start-1 lg:row-span-2 bg-white rounded-[24px] border border-orange-100 shadow-sm p-6">
                    <img
                        src={needHelpPandit.image}
                        alt={needHelpPandit.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-orange-100"
                    />
                    <h3 className="mt-3 text-lg font-bold text-[#2E1F15]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        Need Help Choosing?
                    </h3>
                    <p className="mt-1.5 text-[13px] text-stone-500 leading-relaxed">
                        Talk to our team for guidance on the right Chadhava for your intention.
                    </p>
                    <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-2.5 rounded-full text-[13.5px] shadow-sm hover:brightness-105 transition-all cursor-pointer"
                    >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp Us
                    </a>
                    <a
                        href={`tel:+${SUPPORT_PHONE}`}
                        className="mt-2.5 flex items-center justify-center gap-2 bg-white text-stone-700 font-bold py-2.5 rounded-full text-[13.5px] border border-orange-200 hover:bg-orange-50 transition-all cursor-pointer"
                    >
                        <Phone className="w-4 h-4 text-orange-500" />
                        Call Now
                    </a>
                </aside>

                {loading &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-[24px] border border-orange-100/50 overflow-hidden animate-pulse">
                            <div className="h-52 bg-stone-200" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-stone-200 rounded w-1/2" />
                                <div className="h-4 bg-stone-200 rounded w-3/4" />
                                <div className="h-12 bg-stone-200 rounded-full" />
                            </div>
                        </div>
                    ))}

                {!loading && error && (
                    <p className="text-center text-stone-400 text-[13px] py-10 md:col-span-2 lg:col-span-3 md:text-sm">
                        Could not load Chadhava offerings. Please try again later.
                    </p>
                )}

                {!loading && !error && filteredItems.length === 0 && (
                    <p className="text-center text-stone-400 text-[13px] py-10 md:col-span-2 lg:col-span-3 md:text-sm">
                        {tab === "live"
                            ? "No live chadhavas right now — see Festival Specials."
                            : items.length === 0
                                ? "No Chadhava offerings available right now. 🌺"
                                : "No chadhavas match this filter — try a different option."}
                    </p>
                )}

                {!loading &&
                    filteredItems.map((c) => {
                        const eventTag = getEventTag(c);
                        const targetDate = c.availableDates?.[0] || new Date(Date.now() + 13 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString();
                        const displayDate = c.availableDates?.[0] ? formatDate(c.availableDates[0]) : "";
                        const cleanTitle = c.deity.replace(/\s*\([^)]*\)\s*$/, "").trim();

                        return (
                            <div
                                key={c.id}
                                onClick={() => navigate(`/chadhava/${c.id}`)}
                                className="bg-[#FFFDF9] rounded-[24px] overflow-hidden border border-[#FFEFE2] shadow-[0_12px_36px_-12px_rgba(224,90,16,0.12)] cursor-pointer active:scale-[0.995] transition-transform flex flex-col md:h-full md:transition-all md:duration-300 md:hover:-translate-y-1 md:hover:border-orange-200 md:hover:shadow-[0_22px_48px_-14px_rgba(224,90,16,0.24)]"
                            >
                                {/* Banner Image container */}
                                <div className="relative w-full h-52 overflow-hidden rounded-t-[24px]">
                                    <img
                                        src={c.image}
                                        alt={c.deity}
                                        className="w-full h-full object-cover md:transition-transform md:duration-700 md:hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                                    {/* Top-Left Event Pill (Dark grey) */}
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-[2px] text-white px-3.5 py-1 text-[11px] font-bold rounded-full flex items-center gap-1 shadow-sm">
                                        <span>🕉️</span>
                                        <span>{eventTag}</span>
                                    </div>

                                    {/* Top-Right Share Button */}
                                    <button
                                        onClick={(e) => handleShare(e, c)}
                                        className="absolute top-3 right-3 w-8 h-8 bg-white/95 rounded-full flex items-center justify-center shadow-md border border-stone-100/50 active:scale-90 transition-transform cursor-pointer md:hover:bg-white"
                                    >
                                        <Share2 className="w-4 h-4 text-stone-700" />
                                    </button>

                                    {/* Bottom-Left Countdown Timer */}
                                    <div className="absolute bottom-3 left-3 bg-white/95 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm border border-stone-100/30">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                        </span>
                                        <CountdownTimer targetDate={targetDate} />
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 flex flex-col gap-2 md:flex-1 md:p-5">
                                    {/* Temple & Date Row */}
                                    <div className="flex items-center justify-between text-[12.5px] font-semibold text-stone-500 gap-2">
                                        <div className="flex items-center gap-1 min-w-0">
                                            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                            <span className="truncate">{c.templeName}{c.templeLocation ? `, ${c.templeLocation}` : ""}</span>
                                        </div>
                                        {displayDate && (
                                            <div className="flex items-center gap-1 shrink-0 text-amber-800 bg-amber-50/50 px-2 py-0.5 rounded-md">
                                                <CalendarDays className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                                <span>{displayDate}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Deity title */}
                                    <h2 className="text-[19px] font-bold text-[#2E1F15] mt-1 text-left">
                                        {cleanTitle}
                                    </h2>

                                    {/* Description */}
                                    {c.description && (
                                        <p className="text-[13px] text-stone-500 leading-relaxed line-clamp-2 text-left mt-0.5">
                                            {c.description}
                                        </p>
                                    )}

                                    {/* Action button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.fbq) {
                                                window.fbq("track", "Chadhava Participate Now", {
                                                    content_name: c.deity,
                                                    content_ids: [c.id],
                                                    content_type: "chadhava",
                                                    value: c.startingPrice,
                                                    currency: "INR",
                                                });
                                            }
                                            navigate(`/chadhava/${c.id}`);
                                        }}
                                        className="mt-3.5 w-full bg-[#E05A10] hover:bg-[#C94D0C] text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-1.5 shadow-lg shadow-orange-200/50 hover:shadow-orange-300/40 active:scale-[0.985] transition-all duration-200 text-[14.5px] cursor-pointer md:mt-auto md:text-[15px]"
                                    >
                                        <span>Participate Now</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
            </section>

            {/* ── Desktop "Choose by Purpose" row ── */}
            <section className="hidden md:block md:px-8 lg:px-10 md:pb-16 lg:pb-20">
                <h2 className="text-2xl lg:text-[28px] font-bold text-[#2E1F15]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Choose by Purpose
                </h2>
                <div className="mt-4 flex flex-wrap gap-2.5">
                    <button
                        onClick={() => setSelectedPurpose(null)}
                        className={`px-4 py-2 rounded-full text-[13px] font-bold transition-colors cursor-pointer ${
                            selectedPurpose === null
                                ? "bg-[#E05A10] text-white shadow-sm"
                                : "bg-white text-stone-600 border border-orange-100 hover:bg-orange-50"
                        }`}
                    >
                        All Purposes
                    </button>
                    {PURPOSE_FILTERS.map((p) => (
                        <button
                            key={p.label}
                            onClick={() => setSelectedPurpose(selectedPurpose === p.label ? null : p.label)}
                            className={`px-4 py-2 rounded-full text-[13px] font-bold transition-colors cursor-pointer ${
                                selectedPurpose === p.label
                                    ? "bg-[#E05A10] text-white shadow-sm"
                                    : "bg-white text-stone-600 border border-orange-100 hover:bg-orange-50"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
