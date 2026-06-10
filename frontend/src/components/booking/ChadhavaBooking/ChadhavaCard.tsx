import { motion } from "framer-motion";
import { MapPin, Star, Users, ChevronRight, Flower2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Chadhava } from "./chadhavaData";

interface Props {
    chadhava: Chadhava;
}

export default function ChadhavaCard({ chadhava }: Props) {
    const navigate = useNavigate();
    const discount = chadhava.originalPrice
        ? Math.round(((chadhava.originalPrice - chadhava.startingPrice) / chadhava.originalPrice) * 100)
        : 0;

    return (
        <motion.div
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate(`/chadhava/${chadhava.id}`)}
            className="cdv-card group relative shrink-0 w-[68vw] max-w-[260px] cursor-pointer rounded-[20px] bg-white overflow-hidden border border-rose-100/80 shadow-[0_10px_34px_-12px_rgba(190,18,60,0.28)]"
        >
            {/* ── Image header ── */}
            <div className="relative h-[140px] overflow-hidden">
                <img
                    src={chadhava.image}
                    alt={`Chadhava for ${chadhava.deity} at ${chadhava.templeName}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/25" />

                {/* Chadhava badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-rose-600/95 text-white">
                    <Flower2 className="w-3 h-3" />
                    CHADHAVA
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
                        {chadhava.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Users className="w-3 h-3" />
                        {chadhava.devoteesOffered.toLocaleString("en-IN")} offered
                    </span>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="p-3">
                {/* Temple */}
                <div className="flex items-center gap-1 text-rose-600">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wide truncate">
                        {chadhava.templeName}
                    </span>
                </div>

                {/* Deity name */}
                <div className="mt-1 flex items-baseline justify-between gap-2">
                    <h3
                        className="text-stone-900 font-bold leading-tight truncate"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "19px" }}
                    >
                        {chadhava.deity}
                    </h3>
                    <span className="text-[13px] font-semibold text-stone-400 shrink-0">
                        {chadhava.deityHindi}
                    </span>
                </div>

                {/* Offering day */}
                <p className="mt-1.5 text-[11.5px] text-stone-500 font-medium truncate">
                    🪔 {chadhava.offeringDay}
                </p>

                {/* Divider */}
                <div className="my-3 h-px bg-gradient-to-r from-transparent via-rose-100 to-transparent" />

                {/* Price + CTA */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-0.5">
                            Starting at
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[19px] font-extrabold text-stone-900">
                                ₹{chadhava.startingPrice.toLocaleString("en-IN")}
                            </span>
                            {chadhava.originalPrice && (
                                <span className="text-[12px] text-stone-400 line-through">
                                    ₹{chadhava.originalPrice.toLocaleString("en-IN")}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chadhava/${chadhava.id}`);
                        }}
                        className="flex items-center gap-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[13px] font-bold pl-4 pr-3 py-2.5 rounded-xl shadow-lg shadow-rose-200/70 active:scale-95 transition-transform"
                    >
                        Offer Now
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
