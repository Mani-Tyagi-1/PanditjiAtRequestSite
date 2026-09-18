import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Landmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../../utils/apiConfig";
import { money } from "../../utils/currency";

type RelatedPuja = {
    _id: string;
    poojaNameEng: string;
    poojaNameHindi?: string;
    poojaMode: "online" | "offline" | "both";
    poojaPriceOnline?: number;
    poojaPriceOffline?: number;
    poojaCardImage?: string;
};

type Props = {
    title: string;
    subtitle: string;
    terms: string[];
    excludePoojaID: string;
    source: string;
    limit?: number;
};

const modeLabel = (mode: RelatedPuja["poojaMode"]) => mode === "both" ? "Online or at home" : mode === "offline" ? "At-home puja" : "Online puja";

export default function RelatedPujasSection({ title, subtitle, terms, excludePoojaID, source, limit = 6 }: Props) {
    const navigate = useNavigate();
    const railRef = useRef<HTMLDivElement | null>(null);
    const [poojas, setPoojas] = useState<RelatedPuja[]>([]);
    const [loading, setLoading] = useState(true);
    const [reducedMotion, setReducedMotion] = useState(false);
    const termKey = terms.join(",");

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReducedMotion(media.matches);
        update();
        media.addEventListener?.("change", update);
        return () => media.removeEventListener?.("change", update);
    }, []);

    useEffect(() => {
        let active = true;
        axios.get(`${API_URL}/fetch-related-poojas`, { params: { terms: termKey, excludePoojaID, limit } })
            .then(({ data }) => { if (active) setPoojas(Array.isArray(data?.poojas) ? data.poojas : []); })
            .catch((error) => { console.error(`[RelatedPujas:${source}] failed to load:`, error); if (active) setPoojas([]); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [excludePoojaID, limit, source, termKey]);

    const repeatedPoojas = useMemo(() => poojas.length > 2 ? [...poojas, ...poojas] : poojas, [poojas]);

    useEffect(() => {
        const rail = railRef.current;
        if (!rail || reducedMotion || poojas.length < 3) return;
        let paused = false;
        const pause = () => { paused = true; };
        const resume = () => { paused = false; };
        rail.addEventListener("pointerenter", pause);
        rail.addEventListener("pointerleave", resume);
        rail.addEventListener("touchstart", pause, { passive: true });
        rail.addEventListener("touchend", resume, { passive: true });
        rail.addEventListener("focusin", pause);
        rail.addEventListener("focusout", resume);
        const id = window.setInterval(() => {
            if (paused) return;
            const card = rail.querySelector<HTMLElement>("[data-related-puja-card]");
            const step = (card?.offsetWidth || 220) + 12;
            if (rail.scrollLeft >= rail.scrollWidth / 2 - step) rail.scrollLeft = 0;
            rail.scrollBy({ left: step, behavior: "smooth" });
        }, 3400);
        return () => {
            window.clearInterval(id);
            rail.removeEventListener("pointerenter", pause);
            rail.removeEventListener("pointerleave", resume);
            rail.removeEventListener("touchstart", pause);
            rail.removeEventListener("touchend", resume);
            rail.removeEventListener("focusin", pause);
            rail.removeEventListener("focusout", resume);
        };
    }, [poojas.length, reducedMotion]);

    if (!loading && poojas.length === 0) return null;

    const scroll = (direction: -1 | 1) => {
        const rail = railRef.current;
        if (!rail) return;
        const card = rail.querySelector<HTMLElement>("[data-related-puja-card]");
        rail.scrollBy({ left: direction * ((card?.offsetWidth || 220) + 12), behavior: "smooth" });
    };

    return (
        <section aria-labelledby="related-pujas-title" className="space-y-2">
            <div className="flex items-end justify-between gap-2">
                <div>
                    <h3 id="related-pujas-title" className="font-svn-sub text-[12px] font-bold uppercase tracking-[0.14em] text-[#7A1622]">{title}</h3>
                    <p className="text-[11px] text-[#665C50] mt-0.5">{subtitle}</p>
                </div>
                {!loading && poojas.length > 1 && <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => scroll(-1)} aria-label="Previous related puja" className="w-7 h-7 rounded-full border border-[#C79A2B]/70 bg-[#FCF8F0] flex items-center justify-center text-[#7A1622]"><ChevronLeft className="w-4 h-4" /></button>
                    <button type="button" onClick={() => scroll(1)} aria-label="Next related puja" className="w-7 h-7 rounded-full border border-[#C79A2B]/70 bg-[#FCF8F0] flex items-center justify-center text-[#7A1622]"><ChevronRight className="w-4 h-4" /></button>
                </div>}
            </div>
            <div ref={railRef} className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1 -mx-1 px-1" aria-label="Related Shiva pujas">
                {loading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="w-[210px] shrink-0 snap-start rounded-2xl border border-[#D8B66A]/60 bg-[#FCF8F0] overflow-hidden animate-pulse"><div className="h-28 bg-[#E8DDC8]" /><div className="p-3 space-y-2"><div className="h-3 bg-[#E8DDC8] rounded" /><div className="h-3 bg-[#E8DDC8] rounded w-2/3" /><div className="h-7 bg-[#E8DDC8] rounded" /></div></div>) : repeatedPoojas.map((pooja, index) => {
                    const price = pooja.poojaMode === "offline" ? pooja.poojaPriceOffline : pooja.poojaPriceOnline;
                    return <article key={`${pooja._id}-${index}`} data-related-puja-card className="w-[210px] shrink-0 snap-start rounded-2xl border border-[#D8B66A]/70 bg-[#FCF8F0] overflow-hidden shadow-[0_3px_14px_-8px_rgba(40,25,10,0.45)]">
                        <button type="button" onClick={() => navigate(`/puja/${pooja._id}`)} className="block w-full text-left">
                            <div className="relative h-28 bg-[#EFE3CC] overflow-hidden">{pooja.poojaCardImage ? <img src={pooja.poojaCardImage} alt={pooja.poojaNameEng} loading="lazy" className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[#8E6A25]"><Landmark className="w-8 h-8" /></div>}<span className="absolute bottom-2 left-2 rounded-full bg-[#FCF8F0]/95 border border-[#C79A2B]/70 px-2 py-0.5 text-[9px] font-bold text-[#7A1622]">{modeLabel(pooja.poojaMode)}</span></div>
                            <div className="p-3"><h4 className="text-[13px] font-bold text-[#23201B] leading-snug line-clamp-2 min-h-[36px]">{pooja.poojaNameEng}</h4>{pooja.poojaNameHindi && <p className="text-[10px] text-[#8E6A25] mt-0.5 line-clamp-1">{pooja.poojaNameHindi}</p>}<div className="flex items-baseline gap-1.5 mt-1.5">{typeof price === "number" && price > 0 && <span className="text-[14px] font-black text-[#7A1622]">From {money(price)}</span>}</div></div>
                        </button>
                        <button type="button" onClick={() => navigate(`/puja/${pooja._id}`)} className="mx-3 mb-3 w-[calc(100%-24px)] flex items-center justify-center gap-1 bg-[#7A1622] text-[#F3E5BF] text-[11px] font-bold py-2 rounded-xl active:scale-95 transition-transform"><Check className="w-3.5 h-3.5" /> View &amp; Book</button>
                    </article>;
                })}
            </div>
        </section>
    );
}
