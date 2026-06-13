import { motion } from "framer-motion";
import { ArrowRight, Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../utils/apiConfig";

interface Category {
  _id: string;
  category_id?: string;
  category_name_en?: string;
  category_name_hin?: string;
  isActive: boolean;
}

interface Puja {
  _id: string;
  poojaNameEng: string;
  poojaNameHindi?: string;
  poojaPriceOnline?: number;
  poojaPriceOffline?: number;
  poojaCardImage?: string;
  poojaMainImage?: string | string[];
  isActive: boolean;
  mainCategories?: { _id?: string; id?: string; name?: string }[];
  subCategories?: { id?: string; name?: string }[];
}

// const RITUAL_PLACES = [
//   { id: "kashi", label: "Kashi", imageUrl: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/vedic-vaibhav/kashi.png" },
//   { id: "haridwar", label: "Haridwar", imageUrl: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/vedic-vaibhav/haridwar.png" },
//   { id: "prayagraj", label: "Prayagraj", imageUrl: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/vedic-vaibhav/prayagraj.png" },
// ];

function normalizePujas(data: unknown): Puja[] {
  if (Array.isArray(data)) return data as Puja[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.poojas)) return record.poojas as Puja[];
    if (Array.isArray(record.data)) return record.data as Puja[];
    if (Array.isArray(record.pooja)) return record.pooja as Puja[];
    if (Array.isArray(record.poojaDetails)) return record.poojaDetails as Puja[];
  }
  return [];
}

function normalizeCategories(data: unknown): Category[] {
  if (Array.isArray(data)) return data as Category[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.poojaCategory)) return record.poojaCategory as Category[];
  }
  return [];
}

export function DeathRituals() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [poojas, setPujas] = useState<Puja[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const loadDeathRituals = async () => {
      try {
        const cachedCategories = sessionStorage.getItem("all_pooja_categories");
        let activeCategories: Category[] = cachedCategories
          ? JSON.parse(cachedCategories)
          : [];

        if (activeCategories.length === 0 || !activeCategories.some((cat) => cat.category_id === "cat-9")) {
          activeCategories = await (async () => {
              const res = await fetch(`${API_URL}/fetch-all-pooja-category`, {
                signal: controller.signal,
              });
              const data = await res.json();
              const cats = normalizeCategories(data).filter((cat) => cat.isActive);
              sessionStorage.setItem("all_pooja_categories", JSON.stringify(cats));
              return cats;
            })();
        }

        setCategories(activeCategories);

        const cachedPujas = sessionStorage.getItem("all_active_poojas");
        const activePujas: Puja[] = cachedPujas
          ? JSON.parse(cachedPujas)
          : await (async () => {
              const res = await fetch(`${API_URL}/fetch-all-poojas`, {
                signal: controller.signal,
              });
              const data = await res.json();
              const list = normalizePujas(data).filter((puja) => puja.isActive);
              sessionStorage.setItem("all_active_poojas", JSON.stringify(list));
              return list;
            })();

        setPujas(activePujas);
      } catch (error) {
        if ((error as { name?: string })?.name !== "AbortError") {
          console.error("Failed to load death ritual poojas", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDeathRituals();

    return () => controller.abort();
  }, []);

  const deathRitualPoojas = useMemo(() => {
    const deathCategory = categories.find((cat) => cat.category_id === "cat-9");

    return poojas.filter((puja) => {
      if (!puja.isActive) return false;

      if (deathCategory) {
        return puja.mainCategories?.some(
          (mainCategory) =>
            mainCategory.id === deathCategory._id ||
            mainCategory._id === deathCategory._id
        );
      }

      return puja.subCategories?.some(
        (subCategory) =>
          subCategory.id === "Ritual" ||
          subCategory.name === "Ritual" ||
          subCategory.name?.toLowerCase().includes("ritual")
      );
    });
  }, [categories, poojas]);

  if (!isLoading && deathRitualPoojas.length === 0) {
    return null;
  }

  const singlePuja = deathRitualPoojas.length === 1 ? deathRitualPoojas[0] : null;

  return (
    <section className="relative overflow-hidden py-2 md:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
        {isLoading && (
          <div className="h-64 md:h-80 rounded-2xl bg-orange-100/70 animate-pulse" />
        )}

        {!isLoading && singlePuja && (
          <div className="space-y-3">
            <motion.article
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4 }}
              onClick={() => {
                navigate(`/puja/${singlePuja._id}`);
                window.scrollTo(0, 0);
              }}
              aria-label={`Open ${singlePuja.poojaNameEng} puja details`}
              className="group relative h-[180px] md:h-[220px] rounded-2xl md:rounded-3xl overflow-hidden bg-stone-200 shadow-xl hover:shadow-2xl cursor-pointer"
            >
              {(singlePuja.poojaMainImage || singlePuja.poojaCardImage) && (
                <img
                  src={
                    Array.isArray(singlePuja.poojaMainImage)
                      ? (singlePuja.poojaMainImage[0] || singlePuja.poojaCardImage || "")
                      : (singlePuja.poojaMainImage || singlePuja.poojaCardImage || "")
                  }
                  alt={singlePuja.poojaNameEng}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </motion.article>

            {/* <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.05 }}
            >

              <div className="grid grid-cols-3 gap-3">
                {RITUAL_PLACES.map((place) => (
                                        <div
                                            key={place.id}
                                            className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"
                                        >
                                            <div className="w-30 h-18 bg-orange-50">
                                                {place.imageUrl ? (
                                                    <img
                                                        src={place.imageUrl}
                                                        alt={place.label}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-orange-300">
                                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="px-3 py-1">
                                                <p className="text-xs font-bold text-stone-700">
                                                    {place.label}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
              </div>
            </motion.div> */}
          </div>
        )}

        {!isLoading && !singlePuja && (
          <>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 text-orange-700 text-sm font-semibold px-4 py-2 bg-orange-100 rounded-full">
            <Flame className="w-4 h-4" />
            Sacred Final Rites
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-gray-900">
            Death Rituals
          </h2>
          <p className="mt-3 text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            Book experienced pandits for antim sanskar, shraddh, and related
            Vedic rituals with care and dignity.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          {deathRitualPoojas.map((puja, index) => {
                const image = Array.isArray(puja.poojaMainImage)
                    ? (puja.poojaMainImage[0] || puja.poojaCardImage || "")
                    : (puja.poojaMainImage || puja.poojaCardImage || "");
                const price = puja.poojaPriceOnline || puja.poojaPriceOffline || 0;

                return (
                  <motion.article
                    key={puja._id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    whileHover={{ y: -6 }}
                    onClick={() => {
                      navigate(`/puja/${puja._id}`);
                      window.scrollTo(0, 0);
                    }}
                    className="group relative h-72 md:h-80 rounded-2xl overflow-hidden hover:shadow-2xl cursor-pointer"
                  >
                    {image && (
                      <img
                        src={image}
                        alt={puja.poojaNameEng}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        {puja.poojaNameEng}
                      </h3>
                      {puja.poojaNameHindi && (
                        <p className="mt-1 text-sm md:text-base text-white/75 font-semibold">
                          {puja.poojaNameHindi}
                        </p>
                      )}
                      <p className="mt-3 text-amber-300 text-sm md:text-base font-bold">
                        <span>&#8377;</span>
                        {price.toLocaleString("en-IN")} onwards
                      </p>
                      <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-900/20 transition-transform group-hover:translate-x-1">
                        Perform Now
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
        </div>
          </>
        )}
      </div>
    </section>
  );
}
