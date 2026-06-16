import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
    ArrowLeft,
    Home as HomeIcon,
    Landmark,
    Star,
    MapPin,
    Users,
    Clock,
    Check,
    ChevronRight,
} from "lucide-react";
import API_URL from "../utils/apiConfig";

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
};
type Category = {
    category_id: string;
    category_name_en: string;
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

type Tab = "home" | "mandir";

export default function BookPujaPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [tab, setTab] = useState<Tab>(searchParams.get("tab") === "mandir" ? "mandir" : "home");

    const [poojas, setPoojas] = useState<Pooja[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCat, setActiveCat] = useState<string>("All");
    const [loadingHome, setLoadingHome] = useState(true);

    const [livePujas, setLivePujas] = useState<LivePuja[]>([]);
    const [loadingLive, setLoadingLive] = useState(true);

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

    const filteredPoojas = useMemo(() => {
        if (activeCat === "All") return poojas;
        const match = (p: Pooja) =>
            (p.mainCategories || []).some((c) => c.name === activeCat) ||
            (p.subCategories || []).some((c) => c.name === activeCat);
        return poojas.filter(match);
    }, [poojas, activeCat]);

    return (
        <div className="font-sans min-h-screen">
            <Helmet>
                <title>Book Puja | Pandit Ji At Request</title>
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
                    Book Puja
                </h1>
                <p className="text-center text-[12.5px] text-stone-500 -mt-0.5">Find the right ritual for your intention</p>

                {/* Segmented tabs */}
                <div className="mt-4 bg-white rounded-2xl p-1.5 flex gap-1.5 shadow-sm border border-orange-100">
                    {([
                        { key: "home", label: "Pooja for Home", icon: HomeIcon },
                        { key: "mandir", label: "Live Mandir Pooja", icon: Landmark },
                    ] as const).map(({ key, label, icon: Icon }) => {
                        const active = tab === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${active ? "bg-orange-50 text-orange-600 shadow-sm" : "text-stone-500"}`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Tab content ── */}
            {tab === "home" ? (
                <section className="px-4 pt-3">
                    {/* Category chips */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                        {["All", ...categories.map((c) => c.category_name_en)].map((name) => {
                            const active = activeCat === name;
                            return (
                                <button
                                    key={name}
                                    onClick={() => setActiveCat(name)}
                                    className={`shrink-0 px-5 py-2 rounded-full text-[13px] font-semibold border transition-colors ${active ? "bg-orange-500 text-white border-orange-500" : "bg-white text-stone-600 border-orange-100"}`}
                                >
                                    {name}
                                </button>
                            );
                        })}
                    </div>

                    {!loadingHome && (
                        <p className="text-orange-600 font-bold text-[14px] mt-4">
                            Found Result: {filteredPoojas.length}
                        </p>
                    )}

                    {/* Grid */}
                    <div className="mt-3 grid grid-cols-2 gap-3 pb-4">
                        {loadingHome
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-orange-100 overflow-hidden animate-pulse">
                                    <div className="h-36 bg-stone-200" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-4 bg-stone-200 rounded w-3/4" />
                                        <div className="h-9 bg-stone-200 rounded-xl" />
                                    </div>
                                </div>
                            ))
                            : filteredPoojas.map((p) => {
                                const tags = (p.mainCategories || []).map((c) => c.name).filter(Boolean).slice(0, 2) as string[];
                                return (
                                    <div key={p._id} className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm flex flex-col">
                                        <button onClick={() => navigate(`/puja/${p._id}`)} className="relative h-36 bg-orange-50 text-left">
                                            {p.poojaCardImage && (
                                                <img src={p.poojaCardImage} alt={p.poojaNameEng} className="w-full h-full object-cover" loading="lazy" />
                                            )}
                                            <span className="absolute top-2 right-2 flex items-center gap-0.5 bg-emerald-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md">
                                                4.3 <Star className="w-3 h-3 fill-white text-white" />
                                            </span>
                                            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                                                {tags.map((t) => (
                                                    <span key={t} className="bg-white/95 text-stone-700 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </button>
                                        <div className="p-3 pt-2.5 flex flex-col flex-1">
                                            <h3 className="text-[14px] font-bold text-orange-600 leading-tight line-clamp-2 min-h-[36px]">
                                                {p.poojaNameEng}
                                            </h3>
                                            <button
                                                onClick={() => navigate(`/puja/${p._id}`)}
                                                className="mt-2 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[13px] font-bold py-2.5 rounded-xl active:scale-95 transition-transform"
                                            >
                                                Book Pandit Ji
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                    {!loadingHome && filteredPoojas.length === 0 && (
                        <p className="text-center text-stone-400 text-[13px] py-10">No poojas found in this category.</p>
                    )}
                </section>
            ) : (
                <section className="px-4 pt-4 space-y-4 pb-4">
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
                        <p className="text-center text-stone-400 text-[13px] py-10">No live mandir pujas scheduled right now. 🙏</p>
                    )}
                </section>
            )}
        </div>
    );
}

function LiveMandirVerticalCard({ puja, onBook }: { puja: LivePuja; onBook: () => void }) {
    const discount = puja.originalPrice
        ? Math.round(((puja.originalPrice - puja.price) / puja.originalPrice) * 100)
        : 0;
    return (
        <div className="bg-white rounded-3xl border border-orange-100 overflow-hidden shadow-sm">
            {/* Image */}
            <div className="relative h-44 bg-stone-200">
                <img src={puja.image} alt={puja.pujaName} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                {puja.status === "live" && (
                    <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                    </span>
                )}
                <div className="absolute bottom-3 left-4 right-4 text-white">
                    {puja.deity && (
                        <span className="block text-[11px] font-bold tracking-widest text-amber-300 uppercase">{puja.deity}</span>
                    )}
                    <span className="block text-[20px] font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        {puja.templeName}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-4">
                <h3 className="text-[18px] font-bold text-stone-900">{puja.pujaName}</h3>
                {puja.templeLocation && (
                    <p className="mt-1 flex items-center gap-1 text-[12.5px] text-stone-500">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> {puja.templeLocation}
                    </p>
                )}

                <div className="mt-2 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[12px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {(puja.rating ?? 4.9).toFixed(1)}
                    </span>
                    {puja.devoteesJoined != null && (
                        <span className="flex items-center gap-1 text-[12px] font-semibold text-sky-600">
                            <Users className="w-3.5 h-3.5" /> {puja.devoteesJoined.toLocaleString("en-IN")}+ Devotees Joined
                        </span>
                    )}
                </div>

                {!!(puja.benefits && puja.benefits.length) && (
                    <div className="mt-3 space-y-1.5">
                        {puja.benefits.slice(0, 2).map((b) => (
                            <div key={b} className="flex items-center gap-2 text-[13px] text-stone-700">
                                <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3} />
                                </span>
                                {b}
                            </div>
                        ))}
                    </div>
                )}

                {(puja.scheduledDate || puja.scheduledTime) && (
                    <div className="mt-3 flex items-center gap-2 bg-orange-50/70 border border-orange-100 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-stone-600">
                        <Clock className="w-4 h-4 text-orange-500" />
                        {[puja.scheduledDate, puja.scheduledTime].filter(Boolean).join(" • ")}
                    </div>
                )}

                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="leading-none">
                        <span className="text-[10px] text-stone-400 font-semibold uppercase">Starting at</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-[20px] font-bold text-stone-900">₹{puja.price.toLocaleString("en-IN")}</span>
                            {puja.originalPrice && (
                                <span className="text-[12px] text-stone-400 line-through">₹{puja.originalPrice.toLocaleString("en-IN")}</span>
                            )}
                            {discount > 0 && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">{discount}% OFF</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onBook}
                        className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[14px] px-6 py-3 rounded-2xl shadow-lg shadow-orange-200/70 active:scale-95 transition-transform"
                    >
                        Book Now <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
