import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarDays, Star, Minus, Plus, Gift, Check, ShieldCheck, Share2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import API_URL from "../utils/apiConfig";
import { type Chadhava, type ChadhavaSelection } from "../components/booking/ChadhavaBooking/chadhavaData";
import ChadhavaBookingModal from "../components/booking/ChadhavaBooking/ChadhavaBookingModal";

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

export default function ChadhavaDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [chadhava, setChadhava] = useState<Chadhava | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [qty, setQty] = useState<Record<string, number>>({});
    const [addPrasad, setAddPrasad] = useState(false);
    const [prasadUpsellOpen, setPrasadUpsellOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"about" | "history">("about");

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_URL}/chadhavas/${slug}`);
                if (!res.ok) throw new Error("Chadhava not found");
                const json = await res.json();
                
                const raw = json.data;
                if (!raw) throw new Error("Chadhava data is empty");
                
                const normalized: Chadhava = {
                    id: raw._id || raw.id || "",
                    slug: raw.slug || raw._id || raw.id || "",
                    deity: raw.chadhavaName || raw.deity || "",
                    deityHindi: raw.deityHindi || "",
                    templeName: raw.selectedMandirs?.[0]?.nameEnglish || raw.templeName || "",
                    templeLocation: raw.selectedMandirs?.[0]?.city || raw.templeLocation || "",
                    image: raw.chadhavaWebCardImage?.location || raw.chadhavaAppImage?.location || raw.image || "",
                    offeringDay: raw.offeringDay || (raw.availableDates?.length ? "Available on: " + raw.availableDates.join(", ") : ""),
                    availableDates: raw.availableDates || [],
                    startingPrice: raw.startingPrice || 0,
                    originalPrice: raw.originalPrice,
                    rating: raw.rating || 5,
                    devoteesOffered: raw.devoteesOffered || 0,
                    benefits: Array.isArray(raw.benefits) ? raw.benefits.map((b: any) => typeof b === "object" ? b.description : b) : [],
                    tags: raw.tags || [],
                    sections: (raw.chadhavaSections || raw.sections || []).map((sec: any) => ({
                        sectionName: sec.sectionName || "",
                        items: (sec.items || []).map((it: any, index: number) => ({
                            code: it.code || it.itemName || `item_${index}`,
                            itemName: it.itemName || "",
                            itemDesc: it.itemDesc || "",
                            itemImage: it.itemImage?.location || it.itemImage || "",
                            itemPrice: (it.discountedPrice && it.discountedPrice > 0) ? it.discountedPrice : (it.itemPrice || it.chadhavaPrice || 0),
                            maxQuantity: it.maxQuantity || 10,
                            popular: it.popular || false,
                            isActive: it.isActive !== false,
                            type: it.type || "item"
                        }))
                    })),
                    prasad: raw.prasad || { enabled: false, price: 0, name: "", desc: "", image: "" },
                    description: raw.description || "",
                    mandirAppImage: raw.selectedMandirs?.[0]?.mandirAppImage || "",
                    mandirSectionIntro: raw.selectedMandirs?.[0]?.mandirSectionIntro || "",
                    mandirSectionHistory: raw.selectedMandirs?.[0]?.mandirSectionHistory || ""
                };

                // Calculate startingPrice and originalPrice dynamically if not set
                if (normalized.startingPrice === 0) {
                    const prices: number[] = [];
                    for (const sec of normalized.sections) {
                        for (const it of sec.items) {
                            if (it.itemPrice) prices.push(it.itemPrice);
                        }
                    }
                    if (prices.length > 0) {
                        normalized.startingPrice = Math.min(...prices);
                        normalized.originalPrice = raw.originalPrice || Math.round(normalized.startingPrice * 2.2);
                    }
                }
                
                setChadhava(normalized);

                // Auto select the first offering
                const firstItem = normalized.sections?.[0]?.items?.find((i: any) => i.isActive !== false && i.type !== "combo");
                if (firstItem) {
                    setQty({ [firstItem.code]: 1 });
                }
            } catch (err) {
                console.error("Error fetching chadhava details:", err);
                setError("Failed to load offering details. It may not exist or is inactive.");
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    // Meta Pixel: track chadhava detail view
    useEffect(() => {
        if (chadhava && window.fbq) {
            window.fbq("track", "ViewContent", {
                content_name: chadhava.deity,
                content_ids: [chadhava.id],
                content_type: "chadhava",
                value: chadhava.startingPrice,
                currency: "INR",
            });
        }
    }, [chadhava]);

    const itemByCode = useMemo(() => {
        const map = new Map<string, { name: string; price: number; max: number }>();
        chadhava?.sections.forEach((s) =>
            s.items.forEach((i) => map.set(i.code, { name: i.itemName, price: i.itemPrice, max: i.maxQuantity }))
        );
        return map;
    }, [chadhava]);

    const setItemQty = (code: string, next: number) => {
        const max = itemByCode.get(code)?.max ?? 10;
        const clamped = Math.max(0, Math.min(next, max));
        setQty((q) => {
            const copy = { ...q };
            if (clamped === 0) delete copy[code];
            else copy[code] = clamped;
            return copy;
        });
    };

    const handleShare = async (e: React.MouseEvent, c: any) => {
        e.stopPropagation();
        if (!c) return;
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

    const handleAddAll = () => {
        if (!chadhava) return;
        const newQty: Record<string, number> = {};
        chadhava.sections.forEach(sec => {
            sec.items.forEach(it => {
                if (it.isActive !== false && it.type !== "combo") {
                    newQty[it.code] = 1;
                }
            });
        });
        setQty(newQty);
    };

    const selections: ChadhavaSelection[] = useMemo(
        () =>
            Object.entries(qty).map(([code, quantity]) => {
                const meta = itemByCode.get(code)!;
                return { code, name: meta.name, unitPrice: meta.price, quantity };
            }),
        [qty, itemByCode]
    );

    const prasadPrice = addPrasad ? 298 : 0;
    const itemsTotal = selections.reduce((s, x) => s + x.unitPrice * x.quantity, 0);
    const grandTotal = itemsTotal + prasadPrice;
    const sevasSelected = selections.length;
    const targetDate = chadhava?.availableDates?.[0] || new Date(Date.now() + 13 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFAF6] w-full max-w-md mx-auto border-x border-rose-100 animate-pulse">
                <div className="h-56 bg-stone-200" />
                <div className="p-5 space-y-4">
                    <div className="h-6 bg-stone-200 rounded w-1/3" />
                    <div className="h-24 bg-stone-200 rounded-2xl" />
                    <div className="h-24 bg-stone-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error || !chadhava) {
        return (
            <div className="min-h-screen bg-[#FFFAF6] flex flex-col items-center justify-center p-6 text-center w-full max-w-md mx-auto border-x border-rose-100">
                <span className="text-4xl">🌺</span>
                <h2 className="text-lg font-bold text-stone-800 mt-4">Error Loading Chadhava</h2>
                <p className="text-xs text-stone-500 mt-2 max-w-[280px]">{error || "The requested chadhava does not exist."}</p>
                <button onClick={() => navigate("/chadhava")} className="mt-6 bg-rose-600 text-white font-bold px-6 py-2.5 rounded-xl active:scale-95 transition-all">
                    Back to Chadhava
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFAF6] pb-28 font-sans w-full max-w-md mx-auto border-x border-rose-100 relative">
            <Helmet>
                <title>{`${chadhava.deity} Chadhava at ${chadhava.templeName} | Pandit Ji At Request`}</title>
            </Helmet>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#FFFAF6]/95 backdrop-blur-md border-b border-rose-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-rose-200/50 shadow-sm active:scale-90 transition-transform">
                        <ArrowLeft className="w-4 h-4 text-stone-700" />
                    </button>
                    <h1 className="text-[15px] font-bold text-stone-800">Chadhava Details</h1>
                </div>
                <button onClick={(e) => handleShare(e, chadhava)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-rose-200/50 shadow-sm active:scale-90 transition-transform">
                    <Share2 className="w-4 h-4 text-stone-700" />
                </button>
            </div>

            {/* Hero banner */}
            <div className="relative h-52">
                <img src={chadhava.image} alt={chadhava.deity} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#7a1c12]/95 via-[#9b2d18]/55 to-black/25" />
                {!!chadhava.tags?.length && (
                    <span className="absolute top-3 left-3 bg-amber-400 text-amber-950 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                        {chadhava.tags[0]}
                    </span>
                )}
                <div className="absolute top-3 right-3 bg-white/95 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm border border-stone-100/30">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    <CountdownTimer targetDate={targetDate} />
                </div>
                <span className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/45 backdrop-blur-sm text-white text-[12px] font-bold px-2 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {chadhava.rating.toFixed(1)}
                </span>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h2 className="text-[26px] font-bold leading-none" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        {chadhava.deity}
                    </h2>
                    {chadhava.deityHindi && <p className="text-[13px] text-rose-100 mt-1">{chadhava.deityHindi}</p>}
                </div>
            </div>

            {/* Info card */}
            <div className="px-4 -mt-4 relative z-10">
                <div className="bg-white rounded-[24px] border border-[#FFEFE2] shadow-[0_12px_36px_-12px_rgba(224,90,16,0.12)] p-5 space-y-2.5">
                    <div className="flex items-start gap-2.5 text-[13.5px] text-stone-700">
                        <MapPin className="w-4 h-4 text-[#E05A10] shrink-0 mt-0.5" />
                        <span className="font-semibold text-left">{chadhava.templeName}{chadhava.templeLocation ? `, ${chadhava.templeLocation}` : ""}</span>
                    </div>
                    {chadhava.offeringDay && (
                        <div className="flex items-center gap-2.5 text-[13px] text-stone-600">
                            <CalendarDays className="w-4 h-4 text-[#E05A10] shrink-0" />
                            <span className="font-medium text-left">{chadhava.offeringDay}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Choose Your Offerings Card */}
            <div className="px-4 pt-5">
                <div className="bg-[#FFF8F2] border border-[#FFE6D3] rounded-[20px] p-4 flex items-center justify-between">
                    <div className="leading-tight text-left">
                        <h3 className="text-[15.5px] font-bold text-[#2E1F15]">Choose Your Offerings</h3>
                        <p className="text-[12.5px] text-[#E05A10] font-semibold mt-0.5">
                            {sevasSelected === 0 ? "No offerings selected" : `${sevasSelected} selected`}
                        </p>
                    </div>
                    <div className="flex items-center">
                        {sevasSelected > 0 && (
                            <button
                                onClick={() => setQty({})}
                                className="text-[12.5px] font-bold text-stone-400 hover:text-stone-600 transition-colors mr-3"
                            >
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={handleAddAll}
                            className="bg-[#E05A10] hover:bg-[#C94D0C] text-white text-[12.5px] font-bold px-4 py-2 rounded-full shadow-md active:scale-95 transition-all flex items-center gap-1"
                        >
                            <span>Add All</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Sections */}
            {chadhava.sections.map((section) => {
                const regularItems = section.items.filter((i) => i.isActive !== false && i.type !== "combo");
                const comboItems = section.items.filter((i) => i.isActive !== false && i.type === "combo");

                return (
                    <div key={section.sectionName} className="px-4 pt-4">
                        {/* Section Title */}
                        <div className="flex items-center gap-2 mt-2 mb-3">
                            <span className="w-6 h-6 rounded-full bg-[#FFE6D3] flex items-center justify-center shrink-0">
                                <span className="text-[12px]">🕉️</span>
                            </span>
                            <h4 className="text-[15.5px] font-bold text-[#2E1F15] tracking-tight">
                                {section.sectionName}
                            </h4>
                            <div className="h-[1px] bg-[#FFEFE2] flex-1 ml-2" />
                        </div>

                        {/* Regular Offerings Row (Horizontal Scroll) */}
                        {regularItems.length > 0 && (
                            <div className="flex gap-3.5 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x">
                                {regularItems.map((item) => {
                                    const count = qty[item.code] || 0;
                                    return (
                                        <div 
                                            key={item.code} 
                                            className={`w-[155px] shrink-0 bg-white rounded-[20px] border transition-all snap-start flex flex-col justify-between ${
                                                count > 0 ? "border-[#E05A10] shadow-md shadow-orange-50/50" : "border-[#FFEFE2] shadow-sm"
                                            }`}
                                        >
                                            <div>
                                                {/* Image */}
                                                <div className="relative w-full h-[105px] overflow-hidden rounded-t-[19px]">
                                                    <img 
                                                        src={item.itemImage} 
                                                        alt={item.itemName} 
                                                        className="w-full h-full object-cover" 
                                                        loading="lazy" 
                                                    />
                                                    {item.popular && (
                                                        <span className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                                                            ★ Popular
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Details */}
                                                <div className="p-3 text-left">
                                                    <h5 className="text-[13.5px] font-bold text-[#2E1F15] line-clamp-1">
                                                        {item.itemName}
                                                    </h5>
                                                    <p className="text-[11px] text-stone-500 mt-0.5 leading-tight line-clamp-2 h-[28px]">
                                                        {item.itemDesc}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Footer Price & Action */}
                                            <div className="p-3 pt-0 flex items-center justify-between mt-auto">
                                                <span className="text-[14px] font-extrabold text-[#2E1F15]">
                                                    ₹{item.itemPrice}
                                                </span>
                                                
                                                {count === 0 ? (
                                                    <button
                                                        onClick={() => setItemQty(item.code, 1)}
                                                        className="bg-white hover:bg-[#FFE6D3] text-[#E05A10] border border-[#E05A10] text-[11px] font-bold px-3 py-1 rounded-md active:scale-95 transition-transform"
                                                    >
                                                        ADD
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 border border-[#E05A10] rounded-md px-1 py-0.5 bg-[#FFF8F2]">
                                                        <button 
                                                            onClick={() => setItemQty(item.code, count - 1)} 
                                                            className="w-4 h-4 flex items-center justify-center text-[#E05A10] active:scale-90"
                                                        >
                                                            <Minus className="w-3 h-3" strokeWidth={3} />
                                                        </button>
                                                        <span className="text-[11.5px] font-bold text-stone-800 w-3 text-center">{count}</span>
                                                        <button 
                                                            onClick={() => setItemQty(item.code, count + 1)} 
                                                            className="w-4 h-4 flex items-center justify-center text-[#E05A10] active:scale-90"
                                                        >
                                                            <Plus className="w-3 h-3" strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Combo Offering Card (Full Width) */}
                        {comboItems.map((item) => {
                            const count = qty[item.code] || 0;
                            return (
                                <div 
                                    key={item.code} 
                                    className={`w-full bg-white rounded-[24px] border overflow-hidden mt-3 transition-all ${
                                        count > 0 ? "border-[#E05A10] shadow-md shadow-orange-50/50" : "border-[#FFEFE2] shadow-sm"
                                    }`}
                                >
                                    {/* Image displayed fully */}
                                    <div className="w-full bg-[#FFFDF9] border-b border-[#FFEFE2]">
                                        <img 
                                            src={item.itemImage} 
                                            alt={item.itemName} 
                                            className="w-full h-auto object-contain max-h-[220px]" 
                                            loading="lazy" 
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="p-5 text-left">
                                        <p className="text-[13.5px] text-[#2E1F15] font-semibold leading-relaxed">
                                            {item.itemName}
                                        </p>
                                        {item.itemDesc && item.itemDesc !== item.itemName && (
                                            <p className="text-[12px] text-stone-500 mt-2 leading-relaxed">
                                                {item.itemDesc}
                                            </p>
                                        )}

                                        {/* Price & Action */}
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#FFEFE2]">
                                            <span className="text-[19px] font-extrabold text-[#2E1F15]">
                                                ₹{item.itemPrice}
                                            </span>

                                            {count === 0 ? (
                                                <button
                                                    onClick={() => setItemQty(item.code, 1)}
                                                    className="bg-[#E05A10] hover:bg-[#C94D0C] text-white text-[13px] font-bold px-6 py-2.5 rounded-full active:scale-95 transition-transform shadow-md shadow-orange-100/50"
                                                >
                                                    ADD COMBO
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3 border border-[#E05A10] rounded-full px-3 py-1.5 bg-[#FFF8F2]">
                                                    <button 
                                                        onClick={() => setItemQty(item.code, count - 1)} 
                                                        className="w-5 h-5 flex items-center justify-center text-[#E05A10] active:scale-90"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                                                    </button>
                                                    <span className="text-[13.5px] font-bold text-stone-800 w-4 text-center">{count}</span>
                                                    <button 
                                                        onClick={() => setItemQty(item.code, count + 1)} 
                                                        className="w-5 h-5 flex items-center justify-center text-[#E05A10] active:scale-90"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {/* Prasad add-on */}
            {chadhava.prasad?.enabled && (
                <div className="px-4 pt-5">
                    <button
                        onClick={() => setAddPrasad((v) => !v)}
                        className={`w-full text-left bg-white rounded-2xl border-2 p-3 flex gap-3 items-center transition-colors ${addPrasad ? "border-emerald-400 bg-emerald-50/40" : "border-dashed border-amber-300"}`}
                    >
                        <span className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <Gift className="w-5 h-5 text-amber-600" />
                        </span>
                        <div className="flex-1 min-w-0">
                            <h5 className="text-[13.5px] font-bold text-stone-800">{chadhava.prasad.name}</h5>
                            <p className="text-[11px] text-stone-500 leading-snug">{chadhava.prasad.desc}</p>
                        </div>
                        <span className={`flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-lg ${addPrasad ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                            {addPrasad ? <><Check className="w-3.5 h-3.5" strokeWidth={3} /> Added</> : `Add ₹${chadhava.prasad.price}`}
                        </span>
                    </button>
                </div>
            )}

            {/* About Chadhava */}
            {chadhava.description && (
                <div className="px-4 pt-5">
                    <div className="bg-white rounded-[24px] border border-[#FFEFE2] p-5 shadow-sm">
                        <h3 className="text-[16px] font-bold text-[#2E1F15] mb-2 text-left">
                            About Chadhava
                        </h3>
                        <p className="text-[12.5px] text-stone-600 leading-relaxed text-left whitespace-pre-line">
                            {chadhava.description}
                        </p>
                    </div>
                </div>
            )}

            {/* Benefits */}
            {!!chadhava.benefits?.length && (
                <div className="px-4 pt-5">
                    <div className="bg-white rounded-[24px] border border-[#FFEFE2] p-5 shadow-sm">
                        <h3 className="text-[16px] font-bold text-[#2E1F15] mb-3 text-left">
                            Benefits
                        </h3>
                        <div className="space-y-2.5">
                            {chadhava.benefits.map((benefit, i) => (
                                <div key={i} className="flex items-center gap-2.5 text-[12.5px] text-stone-700">
                                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                        <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                                    </span>
                                    <span className="font-medium text-left">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Temple Details Bottom Section (About/History Tabs) */}
            {(chadhava.mandirSectionIntro || chadhava.mandirSectionHistory) && (
                <div className="px-4 pt-5">
                    <div className="bg-white rounded-[24px] border border-[#FFEFE2] overflow-hidden shadow-sm">
                        {chadhava.mandirAppImage && (
                            <div className="w-full h-36 overflow-hidden">
                                <img 
                                    src={chadhava.mandirAppImage} 
                                    alt={chadhava.templeName} 
                                    className="w-full h-full object-cover" 
                                    loading="lazy" 
                                />
                            </div>
                        )}
                        
                        <div className="p-5">
                            {/* Tab Headers */}
                            <div className="flex border-b border-[#FFEFE2] mb-3.5 gap-6">
                                <button
                                    onClick={() => setActiveTab("about")}
                                    className={`pb-2 text-[14px] font-bold transition-all px-1 relative ${
                                        activeTab === "about" ? "text-[#E05A10]" : "text-stone-400"
                                    }`}
                                >
                                    About
                                    {activeTab === "about" && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E05A10] rounded-full" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={`pb-2 text-[14px] font-bold transition-all px-1 relative ${
                                        activeTab === "history" ? "text-[#E05A10]" : "text-stone-400"
                                    }`}
                                >
                                    History
                                    {activeTab === "history" && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E05A10] rounded-full" />
                                    )}
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="text-[12.5px] text-stone-600 leading-relaxed text-left whitespace-pre-line">
                                {activeTab === "about" 
                                    ? chadhava.mandirSectionIntro 
                                    : chadhava.mandirSectionHistory
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Trust */}
            <div className="px-4 pt-5">
                <div className="bg-white border border-[#FFEFE2] rounded-2xl py-3.5 px-4 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11.5px] text-stone-500 leading-snug text-left">
                        You'll receive a photo/video of your chadhava being offered. 100% secure payment & refund guarantee if the ritual is not performed.
                    </p>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-[#FFEFE2] px-4 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="leading-none text-left">
                    <span className="text-[11.5px] text-stone-500 font-semibold">Sevas Selected: {sevasSelected}</span>
                    <p className="text-[20px] font-bold text-[#E05A10] mt-0.5">₹{grandTotal.toLocaleString("en-IN")}</p>
                </div>
                <button
                    onClick={() => setPrasadUpsellOpen(true)}
                    disabled={sevasSelected === 0}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-orange-200/70 active:scale-95 transition-transform disabled:opacity-50 disabled:shadow-none"
                >
                    Proceed Seva ›
                </button>
            </div>

            {/* Prasad Upsell Modal */}
            <AnimatePresence>
                {prasadUpsellOpen && (
                    <div className="fixed inset-0 z-[200] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                            onClick={() => setPrasadUpsellOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 32, stiffness: 320 }}
                            className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 text-center shadow-2xl z-10"
                        >
                            {/* Drag Indicator */}
                            <div className="w-12 h-1 bg-stone-200 rounded-full mx-auto mb-5" />

                            <h3 className="text-[20px] font-bold text-[#2E1F15] flex items-center justify-center gap-1">
                                Complete Your Devotion 🙏
                            </h3>
                            <p className="text-[12.5px] text-red-500 font-bold mt-1">
                                96% of devotees add Sacred Prasad
                            </p>

                            {/* Prasad Box Detail Card */}
                            <div className="mt-5 border border-[#FFEFE2] rounded-2xl p-4 bg-[#FFFDF9] flex gap-3 text-left items-center">
                                <div className="w-16 h-16 rounded-xl bg-orange-50 overflow-hidden shrink-0 border border-orange-100 flex items-center justify-center">
                                    <img 
                                        src={chadhava.prasad?.image || chadhava.image} 
                                        alt="Prasad Box" 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[14px] font-bold text-[#2E1F15]">Mandir Prasad Box</h4>
                                    <p className="text-[11.5px] text-stone-500 mt-0.5 leading-snug">
                                        Assorted satvik prasad blessed directly at the temple during your Seva.
                                    </p>
                                    <p className="text-[15.5px] font-extrabold text-[#E05A10] mt-1">₹298</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={() => {
                                        setAddPrasad(true);
                                        setPrasadUpsellOpen(false);
                                        setModalOpen(true);
                                    }}
                                    className="w-full bg-[#E05A10] hover:bg-[#C94D0C] text-white font-bold py-3.5 rounded-full active:scale-95 transition-transform shadow-md shadow-orange-100/50"
                                >
                                    Add Prasad & Proceed ›
                                </button>
                                <button
                                    onClick={() => {
                                        setAddPrasad(false);
                                        setPrasadUpsellOpen(false);
                                        setModalOpen(true);
                                    }}
                                    className="block w-full text-center text-[12.5px] text-stone-400 hover:text-stone-600 underline py-2 font-medium cursor-pointer"
                                >
                                    No thanks, I will skip the sacred prasad
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ChadhavaBookingModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                chadhava={chadhava}
                selections={selections}
                addPrasad={addPrasad}
                prasadPrice={prasadPrice}
            />
        </div>
    );
}
