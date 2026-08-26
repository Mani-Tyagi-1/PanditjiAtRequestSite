import { useEffect, useState } from "react";
import { ExternalLink, ShoppingCart, Trash2, X } from "lucide-react";
import axios from "axios";
import API_URL from "../../utils/apiConfig";
import { money } from "../../utils/currency";
import { useShopifyCart } from "../../context/ShopifyCartContext";
import { type ShopifyProduct } from "./Shop/shopifyTypes";

export type RecommendedPuja = {
    _id: string;
    poojaID?: string;
    poojaNameEng: string;
    poojaMode: "online" | "offline" | "both";
    poojaPriceOnline?: number;
    poojaPriceOffline?: number;
    poojaCardImage?: string;
};

const MAHAKAL_RECOMMENDED_PRODUCT_ID = "6a3bab393fe484c89e2da3ac";
const MAHAKAL_RECOMMENDED_PUJA_ID = "685b5557922c7df97c114e71";

type Props = {
    isOpen: boolean;
    source: string;
    shopTags: string[];
    pujaTerms: string[];
    excludePoojaID: string;
    recommendedProductId?: string;
    recommendedPujaId?: string;
    recommendedProductFallback?: ShopifyProduct;
    onDismiss: () => void;
    selectedRelatedPuja?: RecommendedPuja | null;
    enableRelatedPujaCart?: boolean;
    onRelatedPujaChange?: (puja: RecommendedPuja | null) => void;
    onPujaInfo?: (puja: RecommendedPuja) => void;
    onContinue: (checkout?: { shopSubtotal: number; relatedPuja?: RecommendedPuja | null }) => void;
    summary?: {
        pujaAmount: number;
        formatAmount: (amount: number) => string;
    };
};

