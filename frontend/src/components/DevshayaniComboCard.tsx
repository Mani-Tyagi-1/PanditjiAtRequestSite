// ─────────────────────────────────────────────────────────────────────────
//  Devshayani Ekadashi combo card — shown at the top of the Chadhava list.
//  Matches the sibling chadhava cards (warm cream + gold-orange) with a subtle
//  Devshayani accent. Frontend-only + removable — see
//  frontend/src/data/devshayaniCombo.ts.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CalendarDays, Share2, Feather } from "lucide-react";
import {
    devshayaniCombo, DEVSHAYANI_COMBO_SLUG, COMBO_PRICE, COMBO_ORIGINAL, COMBO_DATE,
} from "../data/devshayaniCombo";

function Countdown({ targetDate }: { targetDate: string }) {
    const [txt, setTxt] = useState("");
    useEffect(() => {
        const tick = () => {
            const diff = new Date(targetDate).getTime() - Date.now();
            if (diff <= 0) { setTxt("Offerings Closed"); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTxt(`${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, [targetDate]);
    return <span className="text-[11.5px] font-bold text-stone-700 tabular-nums">{txt}</span>;
}

const displayDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

export function DevshayaniComboCard() {
    const navigate = useNavigate();

    const share = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/chadhava/${DEVSHAYANI_COMBO_SLUG}`;
        if (navigator.share) {
            try { await navigator.share({ title: devshayaniCombo.deity, text: "Devshayani Ekadashi Tri-Dham Maha Chadhava", url }); } catch { /* cancelled */ }
        } else {
            try { await navigator.clipboard.writeText(url); alert("Link copied to clipboard!"); } catch { /* ignore */ }
        }
    };

    const open = () => navigate(`/chadhava/${DEVSHAYANI_COMBO_SLUG}`);

    return (
        <div
            onClick={open}
            className="bg-[#FFFDF9] rounded-[24px] overflow-hidden border border-[#F1D9A8] shadow-[0_12px_36px_-12px_rgba(224,90,16,0.14)] cursor-pointer active:scale-[0.995] transition-transform flex flex-col"
        >
            {/* Banner */}
            <div className="relative w-full h-52 overflow-hidden rounded-t-[24px]">
                <img src={devshayaniCombo.image} alt={devshayaniCombo.deity} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                {/* Event pill — Devshayani accent (white pill, gold feather) */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-[2px] text-[#9B1B1B] px-3 py-1 text-[11px] font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                    <Feather className="w-3.5 h-3.5 text-[#C79A3A]" />
                    <span>Devshayani Ekadashi Special</span>
                </div>

                {/* Share */}
                <button onClick={share} className="absolute top-3 right-3 w-8 h-8 bg-white/95 rounded-full flex items-center justify-center shadow-md border border-stone-100/50 active:scale-90 transition-transform">
                    <Share2 className="w-4 h-4 text-stone-700" />
                </button>

                {/* Countdown */}
                <div className="absolute bottom-3 left-3 bg-white/95 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm border border-stone-100/30">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                    </span>
                    <Countdown targetDate={COMBO_DATE} />
                </div>

                {/* Combo badge */}
                <div className="absolute bottom-3 right-3 bg-[#9B1B1B]/90 text-white rounded-full px-2.5 py-1 text-[10.5px] font-bold shadow-sm">
                    3 Temples Combo
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[12.5px] font-semibold text-stone-500 gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="truncate">{devshayaniCombo.templeName}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-amber-800 bg-amber-50/50 px-2 py-0.5 rounded-md">
                        <CalendarDays className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                        <span>{displayDate(COMBO_DATE)}</span>
                    </div>
                </div>

                <h2 className="text-[19px] font-bold text-[#2E1F15] mt-1 text-left leading-snug">
                    Tri-Dham Maha Chadhava Combo
                </h2>

                <p className="text-[13px] text-stone-500 leading-relaxed line-clamp-2 text-left mt-0.5">
                    All 9 sacred sevas offered in your name at Khatu Shyam Ji, Banke Bihari Ji &amp; Shri Badrinath Ji this Devshayani Ekadashi.
                </p>

                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-[20px] font-extrabold text-[#C1272D]">₹{COMBO_PRICE.toLocaleString("en-IN")}/-</span>
                    <span className="text-[13px] text-stone-400 line-through">₹{COMBO_ORIGINAL.toLocaleString("en-IN")}/-</span>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.fbq) {
                            window.fbq("track", "Chadhava Participate Now", {
                                content_name: devshayaniCombo.deity,
                                content_ids: [DEVSHAYANI_COMBO_SLUG],
                                content_type: "chadhava",
                                value: COMBO_PRICE,
                                currency: "INR",
                            });
                        }
                        navigate(`/chadhava/${DEVSHAYANI_COMBO_SLUG}`);
                    }}
                    className="mt-3 w-full bg-[#E05A10] hover:bg-[#C94D0C] text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-1.5 shadow-lg shadow-orange-200/50 active:scale-[0.985] transition-all duration-200 text-[14.5px]"
                >
                    <span>Participate Now</span>
                </button>
            </div>
        </div>
    );
}
