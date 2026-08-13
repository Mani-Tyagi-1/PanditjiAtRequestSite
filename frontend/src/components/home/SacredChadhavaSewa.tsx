import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Share2, ChevronRight } from "lucide-react";
import axios from "axios";
import { CHADHAVA_FALLBACK, Chadhava } from "./chadhavaFallback";
import API_URL from "../../utils/apiConfig";
import { money } from "../../utils/currency";
import analytics from "../../utils/analytics";

const CHADHAVA_LIST_URL = `${API_URL}/config/get-all-new-chadhava-proxy`;

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
        <span className="text-[11px] font-bold text-stone-700 tabular-nums">
            {timeLeft}
        </span>
    );
}


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

const isTodayOrFutureDate = (value: unknown): boolean => {
    if (!value) return false;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date.getTime() >= today.getTime();
};

const normalizeChadhava = (item: any): Chadhava => {
    const id = item._id || item.id || "";
    
    // If it's already fully normalized with a startingPrice
    if (item.deity && item.image && typeof item.startingPrice === "number") {
        return {
            id,
            deity: item.deity,
            templeName: item.templeName,
            image: item.image,
            startingPrice: item.startingPrice,
            originalPrice: item.originalPrice,
            tags: item.tags || []
        };
    }

    const deity = item.deity || item.chadhavaName || "";
    // Legacy Vedic Vaibhav docs expose `selectedMandirs`; current PJAR docs
    // expose `mandirs`. Reading only the legacy key left templeName empty on
    // every PJAR chadhava. Same both-shapes lookup ChadhavaPage/DetailPage do.
    const mandir = item.selectedMandirs?.[0] || item.mandirs?.[0];
    let templeName = item.templeName || "";
    if (mandir && !templeName) {
        templeName = mandir.nameEnglish || mandir.mandirName || mandir.name || "";
    }
    
    // Images may be plain URL strings (new PJAR format) or upload objects (legacy VV).
    const imgLoc = (v: any): string => (v && typeof v === "object" ? v.location : v) || "";
    const image = item.image || imgLoc(item.chadhavaWebCardImage) || imgLoc(item.chadhavaAppImage) || "";
    
    let startingPrice = item.startingPrice || 501;
    let originalPrice = item.originalPrice;
    
    const prices: number[] = [];
    const sections = item.chadhavaSections || item.sections;
    if (Array.isArray(sections)) {
        for (const sec of sections) {
            if (Array.isArray(sec.items)) {
                for (const it of sec.items) {
                    const pr = it.discountedPrice || it.itemPrice || it.chadhavaPrice;
                    if (pr) prices.push(Number(pr));
                }
            }
        }
    }
    const chadhavaItems = item.chadhavaItems || item.items;
    if (Array.isArray(chadhavaItems)) {
        for (const it of chadhavaItems) {
            const pr = Number(it.chadhavaPrice || it.itemPrice || it.discountedPrice);
            if (!isNaN(pr)) prices.push(pr);
        }
    }
    
    if (prices.length > 0) {
        startingPrice = Math.min(...prices);
        if (item.offer?.offerStartPrice) {
            originalPrice = Number(item.offer.offerStartPrice);
        } else if (!originalPrice) {
            originalPrice = Math.round(startingPrice * 2.2);
        }
    }
    
    const tags = item.isFeatured ? ["Most Booked"] : (item.isExclusive ? ["New Offerings"] : (item.tags || []));

    return {
        id,
        deity,
        templeName,
        image,
        startingPrice,
        originalPrice,
        tags,
        availableDates: item.availableDates || []
    } as any;
};

