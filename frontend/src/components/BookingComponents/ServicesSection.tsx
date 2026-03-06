import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Category {
    _id: string;
    category_id: string;
    category_name_en: string;
    category_name_hin: string;
    category_image: string;
    sub_categories: string[];
    isActive: boolean;
}

const items = [
    { title: "Verified" },
    { title: "Trusted" },
    { title: "5+ Year Experience" },
];

export default function PujaServices() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const response = await fetch(`${apiUrl}/fetch-all-pooja-category`);
                const data = await response.json();

                if (data && data.poojaCategory && Array.isArray(data.poojaCategory)) {
                    // Filter active categories if necessary, or just use all
                    setCategories(data.poojaCategory.filter((cat: Category) => cat.isActive));
                } else if (data && Array.isArray(data)) {
                    setCategories(data.filter((cat: Category) => cat.isActive));
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);
    return (
        <>
            <div className="w-full  flex justify-center bg-gradient-to-b from-white via-orange-200 via-orange-300 via-orange-300 pt-7 pb-5">
                <div className="w-full max-w-4xl px-4">
                    {/* Header */}
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex-1 h-[2px] bg-yellow-500"></div>
                        <div
                            className="flex items-center justify-center text-white font-bold px-10 py-1.5 mx-2 bg-center bg-no-repeat bg-[length:100%_100%] drop-shadow-sm min-w-[140px]"
                            style={{ backgroundImage: 'url("https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/gradientBox.png")' }}
                        >
                            Puja Services
                        </div>
                        <div className="flex-1 h-[2px] bg-yellow-500"></div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                        {isLoading ? (
                            // Add a simple loading skeleton state
                            Array.from({ length: 8 }).map((_, idx) => (
                                <div key={idx} className="bg-white/50 animate-pulse rounded-2xl border border-orange-100 p-1 flex flex-col items-center h-24" />
                            ))
                        ) : categories.length > 0 ? (
                            categories.map((category) => (
                                <div
                                    key={category._id}
                                    onClick={() => navigate(`/category/${encodeURIComponent(category.category_name_en)}`)}
                                    className="bg-white rounded-2xl border border-orange-200 shadow-md hover:shadow-lg transition p-1 flex flex-col items-center text-center cursor-pointer"
                                >
                                    <div className="w-12 h-12 flex items-center justify-center">
                                        <img
                                            src={category.category_image}
                                            alt={category.category_name_en}
                                            className="w-10 h-10 object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/category-images/category-images_1771234666851.png'; // Fallback image
                                            }}
                                        />
                                    </div>

                                    <p className="text-gray-700 font-semibold text-sm leading-tight">
                                        {category.category_name_en}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-4 text-center text-stone-500 py-4 text-sm font-medium">
                                No services found.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full flex justify-center">
                <div className="bg-white/80 backdrop-blur-md  flex items-center justify-center gap-5">
                    {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 border border-green-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 111.414-1.414L8.5 11.586l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </span>
                            {item.title}
                        </div>
                    ))}
                </div>
            </div>

        </>
    );
}
