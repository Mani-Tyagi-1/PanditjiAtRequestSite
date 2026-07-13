import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
    ArrowLeft,
    Search,
    X,
    ShoppingBag,
    ShoppingCart,
    ShieldCheck,
    Sparkles,
    BadgeCheck,
    Truck,
    RotateCcw,
    Wallet,
} from "lucide-react";
import { GooglePlayLogoIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import API_URL from "../utils/apiConfig";
import { productPrice, type ShopifyProduct } from "../components/booking/Shop/shopifyTypes";
import type { ShopCardItem } from "../components/booking/Shop/ShopProductCard";
import ShopProductCard from "../components/booking/Shop/ShopProductCard";
import { useShopifyCart } from "../context/ShopifyCartContext";

// Category rules — products are classified by matching these keywords against
// their productType / category / title / tags. Order here = order of chips.
const CATEGORY_RULES: { label: string; match: string[] }[] = [
    { label: "Rudraksh", match: ["rudraksh", "rudraksha", "mukhi"] },
    { label: "Plants", match: ["plant", "tulsi", "bonsai", "sapling", "money plant"] },
    { label: "Bracelets", match: ["bracelet", "wristband", "kada", "band"] },
    { label: "Malas", match: ["mala", "rosary", "japa"] },
    { label: "Gemstones", match: ["gemstone", "stone", "ratna", "crystal", "pyrite", "quartz"] },
    { label: "Yantra", match: ["yantra"] },
    { label: "Idols", match: ["idol", "murti", "statue"] },
    { label: "Puja Items", match: ["puja", "pooja", "diya", "incense", "dhoop", "agarbatti"] },
];

const OTHERS = "Others";

const getCategory = (p: ShopifyProduct): string => {
    const haystack = [p.productType, p.category, p.title, ...(p.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    for (const rule of CATEGORY_RULES) {
        if (rule.match.some((m) => haystack.includes(m))) return rule.label;
    }
    return OTHERS;
};

// Real-data "Bestseller" signal — a product tagged as such in Shopify.
const isBestsellerTag = (t: string) => /best.?seller/i.test(t);
// Real-data "Bundle/Combo" signal — title or tags say so.
const isBundleLike = (haystack: string) => /combo|bundle|\bkit\b|\bset\b/i.test(haystack);

// Best-effort real-count price brackets computed from the fetched catalog —
// no fabricated numbers, just bucket boundaries over real `priceRangeV2` values.
const PRICE_BUCKETS: { label: string; test: (v: number) => boolean }[] = [
    { label: "Under ₹500", test: (v) => v < 500 },
    { label: "₹500 – ₹1,000", test: (v) => v >= 500 && v < 1000 },
    { label: "₹1,000 – ₹2,500", test: (v) => v >= 1000 && v < 2500 },
    { label: "₹2,500+", test: (v) => v >= 2500 },
];

// Generic, already-implied-by-existing-copy trust claims (COD confirmed real
// via ShopifyCartDrawer.tsx's /shopify-orders/cod-config flow).
const TRUST_ITEMS: { icon: typeof ShieldCheck; label: string }[] = [
    { icon: ShieldCheck, label: "Lab Tested" },
    { icon: Sparkles, label: "Energized" },
    { icon: BadgeCheck, label: "Authentic" },
    { icon: Truck, label: "Fast Delivery" },
    { icon: RotateCcw, label: "Easy Returns" },
    { icon: Wallet, label: "COD Available" },
];

// Reused literally from AppLayout.tsx / SiteFooter.tsx so links stay consistent site-wide.
const WHATSAPP_URL =
    "https://wa.me/919056955311?text=" +
    encodeURIComponent("🙏 Namaste! I have a question and would like to chat with Pandit Ji.");
const PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=com.panditJiAtReqapp&hl=en_IN";

// Maps a real fetched Shopify product to the shared card's minimal display shape.
const toCardItem = (p: ShopifyProduct): ShopCardItem => {
    const minPrice = productPrice(p);
    const maxPrice = Number(p.compareAtPriceRange?.minVariantCompareAtPrice?.amount || 0);
    const hasDiscount = maxPrice > minPrice;
    return {
        id: p._id,
        name: p.title,
        image: p.featuredImage?.url || "",
        price: minPrice,
        originalPrice: hasDiscount ? maxPrice : undefined,
        badge: p.rashi || undefined,
        inStock: p.totalInventory === undefined ? true : p.totalInventory > 0,
    };
};

export default function ShopPage() {
    const navigate = useNavigate();
    const { addItem, openCart, count } = useShopifyCart();

    const [products, setProducts] = useState<ShopifyProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Rudraksh");
    // Desktop-only sidebar facets (lg+). Default to "no filter" so mobile/tablet
    // behaviour — which has no UI to change these — is byte-for-byte unchanged.
    const [priceBucket, setPriceBucket] = useState<string | null>(null);
    const [mukhiFilter, setMukhiFilter] = useState<string | null>(null);

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
        return ["All", ...ordered];
    }, [products]);

    // Real per-category counts for the desktop sidebar (lg+).
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        categories.forEach((c) => {
            counts[c] = c === "All" ? products.length : products.filter((p) => getCategory(p) === c).length;
        });
        return counts;
    }, [products, categories]);

    // Real per-bucket counts for the desktop price filter (lg+).
    const priceBucketCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        PRICE_BUCKETS.forEach((b) => {
            counts[b.label] = products.filter((p) => b.test(productPrice(p))).length;
        });
        return counts;
    }, [products]);

    // Best-effort "Mukhi" facet — only rendered when the catalog actually has
    // titles matching "N Mukhi" (real substring match, real counts).
    const mukhiOptions = useMemo(() => {
        const counts: Record<string, number> = {};
        products.forEach((p) => {
            const m = p.title.match(/(\d+)\s*mukhi/i);
            if (m) {
                const label = `${m[1]} Mukhi`;
                counts[label] = (counts[label] || 0) + 1;
            }
        });
        // Labels are like "5 Mukhi", not bare numbers — parseInt stops at the
        // first non-digit char, so this actually numeric-sorts (5, 7, 11, ...).
        return Object.entries(counts).sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10));
    }, [products]);

    // Filter products locally for instantaneous user feedback
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch =
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

            const matchesCategory =
                activeCategory === "All" || getCategory(p) === activeCategory;

            const matchesPrice =
                !priceBucket || (PRICE_BUCKETS.find((b) => b.label === priceBucket)?.test(productPrice(p)) ?? true);

            const matchesMukhi =
                !mukhiFilter || new RegExp(`${mukhiFilter.split(" ")[0]}\\s*mukhi`, "i").test(p.title);

            return matchesSearch && matchesCategory && matchesPrice && matchesMukhi;
        });
    }, [products, searchQuery, activeCategory, priceBucket, mukhiFilter]);

    // ── Curated real-data rows for the desktop mockup (md+) ──
    const bestsellerTagged = useMemo(
        () => products.filter((p) => (p.tags || []).some(isBestsellerTag)),
        [products]
    );
    // Backend defaults `/shopify-products` to sortBy=createdAt&sortOrder=desc,
    // so the fetched order is already newest-first — a real "New Arrivals" slice.
    const newArrivals = useMemo(() => products.slice(0, 10), [products]);
    // When no product is actually tagged "bestseller", fall back to a real but
    // *different* slice (oldest-fetched) so this row doesn't just duplicate
    // New Arrivals above it.
    const bestsellers = useMemo(
        () => (bestsellerTagged.length ? bestsellerTagged.slice(0, 10) : products.slice(-10).reverse()),
        [products, bestsellerTagged]
    );
    const bundleProducts = useMemo(
        () => products.filter((p) => isBundleLike([p.title, ...(p.tags || [])].join(" "))),
        [products]
    );
    const featuredProduct: ShopifyProduct | null = useMemo(() => {
        if (bestsellerTagged.length) return bestsellerTagged[0];
        if (!products.length) return null;
        return [...products].sort((a, b) => productPrice(b) - productPrice(a))[0];
    }, [products, bestsellerTagged]);
    const featuredTags = (featuredProduct?.tags || []).slice(0, 4);

    const handleBuyClick = (prod: ShopifyProduct) => {
        addItem(prod, 1);
        openCart();
    };

    return (
        <div className="font-sans min-h-screen bg-[#FFFAF3] pb-24 w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100/50 md:max-w-none md:mx-0 md:shadow-none md:border-x-0 md:pb-16">
            <Helmet>
                <title>Pandit Ji At Request Shop</title>
                <meta name="description" content="Shop spiritual gems, energized zodiac wristbands, bracelets and puja items." />
            </Helmet>

            {/* ── Header ── */}
            <div className="relative px-4 pt-3 pb-5 bg-gradient-to-b from-[#f7d9ad] to-[#FFFAF3] md:px-8 md:pt-10 md:pb-12 lg:pt-12 lg:pb-14">
                <div className="md:relative lg:flex lg:items-center lg:gap-12">
                    <button
                        onClick={() => navigate("/home")}
                        className="absolute left-4 top-3 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm active:scale-90 transition-transform md:hidden"
                    >
                        <ArrowLeft className="w-4 h-4 text-stone-700" />
                    </button>
                    <button
                        onClick={openCart}
                        className="absolute right-4 top-3 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer md:right-0 md:top-1 md:w-12 md:h-12 md:bg-white md:transition-all md:hover:shadow-lg md:hover:scale-105"
                    >
                        <ShoppingCart className="w-4 h-4 text-stone-700 md:w-5 md:h-5" />
                        {count > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-orange-500 text-white text-[9px] font-bold md:min-w-[18px] md:h-[18px] md:text-[10px]">
                                {count}
                            </span>
                        )}
                    </button>

                    <div className="lg:flex-1 lg:min-w-0">
                        <h1 className="text-center text-[26px] font-bold text-orange-600 md:text-4xl lg:text-[44px] md:tracking-tight lg:text-left" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            Pandit Ji At Request Shop
                        </h1>
                        <p className="text-center text-[12.5px] text-stone-500 -mt-0.5 md:text-[15px] md:mt-1 lg:text-left">Energized spiritual gems & bracelets</p>

                        {/* Search Bar */}
                        <div className="relative mt-4 md:mt-7 md:max-w-xl md:mx-auto lg:mx-0">
                            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-orange-100 md:px-5 md:py-3 md:shadow-md">
                                <Search className="w-4 h-4 text-stone-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search bracelets, rudraksh, gemstones..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent text-[13px] text-stone-850 placeholder-stone-400 outline-none md:text-[14px]"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="cursor-pointer">
                                        <X className="w-4 h-4 text-stone-400" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Trust row (md+) */}
                        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-3 md:mt-8 lg:mt-9 lg:max-w-none">
                            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                                <div key={label} className="flex items-center gap-2 bg-white/70 border border-orange-100 rounded-xl px-3 py-2.5">
                                    <span className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                        <Icon className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="text-[11.5px] font-bold text-stone-700 leading-tight">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Featured "Bestseller" card — real product, lg+ only */}
                    {featuredProduct && (
                        <aside className="hidden lg:block lg:w-[360px] lg:shrink-0">
                            <div className="relative bg-white rounded-3xl shadow-xl border border-orange-100 p-5">
                                <span className="absolute top-4 left-4 z-10 bg-orange-600 text-white text-[10.5px] font-black uppercase tracking-wide px-3 py-1 rounded-full shadow-sm">
                                    {bestsellerTagged.length ? "Bestseller" : "Featured Product"}
                                </span>
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-orange-50/40">
                                    {featuredProduct.featuredImage?.url ? (
                                        <img
                                            src={featuredProduct.featuredImage.url}
                                            alt={featuredProduct.title}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                                            <ShoppingBag className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="mt-3.5 text-[16px] font-bold text-stone-900 leading-snug line-clamp-2">
                                    {featuredProduct.title}
                                </h3>
                                {featuredTags.length > 0 ? (
                                    <ul className="mt-2 space-y-1">
                                        {featuredTags.map((tag) => (
                                            <li key={tag} className="flex items-center gap-1.5 text-[12px] text-stone-600">
                                                <BadgeCheck className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                <span className="truncate">{tag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-2 text-[12px] text-stone-500">Handpicked & quality-checked by our team.</p>
                                )}
                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className="text-[22px] font-black text-orange-600">
                                        ₹{productPrice(featuredProduct).toLocaleString("en-IN")}
                                    </span>
                                </div>
                                <button
                                    onClick={() => navigate(`/shop/product/${featuredProduct.handle}`)}
                                    className="mt-4 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[13.5px] font-bold py-2.5 rounded-xl shadow-sm hover:shadow-md hover:brightness-110 transition-all cursor-pointer"
                                >
                                    Shop Now
                                </button>
                            </div>
                        </aside>
                    )}
                </div>
            </div>

            {/* ── Bestsellers (md+, real fetched products) ── */}
            {bestsellers.length > 0 && (
                <div className="hidden md:block md:px-8 lg:px-10 md:mt-10">
                    <h2 className="text-[22px] lg:text-[26px] font-bold text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        Bestsellers
                    </h2>
                    <p className="text-[13px] text-stone-500 mt-0.5 mb-4">Handpicked selections for you</p>
                    <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {bestsellers.map((p) => (
                            <ShopProductCard
                                key={p._id}
                                product={toCardItem(p)}
                                onOpen={() => navigate(`/shop/product/${p.handle}`)}
                                onBuyNow={() => handleBuyClick(p)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── New Arrivals (md+, real fetched products) ── */}
            {newArrivals.length > 0 && (
                <div className="hidden md:block md:px-8 lg:px-10 md:mt-10">
                    <h2 className="text-[22px] lg:text-[26px] font-bold text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        New Arrivals
                    </h2>
                    <p className="text-[13px] text-stone-500 mt-0.5 mb-4">Freshly added to the shop</p>
                    <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {newArrivals.map((p) => (
                            <ShopProductCard
                                key={p._id}
                                product={toCardItem(p)}
                                onOpen={() => navigate(`/shop/product/${p.handle}`)}
                                onBuyNow={() => handleBuyClick(p)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Value Bundles (md+, only if real bundle/combo products exist) ── */}
            {bundleProducts.length > 0 && (
                <div className="hidden md:block md:px-8 lg:px-10 md:mt-10">
                    <h2 className="text-[22px] lg:text-[26px] font-bold text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        Value Bundles
                    </h2>
                    <p className="text-[13px] text-stone-500 mt-0.5 mb-4">Save more with combo sets</p>
                    <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {bundleProducts.slice(0, 10).map((p) => (
                            <ShopProductCard
                                key={p._id}
                                product={toCardItem(p)}
                                onOpen={() => navigate(`/shop/product/${p.handle}`)}
                                onBuyNow={() => handleBuyClick(p)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Shop All: sidebar filters (lg+, real counts) beside the existing catalog ── */}
            <div className="md:px-8 lg:px-0 md:mt-10">
                <h2 className="hidden md:block text-[22px] lg:text-[26px] font-bold text-stone-900 lg:max-w-[1400px] lg:mx-auto lg:px-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Shop All Products
                </h2>

                <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 lg:max-w-[1400px] lg:mx-auto lg:px-6 lg:items-start lg:mt-4">
                    {/* Sidebar (lg+ only) */}
                    <aside className="hidden lg:block lg:sticky lg:top-24 bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[15px] font-bold text-stone-900">Filters</h3>
                            {(activeCategory !== "All" || priceBucket || mukhiFilter) && (
                                <button
                                    onClick={() => {
                                        setActiveCategory("All");
                                        setPriceBucket(null);
                                        setMukhiFilter(null);
                                    }}
                                    className="text-[11.5px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        <div className="mb-5">
                            <h4 className="text-[11.5px] font-bold text-stone-500 uppercase tracking-wide mb-2">Category</h4>
                            <div className="space-y-0.5">
                                {categories.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setActiveCategory(c)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer transition-colors ${
                                            activeCategory === c ? "bg-orange-50 text-orange-700" : "text-stone-600 hover:bg-stone-50"
                                        }`}
                                    >
                                        <span>{c}</span>
                                        <span className="text-[11px] text-stone-400">{categoryCounts[c] ?? 0}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={mukhiOptions.length > 0 ? "mb-5" : ""}>
                            <h4 className="text-[11.5px] font-bold text-stone-500 uppercase tracking-wide mb-2">Price</h4>
                            <div className="space-y-0.5">
                                {PRICE_BUCKETS.map((b) => (
                                    <button
                                        key={b.label}
                                        onClick={() => setPriceBucket(priceBucket === b.label ? null : b.label)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer transition-colors ${
                                            priceBucket === b.label ? "bg-orange-50 text-orange-700" : "text-stone-600 hover:bg-stone-50"
                                        }`}
                                    >
                                        <span>{b.label}</span>
                                        <span className="text-[11px] text-stone-400">{priceBucketCounts[b.label] ?? 0}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {mukhiOptions.length > 0 && (
                            <div>
                                <h4 className="text-[11.5px] font-bold text-stone-500 uppercase tracking-wide mb-2">Mukhi</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {mukhiOptions.map(([label, cnt]) => (
                                        <button
                                            key={label}
                                            onClick={() => setMukhiFilter(mukhiFilter === label ? null : label)}
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-colors ${
                                                mukhiFilter === label
                                                    ? "bg-orange-500 text-white border-orange-500"
                                                    : "bg-white text-stone-600 border-stone-200 hover:border-orange-300"
                                            }`}
                                        >
                                            {label} ({cnt})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                    <div className="lg:min-w-0">
                        {/* ── Filter Chips ── */}
                        <div className="px-4 md:px-8 lg:px-0 md:mt-2 lg:mt-0">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-1.5 pb-2 -mx-4 px-4 md:flex-wrap md:justify-center lg:justify-start md:overflow-visible md:mx-0 md:px-0 md:gap-2.5 md:pb-3">
                                {categories.map((category) => {
                                    const active = activeCategory === category;
                                    return (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={`shrink-0 px-4 py-1.5 rounded-full text-[12.5px] font-bold border transition-all cursor-pointer md:px-5 md:py-2 md:text-[13px] ${
                                                active
                                                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                                                    : "bg-white text-stone-600 border-orange-100 md:hover:border-orange-300 md:hover:bg-orange-50/60 md:hover:text-orange-600"
                                            }`}
                                        >
                                            {category}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Products Catalog Grid ── */}
                        <div className="px-4 mt-3 md:px-8 lg:px-0 md:mt-5 md:w-full">
                            {loading ? (
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 md:gap-5 lg:gap-6">
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
                                <div className="text-center py-16 text-stone-400 md:py-28">
                                    <ShoppingBag className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                                    <p className="text-[13px] font-medium md:text-[15px]">No products found matching your choice.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 md:gap-5 lg:gap-6">
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
                                                onClick={() => navigate(`/shop/product/${p.handle}`)}
                                                className="group bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all active:scale-[0.98] cursor-pointer md:hover:shadow-xl md:hover:-translate-y-1 md:hover:border-orange-200 md:duration-300"
                                            >
                                                {/* Image Container */}
                                                <div className="relative aspect-square bg-orange-50/20 overflow-hidden">
                                                    {p.featuredImage?.url ? (
                                                        <img
                                                            src={p.featuredImage.url}
                                                            alt={p.title}
                                                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-350 md:group-hover:scale-105"
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
                                                <div className="p-3 flex flex-col justify-between flex-1 md:p-4">
                                                    <div>
                                                        <h3 className="text-[13px] font-bold text-stone-800 leading-snug line-clamp-2 min-h-[36px] md:text-[14px] md:min-h-[42px]">
                                                            {p.title}
                                                        </h3>
                                                        <div className="flex items-baseline gap-1.5 mt-1.5">
                                                            <span className="text-[14.5px] font-black text-orange-600 md:text-[16px]">
                                                                ₹{minPrice.toLocaleString("en-IN")}
                                                            </span>
                                                            {hasDiscount && (
                                                                <span className="text-[11px] text-stone-400 line-through md:text-[12px]">
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
                                                        className="mt-2.5 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-black py-1.5 rounded-xl shadow-xs hover:shadow-sm active:scale-95 transition-all text-center cursor-pointer md:text-[12.5px] md:py-2 md:hover:shadow-md md:hover:brightness-110"
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
                </div>
            </div>

            {/* ── App Download Banner (md+) ── */}
            <div className="hidden md:block md:px-8 lg:px-10 md:mt-12 md:mb-2">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 to-amber-500 grid grid-cols-2 gap-8 px-10 py-10 lg:px-14 lg:py-12">
                    <div className="text-white">
                        <p className="text-[12.5px] font-bold uppercase tracking-wide text-orange-100">Take Devotion With You</p>
                        <h3 className="text-[24px] lg:text-[28px] font-bold mt-1 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            Download the Pandit Ji At Request App
                        </h3>
                        <a
                            href={PLAY_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex items-center gap-2.5 bg-white text-orange-700 rounded-xl px-5 py-3 text-[13.5px] font-bold shadow-lg cursor-pointer hover:shadow-xl transition-all"
                        >
                            <GooglePlayLogoIcon size={20} weight="fill" />
                            Get it on Google Play
                        </a>
                    </div>
                    <div className="text-white border-l border-white/20 pl-8 flex flex-col justify-center">
                        <p className="text-[12.5px] font-bold uppercase tracking-wide text-orange-100">Need Help? We're Here</p>
                        <h3 className="text-[18px] lg:text-[20px] font-bold mt-1 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            Chat with us on WhatsApp for quick support
                        </h3>
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex items-center gap-2.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl px-5 py-3 text-[13.5px] font-bold transition-all cursor-pointer w-fit"
                        >
                            <WhatsappLogoIcon size={20} weight="fill" />
                            Chat on WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
