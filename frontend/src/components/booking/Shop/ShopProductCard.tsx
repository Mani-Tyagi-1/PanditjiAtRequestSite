import { Star, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ShopProduct } from "./shopData";

interface Props {
    product: ShopProduct;
}

export default function ShopProductCard({ product }: Props) {
    const navigate = useNavigate();
    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;
    const soldOut = !product.inStock;

    return (
        <button
            onClick={() => navigate(`/shop-product/${product.id}`)}
            className="shop-card group text-left relative bg-white rounded-2xl overflow-hidden border border-amber-100/80 shadow-[0_8px_24px_-12px_rgba(180,83,9,0.3)] flex flex-col active:scale-[0.98] transition-transform"
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-amber-50">
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-transform duration-700 ${soldOut ? "grayscale opacity-70" : "group-hover:scale-105"}`}
                />
                {product.badge && !soldOut && (
                    <span className="absolute top-2 left-2 bg-stone-900/85 text-white text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full">
                        {product.badge}
                    </span>
                )}
                {discount > 0 && !soldOut && (
                    <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                        {discount}% OFF
                    </span>
                )}
                {soldOut && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-stone-900/80 text-white text-[11px] font-bold px-3 py-1 rounded-full">Sold Out</span>
                    </div>
                )}
                {!soldOut && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/55 backdrop-blur-sm text-white rounded-full pl-1.5 pr-2 py-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10.5px] font-bold leading-none">{product.rating.toFixed(1)}</span>
                        <span className="text-[9.5px] text-white/70 leading-none">({product.reviews.toLocaleString("en-IN")})</span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-2.5 flex flex-col flex-1">
                <h3 className="text-stone-900 font-bold text-[13.5px] leading-tight line-clamp-2 min-h-[34px]">
                    {product.name}
                </h3>

                <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-[16px] font-extrabold text-stone-900">₹{product.price.toLocaleString("en-IN")}</span>
                    {product.originalPrice && (
                        <span className="text-[11px] text-stone-400 line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>
                    )}
                </div>

                {/* View details affordance */}
                <div className="mt-2.5 w-full flex items-center justify-center gap-1 bg-stone-50 group-hover:bg-amber-50 text-stone-600 group-hover:text-amber-600 text-[12px] font-bold py-2 rounded-xl border border-stone-100 transition-colors">
                    View Details
                    <ChevronRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </button>
    );
}
