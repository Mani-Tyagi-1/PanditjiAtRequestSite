import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import ShopProductCard from "./ShopProductCard";
import ShopProductModal from "./ShopProductModal";
import ShopCartModal from "./ShopCartModal";
import {
    SHOP_CATEGORIES, calcShipping,
    type ShopProduct, type ShopCategory, type CartLine,
} from "./shopData";
import API_URL from "../../../utils/apiConfig";
import { money } from "../../../utils/currency";

// ─────────────────────────────────────────────────────────────
//  Spiritual Shop — Section
//  Product grid + category filter + cart & checkout flow.
//  Renders dummy data instantly, then replaces with the backend
//  catalog (GET /shop-products) when available.
// ─────────────────────────────────────────────────────────────

export default function ShopSection() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [category, setCategory] = useState<ShopCategory>("All");
    const [cart, setCart] = useState<CartLine[]>(() => {
        try {
            const saved = localStorage.getItem("pjar_shop_cart");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProduct, _setSelectedProduct] = useState<ShopProduct | null>(null);
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/shop-products`);
            if (!res.ok) throw new Error("Server responded with error status");
            const json = await res.json();
            const data: ShopProduct[] = json?.data || [];
            setProducts(data);
        } catch (err) {
            console.error("Error fetching shop products:", err);
            setError("Failed to fetch products. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem("pjar_shop_cart", JSON.stringify(cart));
        } catch (err) {
            console.error("Failed to save cart to localStorage", err);
        }
    }, [cart]);

    const filtered = useMemo(
        () => (category === "All" ? products : products.filter((p) => p.category === category)),
        [products, category]
    );

    const qtyOf = (id: string) => cart.find((l) => l.product.id === id)?.qty ?? 0;

    // const openProduct = (product: ShopProduct) => {
    //     setSelectedProduct(product);
    //     setIsProductOpen(true);
    //     if (window.fbq) {
    //         window.fbq("track", "ViewContent", {
    //             content_name: product.name,
    //             content_type: "shop_product",
    //             value: product.price,
    //             currency: "INR",
    //         });
    //     }
    // };

    const addToCart = (product: ShopProduct, qty = 1) => {
        setCart((prev) => {
            const existing = prev.find((l) => l.product.id === product.id);
            if (existing) {
                return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + qty } : l));
            }
            return [...prev, { product, qty }];
        });
    };

    const removeFromCart = (product: ShopProduct) => {
        setCart((prev) =>
            prev
                .map((l) => (l.product.id === product.id ? { ...l, qty: l.qty - 1 } : l))
                .filter((l) => l.qty > 0)
        );
    };

    const deleteFromCart = (product: ShopProduct) => {
        setCart((prev) => prev.filter((l) => l.product.id !== product.id));
    };

    const itemCount = cart.reduce((s, l) => s + l.qty, 0);
    const subtotal = cart.reduce((s, l) => s + l.product.price * l.qty, 0);
    const total = subtotal + calcShipping(subtotal);

    return (
        <section className="shop-section relative py-6 overflow-hidden bg-gradient-to-b from-[#FFFAF3] to-[#FFF6EA]">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');
                .shop-section { font-family: 'DM Sans', sans-serif; }
                .shop-chips::-webkit-scrollbar { display: none; }
                .shop-chips { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Header */}
            <div className="px-5 mb-3 flex items-end justify-between gap-3">
                <div>
                    <h2 className="text-stone-900 font-bold leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "27px" }}>
                        Spiritual{" "}
                        <span className="italic bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">Panditji At Request Shop</span>
                    </h2>
                </div>

                {/* Cart button */}
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-white border border-amber-100 shadow-sm active:scale-95 transition-transform"
                >
                    <ShoppingBag className="w-5 h-5 text-amber-600" />
                    {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                            {itemCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Category chips */}
            <div className="shop-chips overflow-x-auto px-5 mb-4">
                <div className="flex gap-2 w-max">
                    {SHOP_CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${category === cat
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                                : "bg-white text-stone-600 border border-stone-200"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product grid */}
            <div className="px-5 grid grid-cols-2 gap-3">
                {loading && (
                    <>
                        <ShopProductSkeleton />
                        <ShopProductSkeleton />
                        <ShopProductSkeleton />
                        <ShopProductSkeleton />
                    </>
                )}

                {error && (
                    <div className="col-span-2 text-center py-8 bg-red-50 border border-red-100 rounded-2xl">
                        <p className="text-red-600 text-[13px] font-semibold">{error}</p>
                        <button
                            onClick={fetchProducts}
                            className="mt-2 text-xs font-bold text-red-700 underline"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && filtered.map((product) => (
                    <ShopProductCard
                        key={product.id}
                        product={product}
                    />
                ))}
            </div>

            {!loading && !error && filtered.length === 0 && (
                <p className="text-center text-stone-400 text-sm py-10">No products in this category yet.</p>
            )}

            {/* Inline cart summary bar (appears when items added) */}
            <AnimatePresence>
                {itemCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                        className="px-5 mt-4"
                    >
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="w-full flex items-center justify-between bg-stone-900 text-white rounded-2xl px-4 py-3 shadow-lg active:scale-[0.99] transition-transform"
                        >
                            <span className="flex items-center gap-2 text-[13px] font-semibold">
                                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-white/15 text-[12px] font-bold">{itemCount}</span>
                                items in cart
                            </span>
                            <span className="flex items-center gap-2 text-[14px] font-bold">
                                {money(total)}
                                <span className="text-amber-300 text-[12px] font-bold">View Cart →</span>
                            </span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <ShopProductModal
                isOpen={isProductOpen}
                product={selectedProduct}
                cartQty={selectedProduct ? qtyOf(selectedProduct.id) : 0}
                onClose={() => setIsProductOpen(false)}
                onAddToCart={addToCart}
                onBuyNow={(product, qty) => {
                    addToCart(product, qty);
                    setIsProductOpen(false);
                    setIsCartOpen(true);
                }}
            />

            <ShopCartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onAdd={addToCart}
                onRemove={removeFromCart}
                onDelete={deleteFromCart}
                onOrderPlaced={() => setCart([])}
            />
        </section>
    );
}

function ShopProductSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-amber-100/80 shadow-sm flex flex-col animate-pulse">
            <div className="aspect-square bg-stone-200" />
            <div className="p-2.5 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                    <div className="h-3.5 bg-stone-200 rounded w-5/6" />
                    <div className="h-3 bg-stone-200 rounded w-1/2" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-stone-200 rounded w-1/3" />
                    <div className="h-8 bg-stone-200 rounded-xl w-full" />
                </div>
            </div>
        </div>
    );
}
