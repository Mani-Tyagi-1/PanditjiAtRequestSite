import { useState, useEffect } from "react";
import PujaCard from "./UI/PujaCard";
import axios from "axios";
import API_URL from "../../utils/apiConfig";

// ─── Recommended For You Section ──────────────────────────────
export default function RecomendedForYou() {
    const [pujas, setPujas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPujas = async () => {
            try {
                const apiUrl = API_URL;
                const response = await axios.get(`${apiUrl}/fetch-all-poojas`);
                const allPujas = response.data.poojas || [];
                const filtered = allPujas
                    .filter((p: any) => p.isFeatured && p.isExclusive && p.isActive)
                    .sort((a: any, b: any) => (a.featuredRank ?? Infinity) - (b.featuredRank ?? Infinity));
                setPujas(filtered);
            } catch (error) {
                console.error("Error fetching recommended pujas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPujas();
    }, []);

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
        .fp-scroll::-webkit-scrollbar { display: none; }
        .fp-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .card-enter { animation: cardIn 0.4s ease both; }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            <section className="fp-section bg-[#FFFAF3] py-10 font-medium">

                {/* ── Section Header ── */}
                <div className="text-center mb-6 px-4 sm:px-6 lg:px-10">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-widest uppercase text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-3 py-1 mb-3 shadow-sm">
                        🕉 Recommended For You
                    </span>
                    <h2
                        className="text-[20px] text-stone-800 leading-snug font-bold"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                        Spiritual ceremonies tailored for your well-being
                    </h2>
                </div>

                {/* ── Horizontal Scroll Grid (2 rows) ── */}
                {pujas.length === 0 ? (
                    <p className="text-center text-stone-400 text-sm py-16">No recommendations available.</p>
                ) : (
                    <div className="fp-scroll overflow-x-auto overflow-y-hidden px-4 sm:px-6 lg:px-10">
                        <div
                            className="grid gap-3 py-4"
                            style={{
                                gridTemplateRows: "repeat(2, auto)",
                                gridAutoFlow: "column",
                                gridAutoColumns: "calc(47% - 6px)",
                            }}
                        >
                            {pujas.map((puja, i) => (
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
                                        badge="Highly Recommended"
                                        badgeColor="bg-emerald-600"
                                        onBook={() => { }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </section>
        </>
    );
}
