import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Check, ShieldCheck, Video, Gift } from "lucide-react";
import { Helmet } from "react-helmet-async";
import API_URL from "../utils/apiConfig";
import { type LiveMandirPuja } from "../components/booking/LiveMandirPujas/liveMandirData";
import LiveMandirBookingModal from "../components/booking/LiveMandirPujas/LiveMandirBookingModal";

export default function LiveMandirPujaDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [puja, setPuja] = useState<LiveMandirPuja | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchPujaDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/live-mandir-pujas/${slug}`);
            if (!res.ok) throw new Error("Puja not found or server error");
            const json = await res.json();
            setPuja(json.data);
        } catch (err) {
            console.error("Error fetching puja details:", err);
            setError("Failed to load puja details. It may not exist or is inactive.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPujaDetails();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex flex-col w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100 animate-pulse">
                <div className="h-56 bg-stone-200" />
                <div className="p-5 space-y-4">
                    <div className="h-6 bg-stone-200 rounded w-1/3" />
                    <div className="h-8 bg-stone-200 rounded w-3/4" />
                    <div className="h-4 bg-stone-200 rounded w-1/2" />
                    <div className="h-24 bg-stone-200 rounded-2xl w-full" />
                </div>
            </div>
        );
    }

    if (error || !puja) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex flex-col items-center justify-center p-6 text-center w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100">
                <span className="text-4xl">🪔</span>
                <h2 className="text-lg font-bold text-stone-850 mt-4">Error Loading Puja</h2>
                <p className="text-xs text-stone-500 mt-2 max-w-[280px]">{error || "The requested live puja does not exist."}</p>
                <button onClick={() => navigate("/")} className="mt-6 bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition-all">
                    Go to Homepage
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFAF3] pb-16 font-sans w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100">
            <Helmet>
                <title>{`${puja.pujaName} at ${puja.templeName} | Pandit Ji At Request`}</title>
                <meta name="description" content={`Book online ${puja.pujaName} at ${puja.templeName}. Benefit from ${puja.benefits.join(", ")}. Safe and verified Vedic rituals.`} />
            </Helmet>

            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-[#FFFAF3]/90 backdrop-blur-md border-b border-orange-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-orange-200/50 shadow-sm active:scale-90 transition-transform">
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>
                <h1 className="text-sm font-bold text-stone-850 truncate">{puja.pujaName} Details</h1>
            </div>

            {/* Hero Image */}
            <div className="relative h-60 overflow-hidden">
                <img src={puja.image} alt={puja.pujaName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="bg-red-500 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase mb-2 inline-block">
                        {puja.status === "live" ? "LIVE NOW" : puja.status === "upcoming" ? "UPCOMING" : "DAILY SEVA"}
                    </span>
                    <h2 className="text-2xl font-bold font-serif leading-tight">{puja.pujaName}</h2>
                    <p className="text-xs text-orange-200 font-medium mt-1">{puja.pujaNameHindi}</p>
                </div>
            </div>

            {/* Details block */}
            <div className="p-4 space-y-4">
                <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-start gap-2.5">
                        <MapPin className="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[13px] font-bold text-stone-800">{puja.templeName}</p>
                            <p className="text-[11px] text-stone-500">{puja.templeLocation}</p>
                        </div>
                    </div>
                </div>

                {/* Benefits */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Benefits of this Puja</h3>
                    <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm space-y-2.5">
                        {puja.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[12.5px] text-stone-700">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                                <span>{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Trust Row */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    {[
                        { icon: Video, label: "Live HD Video" },
                        { icon: Gift, label: "Prasad at Home" },
                        { icon: ShieldCheck, label: "Verified Pandit" },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="bg-white border border-stone-100 rounded-xl py-3 flex flex-col items-center gap-1 shadow-sm">
                            <Icon className="w-4.5 h-4.5 text-orange-500" />
                            <span className="text-[10px] font-semibold text-stone-500 leading-tight">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sticky Bottom Book Button */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-100 px-4 py-3 flex items-center justify-between max-w-md mx-auto shadow-lg">
                <div>
                    <span className="text-[10px] text-stone-400 font-semibold uppercase block">Starting at</span>
                    <span className="text-[20px] font-bold text-orange-600">₹{puja.price.toLocaleString("en-IN")}</span>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-8 py-3 rounded-xl shadow-md active:scale-95 transition-all">
                    Book Puja Now
                </button>
            </div>

            <LiveMandirBookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} puja={puja} />
        </div>
    );
}
