import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Plus, Minus, Check, ShieldCheck, Truck, RotateCcw, ShoppingBag } from "lucide-react";
import { Helmet } from "react-helmet-async";
import API_URL from "../utils/apiConfig";
import { type ShopProduct, type CartLine } from "../components/booking/Shop/shopData";
import ShopCartModal from "../components/booking/Shop/ShopCartModal";
import { money } from "../utils/currency";

export default function ShopProductDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<ShopProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    // Cart state synced with localStorage
    const [cart, setCart] = useState<CartLine[]>(() => {
        try {
            const saved = localStorage.getItem("pjar_shop_cart");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [qty, setQty] = useState(1);
    const [justAdded, setJustAdded] = useState(false);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem("pjar_shop_cart", JSON.stringify(cart));
        } catch (err) {
            console.error("Failed to save cart to localStorage", err);
        }
    }, [cart]);

    const fetchProductDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/shop-products/${slug}`);
            if (!res.ok) throw new Error("Product not found or server error");
            const json = await res.json();
            setProduct(json.data);
        } catch (err) {
            console.error("Error fetching product details:", err);
            setError("Failed to load product details. It may not exist or is inactive.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductDetails();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex flex-col w-full max-w-md mx-auto shadow-xl relative border-x border-amber-100 animate-pulse">
                <div className="aspect-square bg-stone-200" />
                <div className="p-5 space-y-4">
                    <div className="h-6 bg-stone-200 rounded w-1/3" />
                    <div className="h-8 bg-stone-200 rounded w-3/4" />
                    <div className="h-4 bg-stone-200 rounded w-1/2" />
                    <div className="h-24 bg-stone-200 rounded-2xl w-full" />
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex flex-col items-center justify-center p-6 text-center w-full max-w-md mx-auto shadow-xl relative border-x border-amber-100">
                <span className="text-4xl">🛍️</span>
                <h2 className="text-lg font-bold text-stone-850 mt-4">Error Loading Product</h2>
                <p className="text-xs text-stone-500 mt-2 max-w-[280px]">{error || "The requested product does not exist."}</p>
                <button onClick={() => navigate("/")} className="mt-6 bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition-all">
                    Go to Homepage
                </button>
            </div>
        );
    }

    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;
    const soldOut = !product.inStock;
    const lineTotal = product.price * qty;

    const itemCount = cart.reduce((s, l) => s + l.qty, 0);
    const qtyInCart = cart.find((l) => l.product.id === product.id)?.qty ?? 0;

    const addToCart = (prod: ShopProduct, quantity = 1) => {
        setCart((prev) => {
            const existing = prev.find((l) => l.product.id === prod.id);
            if (existing) {
                return prev.map((l) => (l.product.id === prod.id ? { ...l, qty: l.qty + quantity } : l));
            }
            return [...prev, { product: prod, qty: quantity }];
        });
    };

    const handleAdd = () => {
        addToCart(product, qty);
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1400);
        if (window.fbq) {
            window.fbq("track", "AddToCart", {
                content_name: product.name,
                content_type: "shop_product",
                value: product.price * qty,
                currency: "INR",
            });
        }
    };

    const handleBuyNow = () => {
        addToCart(product, qty);
        setIsCartOpen(true);
    };

    const removeFromCart = (prod: ShopProduct) => {
        setCart((prev) =>
            prev
                .map((l) => (l.product.id === prod.id ? { ...l, qty: l.qty - 1 } : l))
                .filter((l) => l.qty > 0)
        );
    };

    const deleteFromCart = (prod: ShopProduct) => {
        setCart((prev) => prev.filter((l) => l.product.id !== prod.id));
    };

    return (
        <div className="min-h-screen bg-[#FFFAF3] pb-20 font-sans w-full max-w-md mx-auto shadow-xl relative border-x border-amber-100">
            <Helmet>
                <title>{`${product.name} | Pandit Ji At Request Shop`}</title>
                <meta name="description" content={`Purchase authentic ${product.name}. ${product.shortDesc}. Sourced & blessed by experts.`} />
            </Helmet>

            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-[#FFFAF3]/90 backdrop-blur-md border-b border-amber-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-amber-200/50 shadow-sm active:scale-90 transition-transform">
                        <ArrowLeft className="w-4 h-4 text-stone-700" />
                    </button>
                    <h1 className="text-sm font-bold text-stone-850 truncate">Product Details</h1>
                </div>
                
                {/* Cart button */}
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white border border-amber-100 shadow-sm active:scale-95 transition-transform"
                >
                    <ShoppingBag className="w-4.5 h-4.5 text-amber-600" />
                    {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                            {itemCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Hero image */}
            <div className="relative aspect-square bg-amber-50">
                <img
                    src={product.image}
                    alt={product.name}
                    className={`w-full h-full object-cover ${soldOut ? "grayscale opacity-70" : ""}`}
                />
                {product.badge && !soldOut && (
                    <span className="absolute top-3 left-3 bg-stone-900/85 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
                        {product.badge}
                    </span>
                )}
                {discount > 0 && !soldOut && (
                    <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                        {discount}% OFF
                    </span>
                )}
                {soldOut && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-stone-900/80 text-white text-[13px] font-bold px-4 py-1.5 rounded-full">Sold Out</span>
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="px-5 py-4 space-y-4">
                <div>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-amber-600">{product.category}</span>
                    <h2 className="font-serif font-bold text-stone-900 leading-tight mt-0.5 text-2xl">
                        {product.name}
                    </h2>
                    <p className="text-[13px] text-stone-500 mt-1">{product.shortDesc}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[12px] font-bold">
                            <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                            {product.rating.toFixed(1)}
                        </span>
                        <span className="text-[12px] text-stone-400 font-medium">
                            {product.reviews.toLocaleString("en-IN")} verified ratings
                        </span>
                    </div>
                </div>

                {/* Price block */}
                <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-stone-900">{money(product.price)}</span>
                        {product.originalPrice && (
                            <>
                                <span className="text-[16px] text-stone-400 line-through">{money(product.originalPrice)}</span>
                                <span className="text-[13px] font-bold text-emerald-600">{discount}% off</span>
                            </>
                        )}
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">Inclusive of all taxes</p>
                </div>

                {/* Quantity Selector */}
                {!soldOut && (
                    <div className="flex items-center justify-between bg-white border border-amber-100 rounded-2xl p-4 shadow-sm">
                        <span className="text-[13.5px] font-bold text-stone-700">Quantity</span>
                        <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-1.5 py-1">
                            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-stone-600 active:scale-90 transition-transform shadow-sm">
                                <Minus className="w-4 h-4" strokeWidth={3} />
                            </button>
                            <span className="text-[15px] font-bold text-stone-800 min-w-[26px] text-center">{qty}</span>
                            <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500 text-white active:scale-90 transition-transform shadow-sm">
                                <Plus className="w-4 h-4" strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { icon: ShieldCheck, label: "Energised & Blessed" },
                        { icon: Truck, label: "Fast Delivery" },
                        { icon: RotateCcw, label: "7-Day Returns" },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="bg-white border border-stone-100 rounded-xl py-3 flex flex-col items-center gap-1 shadow-sm text-center">
                            <Icon className="w-4.5 h-4.5 text-amber-500" />
                            <span className="text-[10px] font-semibold text-stone-500 leading-tight px-1">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Highlights */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Highlights</h3>
                    <ul className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm space-y-2.5">
                        {product.highlights.map((h) => (
                            <li key={h} className="flex items-start gap-2 text-[12.5px] text-stone-700">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                                <span>{h}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* About this Item */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">About this item</h3>
                    <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm text-[12.5px] text-stone-600 leading-relaxed space-y-2">
                        <p>
                            {product.shortDesc}. Each {product.name} is carefully sourced, purified, and energised by our pandits with appropriate Vedic mantras before it reaches you — ready to be placed in your home mandir or worn for daily worship.
                        </p>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-100 px-4 py-3 flex items-center justify-between max-w-md mx-auto shadow-lg">
                {soldOut ? (
                    <button disabled className="w-full bg-stone-100 text-stone-400 font-bold py-3.5 rounded-xl cursor-not-allowed">
                        Sold Out — Notify Me
                    </button>
                ) : (
                    <div className="flex items-center gap-3 w-full">
                        <button
                            onClick={handleAdd}
                            className={`flex-1 flex items-center justify-center gap-1.5 font-bold py-3.5 rounded-xl border-2 transition-colors ${justAdded ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-amber-500 text-amber-600 bg-white"}`}
                        >
                            {justAdded ? (
                                <><Check className="w-4 h-4" strokeWidth={3} /> Added {qtyInCart > 0 ? `(${qtyInCart})` : ""}</>
                            ) : (
                                <><Plus className="w-4 h-4" strokeWidth={3} /> Add to Cart</>
                            )}
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="flex-1 flex flex-col items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-2 rounded-xl shadow-md active:scale-95 transition-transform leading-none"
                        >
                            <span className="text-[14px]">Buy Now</span>
                            <span className="text-[10px] font-semibold text-amber-50/90 mt-0.5">{money(lineTotal)}</span>
                        </button>
                    </div>
                )}
            </div>

            <ShopCartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onAdd={(prod) => addToCart(prod, 1)}
                onRemove={removeFromCart}
                onDelete={deleteFromCart}
                onOrderPlaced={() => setCart([])}
            />
        </div>
    );
}
