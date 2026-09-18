import { useState, useEffect, useMemo } from "react";
import PanditCard from "./PanditCard";
import PanditBookingModal from "./PanditBookingModal";
import {
    HOLY_CITIES,
    type HolyPandit, type HolyCity,
} from "./kashiVrindavanData";
import API_URL from "../../../utils/apiConfig";

// ─────────────────────────────────────────────────────────────
//  Book Pandit Ji from Kashi / Vrindavan — Section
//  Premium pandit profiles + at-home ritual booking flow.
//  Renders dummy data instantly, then replaces with the backend
//  catalog (GET /holy-pandits) when available.
// ─────────────────────────────────────────────────────────────

export default function KashiVrindavanSection() {
    const [pandits, setPandits] = useState<HolyPandit[]>([]);
    const [city, setCity] = useState<HolyCity>("All");
    const [selected, _setSelected] = useState<HolyPandit | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPandits = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/holy-pandits`);
            if (!res.ok) throw new Error("Server responded with error status");
            const json = await res.json();
            const data: HolyPandit[] = json?.data || [];
            setPandits(data);
        } catch (err) {
            console.error("Error fetching holy pandits:", err);
            setError("Failed to fetch pandits. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPandits();
    }, []);

    const filtered = useMemo(
        () => (city === "All" ? pandits : pandits.filter((p) => p.city === city)),
        [pandits, city]
    );

    // const handleBook = (pandit: HolyPandit) => {
    //     setSelected(pandit);
    //     setIsModalOpen(true);
    //     if (window.fbq) {
    //         window.fbq("track", "ViewContent", {
    //             content_name: `${pandit.name} - ${pandit.city}`,
    //             content_type: "holy_pandit",
    //         });
    //     }
    // };

    return (
        <section className="kvp-section relative py-6 overflow-hidden bg-gradient-to-b from-[#F5F4FF] to-[#FAFAFF]">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');
                .kvp-section { font-family: 'DM Sans', sans-serif; }
                .kvp-rail::-webkit-scrollbar { display: none; }
                .kvp-rail { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Decorative glow */}
            <div className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full bg-indigo-200/30 blur-3xl" />

            {/* Header */}
            <div className="px-5 mb-3">
                <h2 className="text-stone-900 font-bold leading-tight text-center" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "27px" }}>
                    Book {" "}
                    <span className="italic bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Pandit Ji</span>
                </h2>
            </div>

            {/* City filter */}
            <div className="px-5 mb-1 flex gap-2">
                {HOLY_CITIES.map((c) => (
                    <button
                        key={c}
                        onClick={() => setCity(c)}
                        className={`text-[12px] font-bold px-4 py-1.5 rounded-full transition-colors ${city === c
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                            : "bg-white text-stone-600 border border-stone-200"}`}
                    >
                        {c === "All" ? "All Pandits" : c}
                    </button>
                ))}
            </div>

            {/* Card rail */}
            <div className="kvp-rail overflow-x-auto overflow-y-visible">
                <div className="flex gap-4 px-5 py-5">
                    {loading && (
                        <>
                            <PanditCardSkeleton />
                            <PanditCardSkeleton />
                        </>
                    )}

                    {error && (
                        <div className="w-full text-center py-6 bg-red-50 border border-red-100 rounded-2xl mx-1 shrink-0">
                            <p className="text-red-600 text-[13px] font-semibold">{error}</p>
                            <button
                                onClick={fetchPandits}
                                className="mt-2 text-xs font-bold text-red-700 underline"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {!loading && !error && filtered.length === 0 && (
                        <p className="w-full text-center text-stone-400 text-sm py-6 shrink-0">No pandits available in this city yet.</p>
                    )}

                    {!loading && !error && filtered.map((pandit) => (
                        <PanditCard key={pandit.id} pandit={pandit} />
                    ))}
                    <div className="shrink-0 w-1" />
                </div>
            </div>

            <PanditBookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                pandit={selected}
            />
        </section>
    );
}

function PanditCardSkeleton() {
    return (
        <div className="shrink-0 w-[76vw] max-w-[290px] rounded-[24px] bg-white overflow-hidden border border-indigo-100/80 shadow-md animate-pulse">
            <div className="p-4 flex gap-3.5">
                <div className="w-16 h-16 rounded-2xl bg-stone-200 shrink-0" />
                <div className="flex-1 min-w-0 pt-0.5 space-y-2">
                    <div className="h-4 bg-stone-200 rounded w-3/4" />
                    <div className="h-3 bg-stone-200 rounded w-1/2" />
                    <div className="h-3 bg-stone-200 rounded w-2/3" />
                </div>
            </div>
            <div className="px-4 pb-4 pt-1 space-y-3">
                <div className="h-3 bg-stone-200 rounded w-5/6" />
                <div className="h-px bg-stone-100 my-2" />
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <div className="h-2 bg-stone-200 rounded w-12" />
                        <div className="h-4 bg-stone-200 rounded w-20" />
                    </div>
                    <div className="h-9 bg-stone-200 rounded-xl w-28" />
                </div>
            </div>
        </div>
    );
}
