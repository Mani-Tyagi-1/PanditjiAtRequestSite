import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarDays, Star, Minus, Plus, Gift, Check, ShieldCheck, Share2, ChevronDown, BadgeCheck, Camera, MessageCircle, Clock, } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import API_URL from "../utils/apiConfig";
import { optimizedImg } from "../utils/img";
import { type Chadhava, type ChadhavaSelection } from "../components/booking/ChadhavaBooking/chadhavaData";
// Devshayani Ekadashi combo (frontend-only offering — remove to disable)
import { devshayaniCombo, DEVSHAYANI_COMBO_SLUG, COMBO_TEMPLES, COMBO_PRASAD_BOX_ITEMS } from "../data/devshayaniCombo";
import { money } from "../utils/currency";
import analytics from "../utils/analytics";

function CountdownTimer({ targetDate, variant = "badge" }: { targetDate: string; variant?: "badge" | "bar" | "goldbar" }) {
    const [timeLeft, setTimeLeft] = useState("");
    const isLongFormat = variant === "bar" || variant === "goldbar";

    useEffect(() => {
        const calculateTime = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();
            if (difference <= 0) {
                setTimeLeft(isLongFormat ? "Offerings Closed" : "Closed");
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            if (isLongFormat) {
                setTimeLeft(`${days} Days | ${hours} Hrs | ${minutes} Mins | ${seconds} Sec`);
            } else {
                const hh = String(hours).padStart(2, "0");
                const mm = String(minutes).padStart(2, "0");
                const ss = String(seconds).padStart(2, "0");
                setTimeLeft(`${days}d ${hh}:${mm}:${ss}`);
            }
        };

        calculateTime();
        const timer = setInterval(calculateTime, 1000);
        return () => clearInterval(timer);
    }, [targetDate, isLongFormat]);

    if (variant === "goldbar") {
        return <span className="text-[12.5px] font-bold text-[#7A4A12] tabular-nums tracking-wide">{timeLeft}</span>;
    }

    if (variant === "bar") {
        return <span className="text-[12.5px] font-bold text-white tabular-nums tracking-wide">{timeLeft}</span>;
    }

    return (
        <span className="text-[11.5px] font-bold text-stone-700 tabular-nums">
            {timeLeft}
        </span>
    );
}

/**
 * New PJAR chadhavas store `description` as a Quill delta JSON string, e.g.
 * `{"ops":[{"insert":"..."}]}`. Convert that to readable plain text; pass
 * through anything that is already plain text (legacy/site docs).
 */
function toPlainDescription(value?: string): string {
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
        /* not valid JSON — fall through and return the original string */
    }
    return value;
}

/** Format an ISO date to "29 June 2026 , Monday". */
function formatOfferingDate(dateStr?: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "long" });
    const weekday = d.toLocaleString("en-US", { weekday: "long" });
    return `${day} ${month} ${d.getFullYear()} , ${weekday}`;
}

