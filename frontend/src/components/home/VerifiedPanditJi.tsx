import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import axios from "axios";
import API_URL from "../../utils/apiConfig";
import SectionHeader from "./SectionHeader";

type Pandit = {
    _id: string;
    prefix?: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    experienceInYears?: number;
    rating?: number;
    isVerified?: boolean;
    isActive?: boolean;
    location?: { city?: string; state?: string };
};

export default function VerifiedPanditJi() {
    const navigate = useNavigate();
    const [pandits, setPandits] = useState<Pandit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get(`${API_URL}/pandits`);
                if (data?.success && Array.isArray(data.data)) {
                    const filtered = data.data.filter((p: Pandit) => {
                        if (p.isActive === false || p.isVerified !== true) return false;
                        const fullName = `${p.prefix || ""} ${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
                        if (fullName.includes("nirmanyu thakur") || fullName.includes("vansh bhandari")) return false;
                        return true;
                    });
                    setPandits(filtered);
                }
            } catch (err) {
                console.error("Error loading pandits:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (!loading && pandits.length === 0) return null;

    return (
        <section className="px-4 pt-6">
            <SectionHeader
                title="Our Verified Pandit Ji"
                icon={BadgeCheck}
                subtitle="Expert & Certified"
                onViewAll={() => navigate("/all-pandits")}
            />

            <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x scroll-px-4 [&>*:last-child]:mr-1">
                {loading
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="shrink-0 w-[85%] max-w-[330px] bg-white rounded-2xl border border-orange-100 shadow-sm p-3 animate-pulse snap-start">
                            <div className="flex gap-3">
                                <div className="w-16 h-16 rounded-full bg-stone-200 shrink-0" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 bg-stone-200 rounded w-2/3" />
                                    <div className="h-3 bg-stone-200 rounded w-1/2" />
                                    <div className="h-3 bg-stone-200 rounded w-1/3" />
                                </div>
                            </div>
                            <div className="h-9 bg-stone-200 rounded-xl mt-3" />
                        </div>
                    ))
                    : pandits.map((p) => {
                        const fullName = [p.prefix, p.firstName, p.lastName].filter(Boolean).join(" ");
                        const location = [p.location?.city, p.location?.state].filter(Boolean).join(", ");
                        return (
                            <div key={p._id} className="shrink-0 w-[85%] max-w-[330px] bg-white rounded-2xl border border-orange-100 shadow-[0_10px_26px_-14px_rgba(0,0,0,0.3)] p-3 snap-start">
                                <button onClick={() => navigate(`/pandit/${p._id}`)} className="w-full flex gap-3 text-left">
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-orange-50 to-amber-100 shrink-0 flex items-center justify-center">
                                        {p.profileImage ? (
                                            <img
                                                src={p.profileImage}
                                                alt={fullName}
                                                className="w-full h-full object-cover object-top"
                                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                            />
                                        ) : (
                                            <span className="text-2xl">🙏</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <p className="font-bold text-stone-800 text-[14px] truncate">{fullName || "Pandit Ji"}</p>
                                            {p.isVerified && <BadgeCheck className="w-4 h-4 text-orange-500 shrink-0" />}
                                        </div>
                                        <p className="text-[11.5px] text-stone-500 mt-0.5">
                                            <span className="font-bold text-orange-600">{p.experienceInYears || 10}+ Years</span> Experience
                                        </p>
                                        {location && (
                                            <p className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                                                <MapPin className="w-3 h-3 text-stone-400 shrink-0" /> <span className="truncate">{location}</span>
                                            </p>
                                        )}
                                        <p className="flex items-center gap-1 text-[12px] font-bold text-amber-700 mt-0.5">
                                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {(p.rating ?? 4.8).toFixed(1)}
                                        </p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate(`/pandit/${p._id}`)}
                                    className="mt-3 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[13.5px] py-2.5 rounded-xl shadow-lg shadow-orange-200/70 active:scale-95 transition-transform"
                                >
                                    Book Pandit Ji
                                </button>
                            </div>
                        );
                    })}
            </div>
        </section>
    );
}
