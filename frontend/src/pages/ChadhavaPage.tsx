import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, MapPin, CalendarDays, Star, Users } from "lucide-react";
import API_URL from "../utils/apiConfig";

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
};

export default function ChadhavaPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState<Chadhava[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_URL}/chadhavas`);
                if (!res.ok) throw new Error("Failed");
                const json = await res.json();
                setItems(json?.data || []);
            } catch (err) {
                console.error("Error loading chadhavas:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="font-sans min-h-screen">
            <Helmet>
                <title>Chadhava Seva | Pandit Ji At Request</title>
            </Helmet>

            {/* ── Header ── */}
            <div className="relative px-4 pt-3 pb-5 bg-gradient-to-b from-[#f7d9ad] to-[#FFFAF3]">
                <button
                    onClick={() => navigate("/home")}
                    className="absolute left-4 top-3 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                >
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>
                <h1 className="text-center text-[26px] font-bold text-orange-600" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Chadhava Seva
                </h1>
                <p className="text-center text-[12.5px] text-stone-500 -mt-0.5">
                    Offer prayers &amp; prasad directly at sacred temples
                </p>
            </div>

            {/* ── List ── */}
            <section className="px-4 pt-4 space-y-4 pb-4">
                {loading &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-orange-100 overflow-hidden animate-pulse">
                            <div className="h-40 bg-stone-200" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-stone-200 rounded w-1/2" />
                                <div className="h-4 bg-stone-200 rounded w-3/4" />
                                <div className="h-10 bg-stone-200 rounded-xl" />
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
                        const discount = c.originalPrice
                            ? Math.round(((c.originalPrice - c.startingPrice) / c.originalPrice) * 100)
                            : 0;
                        return (
                            <div key={c.id} className="bg-white rounded-3xl border border-orange-100 overflow-hidden shadow-sm">
                                {/* Banner */}
                                <div className="relative h-44">
                                    <img src={c.image} alt={c.deity} className="w-full h-full object-cover" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />
                                    {!!c.tags?.length && (
                                        <span className="absolute top-3 left-3 bg-amber-400 text-amber-950 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                                            {c.tags[0]}
                                        </span>
                                    )}
                                    {discount > 0 && (
                                        <span className="absolute top-3 right-3 bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                            {discount}% OFF
                                        </span>
                                    )}
                                    <div className="absolute bottom-3 left-4 right-4 text-white">
                                        <h2 className="text-[22px] font-bold leading-none" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                            {c.deity}
                                        </h2>
                                        {c.deityHindi && <p className="text-[12px] text-amber-100 mt-0.5">{c.deityHindi}</p>}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="flex items-center gap-1 text-[12.5px] font-semibold text-stone-600 min-w-0">
                                            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                            <span className="truncate">{c.templeName}{c.templeLocation ? `, ${c.templeLocation}` : ""}</span>
                                        </p>
                                        <span className="flex items-center gap-1 text-[12px] font-bold text-amber-700 shrink-0">
                                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {(c.rating ?? 5).toFixed(1)}
                                        </span>
                                    </div>

                                    {c.offeringDay && (
                                        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-stone-500">
                                            <CalendarDays className="w-3.5 h-3.5 text-orange-500" /> {c.offeringDay}
                                        </p>
                                    )}

                                    {!!c.benefits?.length && (
                                        <p className="mt-2 text-[12.5px] text-stone-500 leading-snug line-clamp-2">
                                            {c.benefits.join(" · ")}
                                        </p>
                                    )}

                                    {c.devoteesOffered != null && (
                                        <p className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold text-sky-600">
                                            <Users className="w-3.5 h-3.5" /> {c.devoteesOffered.toLocaleString("en-IN")}+ devotees offered
                                        </p>
                                    )}

                                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                                        <div className="leading-none">
                                            <span className="text-[10px] text-stone-400 font-semibold uppercase">Starting at</span>
                                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                                <span className="text-[20px] font-bold text-orange-600">₹{c.startingPrice.toLocaleString("en-IN")}</span>
                                                {c.originalPrice && (
                                                    <span className="text-[12px] text-stone-400 line-through">₹{c.originalPrice.toLocaleString("en-IN")}</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/chadhava/${c.id}`)}
                                            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[14px] px-6 py-3 rounded-2xl shadow-lg shadow-orange-200/70 active:scale-95 transition-transform"
                                        >
                                            Participate Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </section>
        </div>
    );
}
