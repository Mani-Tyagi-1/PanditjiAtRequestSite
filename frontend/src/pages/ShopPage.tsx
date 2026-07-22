import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
    ArrowLeft,
    Search,
    X,
    ShoppingBag,
    ShoppingCart,
} from "lucide-react";
import API_URL from "../utils/apiConfig";
import { type ShopifyProduct } from "../components/booking/Shop/shopifyTypes";
import { useShopifyCart } from "../context/ShopifyCartContext";
import {
    ALL,
    CATEGORY_RULES,
    OTHERS,
    categoryToSlug,
    getCategory,
    slugToCategory,
} from "../utils/shopCategories";

const DEFAULT_CATEGORY = "Rudraksh";

export default function ShopPage() {
    const navigate = useNavigate();
    const { category: categorySlug } = useParams<{ category?: string }>();
    const { addItem, openCart, count } = useShopifyCart();

    const [products, setProducts] = useState<ShopifyProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // The selected category lives in the URL (/shop/rudraksh, /shop/puja-items,
    // /shop/all), so it survives refresh/back and is shareable. Bare /shop keeps
    // the original default.
    const activeCategory = slugToCategory(categorySlug) || DEFAULT_CATEGORY;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch the shopify products from the backend we built
                const { data } = await axios.get(`${API_URL}/shopify-products?limit=100`);
                setProducts(data?.data || []);
            } catch (err) {
                console.error("Error fetching Shopify products:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Build the list of category chips from the categories actually present in
    // the catalog, ordered to match CATEGORY_RULES (with "Others" last).
    const categories = useMemo(() => {
        const present = new Set(products.map(getCategory));
        const ordered = CATEGORY_RULES.map((r) => r.label).filter((l) => present.has(l));
        if (present.has(OTHERS)) ordered.push(OTHERS);
        return [ALL, ...ordered];
    }, [products]);

    // Filter products locally for instantaneous user feedback
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch =
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

            const matchesCategory =
                activeCategory === ALL || getCategory(p) === activeCategory;

            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, activeCategory]);

    const handleBuyClick = (prod: ShopifyProduct) => {
        addItem(prod, 1);
        openCart();
    };

    return (
        <div className="font-sans min-h-screen bg-[#FFFAF3] pb-24 w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100/50">
            <Helmet>
                <title>
                    {activeCategory && activeCategory !== ALL
                        ? `${activeCategory} — Pandit Ji At Request Shop`
                        : "Pandit Ji At Request Shop"}
                </title>
                <meta name="description" content="Shop spiritual gems, energized zodiac wristbands, bracelets and puja items." />
            </Helmet>

            {/* ── Header ── */}
            <div className="relative px-4 pt-3 pb-5 bg-gradient-to-b from-[#f7d9ad] to-[#FFFAF3]">
                <button
                    onClick={() => navigate("/home")}
                    className="absolute left-4 top-3 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                >
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>
                <button
                    onClick={openCart}
                    className="absolute right-4 top-3 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                >
                    <ShoppingCart className="w-4 h-4 text-stone-700" />
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-orange-500 text-white text-[9px] font-bold">
                            {count}
                        </span>
                    )}
                </button>
                <h1 className="text-center text-[26px] font-bold text-orange-600" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Pandit Ji At Request Shop
                </h1>
                <p className="text-center text-[12.5px] text-stone-500 -mt-0.5">Energized spiritual gems & bracelets</p>

                {/* Search Bar */}
                <div className="relative mt-4">
                    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-orange-100">
                        <Search className="w-4 h-4 text-stone-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search bracelets, rudraksh, gemstones..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-[13px] text-stone-850 placeholder-stone-400 outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")}>
                                <X className="w-4 h-4 text-stone-400" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Filter Chips ── */}
            <div className="px-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-1.5 pb-2 -mx-4 px-4">
                    {categories.map((category) => {
                        const active = activeCategory === category;
                        return (
                            <button
                                key={category}
                                onClick={() => navigate(`/shop/${categoryToSlug(category)}`)}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-[12.5px] font-bold border transition-all ${
                                    active
                                        ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                                        : "bg-white text-stone-600 border-orange-100"
                                }`}
                            >
                                {category}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Products Catalog Grid ── */}
            <div className="px-4 mt-3">
                {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-orange-100 overflow-hidden animate-pulse">
                                <div className="aspect-square bg-stone-200" />
                                <div className="p-3 space-y-2">
                                    <div className="h-4 bg-stone-200 rounded w-3/4" />
                                    <div className="h-6 bg-stone-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-16 text-stone-400">
                        <ShoppingBag className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                        <p className="text-[13px] font-medium">No products found matching your choice.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredProducts.map((p) => {
                            const minPrice = Number(p.priceRangeV2?.minVariantPrice?.amount || 0);
                            const maxPrice = Number(p.compareAtPriceRange?.minVariantCompareAtPrice?.amount || 0);
                            const hasDiscount = maxPrice > minPrice;
                            const discountPercent = hasDiscount
                                ? Math.round(((maxPrice - minPrice) / maxPrice) * 100)
                                : 0;

                            return (
                                <div
                                    key={p._id}
                                    onClick={() =>
                                        navigate(`/shop/${categoryToSlug(getCategory(p))}/${p.handle}`)
                                    }
                                    className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    {/* Image Container */}
                                    <div className="relative aspect-square bg-orange-50/20 overflow-hidden">
                                        {p.featuredImage?.url ? (
                                            <img
                                                src={p.featuredImage.url}
                                                alt={p.title}
                                                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-350"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300">
                                                <ShoppingBag className="w-8 h-8" />
                                            </div>
                                        )}
                                        {p.rashi && (
                                            <span className="absolute top-2 left-2 bg-orange-600 text-white text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                                                {p.rashi}
                                            </span>
                                        )}
                                        {hasDiscount && (
                                            <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md">
                                                {discountPercent}% OFF
                                            </span>
                                        )}
                                    </div>

                                    {/* Content Details */}
                                    <div className="p-3 flex flex-col justify-between flex-1">
                                        <div>
                                            <h3 className="text-[13px] font-bold text-stone-800 leading-snug line-clamp-2 min-h-[36px]">
                                                {p.title}
                                            </h3>
                                            <div className="flex items-baseline gap-1.5 mt-1.5">
                                                <span className="text-[14.5px] font-black text-orange-600">
                                                    ₹{minPrice.toLocaleString("en-IN")}
                                                </span>
                                                {hasDiscount && (
                                                    <span className="text-[11px] text-stone-400 line-through">
                                                        ₹{maxPrice.toLocaleString("en-IN")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleBuyClick(p);
                                            }}
                                            className="mt-2.5 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-black py-1.5 rounded-xl shadow-xs hover:shadow-sm active:scale-95 transition-all text-center"
                                        >
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
