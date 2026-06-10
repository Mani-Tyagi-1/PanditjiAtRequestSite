import { motion } from "framer-motion";
import { MapPin, Clock, Star, Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LiveMandirPuja } from "./liveMandirData";

const STATUS_META: Record<
    LiveMandirPuja["status"],
    { label: string; dot: string; chip: string }
> = {
    live: { label: "LIVE NOW", dot: "bg-red-500", chip: "bg-red-500/95 text-white" },
    upcoming: { label: "UPCOMING", dot: "bg-amber-400", chip: "bg-black/55 text-white backdrop-blur-sm" },
    daily: { label: "DAILY SEVA", dot: "bg-emerald-400", chip: "bg-black/55 text-white backdrop-blur-sm" },
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
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate(`/live-mandir-puja/${puja.id}`)}
            className="lmp-card group relative shrink-0 w-[68vw] max-w-[260px] cursor-pointer rounded-[20px] bg-white overflow-hidden border border-amber-100/80 shadow-[0_10px_34px_-12px_rgba(180,83,9,0.35)]"
        >
            {/* ── Image header ── */}
            <div className="relative h-[140px] overflow-hidden">
                <img
                    src={puja.image}
                    alt={`${puja.pujaName} at ${puja.templeName}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                />
                {/* Cinematic gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/25" />

                {/* Status badge */}
                <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${status.chip}`}>
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
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-[10px] font-extrabold text-amber-950 shadow-md">
                        {discount}% OFF
                    </div>
                )}

                {/* Rating + devotees */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <span className="flex items-center gap-1 text-[11px] font-bold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {puja.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Users className="w-3 h-3" />
                        {puja.devoteesJoined.toLocaleString("en-IN")} joined
                    </span>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="p-3">
                {/* Temple */}
                <div className="flex items-center gap-1 text-orange-600">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wide truncate">
                        {puja.templeName}
                    </span>
                </div>

                {/* Puja name */}
                <div className="mt-1 flex items-baseline justify-between gap-2">
                    <h3
                        className="lmp-title text-stone-900 font-bold leading-tight truncate"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "19px" }}
                    >
                        {puja.pujaName}
                    </h3>
                    <span className="text-[13px] font-semibold text-stone-400 shrink-0">
                        {puja.pujaNameHindi}
                    </span>
                </div>

                {/* Schedule row */}
                <div className="mt-2 flex items-center gap-3 text-[11.5px] text-stone-500 font-medium">
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        {puja.scheduledDate}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {puja.scheduledTime}
                    </span>
                </div>

                {/* Divider */}
                <div className="my-3 h-px bg-gradient-to-r from-transparent via-amber-100 to-transparent" />

                {/* Price + CTA */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-0.5">
                            Starting at
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[19px] font-extrabold text-stone-900">
                                ₹{puja.price.toLocaleString("en-IN")}
                            </span>
                            {puja.originalPrice && (
                                <span className="text-[12px] text-stone-400 line-through">
                                    ₹{puja.originalPrice.toLocaleString("en-IN")}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/live-mandir-puja/${puja.id}`);
                        }}
                        className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[13px] font-bold pl-4 pr-3 py-2.5 rounded-xl shadow-lg shadow-orange-200/70 active:scale-95 transition-transform"
                    >
                        Book Puja
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
