import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Check, ShieldCheck, Sparkles, } from "lucide-react";
import { Helmet } from "react-helmet-async";
import API_URL from "../utils/apiConfig";
import { type Chadhava} from "../components/booking/ChadhavaBooking/chadhavaData";
import ChadhavaBookingModal from "../components/booking/ChadhavaBooking/ChadhavaBookingModal";

export default function ChadhavaDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [chadhava, setChadhava] = useState<Chadhava | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchChadhavaDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/chadhavas/${slug}`);
            if (!res.ok) throw new Error("Chadhava not found or server error");
            const json = await res.json();
            setChadhava(json.data);
        } catch (err) {
            console.error("Error fetching chadhava details:", err);
            setError("Failed to load offering details. It may not exist or is inactive.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChadhavaDetails();
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

    if (error || !chadhava) {
        return (
            <div className="min-h-screen bg-[#FFFAF6] flex flex-col items-center justify-center p-6 text-center w-full max-w-md mx-auto shadow-xl relative border-x border-rose-100">
                <span className="text-4xl">🌺</span>
                <h2 className="text-lg font-bold text-stone-850 mt-4">Error Loading Chadhava</h2>
                <p className="text-xs text-stone-500 mt-2 max-w-[280px]">{error || "The requested chadhava does not exist."}</p>
                <button onClick={() => navigate("/")} className="mt-6 bg-rose-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition-all">
                    Go to Homepage
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFAF6] pb-16 font-sans w-full max-w-md mx-auto shadow-xl relative border-x border-rose-100">
            <Helmet>
                <title>{`Book ${chadhava.deity} Chadhava at ${chadhava.templeName} | Pandit Ji At Request`}</title>
                <meta name="description" content={`Offer fresh flowers, shringar chunri, or bhog prasad to ${chadhava.deity} at ${chadhava.templeName}. Benefit from ${chadhava.benefits.join(", ")}.`} />
            </Helmet>

            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-[#FFFAF6]/90 backdrop-blur-md border-b border-rose-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-rose-200/50 shadow-sm active:scale-90 transition-transform">
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>
                <h1 className="text-sm font-extrabold text-stone-850 truncate">{chadhava.deity} Chadhava</h1>
            </div>

            {/* Hero Image */}
            <div className="relative h-60 overflow-hidden">
                <img src={chadhava.image} alt={chadhava.deity} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="bg-rose-500 text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full uppercase mb-2 inline-block">
                        {chadhava.offeringDay}
                    </span>
                    <h2 className="text-2xl font-bold font-serif leading-tight">{chadhava.deity}</h2>
                    <p className="text-xs text-rose-200 font-medium mt-1">{chadhava.deityHindi}</p>
                </div>
            </div>

            {/* Details block */}
            <div className="p-4 space-y-4">
                <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-start gap-2.5">
                        <MapPin className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[13px] font-bold text-stone-800">{chadhava.templeName}</p>
                            <p className="text-[11px] text-stone-500">{chadhava.templeLocation}</p>
                        </div>
                    </div>
                </div>

                {/* Benefits */}
                <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-2">Benefits of this Offering</h3>
                    <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm space-y-2.5">
                        {chadhava.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[12.5px] text-stone-700">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                                <span>{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Offerings list */}
                <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-2">Available Offerings</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {chadhava.offerings.map((o) => (
                            <div key={o.id} className={`bg-white rounded-2xl border-2 p-3.5 flex flex-col justify-between relative ${o.popular ? "border-rose-500" : "border-stone-200"}`}>
                                {o.popular && (
                                    <span className="absolute -top-2.5 right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                                        ★ Popular
                                    </span>
                                )}
                                <div>
                                    <span className="text-2xl">{o.icon}</span>
                                    <h4 className="font-bold text-stone-800 text-[13.5px] mt-1">{o.name}</h4>
                                    <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{o.description}</p>
                                </div>
                                <p className="font-extrabold text-stone-900 text-[15px] mt-3">₹{o.price.toLocaleString("en-IN")}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upsell keepsake details */}
                <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-rose-500" />
                        <h4 className="text-[12.5px] font-bold text-stone-800 uppercase tracking-wide">Included Keepsake Option</h4>
                    </div>
                    <div className="flex gap-3">
                        <img src={chadhava.spiritualProduct.image} alt={chadhava.spiritualProduct.name} className="w-16 h-16 rounded-xl object-cover border border-rose-100" />
                        <div>
                            <h5 className="font-bold text-[13px] text-stone-800 leading-tight">{chadhava.spiritualProduct.name}</h5>
                            <p className="text-[11px] text-stone-500 mt-1 leading-snug">{chadhava.spiritualProduct.tagline}</p>
                            <p className="text-[11px] text-rose-600 font-bold mt-1">Available at ₹{chadhava.spiritualProduct.price} as add-on during checkout</p>
                        </div>
                    </div>
                </div>

                {/* Trust banner */}
                <div className="bg-white border border-stone-100 rounded-xl py-3 px-4 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-stone-500 leading-snug">
                        You will receive a photo or video proof of your chadhava being offered. 100% secure payment & refund guarantee if the ritual is not performed.
                    </p>
                </div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-100 px-4 py-3 flex items-center justify-between max-w-md mx-auto shadow-lg">
                <div>
                    <span className="text-[10px] text-stone-400 font-semibold uppercase block">Starting at</span>
                    <span className="text-[20px] font-extrabold text-rose-600">₹{chadhava.startingPrice.toLocaleString("en-IN")}</span>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold px-8 py-3 rounded-xl shadow-md active:scale-95 transition-all">
                    Offer Chadhava
                </button>
            </div>

            <ChadhavaBookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} chadhava={chadhava} />
        </div>
    );
}
