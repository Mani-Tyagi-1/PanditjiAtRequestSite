import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Award, BadgeCheck, ShieldCheck, Languages, Check, Clock } from "lucide-react";
import { Helmet } from "react-helmet-async";
import API_URL from "../utils/apiConfig";
import { type HolyPandit} from "../components/booking/KashiVrindavanPandits/kashiVrindavanData";
import PanditBookingModal from "../components/booking/KashiVrindavanPandits/PanditBookingModal";

export default function HolyPanditDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [pandit, setPandit] = useState<HolyPandit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchPanditDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/holy-pandits/${slug}`);
            if (!res.ok) throw new Error("Pandit not found or server error");
            const json = await res.json();
            setPandit(json.data);
        } catch (err) {
            console.error("Error fetching pandit details:", err);
            setError("Failed to load Pandit details. Pt. Ji may be offline or inactive.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPanditDetails();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex flex-col w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100 animate-pulse">
                <div className="h-48 bg-stone-200" />
                <div className="p-5 space-y-4">
                    <div className="h-6 bg-stone-200 rounded w-1/3" />
                    <div className="h-8 bg-stone-200 rounded w-3/4" />
                    <div className="h-4 bg-stone-200 rounded w-1/2" />
                    <div className="h-24 bg-stone-200 rounded-2xl w-full" />
                </div>
            </div>
        );
    }

    if (error || !pandit) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex flex-col items-center justify-center p-6 text-center w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100">
                <span className="text-4xl">👳</span>
                <h2 className="text-lg font-bold text-stone-850 mt-4">Error Loading Pandit Ji</h2>
                <p className="text-xs text-stone-500 mt-2 max-w-[280px]">{error || "The requested Pt. Ji does not exist."}</p>
                <button onClick={() => navigate("/")} className="mt-6 bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition-all">
                    Go to Homepage
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFF] pb-16 font-sans w-full max-w-md mx-auto shadow-xl relative border-x border-indigo-100">
            <Helmet>
                <title>{`${pandit.name} - Verified Pandit from ${pandit.city} | Pandit Ji At Request`}</title>
                <meta name="description" content={`Book Pt. ${pandit.name} from ${pandit.city} for at-home poojas, havans, and Vedic rituals. ${pandit.experienceYears} years of experience.`} />
            </Helmet>

            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#FAFAFF]/90 backdrop-blur-md border-b border-indigo-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-indigo-200/50 shadow-sm active:scale-90 transition-transform">
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>
                <h1 className="text-sm font-extrabold text-stone-850 truncate">{pandit.name} Details</h1>
            </div>

            {/* Profile banner block */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white px-5 pt-6 pb-6 relative rounded-b-[32px] shadow-md">
                <div className="flex gap-4 items-center">
                    <img src={pandit.image} alt={pandit.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white/20 shadow-md shrink-0" />
                    <div>
                        <div className="flex items-center gap-1.5 text-indigo-100">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold uppercase tracking-wide">{pandit.city}</span>
                            {pandit.verified && <BadgeCheck className="w-4 h-4 text-white" />}
                        </div>
                        <h2 className="text-xl font-bold mt-1 font-serif">{pandit.name}</h2>
                        
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-indigo-100 font-medium">
                            <span className="flex items-center gap-0.5"><Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> {pandit.rating.toFixed(1)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {pandit.experienceYears} yrs exp</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* About Pt. Ji */}
                <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm">
                    <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-indigo-500 mb-1.5">About Pandit Ji</h3>
                    <p className="text-[12.5px] text-stone-600 leading-relaxed font-light">{pandit.about}</p>
                    
                    <div className="h-px bg-stone-100 my-3.5" />
                    
                    <div className="space-y-2 text-[12.5px] text-stone-600">
                        <div className="flex items-center gap-2">
                            <Languages className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span>Languages: <strong>{pandit.languages.join(", ")}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span>Specialities: <strong>{pandit.specializations.join(", ")}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span>Rituals Performed: <strong>{pandit.pujasPerformed}+</strong></span>
                        </div>
                    </div>
                </div>

                {/* Rituals at Home list */}
                <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-2">Pujas & Rituals pt. Ji performs</h3>
                    <div className="space-y-3">
                        {pandit.services.map((svc) => (
                            <div key={svc.id} className={`bg-white rounded-2xl border-2 p-4 transition-all relative ${svc.popular ? "border-indigo-500 bg-indigo-50/20" : "border-stone-200"}`}>
                                {svc.popular && (
                                    <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                        ★ Most Booked
                                    </span>
                                )}
                                <div className="flex justify-between gap-3">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-[14px] text-stone-850">{svc.name}</h4>
                                        <p className="text-[12px] text-stone-500 leading-snug">{svc.description}</p>
                                    </div>
                                    <span className="font-extrabold text-[16px] text-stone-900 shrink-0">₹{svc.price.toLocaleString("en-IN")}</span>
                                </div>
                                <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> approx {svc.durationHours} hours duration
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trust banner */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-indigo-900 leading-snug">
                        Pandit ji is verified. After you request a booking, Pt. Ji will contact you to confirm the Muhurat and guide you about the Samagri lists. You do not need to pay anything right now.
                    </p>
                </div>
            </div>

            {/* Bottom sticky Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-100 px-4 py-3 flex items-center justify-between max-w-md mx-auto shadow-lg">
                <div>
                    <span className="text-[10px] text-stone-400 font-semibold uppercase block">Starting at</span>
                    <span className="text-[20px] font-extrabold text-indigo-600">₹{pandit.startingPrice.toLocaleString("en-IN")}</span>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold px-8 py-3 rounded-xl shadow-md active:scale-95 transition-all">
                    Request Pt. Ji
                </button>
            </div>

            <PanditBookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} pandit={pandit} />
        </div>
    );
}
