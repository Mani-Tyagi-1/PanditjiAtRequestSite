import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import axios from "axios";
import {
    ArrowLeft,
    Star,
    Check,
    Plus,
    Minus,
    ShoppingCart,
    ShoppingBag,
    ShieldCheck,
    Truck,
    RotateCcw,
} from "lucide-react";
import API_URL from "../utils/apiConfig";
import { type ShopifyProduct } from "../components/booking/Shop/shopifyTypes";
import { useShopifyCart } from "../context/ShopifyCartContext";

export default function ShopifyProductDetailPage() {
    const { handle } = useParams<{ handle: string }>();
    const navigate = useNavigate();
    const { addItem, openCart, count } = useShopifyCart();

    const [product, setProduct] = useState<ShopifyProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImage, setActiveImage] = useState(0);
    const [qty, setQty] = useState(1);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axios.get(`${API_URL}/shopify-products/handle/${handle}`);
                if (!data?.success || !data?.data) throw new Error("Product not found");
                setProduct(data.data);
                setActiveImage(0);
            } catch (err) {
                console.error("Error fetching Shopify product:", err);
                setError("Failed to load product. It may not exist or is unavailable.");
            } finally {
                setLoading(false);
            }
        };
        if (handle) fetchProduct();
    }, [handle]);

    // Collect all product pictures (featured image + media gallery), de-duped.
    const images = useMemo(() => {
        if (!product) return [];
        const urls: string[] = [];
        if (product.featuredImage?.url) urls.push(product.featuredImage.url);
        (product.media || []).forEach((m) => {
            if (m.image?.url) urls.push(m.image.url);
        });
        return Array.from(new Set(urls));
    }, [product]);

    const handleBuyClick = () => {
        if (!product) return;
        addItem(product, qty);
        openCart();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100/50 animate-pulse">
                <div className="aspect-square bg-stone-200" />
                <div className="p-5 space-y-4">
                    <div className="h-6 bg-stone-200 rounded w-1/3" />
                    <div className="h-8 bg-stone-200 rounded w-3/4" />
                    <div className="h-24 bg-stone-200 rounded-2xl w-full" />
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex flex-col items-center justify-center p-6 text-center w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100/50">
                <span className="text-4xl">🛍️</span>
                <h2 className="text-lg font-bold text-stone-850 mt-4">Error Loading Product</h2>
                <p className="text-xs text-stone-500 mt-2 max-w-[280px]">{error || "This product does not exist."}</p>
                <button onClick={() => navigate("/shop")} className="mt-6 bg-orange-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition-all">
                    Back to Shop
                </button>
            </div>
        );
    }

    const minPrice = Number(product.priceRangeV2?.minVariantPrice?.amount || 0);
    const maxPrice = Number(product.compareAtPriceRange?.minVariantCompareAtPrice?.amount || 0);
    const hasDiscount = maxPrice > minPrice;
    const discountPercent = hasDiscount ? Math.round(((maxPrice - minPrice) / maxPrice) * 100) : 0;

    return (
        <div className="font-sans min-h-screen bg-[#FFFAF3] pb-24 w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100/50">
            <Helmet>
                <title>{`${product.title} | Pandit Ji At Request`}</title>
                <meta name="description" content={`Buy ${product.title} — energized & certified spiritual product. Blessed by experts.`} />
            </Helmet>

            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-[#FFFAF3]/90 backdrop-blur-md border-b border-orange-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-orange-100 shadow-sm active:scale-90 transition-transform">
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>
                <h1 className="text-sm font-bold text-stone-850 truncate flex-1">Product Details</h1>
                <button onClick={openCart} className="relative w-9 h-9 rounded-full bg-white flex items-center justify-center border border-orange-100 shadow-sm active:scale-90 transition-transform">
                    <ShoppingCart className="w-4 h-4 text-stone-700" />
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-orange-500 text-white text-[9px] font-bold">
                            {count}
                        </span>
                    )}
                </button>
            </div>

            {/* Image Gallery */}
            <div className="relative aspect-square bg-orange-50/20 overflow-hidden p-3 rounded-2xl">
                {images.length > 0 ? (
                    <img
                        src={images[activeImage]}
                        alt={product.title}
                        className="w-full h-full object-cover rounded-2xl"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300">
                        <ShoppingBag className="w-12 h-12" />
                    </div>
                )}
                {product.rashi && (
                    <span className="absolute top-6 left-6 bg-orange-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-md shadow-md">
                        {product.rashi}
                    </span>
                )}
                {hasDiscount && (
                    <span className="absolute top-6 right-6 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                        {discountPercent}% OFF
                    </span>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pt-3 -mx-0">
                    {images.map((url, i) => (
                        <button
                            key={url}
                            onClick={() => setActiveImage(i)}
                            className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                                activeImage === i ? "border-orange-500" : "border-orange-100"
                            }`}
                        >
                            <img src={url} alt={`${product.title} ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Details */}
            <div className="p-5 space-y-4">
                <div>
                    <h2 className="text-2xl font-bold text-stone-850 leading-tight">{product.title}</h2>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[11.5px] font-bold">
                            <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" /> 4.9
                        </span>
                        <span className="text-[12px] text-stone-400 font-semibold">Energized & Certified</span>
                    </div>
                </div>

                {/* Price block */}
                <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-baseline gap-2.5">
                        <span className="text-3xl font-black text-orange-600">
                            ₹{minPrice.toLocaleString("en-IN")}
                        </span>
                        {hasDiscount && (
                            <>
                                <span className="text-base text-stone-400 line-through">
                                    ₹{maxPrice.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[13px] font-bold text-emerald-600">{discountPercent}% off</span>
                            </>
                        )}
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">Free energized packaging · Blessed by Experts · Inclusive of all taxes</p>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center justify-between bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
                    <span className="text-[13.5px] font-bold text-stone-700">Quantity</span>
                    <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-1.5 py-1">
                        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-stone-600 active:scale-90 transition-transform shadow-sm">
                            <Minus className="w-4 h-4" strokeWidth={3} />
                        </button>
                        <span className="text-[15px] font-bold text-stone-800 min-w-[26px] text-center">{qty}</span>
                        <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500 text-white active:scale-90 transition-transform shadow-sm">
                            <Plus className="w-4 h-4" strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { icon: ShieldCheck, label: "Energised & Blessed" },
                        { icon: Truck, label: "Fast Delivery" },
                        { icon: RotateCcw, label: "7-Day Returns" },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="bg-white border border-stone-100 rounded-xl py-3 flex flex-col items-center gap-1 shadow-xs text-center">
                            <Icon className="w-4.5 h-4.5 text-orange-500" />
                            <span className="text-[10px] font-semibold text-stone-500 leading-tight px-1">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Description */}
                {product.descriptionHtml && (
                    <div>
                        <h3 className="text-[12px] font-black uppercase tracking-wider text-stone-400 mb-1.5">Description</h3>
                        <div
                            className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm text-[12.5px] text-stone-600 leading-relaxed space-y-2 shopify-description"
                            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                        />
                    </div>
                )}

                {/* Quality Badges */}
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: "100% Genuine Beads", desc: "Purified & Mantra Blessed" },
                        { label: "Fast Pan-India Delivery", desc: "Ships within 24-48 hrs" },
                    ].map((badge) => (
                        <div key={badge.label} className="bg-white border border-stone-100 rounded-xl p-3 flex flex-col justify-center shadow-xs">
                            <span className="text-[11px] font-bold text-orange-600 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={3} /> {badge.label}
                            </span>
                            <span className="text-[9.5px] text-stone-400 mt-0.5">{badge.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sticky Buy Now Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-orange-100 px-4 py-3 max-w-md mx-auto shadow-lg">
                <button
                    onClick={handleBuyClick}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-2 text-sm"
                >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart · ₹{(minPrice * qty).toLocaleString("en-IN")}
                </button>
            </div>
        </div>
    );
}
