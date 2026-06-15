import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
    Search,
    Bell,
    Wallet,
    ChevronRight,
    Phone,
    Video,
    MessageSquare,
    Flame,
} from "lucide-react";
import API_URL from "../utils/apiConfig";

const LOGO =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/pjar_logo-removebg-preview.png";
const BANKE_BIHARI =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/bankebiharijichadawa-optimized.webp";

type Pooja = {
    _id: string;
    poojaNameEng: string;
    poojaNameHindi?: string;
    poojaCardImage?: string;
    poojaPriceOnline?: number;
    poojaPriceOffline?: number;
    isFeatured?: boolean;
};

const CONSULTATIONS = [
    { icon: Phone, label: "Talk on Call", sub: "Instant Guidance", path: "/paid-consultation", tint: "bg-orange-100 text-orange-600" },
    { icon: Video, label: "Video Call", sub: "Face to Face", path: "/paid-consultation", tint: "bg-rose-100 text-rose-500" },
    { icon: MessageSquare, label: "Chat", sub: "Quick Answers", path: "/free-consultation", tint: "bg-emerald-100 text-emerald-600" },
];

export default function HomePage() {
    const navigate = useNavigate();
    const [poojas, setPoojas] = useState<Pooja[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPoojas = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/fetch-all-poojas`);
                const list: Pooja[] = data?.poojas || [];
                // Featured first, then fill with the rest.
                const featured = list.filter((p) => p.isFeatured);
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

    const priceOf = (p: Pooja) => p.poojaPriceOnline || p.poojaPriceOffline || 0;

    return (
        <div className="font-sans" style={{ background: "linear-gradient(to bottom, #fee8be, #fee8be)" }}>
            <Helmet>
                <title>Pandit Ji At Request — Book Pooja, Chadhava & Consultation</title>
            </Helmet>

            {/* ── Header ── */}
            <div
                className="sticky top-0 z-30 px-4 pt-3 pb-4 bg-"
                style={{ background: "linear-gradient(to bottom, #f8d38e, #fee8be)" }}
            >
                <div className="flex items-center justify-between gap-2">
                    <img src={LOGO} alt="Pandit Ji At Request" className="h-11 w-auto object-contain" />

                    <div className="flex items-center gap-2">
                        {/* Wallet pill */}
                        <button
                            onClick={() => navigate("/account")}
                            className="flex items-center gap-1.5 bg-white rounded-2xl pl-2 pr-2.5 py-1.5 shadow-sm active:scale-95 transition-transform"
                        >
                            <span className="w-7 h-7 rounded-xl bg-orange-500 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-white" />
                            </span>
                            <span className="leading-none text-left">
                                <span className="block text-[9px] font-semibold text-stone-500">Wallet</span>
                                <span className="block text-[12px] font-bold text-stone-800">₹0</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                        </button>

                        {/* Bell */}
                        <button className="relative w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                            <Bell className="w-5 h-5 text-stone-700" />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
                        </button>

                        {/* Lang toggle */}
                        <button className="w-12 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                            <span className="text-[11px] font-bold text-orange-600">हिं<span className="text-stone-400"> / </span>EN</span>
                        </button>
                    </div>
                </div>

                {/* Search */}
                <button
                    onClick={() => navigate("/book-puja")}
                    className="mt-3 w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm text-left"
                >
                    <Search className="w-5 h-5 text-stone-400" />
                    <span className="text-[13.5px] text-stone-400">Search pooja, pandit ji, ritual…</span>
                </button>
            </div>

            {/* ── Book Pooja ── */}
            <section className="px-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-[20px] font-bold text-stone-900 shrink-0">Book Pooja</h2>
                    <span className="text-[16px] shrink-0">🌼</span>
                    <span className="h-px w-5 bg-orange-300 shrink-0" />
                    <span className="text-[12px] text-stone-500 font-medium truncate">Poojas just for you</span>
                    <button
                        onClick={() => navigate("/book-puja")}
                        className="ml-auto flex items-center gap-0.5 text-[13.5px] font-bold text-stone-900 active:scale-95 transition-transform shrink-0"
                    >
                        View All <ChevronRight className="w-4 h-4 text-orange-500" />
                    </button>
                </div>

                <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-hide snap-x scroll-px-2 border-2 border-[#d6b578] rounded-3xl py-2 px-4 [&>*:last-child]:mr-1">
                    {loading
                        ? Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="shrink-0 w-[44%] bg-white rounded-2xl border border-orange-100 overflow-hidden animate-pulse">
                                <div className="h-32 bg-stone-200" />
                                <div className="p-3 space-y-2">
                                    <div className="h-3 bg-stone-200 rounded w-3/4" />
                                    <div className="h-4 bg-stone-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))
                        : poojas.map((p) => (
                            <button
                                key={p._id}
                                onClick={() => navigate(`/puja/${p._id}`)}
                                className="shrink-0 w-[44%] bg-white rounded-2xl border border-orange-100/70 overflow-hidden text-left shadow-[0_6px_18px_-8px_rgba(234,88,12,0.35)] active:scale-[0.98] transition-transform snap-start"
                            >
                                <div className="relative h-32 bg-gradient-to-br from-amber-300 via-orange-300 to-orange-400">
                                    {p.poojaCardImage && (
                                        <img src={p.poojaCardImage} alt={p.poojaNameEng} className="w-full h-full object-cover" loading="lazy" />
                                    )}
                                    {p.isFeatured && (
                                        <span className="absolute top-2 left-2 flex items-center gap-1 bg-white text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            <Flame className="w-3 h-3 fill-orange-500 text-orange-500" /> Popular
                                        </span>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="text-[13.5px] font-bold text-stone-800 leading-tight line-clamp-2 min-h-[34px]">
                                        {p.poojaNameEng}
                                    </h3>
                                    <p className="mt-1 text-[15px] font-bold text-orange-600">
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

            {/* ── Consultation ── */}
            <section className="px-4 pt-4">
                <div className="bg-gradient-to-b from-[#FBE7C4] to-[#FFF7EA] border-2 border-[#d6b578] rounded-3xl p-4">
                    <h2 className="text-[18px] font-bold text-stone-900">Consultation</h2>
                    <p className="text-[12px] text-stone-500 mt-0.5">Talk to experienced pandit ji</p>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                        {CONSULTATIONS.map(({ icon: Icon, label, sub, path, tint }) => (
                            <button
                                key={label}
                                onClick={() => navigate(path)}
                                className="bg-white rounded-2xl py-4 px-2 flex flex-col items-center gap-2 shadow-[0_6px_18px_-10px_rgba(234,88,12,0.4)] active:scale-95 transition-transform"
                            >
                                <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tint}`}>
                                    <Icon className="w-5 h-5" />
                                </span>
                                <span className="text-[12.5px] font-bold text-stone-800">{label}</span>
                                <span className="text-[10px] font-semibold text-orange-500">{sub}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── LIVE Chadhava banner ── */}
            <section className="px-4 pt-4">
                <div className="relative rounded-3xl overflow-hidden shadow-md h-60">
                    <img src={BANKE_BIHARI} alt="Live Chadhava" className="absolute inset-0 w-full h-full object-cover" />
                </div>
            </section>
        </div>
    );
}