// Pool of short, genuine-sounding devotee reviews for chadhava offerings. A
// different random subset is shown per chadhava (see seededReviews) so the
// reviews vary page-to-page instead of repeating everywhere.
// ponytail: self-contained here — the LiveMandir page keeps its own puja-context
// pool; the two contexts (offering vs live puja) differ enough that one shared
// list would read wrong on both. TODO: replace with real reviews from the API.
interface ChadhavaReview { name: string; rating: number; date: string; text: string; verified?: boolean; }
const PLACEHOLDER_REVIEWS: ChadhavaReview[] = [
    { name: "Sunita Rao", rating: 5, date: "1 week ago", text: "Offered chadhava in my name at the temple. Got the photos next day. 🙏", verified: true },
    { name: "Rahul Khanna", rating: 5, date: "3 weeks ago", text: "They shared a video of my offering being done. Felt blessed.", verified: true },
    { name: "Geeta Iyer", rating: 5, date: "2 weeks ago", text: "Prasad box reached home nicely packed. Very happy.", verified: true },
    { name: "Mohit Saxena", rating: 4, date: "1 month ago", text: "Smooth booking and got proof of the chadhava. Authentic.", verified: false },
    { name: "Pooja Reddy", rating: 5, date: "6 days ago", text: "Booked from Dubai for my parents. They received the prasad. 🙏", verified: true },
    { name: "Anil Kapoor", rating: 5, date: "1 month ago", text: "First time trying this. Got photos of the offering same day.", verified: true },
    { name: "Shalini Nair", rating: 4, date: "3 weeks ago", text: "Good service. Prasad took a few days but reached safely.", verified: true },
    { name: "Deepa Joshi", rating: 5, date: "2 weeks ago", text: "Loved the photos they sent. Felt like I was at the temple.", verified: false },
    { name: "Vivek Sharma", rating: 5, date: "1 month ago", text: "Genuine offering, no doubts. Will book again.", verified: true },
    { name: "Kiran Patel", rating: 5, date: "4 days ago", text: "Quick updates on WhatsApp and clear photos of chadhava. 🙏", verified: true },
    { name: "Manju Devi", rating: 5, date: "2 months ago", text: "Did this in my late husband's name. Felt peaceful. Thank you.", verified: true },
    { name: "Rohit Verma", rating: 4, date: "3 weeks ago", text: "Overall happy. Would like more photos but satisfied.", verified: false },
    { name: "Sneha Kulkarni", rating: 5, date: "1 week ago", text: "Booking was easy and the prasad was fresh. Recommended.", verified: true },
    { name: "Arvind Menon", rating: 5, date: "1 month ago", text: "Offered in my family's name. Got the video as promised.", verified: true },
    { name: "Neeta Agarwal", rating: 5, date: "5 days ago", text: "Very reliable. Photos came the same evening. 🙏", verified: false },
    { name: "Suresh Nayak", rating: 5, date: "2 months ago", text: "Authentic chadhava and timely prasad delivery. Happy.", verified: true },
    { name: "Lata Pillai", rating: 4, date: "3 weeks ago", text: "Nice experience. Booking could be faster but good service.", verified: true },
    { name: "Gaurav Mehta", rating: 5, date: "1 week ago", text: "Booked from USA, prasad reached my mom in India. 🙏", verified: true },
    { name: "Ritika Singh", rating: 5, date: "1 month ago", text: "They did everything properly and shared proof. Trustworthy.", verified: false },
    { name: "Harish Gupta", rating: 5, date: "2 weeks ago", text: "Simple, genuine and devotional. Got my offering photos.", verified: true },
];

// Pick a stable-but-varied subset of reviews for a chadhava. Seeded by slug so
// the same page always shows the same reviews (no reshuffle on countdown ticks)
// while different chadhavas show different ones.
function seededReviews(seed: string, count: number): ChadhavaReview[] {
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

function ReviewStars({ value }: { value: number }) {
    const full = Math.round(value);
    return (
        <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`w-3 h-3 ${i <= full ? "fill-amber-400 text-amber-400" : "text-stone-300"}`} />
            ))}
        </span>
    );
}

