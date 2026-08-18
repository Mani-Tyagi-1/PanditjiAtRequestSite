import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../../../utils/apiConfig";
import { money } from "../../../utils/currency";
import { useShopifyCart } from "../../../context/ShopifyCartContext";
import { categoryToSlug, getCategory } from "../../../utils/shopCategories";
import { type ShopifyProduct } from "./shopifyTypes";

type Props = {
    title: string;
    subtitle: string;
    tags: string[];
    source: string;
    limit?: number;
};

export default function RelatedProductsSection({ title, subtitle, tags, source, limit = 6 }: Props) {
    const navigate = useNavigate();
    const { addItem, openCart } = useShopifyCart();
    const railRef = useRef<HTMLDivElement | null>(null);
    const [products, setProducts] = useState<ShopifyProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [addedId, setAddedId] = useState<string | null>(null);
    const [reducedMotion, setReducedMotion] = useState(false);
    const tagKey = tags.join(",");

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReducedMotion(media.matches);
        update();
        media.addEventListener?.("change", update);
        return () => media.removeEventListener?.("change", update);
    }, []);

    useEffect(() => {
        let active = true;
        axios.get(`${API_URL}/shopify-products/related`, { params: { tags: tagKey, limit } })
            .then(({ data }) => {
                if (active) setProducts(Array.isArray(data?.data) ? data.data : []);
            })
            .catch((error) => {
                console.error(`[RelatedProducts:${source}] failed to load:`, error);
                if (active) setProducts([]);
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [limit, source, tagKey]);

    const repeatedProducts = useMemo(
        () => products.length > 2 ? [...products, ...products] : products,
        [products],
    );

    useEffect(() => {
        const rail = railRef.current;
        if (!rail || reducedMotion || products.length < 3) return;

        let paused = false;
        const pause = () => { paused = true; };
        const resume = () => { paused = false; };
        rail.addEventListener("pointerenter", pause);
        rail.addEventListener("pointerleave", resume);
        rail.addEventListener("touchstart", pause, { passive: true });
        rail.addEventListener("touchend", resume, { passive: true });
        rail.addEventListener("focusin", pause);
        rail.addEventListener("focusout", resume);

        const id = window.setInterval(() => {
            if (paused) return;
            const card = rail.querySelector<HTMLElement>("[data-related-card]");
            const step = (card?.offsetWidth || 220) + 12;
            const halfway = rail.scrollWidth / 2;
            if (rail.scrollLeft >= halfway - step) rail.scrollLeft = 0;
            rail.scrollBy({ left: step, behavior: "smooth" });
        }, 3200);

        return () => {
            window.clearInterval(id);
            rail.removeEventListener("pointerenter", pause);
            rail.removeEventListener("pointerleave", resume);
            rail.removeEventListener("touchstart", pause);
            rail.removeEventListener("touchend", resume);
            rail.removeEventListener("focusin", pause);
            rail.removeEventListener("focusout", resume);
        };
    }, [products.length, reducedMotion]);

    if (!loading && products.length === 0) return null;

    const scroll = (direction: -1 | 1) => {
        const rail = railRef.current;
        if (!rail) return;
        const card = rail.querySelector<HTMLElement>("[data-related-card]");
        rail.scrollBy({ left: direction * ((card?.offsetWidth || 220) + 12), behavior: "smooth" });
    };

    const handleAdd = (product: ShopifyProduct) => {
        addItem(product, 1);
        setAddedId(product._id);
        openCart();
        window.setTimeout(() => setAddedId((current) => current === product._id ? null : current), 1800);
    };

    return (
        <section aria-labelledby="related-products-title" className="space-y-2">
            <div className="flex items-end justify-between gap-2">
                <div>
                    <h3 id="related-products-title" className="font-svn-sub text-[12px] font-bold uppercase tracking-[0.14em] text-[#7A1622]">{title}</h3>
                    <p className="text-[11px] text-[#665C50] mt-0.5">{subtitle}</p>
                </div>
                {!loading && products.length > 1 && (
                    <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={() => scroll(-1)} aria-label="Previous related product" className="w-7 h-7 rounded-full border border-[#C79A2B]/70 bg-[#FCF8F0] flex items-center justify-center text-[#7A1622]"><ChevronLeft className="w-4 h-4" /></button>
                        <button type="button" onClick={() => scroll(1)} aria-label="Next related product" className="w-7 h-7 rounded-full border border-[#C79A2B]/70 bg-[#FCF8F0] flex items-center justify-center text-[#7A1622]"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                )}
            </div>

            <div ref={railRef} className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1 -mx-1 px-1" aria-label="Related devotional products">
                {loading ? Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="w-[174px] shrink-0 snap-start rounded-2xl border border-[#D8B66A]/60 bg-[#FCF8F0] overflow-hidden animate-pulse">
                        <div className="aspect-square bg-[#E8DDC8]" />
                        <div className="p-2.5 space-y-2"><div className="h-3 bg-[#E8DDC8] rounded" /><div className="h-3 bg-[#E8DDC8] rounded w-1/2" /></div>
                    </div>
                )) : repeatedProducts.map((product, index) => {
                    const price = Number(product.priceRangeV2?.minVariantPrice?.amount || 0);
                    const compareAt = Number(product.compareAtPriceRange?.minVariantCompareAtPrice?.amount || 0);
                    const hasDiscount = compareAt > price;
                    return (
                        <article key={`${product._id}-${index}`} data-related-card className="w-[174px] shrink-0 snap-start rounded-2xl border border-[#D8B66A]/70 bg-[#FCF8F0] overflow-hidden shadow-[0_3px_14px_-8px_rgba(40,25,10,0.45)]">
                            <button type="button" onClick={() => navigate(`/shop/${categoryToSlug(getCategory(product))}/${product.handle}`)} className="block w-full text-left">
                                <div className="aspect-square bg-[#EFE3CC] overflow-hidden">
                                    {product.featuredImage?.url ? <img src={product.featuredImage.url} alt={product.title} loading="lazy" className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[#8E6A25] text-xs">Devotional item</div>}
                                </div>
                                <div className="p-2.5">
                                    <h4 className="text-[12px] font-bold text-[#23201B] leading-snug line-clamp-2 min-h-[32px]">{product.title}</h4>
                                    <div className="flex items-baseline gap-1.5 mt-1">
                                        <span className="text-[13px] font-black text-[#7A1622]">{money(price)}</span>
                                        {hasDiscount && <span className="text-[10px] text-[#665C50] line-through">{money(compareAt)}</span>}
                                    </div>
                                </div>
                            </button>
                            <button type="button" onClick={() => handleAdd(product)} className="mx-2.5 mb-2.5 w-[calc(100%-20px)] flex items-center justify-center gap-1 bg-[#7A1622] text-[#F3E5BF] text-[11px] font-bold py-2 rounded-xl active:scale-95 transition-transform">
                                {addedId === product._id ? <><Check className="w-3.5 h-3.5" /> Added</> : <><ShoppingCart className="w-3.5 h-3.5" /> Add to cart</>}
                            </button>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
