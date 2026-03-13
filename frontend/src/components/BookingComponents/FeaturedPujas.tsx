import { useState, useEffect } from "react";
import PujaCard from "./UI/PujaCard";
import axios from "axios";

// ─── Featured Pujas Section ───────────────────────────────────
export default function FeaturedPujas() {
    const [pujas, setPujas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPujas = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";
                const response = await axios.get(`${apiUrl}/fetch-all-poojas`);
                // Based on controller, it returns { poojas: [] }
                setPujas(response.data.poojas || []);
            } catch (error) {
                console.error("Error fetching featured pujas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPujas();
    }, []);

    const displayPujas = pujas.slice(0, 6);

    if (loading) {
        return (
            <section className="bg-[#FFFAF3] px-4 py-10 sm:px-6 lg:px-10 flex justify-center items-center min-h-[300px]">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </section>
        );
    }

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        .fp-section { font-family: 'DM Sans', sans-serif; }
        .fp-title   { font-family: 'Cormorant Garamond', serif; }
        .filter-pill { transition: all 0.2s ease; }
        .card-enter { animation: cardIn 0.4s ease both; }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            <section className="fp-section bg-[#FFFAF3] px-4 py-10 sm:px-6 lg:px-10 font-medium overflow-hidden">
                <div className="max-w-md mx-auto">

                    {/* ── Section Header ── */}
                    <div className="text-center mb-6">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-widest uppercase text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-3 py-1 mb-3 shadow-sm">
                            🕉 Featured Pujas
                        </span>
                        <h2
                            className="text-[20px] text-stone-800 leading-snug font-bold"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            Authentic ceremonies performed by verified pandits
                        </h2>
                    </div>

                    {/* ── Grid ── */}
                    {displayPujas.length === 0 ? (
                        <p className="text-center text-stone-400 text-sm py-16">No pujas found at the moment.</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
                            {displayPujas.map((puja: any, i: number) => (
                                <div
                                    key={puja._id}
                                    className="card-enter"
                                    style={{ animationDelay: `${i * 60}ms` }}
                                >
                                    <PujaCard
                                        id={puja._id}
                                        title={puja.poojaNameEng}
                                        subtitle={puja.poojaSubDescription || puja.poojaDescriptionMain}
                                        price={puja.poojaPriceOnline || puja.poojaPriceOffline || 0}
                                        image={puja.poojaCardImage}
                                        badge={puja.isFeatured ? "Featured" : undefined}
                                        onBook={() => {}}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Bottom CTA ── */}
                    <div className="mt-10 text-center">
                        <button className="inline-flex items-center gap-2 border border-orange-300 text-orange-600 text-sm font-medium px-6 py-2.5 rounded-full hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200">
                            Browse All Pujas
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                            </svg>
                        </button>
                    </div>

                </div>
            </section>
        </>
    );
}