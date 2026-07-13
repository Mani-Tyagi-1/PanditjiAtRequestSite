import { useState, useEffect } from "react";
import ChadhavaCard from "./ChadhavaCard";
import { type Chadhava } from "./chadhavaData";
import API_URL from "../../../utils/apiConfig";

// ─────────────────────────────────────────────────────────────
//  Chadhava (Offerings) Booking — Section
//  Premium card carousel + booking flow with a prasad-box upsell
//  shown at the review step. Data is dummy (chadhavaData.ts) —
//  swap the import for an API fetch when the backend is ready.
// ─────────────────────────────────────────────────────────────

export default function ChadhavaSection() {
    const [chadhavas, setChadhavas] = useState<Chadhava[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchChadhavas = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/chadhavas`);
            if (!res.ok) throw new Error("Server responded with error status");
            const json = await res.json();
            const data: Chadhava[] = json?.data || [];
            setChadhavas(data);
        } catch (err) {
            console.error("Error fetching chadhavas:", err);
            setError("Failed to fetch offerings. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChadhavas();
    }, []);

    // const handleOffer = (chadhava: Chadhava) => {
    //     setSelected(chadhava);
    //     setIsModalOpen(true);
    //     if (window.fbq) {
    //         window.fbq("track", "ViewContent", {
    //             content_name: `Chadhava - ${chadhava.deity} - ${chadhava.templeName}`,
    //             content_type: "chadhava",
    //         });
    //     }
    // };

    return (
        <section className="cdv-section relative py-6 overflow-hidden bg-gradient-to-b from-[#FFF6F4] to-[#FFFAF6] md:py-12 lg:py-16">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');
                .cdv-section { font-family: 'DM Sans', sans-serif; }
                .cdv-rail::-webkit-scrollbar { display: none; }
                .cdv-rail { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Decorative glow */}
            <div className="pointer-events-none absolute -top-10 -left-10 w-44 h-44 rounded-full bg-rose-200/30 blur-3xl" />

            {/* ── Header ── */}
            <div className="px-5 mb-1 md:mb-4">
                <h2 className="text-stone-900 font-bold leading-tight text-center text-[27px] md:text-4xl lg:text-[40px] md:tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Offer{" "}
                    <span className="italic bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">
                        Chadhava
                    </span>
                </h2>
            </div>

            {/* ── Card rail ── */}
            <div className="cdv-rail overflow-x-auto overflow-y-visible md:overflow-visible">
                <div className="flex gap-4 px-5 py-5 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-5 lg:gap-6 md:w-full md:px-8 lg:px-10 md:py-8">
                    {loading && (
                        <>
                            <ChadhavaCardSkeleton />
                            <ChadhavaCardSkeleton />
                            <ChadhavaCardSkeleton />
                        </>
                    )}

                    {error && (
                        <div className="w-full text-center py-6 bg-red-50 border border-red-100 rounded-2xl mx-1 shrink-0 md:col-span-3 lg:col-span-4 md:mx-0">
                            <p className="text-red-600 text-[13px] font-semibold">{error}</p>
                            <button
                                onClick={fetchChadhavas}
                                className="mt-2 text-xs font-bold text-red-700 underline"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {!loading && !error && chadhavas.length === 0 && (
                        <div className="w-full text-center py-10 text-stone-500 text-sm shrink-0 md:col-span-3 lg:col-span-4">
                            No chadhava offerings available at this time. Please check back later. 🙏
                        </div>
                    )}

                    {!loading && !error && chadhavas.map((chadhava) => (
                        <ChadhavaCard key={chadhava.id} chadhava={chadhava} />
                    ))}
                    <div className="shrink-0 w-1 md:hidden" />
                </div>
            </div>
        </section>
    );
}

function ChadhavaCardSkeleton() {
    return (
        <div className="shrink-0 w-[68vw] max-w-[260px] rounded-[20px] bg-white overflow-hidden border border-rose-100/80 shadow-md animate-pulse md:w-auto md:shrink md:max-w-none">
            <div className="h-[140px] bg-stone-200 md:h-[168px]" />
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