export default function SacredChadhavaSewa() {
    const navigate = useNavigate();
    const [items, setItems] = useState<Chadhava[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const response = await axios.get(CHADHAVA_LIST_URL, {
                    timeout: 12000,
                    headers: { Accept: "application/json" },
                });

                const payload = response.data;
                const rawItems = Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload?.items)
                        ? payload.items
                        : Array.isArray(payload)
                            ? payload
                            : [];

                const activeItems = rawItems.filter(
                    (item: any) =>
                        item?.isActive !== false &&
                        Array.isArray(item?.availableDates) &&
                        item.availableDates.some(isTodayOrFutureDate)
                );

                const finalItems = activeItems.length > 0 ? activeItems : CHADHAVA_FALLBACK;
                setItems(finalItems.map(normalizeChadhava));
            } catch (err) {
                console.error("Error loading chadhavas:", err);
                setItems(CHADHAVA_FALLBACK.map(normalizeChadhava));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (!loading && items.length === 0) return null;

    return (
        <section className="px-4 pt-6">
            {/* Custom Header matching screenshot style */}
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[22px] font-black text-[#2E1F15] tracking-tight shrink-0 flex items-center gap-1.5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Sacred Chadhava Sewa
                </h2>
                <span className="h-[1px] w-6 bg-stone-300 shrink-0" />
                <span className="text-[12.5px] text-stone-500 font-medium truncate">Direct Temple Offerings</span>
                <button
                    onClick={() => navigate("/chadhava")}
                    className="ml-auto flex items-center gap-0.5 text-[14px] font-bold text-orange-600 active:scale-95 transition-transform shrink-0 cursor-pointer"
                >
                    View All <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="mt-3 flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x scroll-px-4 [&>*:last-child]:mr-1">
                {loading
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="shrink-0 w-[78%] max-w-[290px] md:w-[300px] bg-[#FFFDF9] rounded-[32px] overflow-hidden border border-[#FFEFE2] animate-pulse snap-start">
                            <div className="h-44 bg-stone-200" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-stone-200 rounded w-3/4" />
                                <div className="flex items-center justify-between mt-2">
                                    <div className="h-6 bg-stone-200 rounded w-1/3" />
                                    <div className="h-9 bg-stone-200 rounded-full w-24" />
                                </div>
                            </div>
                        </div>
                    ))
                    : items.map((c: any) => {
                        const targetDate = c.availableDates?.[0] || new Date(Date.now() + 13 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString();

                        return (
                            <div 
                                key={c.id} 
                                onClick={() => navigate(`/chadhava/${c.id}`)}
                                className="shrink-0 w-[65%] max-w-[290px] md:w-[300px] bg-[#FFFDF9] rounded-[20px] overflow-hidden border border-[#FFEFE2] shadow-[0_12px_36px_-12px_rgba(224,90,16,0.12)] cursor-pointer active:scale-[0.99] transition-transform snap-start flex flex-col justify-between"
                            >
                                {/* Banner / Image Area */}
                                <div className="relative w-full h-35 overflow-hidden rounded-t-[20px]">
                                    <img 
                                        src={c.image} 
                                        alt={c.deity} 
                                        loading="lazy" 
                                        className="w-full h-full object-cover" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                    

                                    {/* Top-Right Share Button */}
                                    <button 
                                        onClick={(e) => handleShare(e, c)}
                                        className="absolute top-2 right-2 w-6 h-6  bg-white/95 rounded-full flex items-center justify-center shadow-md border border-stone-100/50 active:scale-90 transition-transform"
                                    >
                                        <Share2 className="w-4 h-4 text-stone-700" />
                                    </button>

                                    {/* Bottom-Left Countdown Timer */}
                                    <div className="absolute bottom-1 left-1 bg-white/95 rounded-[10px] px-2 py-0.5 flex items-center gap-2 shadow-sm border border-stone-100/50">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                        </span>
                                        <CountdownTimer targetDate={targetDate} />
                                    </div>
                                </div>

                                {/* Body / Content Area */}
                                <div className="p-3 pt-1 flex flex-col gap-2.5">
                                    {/* Title */}
                                    <h3 
                                        className="text-[16px] font-bold text-[#2E1F15] tracking-tight line-clamp-1 text-left"
                                        title={c.deity}
                                    >
                                        {c.deity}
                                    </h3>

                                    {/* Price and Action Row */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[25px] font-extrabold text-[#D85C0E]">
                                            {money(c.startingPrice)}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                analytics.metaBridge("Chadhava Offer Now", {
                                                    content_name: c.deity,
                                                    content_ids: [c.id],
                                                    content_type: "chadhava",
                                                    value: c.startingPrice,
                                                    currency: "INR",
                                                });
                                                navigate(`/chadhava/${c.id}`);
                                            }}
                                            className="bg-[#E05A10] hover:bg-[#C94D0C] text-white font-bold text-[13px] px-7 py-1 rounded-full shadow-lg shadow-orange-200/50 hover:shadow-orange-300/40 active:scale-95 transition-all duration-200"
                                        >
                                            Offer Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </section>
    );
}