export default function CheckoutRecommendationsSheet({ isOpen, source, shopTags, pujaTerms, excludePoojaID, recommendedProductId, recommendedPujaId, recommendedProductFallback, onDismiss, selectedRelatedPuja, enableRelatedPujaCart = false, onRelatedPujaChange, onPujaInfo, onContinue, summary }: Props) {
    const { addItem, removeItem, items, subtotal } = useShopifyCart();
    const [products, setProducts] = useState<ShopifyProduct[]>([]);
    const [pujas, setPujas] = useState<RecommendedPuja[]>([]);
    const [localSelectedPuja, setLocalSelectedPuja] = useState<RecommendedPuja | null>(null);
    const [loading, setLoading] = useState(false);
    const [summaryShopSubtotal, setSummaryShopSubtotal] = useState(0);
    const shopTagsKey = shopTags.join(",");
    const pujaTermsKey = pujaTerms.join(",");
    const isMahakalSeva = source.includes("savan") || source.includes("mahakal");
    const fixedRecommendedProductId = recommendedProductId || (isMahakalSeva ? MAHAKAL_RECOMMENDED_PRODUCT_ID : undefined);
    const fixedRecommendedPujaId = recommendedPujaId || (isMahakalSeva ? MAHAKAL_RECOMMENDED_PUJA_ID : undefined);

    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        setLoading(true);
        Promise.allSettled([
            fixedRecommendedProductId
                ? axios.get(`${API_URL}/shopify-products/${encodeURIComponent(fixedRecommendedProductId)}`)
                : axios.get(`${API_URL}/shopify-products/related`, { params: { tags: shopTagsKey, limit: 1 } }),
            fixedRecommendedPujaId
                ? axios.get(`${API_URL}/fetch-pooja-by-id/${encodeURIComponent(fixedRecommendedPujaId)}`)
                : axios.get(`${API_URL}/fetch-related-poojas`, { params: { terms: pujaTermsKey, excludePoojaID, limit: 1 } }),
        ])
            .then(([shopResult, pujaResult]) => {
                if (!active) return;
                const shopData = shopResult.status === "fulfilled" ? shopResult.value.data : null;
                const pujaData = pujaResult.status === "fulfilled" ? pujaResult.value.data : null;
                const shopProduct = fixedRecommendedProductId ? shopData?.data : null;
                const relatedProducts = Array.isArray(shopData?.data) ? shopData.data : [];
                const directPuja = fixedRecommendedPujaId ? pujaData?.pooja : null;
                const relatedPujas = Array.isArray(pujaData?.poojas) ? pujaData.poojas : [];
                setProducts(fixedRecommendedProductId
                    ? (shopProduct ? [shopProduct] : recommendedProductFallback ? [recommendedProductFallback] : [])
                    : relatedProducts);
                setPujas(fixedRecommendedPujaId ? (directPuja ? [directPuja] : []) : relatedPujas);
                if (shopResult.status === "rejected") console.error(`[CheckoutRecommendations:${source}] product request failed:`, shopResult.reason);
                if (pujaResult.status === "rejected") console.error(`[CheckoutRecommendations:${source}] puja request failed:`, pujaResult.reason);
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [excludePoojaID, fixedRecommendedProductId, fixedRecommendedPujaId, isOpen, pujaTermsKey, recommendedProductFallback, shopTagsKey, source]);

    useEffect(() => {
        if (!isOpen) return;
        setSummaryShopSubtotal(subtotal);
    }, [isOpen, subtotal]);

    if (!isOpen) return null;

    const toggleProductInCart = (product: ShopifyProduct) => {
        const existingLine = items.find((line) => line.product._id === product._id);
        const productPrice = Number(product.priceRangeV2?.minVariantPrice?.amount || 0);
        const nextShopSubtotal = existingLine
            ? subtotal - (productPrice * existingLine.qty)
            : subtotal + productPrice;

        if (existingLine) removeItem(product._id);
        else addItem(product, 1);
        setSummaryShopSubtotal(nextShopSubtotal);
    };

    const activeRelatedPuja = enableRelatedPujaCart
        ? (selectedRelatedPuja === undefined ? localSelectedPuja : selectedRelatedPuja)
        : null;

    const toggleRelatedPuja = (puja: RecommendedPuja) => {
        if (!enableRelatedPujaCart) return;
        const next = activeRelatedPuja?._id === puja._id ? null : puja;
        setLocalSelectedPuja(next);
        onRelatedPujaChange?.(next);
    };

    const openPuja = (puja: RecommendedPuja) => {
        onPujaInfo?.(puja);
        window.location.assign(`${window.location.origin}/puja/${puja._id}`);
    };

    const summaryTotal = (summary?.pujaAmount || 0) + summaryShopSubtotal + (activeRelatedPuja?.poojaPriceOffline || 0);

    return (
        <div className="fixed inset-0 z-[180] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="checkout-recommendations-title">
            <button type="button" aria-label="Close recommendations" onClick={onDismiss} className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
            <section className="relative w-full max-w-md rounded-t-[28px] bg-[#FFFAF3] border-t border-orange-200 shadow-2xl px-5 pt-4 pb-5 animate-in slide-in-from-bottom duration-300 max-h-[82vh] overflow-y-auto">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300" />
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 id="checkout-recommendations-title" className="text-[18px] font-bold text-stone-800">Before you complete your {isMahakalSeva ? "Mahakal seva" : "puja seva"}</h2>
                        <p className="mt-1 text-[12px] leading-snug text-stone-500">Add one sacred devotional essential or receive blessings through one related {isMahakalSeva ? "Mahadev" : "devotional"} puja.</p>
                    </div>
                    <button type="button" onClick={onDismiss} aria-label="Close recommendations" className="w-8 h-8 shrink-0 rounded-full bg-stone-100 flex items-center justify-center text-stone-500"><X className="w-4 h-4" /></button>
                </div>

                {loading ? (
                    <div className="mt-5 grid grid-cols-2 gap-3">
                        {[0, 1].map((item) => <div key={item} className="h-36 rounded-2xl bg-stone-100 animate-pulse" />)}
                    </div>
                ) : (products.length > 0 || pujas.length > 0) ? (
                    <div className="mt-5 space-y-5">
                        {products.length > 0 && <div>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-orange-700">{isMahakalSeva ? "Add a Mahadev devotional essential" : "Add a devotional essential"}</p>
                            <div className="grid grid-cols-1 gap-3">
                                {products.slice(0, 1).map((product) => {
                                    const price = Number(product.priceRangeV2?.minVariantPrice?.amount || 0);
                                    const isAdded = items.some((line) => line.product._id === product._id);
                                    return <article key={product._id} className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-2 shadow-sm">
                                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-orange-50">{product.featuredImage?.url && <img src={product.featuredImage.url} alt={product.title} loading="lazy" className="h-full w-full object-cover" />}</div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="line-clamp-2 text-[12px] font-bold leading-snug text-stone-800">{product.title}</h3>
                                            <p className="mt-1 text-[13px] font-black text-orange-600">{money(price)}</p>
                                            <button type="button" onClick={() => toggleProductInCart(product)} className={`mt-2 flex w-full items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-bold active:scale-95 ${isAdded ? "bg-stone-100 text-red-600" : "bg-orange-500 text-white"}`}>
                                                {isAdded ? <><Trash2 className="h-3.5 w-3.5" /> Remove from cart</> : <><ShoppingCart className="h-3.5 w-3.5" /> Add to cart</>}
                                            </button>
                                        </div>
                                    </article>;
                                })}
                            </div>
                        </div>}

                        {pujas.length > 0 && <div>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-orange-700">{isMahakalSeva ? "Explore one more Mahadev puja" : "Explore one related puja"}</p>
                            <div className="space-y-2">
                                {pujas.slice(0, 1).map((puja) => {
                                    const price = puja.poojaPriceOffline;
                                    const isAdded = activeRelatedPuja?._id === puja._id;
                                    return <article key={puja._id} className="relative flex w-full items-center gap-3 rounded-2xl border border-orange-100 bg-white p-2.5 text-left shadow-sm">
                                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-orange-50">{puja.poojaCardImage && <img src={puja.poojaCardImage} alt="" loading="lazy" className="h-full w-full object-cover" />}</div>
                                        <div className="min-w-0 flex-1">
                                            <span className="block line-clamp-2 pr-8 text-[12px] font-bold leading-snug text-stone-800">{puja.poojaNameEng}</span>
                                            <span className="mt-0.5 block text-[10px] text-stone-500">At-home puja{typeof price === "number" && price > 0 ? ` · ${money(price)}` : ""}</span>
                                            {enableRelatedPujaCart && <button type="button" onClick={() => toggleRelatedPuja(puja)} className={`mt-2 flex w-full items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-bold transition-transform active:scale-95 ${isAdded ? "border border-red-100 bg-red-50 text-red-600" : "bg-orange-500 text-white"}`}>
                                                {isAdded ? <><Trash2 className="h-3.5 w-3.5" /> Remove</> : <><ShoppingCart className="h-3.5 w-3.5" /> Add to cart</>}
                                            </button>}
                                        </div>
                                        <button type="button" aria-label={`Know more about ${puja.poojaNameEng}`} onClick={() => openPuja(puja)} className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-orange-500"><ExternalLink className="h-4 w-4" /></button>
                                    </article>;
                                })}
                            </div>
                        </div>}
                    </div>
                ) : <p className="py-6 text-center text-[12px] text-stone-500">Your seva is ready to continue.</p>}

                {summary && (
                    <div className="mt-5 rounded-xl border-y border-orange-200 bg-[#FFFDF8] px-3 py-2.5">
                        <div className="flex items-center justify-between text-[12px] text-stone-600">
                            <span>{source.includes("savan") ? "Savan Somwar Seva" : "Puja seva"}</span>
                            <span className="font-semibold text-stone-800">{summary.formatAmount(summary.pujaAmount)}</span>
                        </div>
                        {summaryShopSubtotal > 0 && (
                            <div className="mt-1 flex items-center justify-between text-[12px] text-stone-600">
                                <span className="min-w-0 truncate pr-3">{items.map((line) => `${line.product.title}${line.qty > 1 ? ` ×${line.qty}` : ""}`).join(", ") || "Shop additions"}</span>
                                <span className="font-semibold text-stone-800">{summary.formatAmount(summaryShopSubtotal)}</span>
                            </div>
                        )}
                        {activeRelatedPuja && (
                            <div className="mt-1 flex items-center justify-between text-[12px] text-stone-600">
                                <span className="min-w-0 truncate pr-3">{activeRelatedPuja.poojaNameEng}</span>
                                <span className="font-semibold text-stone-800">{summary.formatAmount(activeRelatedPuja.poojaPriceOffline || 0)}</span>
                            </div>
                        )}
                        <div className="mt-2 flex items-baseline justify-between border-t border-orange-200 pt-2">
                            <span className="font-serif text-[10px] uppercase tracking-[0.14em] text-orange-800">Total</span>
                            <span className="font-serif text-[20px] font-bold text-[#A41F2E]">{summary.formatAmount(summaryTotal)}</span>
                        </div>
                    </div>
                )}

                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        onClick={() => onContinue(summaryShopSubtotal > 0 || activeRelatedPuja ? { shopSubtotal: summaryShopSubtotal, relatedPuja: activeRelatedPuja } : undefined)}
                        className="flex-1 rounded-2xl border border-stone-200 bg-white py-3 text-[13px] font-bold text-stone-600"
                    >
                        {summaryShopSubtotal > 0 || activeRelatedPuja ? "Continue to payment" : "Skip & continue"}
                    </button>
                </div>
            </section>
        </div>
    );
}
