import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, MapPin, CalendarDays, Share2 } from "lucide-react";
import API_URL from "../utils/apiConfig";
// Devshayani Ekadashi combo (frontend-only campaign card — remove this import
// and the <DevshayaniComboCard/> below to disable the whole feature)
import { DevshayaniComboCard } from "../components/DevshayaniComboCard";
import analytics from "../utils/analytics";

/**
 * Chadhava records to hide from THIS listing, by Mongo `_id`.
 *
 * A presentation-only filter: the record stays active in the backend and its
 * detail page at /chadhava/<id> still resolves, so any link already shared or
 * running in an ad keeps working — it is only withheld from the grid here.
 * Deactivate the record in the admin instead if it should be gone everywhere.
 */
const HIDDEN_CHADHAVA_IDS = new Set<string>([
    "6a67a05951d2fb61b47ddd5c",
]);

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
    // Legacy Vedic Vaibhav docs expose `selectedMandirs`; current PJAR docs
    // expose `mandirs`. Reading only the legacy key left templeName/Location
    // empty on every PJAR chadhava, so the card rendered a bare map pin with no
    // text beside it. Same both-shapes lookup ChadhavaDetailPage already does.
    const mandir = item.selectedMandirs?.[0] || item.mandirs?.[0];
    let templeName = item.templeName || "";
    let templeLocation = item.templeLocation || "";
    if (mandir) {
        // `nameEnglish` is the PJAR/VV field; the others cover older records.
        if (!templeName) templeName = mandir.nameEnglish || mandir.mandirName || mandir.name || "";
        if (!templeLocation) templeLocation = mandir.city || mandir.location || "";
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

export default function ChadhavaPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState<Chadhava[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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
                        !HIDDEN_CHADHAVA_IDS.has(String(item?._id || item?.id || "")) &&
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

    return (
        <div className="font-sans min-h-screen bg-[#FFFDF9]/60">
            <Helmet>
                <title>Chadhava Seva | Pandit Ji At Request</title>
            </Helmet>

            {/* ── Header ── */}
            <div className="relative px-4 pt-3 pb-5 bg-gradient-to-b from-[#f7d9ad] to-[#FFFAF3] shadow-sm">
                <button
                    onClick={() => navigate("/home")}
                    className="absolute left-4 top-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                >
                    <ArrowLeft className="w-4 h-4 text-stone-700" strokeWidth={2.5} />
                </button>
                <h1 className="text-center text-[26px] font-bold text-orange-600 tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Chadhava Seva
                </h1>
                <p className="text-center text-[12.5px] text-stone-500 -mt-0.5">
                    Offer prayers &amp; prasad directly at sacred temples
                </p>
            </div>

            {/* ── List ── */}
            <section className="px-4 pt-4 space-y-5 pb-8">
                {/* Devshayani Ekadashi combo — frontend-only campaign card (removable) */}
                <DevshayaniComboCard />

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
                    <p className="text-center text-stone-400 text-[13px] py-10">
                        Could not load Chadhava offerings. Please try again later.
                    </p>
                )}

                {!loading && !error && items.length === 0 && (
                    <p className="text-center text-stone-400 text-[13px] py-10">No Chadhava offerings available right now. 🌺</p>
                )}

                {!loading &&
                    items.map((c) => {
                        const eventTag = getEventTag(c);
                        const targetDate = c.availableDates?.[0] || new Date(Date.now() + 13 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString();
                        const displayDate = c.availableDates?.[0] ? formatDate(c.availableDates[0]) : "";
                        const cleanTitle = c.deity.replace(/\s*\([^)]*\)\s*$/, "").trim();

                        return (
                            <div 
                                key={c.id} 
                                onClick={() => navigate(`/chadhava/${c.id}`)}
                                className="bg-[#FFFDF9] rounded-[24px] overflow-hidden border border-[#FFEFE2] shadow-[0_12px_36px_-12px_rgba(224,90,16,0.12)] cursor-pointer active:scale-[0.995] transition-transform flex flex-col"
                            >
                                {/* Banner Image container */}
                                <div className="relative w-full h-52 overflow-hidden rounded-t-[24px]">
                                    <img 
                                        src={c.image} 
                                        alt={c.deity} 
                                        className="w-full h-full object-cover" 
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
                                        className="absolute top-3 right-3 w-8 h-8 bg-white/95 rounded-full flex items-center justify-center shadow-md border border-stone-100/50 active:scale-90 transition-transform"
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
                                <div className="p-4 flex flex-col gap-2">
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
                                            analytics.metaBridge("Chadhava Participate Now", {
                                                content_name: c.deity,
                                                content_ids: [c.id],
                                                content_type: "chadhava",
                                                value: c.startingPrice,
                                                currency: "INR",
                                            });
                                            navigate(`/chadhava/${c.id}`);
                                        }}
                                        className="mt-3.5 w-full bg-[#E05A10] hover:bg-[#C94D0C] text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-1.5 shadow-lg shadow-orange-200/50 hover:shadow-orange-300/40 active:scale-[0.985] transition-all duration-200 text-[14.5px]"
                                    >
                                        <span>Participate Now</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
            </section>
        </div>
    );
}
