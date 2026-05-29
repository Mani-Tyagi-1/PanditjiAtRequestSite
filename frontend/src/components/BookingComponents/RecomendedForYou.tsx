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

            <section className="fp-section bg-[#FFFAF3] py-4 font-medium">

                {/* ── Section Header ── */}
                <div className="text-center mb-2 px-4">
                    <div className="flex items-center gap-2 justify-center mb-2">
                        <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-transparent to-orange-200" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
                            🕉 Recommended For You
                        </span>
                        <div className="h-px flex-1 max-w-[40px] bg-gradient-to-l from-transparent to-orange-200" />
                    </div>
                    <h2
                        className="text-xl font-bold text-stone-800"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                        Spiritual ceremonies{" "}
                        <span className="italic bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                            tailored for you
                        </span>
                    </h2>
                    <p className="text-[12px] text-stone-500 text-center mt-1 font-light">
                        Handpicked Vedic pujas curated to align with your sacred occasion and intention.
                    </p>
                </div>

                {/* ── Horizontal Scroll Grid (2 rows) ── */}
                {pujas.length === 0 ? (
                    <p className="text-center text-stone-400 text-sm py-16">No recommendations available.</p>
                ) : (
                    <div className="fp-scroll overflow-x-auto overflow-y-hidden pl-2 pr-4 sm:pl-3 sm:pr-6 lg:pl-4 lg:pr-10">
                        <div
                            className="grid gap-3 py-4"
                            style={{
                                gridTemplateRows: "repeat(2, auto)",
                                gridAutoFlow: "column",
                                gridAutoColumns: "calc(41% - 6px)",
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
