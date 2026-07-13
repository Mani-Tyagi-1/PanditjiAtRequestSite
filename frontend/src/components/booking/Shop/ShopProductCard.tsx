import { Star, ChevronRight, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Minimal real-data shape this card needs — structurally satisfied both by the
// legacy dummy `ShopProduct` (./shopData, used by the unrouted `ShopSection`)
// and by real Shopify products mapped in `pages/ShopPage.tsx`, so this card can
// be reused as the renderer for both without any fabricated fields.
export interface ShopCardItem {
    id: string;
    name: string;
    image: string;
    price: number;
    originalPrice?: number;
    badge?: string;
    rating?: number;
    reviews?: number;
    inStock?: boolean;
}

interface Props {
    product: ShopCardItem;
    /** Overrides the default `/shop-product/:id` navigation when provided (used for real Shopify products, which live at `/shop/product/:handle`). */
    onOpen?: () => void;
    /** When provided, renders a real "Buy Now" quick-add button instead of the plain "View Details" affordance. */
    onBuyNow?: () => void;
}

export default function ShopProductCard({ product, onOpen, onBuyNow }: Props) {
    const navigate = useNavigate();
    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;
    const soldOut = product.inStock === false;
    const hasRating = typeof product.rating === "number" && typeof product.reviews === "number";

    const openProduct = () => (onOpen ? onOpen() : navigate(`/shop-product/${product.id}`));

    // Rendered as a `<div role="button">` (not a native `<button>`) because when
    // `onBuyNow` is supplied this wrapper contains a real nested "Buy Now"
    // `<button>` — nesting interactive `<button>` elements is invalid HTML5.
    // `role="button"` + `tabIndex`/`onKeyDown` keep it keyboard-operable like a
    // real button in both the plain and `onBuyNow` cases.
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={openProduct}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openProduct();
                }
            }}
            className="shop-card group text-left relative bg-white rounded-2xl overflow-hidden border border-amber-100/80 shadow-[0_8px_24px_-12px_rgba(180,83,9,0.3)] flex flex-col active:scale-[0.98] transition-transform cursor-pointer md:transition-all md:duration-300 md:hover:shadow-xl md:hover:-translate-y-1 md:hover:border-amber-200"
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-amber-50">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-700 ${soldOut ? "grayscale opacity-70" : "group-hover:scale-105 md:group-hover:scale-105"}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300">
                        <ShoppingBag className="w-8 h-8" />
                    </div>
                )}
                {product.badge && !soldOut && (
                    <span className="absolute top-2 left-2 bg-stone-900/85 text-white text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                        {product.badge}
                    </span>
                )}
                {discount > 0 && !soldOut && (
                    <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {discount}% OFF
                    </span>
                )}
                {soldOut && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-stone-900/80 text-white text-[11px] font-bold px-3 py-1 rounded-full">Sold Out</span>
                    </div>
                )}
                {!soldOut && hasRating && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/55 backdrop-blur-sm text-white rounded-full pl-1.5 pr-2 py-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10.5px] font-bold leading-none">{product.rating!.toFixed(1)}</span>
                        <span className="text-[9.5px] text-white/70 leading-none">({product.reviews!.toLocaleString("en-IN")})</span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-2.5 flex flex-col flex-1 md:p-4">
                <h3 className="text-stone-900 font-bold text-[13.5px] leading-tight line-clamp-2 min-h-[34px] md:text-[14.5px] md:min-h-[38px]">
                    {product.name}
                </h3>

                <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-[16px] font-bold text-stone-900 md:text-[17px]">₹{product.price.toLocaleString("en-IN")}</span>
                    {product.originalPrice && (
                        <span className="text-[11px] text-stone-400 line-through md:text-[12px]">₹{product.originalPrice.toLocaleString("en-IN")}</span>
                    )}
                </div>

                {/* View details affordance, or a real quick "Buy Now" add-to-cart when the caller wires one up */}
                {onBuyNow ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onBuyNow();
                        }}
                        disabled={soldOut}
                        className="mt-2.5 w-full flex items-center justify-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[12px] font-bold py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed md:text-[13px] md:py-2.5 md:hover:shadow-md md:hover:brightness-110"
                    >
                        {soldOut ? "Sold Out" : "Buy Now"}
                    </button>
                ) : (
                    <div className="mt-2.5 w-full flex items-center justify-center gap-1 bg-stone-50 group-hover:bg-amber-50 text-stone-600 group-hover:text-amber-600 text-[12px] font-bold py-2 rounded-xl border border-stone-100 transition-colors md:text-[13px] md:py-2.5">
                        View Details
                        <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>
        </div>
    );
}
