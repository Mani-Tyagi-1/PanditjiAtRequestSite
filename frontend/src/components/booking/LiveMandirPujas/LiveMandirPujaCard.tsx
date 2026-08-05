import { motion } from "framer-motion";
import { MapPin, Star, Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LiveMandirPuja } from "./liveMandirData";
import { money } from "../../../utils/currency";

const STATUS_META: Record<
    LiveMandirPuja["status"],
    { label: string; dot: string; chip: string }
> = {
    live: { label: "LIVE NOW", dot: "bg-red-500", chip: "bg-rose-600 text-white shadow-sm" },
    upcoming: { label: "UPCOMING", dot: "bg-amber-400", chip: "bg-black/60 text-white backdrop-blur-xs" },
    daily: { label: "DAILY SEVA", dot: "bg-emerald-400", chip: "bg-black/60 text-white backdrop-blur-xs" },
};

interface Props {
    puja: LiveMandirPuja;
}

export default function LiveMandirPujaCard({ puja }: Props) {
    const navigate = useNavigate();
    const status = STATUS_META[puja.status];
    const discount = puja.originalPrice
        ? Math.round(((puja.originalPrice - puja.price) / puja.originalPrice) * 100)
        : 0;

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/live-mandir-puja/${puja.id}`)}
            className="lmp-card group relative shrink-0 w-[68vw] max-w-[260px] cursor-pointer rounded-[24px] bg-[#FFFDF9] overflow-hidden border border-[#FFEFE2] shadow-[0_12px_36px_-12px_rgba(224,90,16,0.1)] hover:shadow-[0_16px_40px_-10px_rgba(224,90,16,0.16)] transition-all duration-300 flex flex-col justify-between"
        >
            {/* Image & Overlay */}
            <div className="relative h-[135px] overflow-hidden rounded-t-[24px]">
                <img
                    src={puja.image}
                    alt={`${puja.pujaName} at ${puja.templeName}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2E1F15]/90 via-transparent to-black/20" />

                {/* Status badge */}
                <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider ${status.chip}`}>
                    <span className="relative flex h-1.5 w-1.5">
                        {puja.status === "live" && (
                            <span className={`absolute inline-flex h-full w-full rounded-full ${status.dot} opacity-75 animate-ping`} />
                        )}
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.dot}`} />
                    </span>
                    {status.label}
                </div>

                {/* Discount ribbon */}
                {discount > 0 && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-[9px] font-bold text-amber-950 shadow-sm">
                        {discount}% OFF
                    </div>
                )}

                {/* Rating & Devotees overlay */}
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-black/45 backdrop-blur-xs px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {puja.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-black/45 backdrop-blur-xs px-2 py-0.5 rounded-full">
                        <Users className="w-3 h-3" />
                        {puja.devoteesJoined >= 1000 ? `${(puja.devoteesJoined / 1000).toFixed(1)}k` : puja.devoteesJoined}
                    </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                    {/* Temple Name */}
                    <div className="flex items-center gap-1 text-orange-600">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wide truncate">
                            {puja.templeName}
                        </span>
                    </div>

                    {/* Puja Name & Hindi translation */}
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                        <h3
                            className="text-[#2E1F15] font-bold leading-tight truncate flex-1"
                            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px" }}
                        >
                            {puja.pujaName}
                        </h3>
                        <span className="text-[12px] font-semibold text-stone-400 shrink-0">
                            {puja.pujaNameHindi}
                        </span>
                    </div>
                </div>

                {/* Divider */}
                <div className="my-2.5 h-[1px] bg-[#FFEFE2]" />

                {/* Price and Action button */}
                <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col leading-none">
                        <div className="flex items-baseline gap-1">
                            <span className="text-[17px] font-extrabold text-[#D85C0E]">
                                {money(puja.price)}
                            </span>
                            {puja.originalPrice && (
                                <span className="text-[11px] text-stone-400 line-through">
                                    {money(puja.originalPrice)}
                                </span>
                            )}
                        </div>
                        <span className="text-[9px] font-medium text-stone-400 mt-0.5">{puja.durationMins} min · Live</span>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/live-mandir-puja/${puja.id}`);
                        }}
                        className="flex items-center justify-center bg-[#E05A10] hover:bg-[#C94D0C] text-white p-2 rounded-full shadow-md active:scale-90 transition-all cursor-pointer shrink-0"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
