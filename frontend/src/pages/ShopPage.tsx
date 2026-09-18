import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import { money } from "../utils/currency";
import { loadPujaCheckoutDraft } from "../utils/pujaCheckoutDraft";

const DEFAULT_CATEGORY = "Rudraksh";

export default function ShopPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { category: categorySlug } = useParams<{ category?: string }>();
    const { addItem, openCart, count, subtotal } = useShopifyCart();
    const shopParams = new URLSearchParams(location.search);
    const returnTo = shopParams.get("returnTo");
    const source = shopParams.get("source");
    const isPujaCheckout = Boolean(returnTo && source);
    const checkoutDraft = isPujaCheckout
        ? loadPujaCheckoutDraft<{ pujaTotal?: number }>(source?.includes("banke") ? "banke-bihari" : "savan")
        : null;
    const [returningToPayment, setReturningToPayment] = useState(false);

    const shopQuery = () => {
        const params = new URLSearchParams();
        if (source) params.set("source", source);
        if (returnTo) params.set("returnTo", returnTo);
        const query = params.toString();
        return query ? `?${query}` : "";
    };

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
        // During a puja checkout, products are add-ons to that checkout. Keep
        // the user on the catalog and let them return to the puja total rather
        // than opening the standalone shop payment drawer.
        if (!isPujaCheckout) {
            openCart();
            return;
        }

        // Give the cart context/localStorage a moment to persist the new line,
        // then resume the original puja checkout with the complete cart.
        setReturningToPayment(true);
        window.setTimeout(() => {
            const separator = returnTo!.includes("?") ? "&" : "?";
            navigate(`${returnTo}${separator}resumeCheckout=1`);
        }, 450);
    };

    const pujaAmount = Number(checkoutDraft?.pujaTotal || 0);
    const combinedTotal = pujaAmount + subtotal;

    return (
        <div className={`font-sans min-h-screen bg-[#FFFAF3] ${isPujaCheckout ? "pb-80" : "pb-24"} w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100/50`}>
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
                    onClick={() => navigate(returnTo || "/home")}
                    aria-label={returnTo ? "Return to puja checkout" : "Back to home"}
                    className="absolute left-4 top-3 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                >
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>
                <button
                    onClick={() => (isPujaCheckout ? navigate(returnTo!) : openCart())}
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

                {isPujaCheckout && (
                    <button
                        type="button"
                        onClick={() => navigate(returnTo!)}
                        className="mx-auto mt-3 flex items-center gap-1.5 rounded-full bg-white/85 px-4 py-2 text-[12px] font-bold text-orange-700 shadow-sm border border-orange-200"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Return to puja checkout
                    </button>
                )}

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
                                onClick={() => navigate(`/shop/${categoryToSlug(category)}${shopQuery()}`)}
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
                                        navigate(`/shop/${categoryToSlug(getCategory(p))}/${p.handle}${shopQuery()}`)
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
                                                    {money(minPrice)}
                                                </span>
                                                {hasDiscount && (
                                                    <span className="text-[11px] text-stone-400 line-through">
                                                        {money(maxPrice)}
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

            {isPujaCheckout && (
                <section className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-md rounded-t-[26px] border-t border-orange-200 bg-[#FFFAF3]/98 px-4 pb-5 pt-3 shadow-[0_-10px_30px_-15px_rgba(80,40,0,0.45)] backdrop-blur-md">
                    <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-orange-200" />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-orange-800">Your puja checkout</p>
                            <p className="text-[11px] text-stone-500">Products added here will be included with your puja.</p>
                        </div>
                        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">{count} item{count === 1 ? "" : "s"}</span>
                    </div>
                    <div className="mt-3 space-y-1.5 border-y border-orange-200 py-2.5 text-[12px] text-stone-600">
                        <div className="flex items-center justify-between"><span>Puja seva</span><span className="font-semibold text-stone-800">{money(pujaAmount)}</span></div>
                        {subtotal > 0 && <div className="flex items-center justify-between"><span>Shop additions</span><span className="font-semibold text-stone-800">{money(subtotal)}</span></div>}
                        <div className="flex items-baseline justify-between pt-1"><span className="font-serif text-[10px] uppercase tracking-[0.14em] text-orange-800">Final payable</span><span className="font-serif text-[22px] font-bold text-[#A41F2E]">{money(combinedTotal)}</span></div>
                    </div>
                    <button type="button" onClick={() => navigate(returnTo!)} disabled={returningToPayment} className="mt-3 w-full rounded-2xl bg-[#A41F2E] py-3 text-[13px] font-bold text-white disabled:opacity-60">
                        {returningToPayment ? "Opening payment…" : "Return to payment"}
                    </button>
                </section>
            )}
        </div>
    );
}