// Auto-scrolling reviews strip — cards glide continuously, paused on hover.
function ReviewMarquee({ reviews }: { reviews: ChadhavaReview[] }) {
    const items = [...reviews, ...reviews]; // duplicated for a seamless loop
    return (
        <div className="overflow-hidden -mx-4 px-4">
            <style>{`@keyframes chadhavaReviewMarquee{from{transform:translateX(-50%)}to{transform:translateX(0)}}.chadhava-review-track{animation:chadhavaReviewMarquee 36s linear infinite;width:max-content}.chadhava-review-track:hover{animation-play-state:paused}`}</style>
            <div className="chadhava-review-track flex gap-2.5">
                {items.map((r, i) => (
                    <div key={i} className="shrink-0 w-56 bg-white border border-[#FFEFE2] rounded-2xl p-3 shadow-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#2E1F15] text-[12px]">{r.name}</span>
                            {r.verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            <span className="ml-auto text-[9px] text-stone-400">{r.date}</span>
                        </div>
                        <ReviewStars value={r.rating} />
                        <p className="text-[11.5px] text-stone-600 mt-1 leading-snug line-clamp-3 text-left">{r.text}</p>
                    </div>
                ))}
            </div>
        </div>
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
    const [activeTab, setActiveTab] = useState<"about" | "history">("about");
    const [bannerIndex, setBannerIndex] = useState(0);
    const sectionsRef = useRef<HTMLDivElement>(null);

    // Is this the frontend-only Devshayani Ekadashi combo?
    const isDevshayaniCombo = slug === DEVSHAYANI_COMBO_SLUG;

    useEffect(() => {
        // Devshayani combo — served from local data, no backend fetch.
        if (isDevshayaniCombo) {
            setChadhava(devshayaniCombo);
            // Pre-select the first individual seva (not the combo bundle).
            const firstSeva = devshayaniCombo.sections
                .flatMap((s) => s.items)
                .find((i) => i.isActive !== false && i.type !== "combo");
            setQty(firstSeva ? { [firstSeva.code]: 1 } : {});
            setLoading(false);
            setError(null);
            return;
        }
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_URL}/chadhavas/${slug}`);
                if (!res.ok) throw new Error("Chadhava not found");
                const json = await res.json();

                const raw = json.data;
                if (!raw) throw new Error("Chadhava data is empty");

                // Hero carousel images, in the order they are shown: the web card
                // image FIRST, then the inner images. The remaining arrays are
                // only carried for legacy Vedic Vaibhav docs, which expose none
                // of the two fields above — for a current PJAR doc they are all
                // empty, so the carousel is exactly [webCard, ...inner].
                //
                // `chadhavaAppImage` is deliberately NOT in this list: it is the
                // app-shaped crop of the same artwork as the web card, so
                // including it appended a near-duplicate slide. It is used only
                // as a last-resort fallback below, when a doc exposes nothing
                // else at all.
                const imgLoc = (v: any): string => (v && typeof v === "object" ? v.location : v) || "";
                const bannerImages = Array.from(new Set([
                    raw.chadhavaWebCardImage,
                    ...(Array.isArray(raw.chadhavaInnerImages) ? raw.chadhavaInnerImages : []),
                    ...(Array.isArray(raw.chadhavaImages) ? raw.chadhavaImages : []),
                    ...(Array.isArray(raw.bannerImages) ? raw.bannerImages : []),
                    ...(Array.isArray(raw.images) ? raw.images : []),
                    raw.image,
                ].map(imgLoc).filter(Boolean)));
                if (bannerImages.length === 0) {
                    const fallback = imgLoc(raw.chadhavaAppImage);
                    if (fallback) bannerImages.push(fallback);
                }

                // Legacy Vedic Vaibhav docs use `selectedMandirs`; new PJAR docs use `mandirs`.
                const mandir = raw.selectedMandirs?.[0] || raw.mandirs?.[0] || {};

                // Seva sections. Legacy/site docs expose `chadhavaSections`/`sections`;
                // new PJAR docs expose flat `chadhavaItems` + `chadhavaCombos`, which we
                // fold into sections using the SAME `item_N`/`combo_N` codes the server
                // assigns (see normalizeExternalChadhava) so quotes/orders resolve.
                const rawSections = raw.chadhavaSections || raw.sections;
                let sections: Chadhava["sections"];
                if (Array.isArray(rawSections) && rawSections.length > 0) {
                    sections = rawSections.map((sec: any) => ({
                        sectionName: sec.sectionName || "",
                        items: (sec.items || []).map((it: any, index: number) => {
                            const basePrice = it.itemPrice || it.chadhavaPrice || 0;
                            const hasDiscount = it.discountedPrice && it.discountedPrice > 0 && it.discountedPrice < basePrice;
                            return {
                                code: it.code || it.itemName || `item_${index}`,
                                itemName: it.itemName || "",
                                itemDesc: it.itemDesc || "",
                                itemImage: imgLoc(it.itemImage),
                                itemPrice: hasDiscount ? it.discountedPrice : basePrice,
                                originalPrice: hasDiscount ? basePrice : undefined,
                                maxQuantity: it.maxQuantity || 10,
                                popular: it.popular || false,
                                isActive: it.isActive !== false,
                                type: it.type || "item",
                            };
                        }),
                    }));
                } else {
                    sections = [];
                    const itemEntries = (Array.isArray(raw.chadhavaItems) ? raw.chadhavaItems : []).map((it: any, index: number) => ({
                        code: `item_${index}`,
                        itemName: it.chadhavaName || it.itemName || "",
                        itemDesc: it.chadhavaDescription || it.itemDesc || "",
                        itemImage: imgLoc(it.chadhavaImage || it.itemImage),
                        itemPrice: it.chadhavaPrice || it.itemPrice || 0,
                        maxQuantity: it.maxQuantity || 10,
                        popular: false,
                        isActive: it.isActive !== false,
                        type: "item",
                    }));
                    const comboEntries = (Array.isArray(raw.chadhavaCombos) ? raw.chadhavaCombos : []).map((it: any, index: number) => ({
                        code: `combo_${index}`,
                        itemName: it.comboName || "",
                        itemDesc: it.comboDescription || "",
                        itemImage: imgLoc(it.comboImages?.[0]),
                        itemPrice: it.comboPrice || 0,
                        maxQuantity: it.maxQuantity || 10,
                        popular: false,
                        isActive: true,
                        type: "combo",
                    }));
                    if (itemEntries.length) sections.push({ sectionName: "Arpan Seva", items: itemEntries });
                    if (comboEntries.length) sections.push({ sectionName: "Combo Offerings", items: comboEntries });
                }

                const normalized: Chadhava = {
                    id: raw._id || raw.id || "",
                    slug: raw.slug || raw._id || raw.id || "",
                    deity: raw.chadhavaName || raw.deity || "",
                    deityHindi: raw.deityHindi || "",
                    templeName: mandir.nameEnglish || raw.templeName || "",
                    templeLocation: mandir.city || raw.templeLocation || "",
                    image: bannerImages[0] || "",
                    bannerImages,
                    offeringDay: raw.offeringDay || (raw.availableDates?.length ? "Available on: " + raw.availableDates.join(", ") : ""),
                    availableDates: raw.availableDates || [],
                    startingPrice: raw.startingPrice || 0,
                    originalPrice: raw.originalPrice,
                    rating: raw.rating || 5,
                    devoteesOffered: raw.devoteesOffered || 0,
                    benefits: Array.isArray(raw.benefits) ? raw.benefits.map((b: any) => typeof b === "object" ? b.description : b) : [],
                    tags: raw.tags || [],
                    sections,
                    prasad: raw.prasad || { enabled: false, price: 0, name: "", desc: "", image: "" },
                    description: toPlainDescription(raw.description),
                    mandirAppImage: imgLoc(mandir.mandirAppImage),
                    mandirSectionIntro: mandir.mandirSectionIntro || "",
                    mandirSectionHistory: mandir.mandirSectionHistory || ""
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

    // Product detail view — GA4's view_item and Meta's ViewContent. The head of
    // the funnel, and what Google Ads builds its remarketing audiences from.
    useEffect(() => {
        if (!chadhava) return;
        analytics.viewItem({
            items: [{
                id: String(chadhava.id),
                name: chadhava.deity,
                price: chadhava.startingPrice,
                quantity: 1,
                category: "Chadhava",
                brand: chadhava.templeName,
            }],
            value: chadhava.startingPrice,
            currency: "INR",
            meta: {
                event: "ViewContent",
                params: {
                    content_name: chadhava.deity,
                    content_ids: [chadhava.id],
                    content_type: "chadhava",
                    value: chadhava.startingPrice,
                    currency: "INR",
                },
            },
        });
    }, [chadhava]);

    // Auto-scroll: once the chadhava loads, gently glide the page down and
    // settle at the offerings ("chadhava") section so the user lands on it.
    useEffect(() => {
        if (loading || !chadhava) return;
        const t = setTimeout(() => {
            const el = sectionsRef.current;
            if (!el) return;
            const top = el.getBoundingClientRect().top + window.scrollY - 64;
            window.scrollTo({ top, behavior: "smooth" });
        }, 2000);
        return () => clearTimeout(t);
    }, [loading, chadhava]);

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
    const reviews = useMemo(() => seededReviews(slug ?? chadhava?.id ?? "chadhava", 9), [slug, chadhava?.id]);

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
        <div className="min-h-screen bg-[#FFFAF6] pb-36 font-sans w-full max-w-md mx-auto border-x border-rose-100 relative">
            <Helmet>
                <title>{`${chadhava.deity} Chadhava at ${chadhava.templeName} | Pandit Ji At Request`}</title>
            </Helmet>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#FFFAF6]/95 backdrop-blur-md border-b border-rose-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-rose-200/50 shadow-sm active:scale-90 transition-transform">
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>
                <h1 className="text-[15px] font-bold text-stone-800">Chadhava Details</h1>
            </div>

            {/* Hero banner carousel */}
            {(() => {
                const banners = chadhava.bannerImages?.length ? chadhava.bannerImages : [chadhava.image];
                return (
                    <div className="px-3 pt-3">
                        <div className="relative rounded-[22px] overflow-hidden shadow-[0_10px_30px_-12px_rgba(224,90,16,0.25)]">
                            <div
                                className="flex items-start overflow-x-auto snap-x snap-mandatory scrollbar-none"
                                onScroll={(e) => {
                                    const el = e.currentTarget;
                                    setBannerIndex(Math.round(el.scrollLeft / el.clientWidth));
                                }}
                            >
                                {banners.map((img, i) => (
                                    <img
                                        key={i}
                                        src={optimizedImg(img, 800)}
                                        onError={(e) => { e.currentTarget.src = img; }}
                                        alt={`${chadhava.deity} ${i + 1}`}
                                        className="w-full shrink-0 snap-center h-auto object-cover"
                                        loading={i === 0 ? "eager" : "lazy"}
                                        fetchPriority={i === 0 ? "high" : "auto"}
                                        decoding="async"
                                    />
                                ))}
                            </div>

                            <div className="absolute bottom-3 left-3 bg-white/95 rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-[12px] font-bold text-stone-800">{chadhava.rating.toFixed(1)}</span>
                                {chadhava.devoteesOffered > 0 && (
                                    <span className="text-[11px] text-stone-500 font-semibold">({chadhava.devoteesOffered})</span>
                                )}
                            </div>
                            {/* Small countdown — bottom-right of banner */}
                            <div className="absolute bottom-3 right-3 bg-white/95 rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
                                <Clock className="w-3.5 h-3.5 text-[#C1272D] shrink-0" />
                                <CountdownTimer targetDate={targetDate} variant="badge" />
                            </div>
                        </div>
                        {/* Pagination dots — one per banner image */}
                        {banners.length > 1 && (
                            <div className="flex items-center justify-center gap-1.5 mt-2.5">
                                {banners.map((_, i) => (
                                    <span
                                        key={i}
                                        className={`h-1.5 rounded-full transition-all ${i === bannerIndex ? "w-5 bg-[#E05A10]" : "w-1.5 bg-[#FFD9BF]"
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Title + temple + date */}
            <div className="px-4 pt-3">
                <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[18px] font-bold text-[#2E1F15] leading-snug text-left flex-1">
                        {chadhava.deity}
                    </h2>
                    <button onClick={(e) => handleShare(e, chadhava)} className="w-9 h-9 rounded-xl bg-[#FFF1E6] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                        <Share2 className="w-4 h-4 text-[#E05A10]" />
                    </button>
                </div>
                {chadhava.deityHindi && (
                    <p className="text-[13px] text-stone-500 mt-1 text-left">{chadhava.deityHindi}</p>
                )}
                <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-[13px] text-stone-700">
                        <MapPin className="w-4 h-4 text-[#E05A10] shrink-0" />
                        <span className="font-semibold text-left">{chadhava.templeName}{chadhava.templeLocation ? `, ${chadhava.templeLocation}` : ""}</span>
                    </div>
                    {(formatOfferingDate(chadhava.availableDates?.[0]) || chadhava.offeringDay) && (
                        <div className="flex items-center gap-2 text-[13px] text-stone-600">
                            <CalendarDays className="w-4 h-4 text-[#E05A10] shrink-0" />
                            <span className="font-medium text-left">{formatOfferingDate(chadhava.availableDates?.[0]) || chadhava.offeringDay}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* WhatsApp reassurance line */}
            <div className="px-4 pt-3">
                <div className="relative flex items-center gap-2.5 py-2 pl-3 pr-24 bg-green-50 border border-green-200 text-green-700 rounded-xl text-[12px] font-semibold text-start">
                    <MessageCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Receive chadhava video with your name &amp; gotra on <span className="font-bold">WhatsApp</span></span>
                    <img
                        src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/makhan%20apnkh.png"
                        alt=""
                        aria-hidden="true"
                        className="absolute right-[-10px] top-0 h-[82px] pointer-events-none select-none"
                    />
                </div>
            </div>

            {/* Sections (auto-scroll target) */}
            <div ref={sectionsRef} className="pt-1">
                {(() => {
                    // Flatten items across all sections so rows of 3 stay continuous
                    // (section titles are hidden, so no visual grouping is lost).
                    const allItems = chadhava.sections.flatMap((section) => section.items);
                    const regularItems = allItems.filter((i) => i.isActive !== false && i.type !== "combo");
                    const comboItems = allItems.filter((i) => i.isActive !== false && i.type === "combo");
                    const firstRowItems = regularItems.slice(0, 3);
                    const remainingItems = regularItems.slice(3);

                    const renderItemCard = (item: typeof regularItems[number]) => {
                        const count = qty[item.code] || 0;
                        return (
                            <div
                                key={item.code}
                                className={`bg-white rounded-2xl border shadow-sm p-1.5 flex flex-col transition-colors ${count > 0 ? "border-[#9B1B1B]" : "border-[#F4E7DC]"}`}
                            >
                                <div className="relative w-full h-[70px] rounded-xl overflow-hidden bg-[#FFFDF9] mb-1">
                                    <img
                                        src={optimizedImg(item.itemImage, 200)}
                                        onError={(e) => { e.currentTarget.src = item.itemImage; }}
                                        alt={item.itemName}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    {item.popular && (
                                        <span className="absolute top-1 left-1 bg-amber-400 text-amber-950 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">★</span>
                                    )}
                                </div>
                                <h5 className="text-[11px] font-bold text-[#2E1F15] leading-tight line-clamp-2 text-center">{item.itemName}</h5>
                                <span className="text-[12px] font-bold text-[#C1272D] text-center mt-0.5">{money(item.itemPrice)}/-</span>
                                <div className="mt-1">
                                    {count === 0 ? (
                                        <button
                                            onClick={() => setItemQty(item.code, 1)}
                                            className="w-full bg-[#9B1B1B] text-white text-[11.5px] font-bold py-1.5 rounded-lg shadow-sm active:scale-95 transition-transform"
                                        >
                                            Add+
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-between bg-white border border-[#9B1B1B] rounded-lg px-2 py-1 shadow-sm">
                                            <button onClick={() => setItemQty(item.code, count - 1)} className="text-[#9B1B1B] active:scale-90">
                                                <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                                            </button>
                                            <span className="text-[12px] font-bold text-stone-800">{count}</span>
                                            <button onClick={() => setItemQty(item.code, count + 1)} className="text-[#9B1B1B] active:scale-90">
                                                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    };

                    return (
                        <div className="px-4 pt-3">
                            {/* First row of regular offerings (up to 3) */}
                            {firstRowItems.length > 0 && (
                                <div className="grid grid-cols-3 gap-2.5 mt-3">
                                    {firstRowItems.map(renderItemCard)}
                                </div>
                            )}

                            {/* Combo Offering Cards (Full Width) — shown after the first 3 items */}
                            {comboItems.map((item) => {
                                const count = qty[item.code] || 0;
                                const discountPct = item.originalPrice ? Math.round((1 - item.itemPrice / item.originalPrice) * 100) : 0;
                                return (
                                    <div
                                        key={item.code}
                                        className={`w-full bg-white rounded-2xl border overflow-hidden mt-3 transition-all shadow-sm ${count > 0 ? "border-[#9B1B1B]" : "border-[#F4E7DC]"
                                            }`}
                                    >
                                        {/* Image with badges */}
                                        <div className="relative w-full bg-[#FFFDF9]">
                                            <img
                                                src={optimizedImg(item.itemImage, 700)}
                                                onError={(e) => { e.currentTarget.src = item.itemImage; }}
                                                alt={item.itemName}
                                                className="w-full h-[160px] object-cover object-bottom"
                                                loading="lazy"
                                            />
                                            <span className="absolute top-2 left-2 bg-[#E8A22A] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                                                Combo Pack
                                            </span>
                                            {discountPct > 0 && (
                                                <span className="absolute top-2 right-2 bg-[#C1272D] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                                                    Save {discountPct}%
                                                </span>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="px-4 py-2 text-left">
                                            <h5 className="text-[15px] font-bold text-[#2E1F15] leading-snug">
                                                {item.itemName}
                                            </h5>
                                            {item.itemDesc && item.itemDesc !== item.itemName && (
                                                <p className="text-[12px] text-stone-500 mt-0.5 leading-snug line-clamp-1">
                                                    {item.itemDesc}
                                                </p>
                                            )}

                                            {/* Price & Action */}
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-[18px] font-extrabold text-[#C1272D]">{money(item.itemPrice)}/-</span>
                                                    {item.originalPrice && (
                                                        <span className="text-[13px] text-stone-400 line-through">{money(item.originalPrice)}/-</span>
                                                    )}
                                                </div>

                                                {count === 0 ? (
                                                    <button
                                                        onClick={() => setItemQty(item.code, 1)}
                                                        className="bg-[#9B1B1B] text-white text-[13px] font-bold px-6 py-2 rounded-xl active:scale-95 transition-transform shadow-md"
                                                    >
                                                        Add+
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-3 bg-white border border-[#9B1B1B] rounded-xl px-3 py-1.5 shadow-md">
                                                        <button onClick={() => setItemQty(item.code, count - 1)} className="text-[#9B1B1B] active:scale-90">
                                                            <Minus className="w-4 h-4" strokeWidth={3} />
                                                        </button>
                                                        <span className="text-[14px] font-bold text-stone-800 w-4 text-center">{count}</span>
                                                        <button onClick={() => setItemQty(item.code, count + 1)} className="text-[#9B1B1B] active:scale-90">
                                                            <Plus className="w-4 h-4" strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Remaining regular offerings (after the combo pack) */}
                            {remainingItems.length > 0 && (
                                <div className="grid grid-cols-3 gap-2.5 mt-3">
                                    {remainingItems.map(renderItemCard)}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

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
                            {addPrasad ? <><Check className="w-3.5 h-3.5" strokeWidth={3} /> Added</> : `Add ${money(chadhava.prasad.price)}`}
                        </span>
                    </button>
                </div>
            )}

            {/* Devshayani combo — "offered at three dhams" strip (scoped) */}
            {isDevshayaniCombo && (
                <div className="px-4 pt-4">
                    <div className="flex items-center gap-2 mb-2.5">
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E7C38A]" />
                        <span className="text-[12px] font-bold text-[#9B1B1B] uppercase tracking-wide">Offered at Three Sacred Dhams</span>
                        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E7C38A]" />
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                        {COMBO_TEMPLES.map((t) => (
                            <div key={t.name} className="bg-white rounded-2xl border border-[#F4E7DC] overflow-hidden shadow-sm">
                                <img src={t.image} alt={t.name} className="w-full h-16 object-cover" loading="lazy" />
                                <div className="p-2 text-center">
                                    <p className="text-[11px] font-bold text-[#2E1F15] leading-tight">{t.name}</p>
                                    <p className="text-[9px] text-stone-400 mt-0.5">{t.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Devotee reviews */}
            <div className="px-4 pt-5">
                <h3 className="text-[16px] font-bold text-[#2E1F15] mb-3 text-left">Loved by devotees</h3>
                <ReviewMarquee reviews={reviews} />
            </div>

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
                                    src={optimizedImg(chadhava.mandirAppImage, 700)}
                                    onError={(e) => { e.currentTarget.src = chadhava.mandirAppImage || ""; }}
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
                                    className={`pb-2 text-[14px] font-bold transition-all px-1 relative ${activeTab === "about" ? "text-[#E05A10]" : "text-stone-400"
                                        }`}
                                >
                                    About
                                    {activeTab === "about" && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E05A10] rounded-full" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={`pb-2 text-[14px] font-bold transition-all px-1 relative ${activeTab === "history" ? "text-[#E05A10]" : "text-stone-400"
                                        }`}
                                >
                                    History
                                    {activeTab === "history" && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E05A10] rounded-full" />
                                    )}
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div
                                className="text-[12.5px] text-stone-600 leading-relaxed text-left prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: activeTab === "about"
                                        ? chadhava.mandirSectionIntro
                                        : chadhava.mandirSectionHistory
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Trust badges */}
            <div className="px-4 pt-5">
                <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                        { icon: Camera, label: "Photo/Video Proof" },
                        { icon: Gift, label: "Prasad at Home" },
                        { icon: ShieldCheck, label: "Verified Temple" },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="bg-white border border-[#FFEFE2] rounded-xl py-2.5 flex flex-col items-center gap-1 shadow-sm">
                            <Icon className="w-4 h-4 text-[#E05A10]" />
                            <span className="text-[9.5px] font-semibold text-stone-500 leading-tight">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trust */}
            <div className="px-4 pt-5">
                <div className="bg-white border border-[#FFEFE2] rounded-2xl py-3.5 px-4 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11.5px] text-stone-500 leading-snug text-left">
                        You'll receive a photo/video of your chadhava being offered. 100% secure payment & refund guarantee if the ritual is not performed.
                    </p>
                </div>
            </div>

            {/* Floating scroll-down button */}
            <div className="fixed bottom-[128px] left-0 right-0 z-40 max-w-md mx-auto pointer-events-none">
                <button
                    onClick={() => window.scrollTo({ top: window.scrollY + window.innerHeight * 0.7, behavior: "smooth" })}
                    className="pointer-events-auto absolute right-4 w-10 h-10 rounded-full bg-[#E0531A] text-white flex items-center justify-center shadow-lg shadow-orange-200/70 active:scale-90 transition-transform"
                    aria-label="Scroll down"
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
            </div>

            {/* Countdown bar */}
            {isDevshayaniCombo ? (
                <div className="fixed bottom-[68px] left-0 right-0 z-40 max-w-md mx-auto bg-gradient-to-r from-[#F6E3B4] via-[#F3D488] to-[#F6E3B4] border-t border-[#E4C577] py-2 flex items-center justify-center gap-3">
                    <img src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Lotus.webp" alt="Timer" className="w-5 h-5 shrink-0" />
                    <CountdownTimer targetDate={targetDate} variant="goldbar" />
                    <img src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Lotus.webp" alt="Timer" className="w-5 h-5 shrink-0" />

                </div>
            ) : (
                <div className="fixed bottom-[68px] left-0 right-0 z-40 max-w-md mx-auto bg-gradient-to-r from-[#B5290F] to-[#E0531A] py-2 flex items-center justify-center">
                    <CountdownTimer targetDate={targetDate} variant="bar" />
                </div>
            )}

            {/* Bottom pay bar */}
            {isDevshayaniCombo ? (
                <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-[#FFF7EC] border-t border-[#EAD3A0] px-4 py-3 flex items-center justify-between">
                    <div className="leading-tight text-left">
                        <span className="text-[12px] text-stone-600 font-semibold">Your Chadhava</span>
                        <p className="text-[19px] font-extrabold text-[#C1272D] mt-0.5">{money(grandTotal)}/-</p>
                    </div>
                    <button
                        onClick={() => setPrasadUpsellOpen(true)}
                        disabled={sevasSelected === 0}
                        className="relative overflow-hidden bg-gradient-to-r from-[#F0A128] via-[#E9861C] to-[#E0531A] text-white font-bold tracking-wide pl-9 pr-9 py-3 rounded-full shadow-lg shadow-amber-300/50 active:scale-95 transition-transform disabled:opacity-50 disabled:shadow-none"
                    >
                        Participate Now
                    </button>
                </div>
            ) : (
                <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-[#FFF3E9] border-t border-[#FFE0CC] px-4 py-3 flex items-center justify-between">
                    <div className="leading-tight text-left">
                        <span className="text-[12px] text-stone-600 font-semibold">Your Chadhava</span>
                        <p className="text-[19px] font-extrabold text-[#C1272D] mt-0.5">{money(grandTotal)}/-</p>
                    </div>
                    <button
                        onClick={() => setPrasadUpsellOpen(true)}
                        disabled={sevasSelected === 0}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold tracking-wide px-10 py-3 rounded-xl shadow-lg shadow-orange-200/70 active:scale-95 transition-transform disabled:opacity-50 disabled:shadow-none"
                    >
                        Participate Now
                    </button>
                </div>
            )}

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
                                        src={optimizedImg(chadhava.prasad?.image || chadhava.image, 140)}
                                        onError={(e) => { e.currentTarget.src = chadhava.prasad?.image || chadhava.image; }}
                                        alt="Prasad Box"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[14px] font-bold text-[#2E1F15]">Mandir Prasad Box</h4>
                                    <p className="text-[11.5px] text-stone-500 mt-0.5 leading-snug">
                                        Assorted satvik prasad blessed directly at the temple during your Seva.
                                    </p>
                                    <p className="text-[15.5px] font-extrabold text-[#E05A10] mt-1">{money(298)}</p>
                                </div>
                            </div>

                            {/* Prasad Box contents — Devshayani combo only */}
                            {isDevshayaniCombo && (
                                <div className="mt-3 border border-[#FFEFE2] rounded-2xl p-4 bg-white text-left">
                                    <p className="text-[12px] font-bold text-[#2E1F15] mb-2.5">Your Prasad Box Includes:</p>
                                    <div className="space-y-2.5">
                                        {COMBO_PRASAD_BOX_ITEMS.map((item) => (
                                            <div key={item.name} className="flex items-center gap-2.5">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-[#F4E7DC] shrink-0" loading="lazy" />
                                                ) : (
                                                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                                        <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                                                    </span>
                                                )}
                                                <span className="text-[12.5px] font-medium text-stone-700">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={() => {
                                        setAddPrasad(true);
                                        setPrasadUpsellOpen(false);
                                        navigate(`/chadhava/${slug}/booking`, { state: { chadhava, selections, addPrasad: true, prasadPrice: 298 } });
                                    }}
                                    className="w-full bg-[#E05A10] hover:bg-[#C94D0C] text-white font-bold py-3.5 rounded-full active:scale-95 transition-transform shadow-md shadow-orange-100/50"
                                >
                                    Add Prasad & Proceed ›
                                </button>
                                <button
                                    onClick={() => {
                                        setAddPrasad(false);
                                        setPrasadUpsellOpen(false);
                                        navigate(`/chadhava/${slug}/booking`, { state: { chadhava, selections, addPrasad: false, prasadPrice: 0 } });
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
        </div>
    );
}
