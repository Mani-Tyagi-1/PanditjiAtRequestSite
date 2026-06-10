import { motion } from "framer-motion";
import { MapPin, Star, BadgeCheck, ChevronRight, Languages } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { HolyPandit } from "./kashiVrindavanData";

interface Props {
    pandit: HolyPandit;
}

export default function PanditCard({ pandit }: Props) {
    const navigate = useNavigate();
    return (
        <motion.div
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate(`/holy-pandit/${pandit.id}`)}
            className="kvp-card group relative shrink-0 w-[80vw] max-w-[300px] cursor-pointer rounded-[20px] bg-white overflow-hidden border border-indigo-100/80 shadow-[0_10px_34px_-12px_rgba(67,56,202,0.28)]"
        >
            {/* ── Header: photo + identity ── */}
            <div className="relative p-3 flex gap-3 bg-gradient-to-br from-indigo-50 to-violet-50">
                <div className="relative shrink-0">
                    <img
                        src={pandit.image}
                        alt={pandit.name}
                        loading="lazy"
                        className="w-[72px] h-[72px] rounded-2xl object-cover border-2 border-white shadow-sm"
                    />
                    {pandit.verified && (
                        <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
                            <BadgeCheck className="w-4 h-4 text-indigo-600 fill-indigo-100" />
                        </span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-indigo-600">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="text-[10.5px] font-bold uppercase tracking-wide">{pandit.city}</span>
                    </div>
                    <h3 className="text-stone-900 font-bold leading-tight mt-0.5 truncate" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "19px" }}>
                        {pandit.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="flex items-center gap-0.5 font-bold text-stone-700">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {pandit.rating.toFixed(1)}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="text-stone-500 font-medium">{pandit.experienceYears} yrs exp</span>
                    </div>
                    <p className="text-[10.5px] text-stone-400 font-medium mt-0.5">
                        {pandit.pujasPerformed.toLocaleString("en-IN")}+ pujas performed
                    </p>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="p-3">
                {/* Specializations */}
                <div className="flex flex-wrap gap-1.5">
                    {pandit.specializations.slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                            {s}
                        </span>
                    ))}
                </div>

                {/* Languages */}
                <div className="flex items-center gap-1 mt-2 text-[11px] text-stone-500 font-medium">
                    <Languages className="w-3.5 h-3.5 text-stone-400" />
                    {pandit.languages.join(" · ")}
                </div>

                {/* Divider */}
                <div className="my-3 h-px bg-gradient-to-r from-transparent via-indigo-100 to-transparent" />

                {/* Price + CTA */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-0.5">Starting at</span>
                        <span className="text-[18px] font-extrabold text-stone-900">₹{pandit.startingPrice.toLocaleString("en-IN")}</span>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/holy-pandit/${pandit.id}`);
                        }}
                        className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-bold pl-4 pr-3 py-2.5 rounded-xl shadow-lg shadow-indigo-200/70 active:scale-95 transition-transform"
                    >
                        Book Pandit
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
