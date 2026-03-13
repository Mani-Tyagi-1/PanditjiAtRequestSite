import { useState, useEffect, useMemo } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import PujaCard from "./UI/PujaCard";

interface PujaData {
  _id: string;
  poojaID: string;
  poojaNameEng: string;
  poojaNameHindi: string;
  poojaMode: string;
  poojaPriceOnline?: number;
  poojaPriceOffline?: number;
  mainCategories: { _id?: string; id: string; name: string }[];
  subCategories: { _id?: string; id: string; name: string }[];
  poojaCardImage: string;
  isFeatured: boolean;
  isActive: boolean;
}

interface CategoryData {
  _id: string;
  category_id: string;
  category_name_en: string;
  category_name_hin: string;
  category_image: string;
  sub_categories: string[];
  isActive: boolean;
}

interface LocationState {
  category?: CategoryData;
}

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const passedCategory = (location.state as LocationState | null)?.category || null;

  const [categoryDetails, setCategoryDetails] = useState<CategoryData | null>(passedCategory);
  const [subCategories, setSubCategories] = useState<string[]>(
    passedCategory?.sub_categories || []
  );
  const [activeCategory, setActiveCategory] = useState("");
  const [allPujas, setAllPujas] = useState<PujaData[]>([]);
  const [isLoadingHeader, setIsLoadingHeader] = useState(!passedCategory);
  const [isLoadingPujas, setIsLoadingPujas] = useState(true);

  useEffect(() => {
    if (!categoryId) return;

    const controller = new AbortController();

    const fetchHeaderFallback = async () => {
      // only used when page refreshed directly and state is missing
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";
        const response = await fetch(`${apiUrl}/fetch-all-pooja-category`, {
          signal: controller.signal,
        });
        const data = await response.json();

        let categoryList: CategoryData[] = [];

        if (data?.poojaCategory && Array.isArray(data.poojaCategory)) {
          categoryList = data.poojaCategory;
        } else if (Array.isArray(data)) {
          categoryList = data;
        }

        const matched =
          categoryList.find((cat) => cat._id === categoryId && cat.isActive) || null;

        setCategoryDetails(matched);
        setSubCategories(matched?.sub_categories || []);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Error fetching category details:", error);
        }
      } finally {
        setIsLoadingHeader(false);
      }
    };

    const fetchPujas = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";
        const cacheKey = `poojas_by_cat_${categoryId}`;

        // 1. instant cache load
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const cachedPujas: PujaData[] = JSON.parse(cached);
          setAllPujas(cachedPujas);
          setIsLoadingPujas(false);
        } else {
          setIsLoadingPujas(true);
        }

        // 2. network fetch (fresh data)
        const response = await fetch(`${apiUrl}/fetch-pooja-by-cat-id/${categoryId}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        let pujasList: PujaData[] = [];

        if (Array.isArray(data)) pujasList = data;
        else if (Array.isArray(data?.poojas)) pujasList = data.poojas;
        else if (Array.isArray(data?.data)) pujasList = data.data;
        else if (Array.isArray(data?.pooja)) pujasList = data.pooja;
        else if (Array.isArray(data?.poojaDetails)) pujasList = data.poojaDetails;

        const safePujas = pujasList.filter(
          (p) =>
            p.isActive &&
            p.mainCategories?.some((mc) => mc.id === categoryId)
        );

        setAllPujas(safePujas);
        sessionStorage.setItem(cacheKey, JSON.stringify(safePujas));
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Error fetching pujas:", error);
        }
      } finally {
        setIsLoadingPujas(false);
      }
    };

    if (!passedCategory) {
      fetchHeaderFallback();
    } else {
      setIsLoadingHeader(false);
    }

    fetchPujas();

    return () => controller.abort();
  }, [categoryId, passedCategory]);

  const visibleSubCategories = useMemo(() => {
    const usedSubCategoryNames = new Set(
      allPujas.flatMap((p) => p.subCategories?.map((sc) => sc.name) || [])
    );

    return subCategories.filter((subCat) => usedSubCategoryNames.has(subCat));
  }, [allPujas, subCategories]);

  useEffect(() => {
    if (visibleSubCategories.length === 0) {
      setActiveCategory("");
      return;
    }

    if (!visibleSubCategories.includes(activeCategory)) {
      setActiveCategory(visibleSubCategories[0]);
    }
  }, [visibleSubCategories, activeCategory]);

  const filteredPujas = useMemo(() => {
    if (!activeCategory) return [];
    return allPujas.filter((p) =>
      p.subCategories?.some((sc) => sc.name === activeCategory)
    );
  }, [allPujas, activeCategory]);

  const recommended = filteredPujas.filter((p) => p.isFeatured);
  const otherPujas = filteredPujas.filter((p) => !p.isFeatured);


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
        {/* Header */}
        <div className="relative px-4 pt-3 pb-3 text-center bg-gradient-to-br from-red-200 via-orange-200 to-amber-100 rounded-b-[60px] mb-5 shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm"
          >
            <svg
              className="w-4 h-4 text-stone-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <h1
            className="text-orange-600 font-extrabold"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "26px",
            }}
          >
            {isLoadingHeader ? "Loading..." : categoryDetails?.category_name_en || "Puja"}
          </h1>

          <p className="text-orange-900/50 text-xs font-medium mt-0.5">
            Find the right authentic ritual for your exact intention
          </p>

          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-orange-400/50" />
            <span className="text-orange-500">🕉</span>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-orange-400/50" />
          </div>
        </div>

        {/* Subcategory Tabs */}
        <div className="px-4 mb-5">
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
            {isLoadingHeader ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="shrink-0 animate-pulse w-24 h-8 bg-orange-100 rounded-full"
                />
              ))
            ) : visibleSubCategories.length > 0 ? (
              visibleSubCategories.map((cat) => (
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
              <div className="text-sm font-medium text-stone-400">
                No subcategories found.
              </div>
            )}
          </div>
        </div>

        {/* Recommended */}
        {recommended.length > 0 && (
          <div className="px-4 mb-5 fade-up" key={`rec-${activeCategory}`}>
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
                  price={p.poojaPriceOnline || p.poojaPriceOffline || 0}
                  subtitle="Sacred ritual performed by expert pandits."
                  badge="Popular"
                  duration="2-3 hrs"
                />
              ))}
            </div>
          </div>
        )}

        {/* All Pujas */}
        {otherPujas.length > 0 && (
          <div
            className="px-4 pb-10 fade-up"
            key={`all-${activeCategory}`}
            style={{ animationDelay: "60ms" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-stone-800 font-bold"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "20px",
                }}
              >
                All {activeCategory} Pujas
              </h3>

              <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
                {filteredPujas.length} Services
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
              {isLoadingPujas ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-[24px] shadow-sm animate-pulse h-48 border border-orange-100/50"
                  />
                ))
              ) : (
                otherPujas.map((p) => (
                  <PujaCard
                    key={p._id}
                    id={p._id}
                    title={p.poojaNameEng}
                    image={p.poojaCardImage}
                    price={p.poojaPriceOnline || p.poojaPriceOffline || 0}
                    subtitle="Authentic vedic pooja performed exactly as per shastras."
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Empty */}
        {!isLoadingPujas && filteredPujas.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 opacity-50">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <p className="text-stone-500 text-base font-medium">
              No specialized services available in this category yet.
            </p>
            <p className="text-stone-400 text-sm mt-1">
              Please explore our other divine offerings.
            </p>
          </div>
        )}
      </div>
    </>
  );
}