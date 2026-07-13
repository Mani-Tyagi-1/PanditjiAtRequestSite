import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Sparkles, Flame, PartyPopper, Sun, Flower2, Soup, Users } from "lucide-react";
import SectionHeader from "./SectionHeader";
import API_URL from "../../utils/apiConfig";

interface Category {
    _id: string;
    category_id: string;
    category_name_en: string;
    category_name_hin?: string;
    category_image?: string;
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
    return Flame;
};

/**
 * Compact "Book by Need" icon row for the Home page (desktop/tablet only).
 * Fetches the same real `/fetch-all-pooja-category` data the full
 * `PoojaByProblem` grid further down the page uses — this is a smaller,
 * additional presentation of the same real categories, not new data.
 */
export default function BookByNeedRow() {
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
                const activeCategories = list.filter(
                    (cat) => cat.isActive !== false && cat.category_id !== "cat-9"
                );
                setCategories(activeCategories.slice(0, 7));
            } catch (err) {
                console.error("Error fetching categories in BookByNeedRow:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (!loading && categories.length === 0) return null;

    return (
        <section className="hidden md:block md:w-full md:px-8 lg:px-10 md:pt-12 lg:pt-16">
            <SectionHeader title="Book by Need" icon={Sparkles} subtitle="Find the right seva in one tap" />

            <div className="mt-6 grid grid-cols-4 lg:grid-cols-7 gap-4">
                {loading
                    ? Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 flex flex-col items-center gap-2 animate-pulse h-[104px]">
                            <div className="w-11 h-11 rounded-xl bg-stone-100" />
                            <div className="h-2.5 bg-stone-100 rounded w-3/4" />
                        </div>
                    ))
                    : categories.map((category) => {
                        const Icon = getIconForCategory(category.category_name_en);
                        return (
                            <button
                                key={category._id}
                                onClick={() =>
                                    navigate(`/category/${category._id}`, {
                                        state: { category },
                                    })
                                }
                                className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 flex flex-col items-center gap-2 text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-orange-200"
                            >
                                <span className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
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
                                <p className="text-[12.5px] font-bold text-stone-800 leading-tight truncate w-full">
                                    {category.category_name_en}
                                </p>
                            </button>
                        );
                    })}
            </div>
        </section>
    );
}
