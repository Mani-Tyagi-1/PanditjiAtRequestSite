import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PujaCard from "./UI/PujaCard";

interface PujaData {
    _id: string;
    poojaID: string;
    poojaNameEng: string;
    poojaNameHindi: string;
    poojaMode: string;
    poojaPriceOnline: number;
    poojaPriceOffline: number;
    mainCategories: { id: string; name: string }[];
    subCategories: { id: string; name: string }[];
    poojaCardImage: string;
    isFeatured: boolean;
    isActive: boolean;
}

// ── Data ─────────────────────────────────────────────────────
const CATEGORIES = ["Wealth", "Health", "Career", "Social Reputation", "Education", "Family"];

export const PUJAS: Record<string, { id: number; title: string; img: string; price: number; popular: boolean; }[]> = {
    Wealth: [
        { id: 1, title: "Shri Lakshmi Pooja", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 2100, popular: true },
        { id: 2, title: "Kuber Pooja", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 1800, popular: false },
        { id: 3, title: "Shri Ashta Lakshmi Pooja", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 3100, popular: true },
        { id: 4, title: "Dhan Varsha Pooja", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 2500, popular: false },
        { id: 5, title: "Vaibhav Lakshmi Vrat", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 1500, popular: false },
        { id: 6, title: "Navgraha Shanti", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 4500, popular: false },
    ],
    Health: [
        { id: 7, title: "Dhanvantari Pooja", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 2200, popular: true },
        { id: 8, title: "Maha Mrityunjaya Jaap", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 3500, popular: true },
        { id: 9, title: "Ayushya Homam", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 2800, popular: false },
    ],
    Career: [
        { id: 10, title: "Saraswati Pooja", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 1800, popular: true },
        { id: 11, title: "Vyapar Vriddhi Pooja", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 2500, popular: false },
        { id: 12, title: "Ganesh Pooja", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 1600, popular: true },
    ],
    "Social Reputation": [
        { id: 13, title: "Mata Ki Chowki", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 17000, popular: true },
        { id: 14, title: "Sunderkand Path", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 5100, popular: false },
    ],
    Education: [
        { id: 15, title: "Vidya Ganapati Pooja", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 1800, popular: true },
        { id: 16, title: "Saraswati Homam", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 2200, popular: false },
    ],
    Family: [
        { id: 17, title: "Satyanarayan Katha", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 2100, popular: true },
        { id: 18, title: "Griha Pravesh Puja", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 5100, popular: false },
        { id: 19, title: "Vastu Shanti Puja", img: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg", price: 3200, popular: false },
    ],
};

// ── Main Page ──────────────────────────────────────────────────
export default function CategoryPage() {
    const { serviceName } = useParams();
    const navigate = useNavigate();

    const [subCategories, setSubCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    // API Data state
    const [allPujas, setAllPujas] = useState<PujaData[]>([]);
    const [isLoadingPujas, setIsLoadingPujas] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setIsLoadingPujas(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

                const [catResponse, poojaResponse] = await Promise.all([
                    fetch(`${apiUrl}/fetch-all-pooja-category`),
                    fetch(`${apiUrl}/fetch-all-poojas`)
                ]);

                const catData = await catResponse.json();
                const poojaData = await poojaResponse.json();

                // 1. Categories logic
                let targetCategoryContent = null;
                if (catData && catData.poojaCategory && Array.isArray(catData.poojaCategory)) {
                    targetCategoryContent = catData.poojaCategory.find((c: any) => c.category_name_en === serviceName);
                } else if (catData && Array.isArray(catData)) {
                    targetCategoryContent = catData.find((c: any) => c.category_name_en === serviceName);
                }

                if (targetCategoryContent && targetCategoryContent.sub_categories) {
                    setSubCategories(targetCategoryContent.sub_categories);
                    if (targetCategoryContent.sub_categories.length > 0) {
                        setActiveCategory(targetCategoryContent.sub_categories[0]);
                    }
                } else {
                    // Fallback local logic
                    setSubCategories(serviceName && !CATEGORIES.includes(serviceName) ? [serviceName, ...CATEGORIES] : CATEGORIES);
                    setActiveCategory(serviceName || "Wealth");
                }

                // 2. Poojas logic
                let pujasList = [];
                if (Array.isArray(poojaData)) pujasList = poojaData;
                else if (poojaData?.data && Array.isArray(poojaData.data)) pujasList = poojaData.data;
                else if (poojaData?.poojas && Array.isArray(poojaData.poojas)) pujasList = poojaData.poojas;
                else if (poojaData?.pooja && Array.isArray(poojaData.pooja)) pujasList = poojaData.pooja;
                else if (poojaData?.poojaDetails && Array.isArray(poojaData.poojaDetails)) pujasList = poojaData.poojaDetails;

                setAllPujas(pujasList.filter((p: PujaData) => p.isActive));

            } catch (error) {
                console.error("Error fetching data:", error);
                setSubCategories(serviceName && !CATEGORIES.includes(serviceName) ? [serviceName, ...CATEGORIES] : CATEGORIES);
                setActiveCategory(serviceName || "Wealth");
            } finally {
                setIsLoading(false);
                setIsLoadingPujas(false);
            }
        };

        if (serviceName) {
            fetchData();
        }
    }, [serviceName]);

    // Client-side filtering of Pujas
    const filteredPujas = allPujas.filter(p => {
        const matchesMain = p.mainCategories?.some(mc => mc.name === serviceName);
        const matchesSub = p.subCategories?.some(sc => sc.name === activeCategory);
        return matchesMain && matchesSub;
    });

    const recommended = filteredPujas.filter((p) => p.isFeatured);
    const all = filteredPujas.filter((p) => !p.isFeatured);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        .puja-page { font-family: 'DM Sans', sans-serif; background: #FFFAF3; min-height: 100vh; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-hide: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.38s ease both; }
      `}</style>

            <div className="max-w-[500px] mx-auto">

                {/* ── Top Header ── */}
                <div className="relative px-4 pt-3 pb-3 text-center bg-gradient-to-br from-red-200 via-orange-200 to-amber-100 rounded-b-[60px] mb-5 shadow-sm">
                    {/* Back */}
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute left-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm"
                    >
                        <svg className="w-4 h-4 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <h1 className="text-orange-600 font-extrabold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px" }}>
                        {serviceName || "Puja"}
                    </h1>
                    <p className="text-orange-900/50 text-xs font-medium mt-0.5">Find the right authentic ritual for your exact intention</p>

                    {/* Decorative divider */}
                    <div className="flex items-center justify-center gap-3 mt-2">
                        <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-orange-400/50" />
                        <span className="text-orange-500">🕉</span>
                        <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-orange-400/50" />
                    </div>
                </div>

                {/* ── Category Tabs ── */}
                <div className="px-4 mb-5">
                    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, idx) => (
                                <div key={idx} className="shrink-0 animate-pulse w-24 h-8 bg-orange-100 rounded-full" />
                            ))
                        ) : subCategories.length > 0 ? (
                            subCategories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`shrink-0 text-sm font-semibold px-4 py-1.5 rounded-full border transition-all duration-200 ${activeCategory === cat
                                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-md shadow-orange-200"
                                        : "bg-white text-stone-600 border-stone-200 hover:border-orange-400 hover:text-orange-600"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))
                        ) : (
                            <div className="text-sm font-medium text-stone-400">No subcategories found.</div>
                        )}
                    </div>
                </div>

                {/* ── Recommended strip ── */}
                {recommended.length > 0 && (
                    <div className="px-4 mb-5 fade-up" key={`rec-${activeCategory}`}>
                        {/* Label */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-orange-300" />
                            <span className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full shadow-sm">
                                ✦ Recommended For You
                            </span>
                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-orange-300" />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                            {recommended.map((p) => (
                                <PujaCard
                                    key={p._id}
                                    id={p._id}
                                    title={p.poojaNameEng}
                                    image={p.poojaCardImage}
                                    price={p.poojaPriceOnline || p.poojaPriceOffline}
                                    subtitle="Sacred ritual performed by expert pandits."
                                    badge="Popular"
                                    duration="2-3 hrs"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── All Pujas ── */}
                {all.length > 0 && (
                    <div className="px-4 pb-10 fade-up" key={`all-${activeCategory}`} style={{ animationDelay: "60ms" }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-stone-800 font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px" }}>
                                All {activeCategory} Pujas
                            </h3>
                            <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">{filteredPujas.length} Services</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
                            {isLoadingPujas ? (
                                Array.from({ length: 4 }).map((_, idx) => (
                                    <div key={idx} className="bg-white rounded-[24px] shadow-sm animate-pulse h-48 border border-orange-100/50" />
                                ))
                            ) : (
                                all.map((p) => (
                                    <PujaCard
                                        key={p._id}
                                        id={p._id}
                                        title={p.poojaNameEng}
                                        image={p.poojaCardImage}
                                        price={p.poojaPriceOnline || p.poojaPriceOffline}
                                        subtitle="Authentic vedic pooja performed exactly as per shastras."
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {(!isLoadingPujas && filteredPujas.length === 0) && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 17L12 22L22 17" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12L12 17L22 12" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="text-stone-500 text-base font-medium">No specialized services available in this category yet.</p>
                        <p className="text-stone-400 text-sm mt-1">Please explore our other divine offerings.</p>
                    </div>
                )}
            </div>
        </>
    );
}