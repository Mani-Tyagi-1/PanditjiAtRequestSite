import { useState, useEffect } from "react";
import LiveMandirPujaCard from "./LiveMandirPujaCard";
import { type LiveMandirPuja } from "./liveMandirData";
import API_URL from "../../../utils/apiConfig";

// ─────────────────────────────────────────────────────────────
//  Live Pujas from Mandir — Section
//  Renders the premium card carousel + drives the booking flow.
//  Data is currently dummy (see liveMandirData.ts). Swap the
//  import for an API fetch when the backend endpoint is ready.
// ─────────────────────────────────────────────────────────────

export default function LiveMandirPujasSection() {
    const [pujas, setPujas] = useState<LiveMandirPuja[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPujas = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/live-mandir-pujas`);
            if (!res.ok) throw new Error("Server responded with error status");
            const json = await res.json();
            const data: LiveMandirPuja[] = json?.data || [];
            setPujas(data);
        } catch (err) {
            console.error("Error fetching live mandir pujas:", err);
            setError("Failed to fetch live pujas. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPujas();
    }, []);

    return (
        <section className="lmp-section relative py-6 overflow-hidden bg-gradient-to-b from-[#FFF8EE] to-[#FFFAF3] md:py-14 lg:py-16">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');
                .lmp-section { font-family: 'DM Sans', sans-serif; }
                .lmp-rail::-webkit-scrollbar { display: none; }
                .lmp-rail { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Decorative glow */}
            <div className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full bg-orange-200/30 blur-3xl" />

            {/* ── Header ── */}
            <div className="px-5 mb-1 md:mb-3">
                <h2 className="text-stone-900 font-bold leading-tight text-center text-[27px] md:text-4xl lg:text-[40px] md:tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Book{" "}
                    <span className="italic bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                        Live Pujas
                    </span>
                </h2>
            </div>

            {/* ── Card rail ── */}
            <div className="lmp-rail overflow-x-auto overflow-y-visible md:overflow-visible">
                <div className="flex gap-4 px-5 py-5 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 lg:gap-7 md:py-7 md:px-8 lg:px-10">
                    {loading && (
                        <>
                            <LiveMandirPujaSkeleton />
                            <LiveMandirPujaSkeleton />
                            <LiveMandirPujaSkeleton />
                        </>
                    )}

                    {error && (
                        <div className="w-full text-center py-6 bg-red-50 border border-red-100 rounded-2xl mx-1 shrink-0 md:col-span-full md:mx-0">
                            <p className="text-red-600 text-[13px] font-semibold">{error}</p>
                            <button
                                onClick={fetchPujas}
                                className="mt-2 text-xs font-bold text-red-700 underline cursor-pointer"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {!loading && !error && pujas.length === 0 && (
                        <div className="w-full text-center py-10 text-stone-500 text-sm shrink-0 md:col-span-full">
                            No live pujas scheduled at this time. Please check back later. 🙏
                        </div>
                    )}

                    {!loading && !error && pujas.map((puja) => (
                        <LiveMandirPujaCard key={puja.id} puja={puja} />
                    ))}
                    {/* Tail spacer so last card isn't flush to edge */}
                    <div className="shrink-0 w-1 md:hidden" />
                </div>
            </div>
        </section>
    );
}

function LiveMandirPujaSkeleton() {
    return (
        <div className="shrink-0 w-[68vw] max-w-[260px] rounded-[20px] bg-white overflow-hidden border border-amber-100/80 shadow-md animate-pulse md:w-auto md:max-w-none md:shrink">
            <div className="h-[140px] bg-stone-200 md:h-[170px] lg:h-[185px]" />
            <div className="p-3 space-y-3">
                <div className="h-3 bg-stone-200 rounded w-1/3" />
                <div className="h-5 bg-stone-200 rounded w-3/4" />
                <div className="h-3 bg-stone-200 rounded w-1/2" />
                <div className="h-px bg-stone-100 my-2" />
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <div className="h-2 bg-stone-200 rounded w-10" />
                        <div className="h-4 bg-stone-200 rounded w-16" />
                    </div>
                    <div className="h-8 bg-stone-200 rounded-xl w-24" />
                </div>
            </div>
        </div>
    );
}
