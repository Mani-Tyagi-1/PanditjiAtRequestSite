import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Sparkles, Flame, PartyPopper, Sun, Flower2, Soup, Users, ChevronRight } from "lucide-react";
import SectionHeader from "./SectionHeader";
import API_URL from "../../utils/apiConfig";

interface Category {
    _id: string;
    category_id: string;
    category_name_en: string;
    category_name_hin?: string;
    category_image?: string;
    sub_categories?: string[];
    isActive?: boolean;
}

const getIconForCategory = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("jaap")) return Sparkles;
    if (lower.includes("dosh")) return Flower2;
    if (lower.includes("havan")) return Flame;
    if (lower.includes("rashi")) return Sun;
    if (lower.includes("festive")) return PartyPopper;
    if (lower.includes("remed")) return Soup;
    if (lower.includes("occas")) return Users;
    return Flame; // default fallback
};

const getSubtitleForCategory = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("dosh")) return "Remove planetary dosh";
    if (lower.includes("jaap")) return "Chant for peace";
    if (lower.includes("havan")) return "Sacred fire ritual";
    if (lower.includes("rashi")) return "Astrological balance";
    if (lower.includes("festive")) return "Celebrate with devotion";
    if (lower.includes("remed")) return "Solve life problems";
    if (lower.includes("occas")) return "Family & home celebrations";
    return "Good health & safety"; // default fallback
};

export default function PoojaByProblem() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${API_URL}/fetch-all-pooja-category`);
                const data = response.data;
                let list: Category[] = [];

                if (data?.poojaCategory && Array.isArray(data.poojaCategory)) {
                    list = data.poojaCategory;
                } else if (Array.isArray(data)) {
                    list = data;
                }

                // Filter categories: active & exclude cat-9 (unwanted category matching services section logic)
                const activeCategories = list.filter(
                    (cat) => cat.isActive !== false && cat.category_id !== "cat-9"
                );
                setCategories(activeCategories);
            } catch (err) {
                console.error("Error fetching categories in PoojaByProblem:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return (
        <section className="px-4 pt-6">
            <SectionHeader title="Pooja by Problem" icon={Sparkles} subtitle="Select according to your needs" />

            <div className="mt-3 grid grid-cols-2 gap-3">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl border border-orange-100 shadow-sm p-3 flex items-center gap-2.5 animate-pulse h-[68px]"
                        >
                            <div className="w-10 h-10 rounded-xl bg-stone-100 shrink-0" />
                            <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="h-3.5 bg-stone-100 rounded w-3/4" />
                                <div className="h-2.5 bg-stone-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))
                ) : categories.length > 0 ? (
                    categories.map((category) => {
                        const Icon = getIconForCategory(category.category_name_en);
                        const sub = getSubtitleForCategory(category.category_name_en);

                        return (
                            <button
                                key={category._id}
                                onClick={() =>
                                    navigate(`/category/${category._id}`, {
                                        state: { category },
                                    })
                                }
                                className="bg-white rounded-2xl border border-orange-100 shadow-sm p-3 flex items-center gap-2.5 text-left active:scale-95 transition-transform"
                            >
                                <span className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                                    {category.category_image ? (
                                        <img
                                            src={category.category_image}
                                            alt={category.category_name_en}
                                            className="w-8 h-8 object-contain"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/category-images/category-images_1771234666851.png";
                                            }}
                                        />
                                    ) : (
                                        <Icon className="w-5 h-5 text-orange-500" />
                                    )}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-stone-800 leading-tight truncate">
                                        {category.category_name_en}
                                    </p>
                                    <p className="text-[10.5px] text-stone-400 truncate">{sub}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                            </button>
                        );
                    })
                ) : (
                    <div className="col-span-2 text-center text-stone-400 text-[13px] py-6">
                        No categories found.
                    </div>
                )}
            </div>
        </section>
    );
}

