import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
    ArrowLeft,
    Search,
    Star,
    X,
    Sparkles,
    Check,
    ShoppingBag,
    Plus,
    Minus,
    Loader2,
    CreditCard,
    Shield,
    Lock,
    Phone,
    AlertCircle
} from "lucide-react";
import API_URL from "../utils/apiConfig";
import { useAuth } from "../context/AuthContext";


type Money = {
    amount: string;
    currencyCode: string;
};

type ShopifyProduct = {
    _id: string;
    shopifyProductId: string;
    title: string;
    handle: string;
    descriptionHtml?: string;
    featuredImage?: {
        id: string;
        url: string;
        altText?: string | null;
        width?: number;
        height?: number;
    };
    priceRangeV2?: {
        minVariantPrice: Money;
        maxVariantPrice: Money;
    };
    compareAtPriceRange?: {
        minVariantCompareAtPrice: Money;
        maxVariantCompareAtPrice: Money;
    };
    rashi?: string;
    status?: string;
    totalInventory?: number;
    tags?: string[];
};

const RASHIS = [
    "All",
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces"
];

export default function ShopPage() {
    const navigate = useNavigate();
    const { user, openLoginModal } = useAuth();
    
    const [products, setProducts] = useState<ShopifyProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeRashi, setActiveRashi] = useState("All");
    const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);

    // Checkout states
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutProduct, setCheckoutProduct] = useState<ShopifyProduct | null>(null);
    const [checkoutForm, setCheckoutForm] = useState({
        name: "",
        addressLine: "",
        city: "",
        state: "",
        pincode: "",
    });
    const [qty, setQty] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

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

    // Load Razorpay script dynamically
    useEffect(() => {
        const existingScript = document.querySelector(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        );
        if (existingScript) return;

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) script.parentNode.removeChild(script);
        };
    }, []);

    // Pre-fill user name when user is logged in
    useEffect(() => {
        if (user) {
            setCheckoutForm((prev) => ({
                ...prev,
                name: user.name || prev.name,
            }));
        }
    }, [user]);

    // Filter products locally for instantaneous user feedback
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch =
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.rashi && p.rashi.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesRashi =
                activeRashi === "All" ||
                (p.rashi && p.rashi.toLowerCase() === activeRashi.toLowerCase()) ||
                (p.tags && p.tags.some(t => t.toLowerCase() === activeRashi.toLowerCase()));

            return matchesSearch && matchesRashi;
        });
    }, [products, searchQuery, activeRashi]);

    const handleBuyClick = (prod: ShopifyProduct) => {
        if (!user) {
            openLoginModal();
            return;
        }
        setCheckoutProduct(prod);
        setQty(1);
        setIsCheckoutOpen(true);
        setIsSuccess(false);
        setErrorMsg("");
        setSelectedProduct(null);
    };

    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkoutProduct) return;

        const { name, addressLine, city, state, pincode } = checkoutForm;
        if (!name.trim() || !addressLine.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
            setErrorMsg("Please fill in all shipping details.");
            return;
        }

        if (!/^\d{6}$/.test(pincode.trim())) {
            setErrorMsg("Please enter a valid 6-digit pincode.");
            return;
        }

        setErrorMsg("");
        setIsSubmitting(true);

        try {
            // Create Shopify Order inside DB & Razorpay
            const orderRes = await axios.post(`${API_URL}/shopify-orders/create-order`, {
                items: [
                    {
                        shopifyProductId: checkoutProduct.shopifyProductId,
                        variantId: "",
                        title: checkoutProduct.title,
                        qty: qty,
                    }
                ],
                customerName: name,
                phone: user?.phone,
                addressLine: addressLine,
                city: city,
                state: state,
                pincode: pincode,
                userId: user?._id,
            });

            const orderData = orderRes.data;
            if (!orderData || !orderData.success) {
                throw new Error(orderData.message || "Failed to initialize order.");
            }

            const RazorpayCtor = (window as any).Razorpay;
            if (!RazorpayCtor) {
                throw new Error("Razorpay payment SDK failed to load. Please refresh and try again.");
            }

            const prefillEmail = user?.email || `user${user?.phone || ""}@panditjiatrequest.com`;

            const rzp = new RazorpayCtor({
                key: orderData.razorpayKeyId,
                amount: orderData.amount * 100,
                currency: orderData.currency || "INR",
                name: "PanditJi At Request",
                description: `${checkoutProduct.title} (x${qty})`,
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: name,
                    contact: user?.phone,
                    email: prefillEmail,
                },
                theme: { color: "#F97316" },
                handler: async function (response: any) {
                    try {
                        const completeRes = await axios.post(`${API_URL}/shopify-orders/complete-payment`, {
                            bookingId: orderData.bookingId,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                        if (!completeRes.data || !completeRes.data.success) {
                            throw new Error(completeRes.data.message || "Payment verification failed.");
                        }

                        setIsSuccess(true);
                    } catch (paymentError: any) {
                        setErrorMsg(paymentError.response?.data?.message || paymentError.message || "Payment verification failed.");
                    } finally {
                        setIsSubmitting(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setErrorMsg("Payment was cancelled. Please try again.");
                        setIsSubmitting(false);
                    },
                },
            });

            rzp.on("payment.failed", function (response: any) {
                setErrorMsg(response?.error?.description || "Payment failed. Please try again.");
                setIsSubmitting(false);
            });

            rzp.open();
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || err.message || "Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    const unitPrice = Number(checkoutProduct?.priceRangeV2?.minVariantPrice?.amount || 0);
    const totalPrice = unitPrice * qty;

    return (
        <div className="font-sans min-h-screen bg-[#FFFAF3] pb-24 w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100/50">
            <Helmet>
                <title>Bhakti Shop | Pandit Ji At Request</title>
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
                <h1 className="text-center text-[26px] font-bold text-orange-600" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Bhakti Shop
                </h1>
                <p className="text-center text-[12.5px] text-stone-500 -mt-0.5">Energized spiritual gems & bracelets</p>

                {/* Search Bar */}
                <div className="relative mt-4">
                    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-orange-100">
                        <Search className="w-4 h-4 text-stone-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search bracelets, rashi, gemstones..."
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
            <div className="px-4 -mt-1">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                    {RASHIS.map((rashi) => {
                        const active = activeRashi === rashi;
                        return (
                            <button
                                key={rashi}
                                onClick={() => setActiveRashi(rashi)}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-[12.5px] font-bold border transition-all ${
                                    active
                                        ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                                        : "bg-white text-stone-600 border-orange-100"
                                }`}
                            >
                                {rashi}
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
                                    onClick={() => setSelectedProduct(p)}
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

            {/* ── Product Details Modal ── */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs max-w-md mx-auto">
                    <div className="bg-[#FFFAF3] rounded-3xl w-full max-h-[85vh] overflow-hidden flex flex-col relative border border-orange-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md border border-orange-100 flex items-center justify-center shadow-md active:scale-90 transition-transform"
                        >
                            <X className="w-4.5 h-4.5 text-stone-700" />
                        </button>

                        <div className="overflow-y-auto flex-1">
                            {/* Product Hero Image */}
                            <div className="relative aspect-square bg-orange-50/20">
                                {selectedProduct.featuredImage?.url ? (
                                    <img
                                        src={selectedProduct.featuredImage.url}
                                        alt={selectedProduct.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300">
                                        <ShoppingBag className="w-12 h-12" />
                                    </div>
                                )}
                                {selectedProduct.rashi && (
                                    <span className="absolute bottom-4 left-4 bg-orange-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-md shadow-md">
                                        {selectedProduct.rashi} Rashi
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-5 space-y-4">
                                <div>
                                    <h2 className="text-xl font-bold text-stone-850 leading-tight">
                                        {selectedProduct.title}
                                    </h2>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[11.5px] font-bold">
                                            <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" /> 4.9
                                        </span>
                                        <span className="text-[12px] text-stone-400 font-semibold">
                                            Energized & Certified
                                        </span>
                                    </div>
                                </div>

                                {/* Price block */}
                                <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-baseline gap-2.5">
                                        <span className="text-3xl font-black text-orange-600">
                                            ₹{Number(selectedProduct.priceRangeV2?.minVariantPrice?.amount || 0).toLocaleString("en-IN")}
                                        </span>
                                        {selectedProduct.compareAtPriceRange?.minVariantCompareAtPrice?.amount && (
                                            <span className="text-base text-stone-400 line-through">
                                                ₹{Number(selectedProduct.compareAtPriceRange.minVariantCompareAtPrice.amount).toLocaleString("en-IN")}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-stone-400 mt-1">Free energized packaging · Blessed by Experts</p>
                                </div>

                                {/* About & Description */}
                                {selectedProduct.descriptionHtml && (
                                    <div>
                                        <h3 className="text-[12px] font-black uppercase tracking-wider text-stone-400 mb-1.5">Description</h3>
                                        <div
                                            className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm text-[12.5px] text-stone-600 leading-relaxed space-y-2 shopify-description"
                                            dangerouslySetInnerHTML={{ __html: selectedProduct.descriptionHtml }}
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
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="p-4 border-t border-orange-100 bg-white flex gap-2">
                            <button
                                onClick={() => handleBuyClick(selectedProduct)}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-2 text-sm"
                            >
                                <Sparkles className="w-4 h-4 fill-white text-white animate-pulse" /> Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Checkout Sheet / Modal ── */}
            {isCheckoutOpen && checkoutProduct && (
                <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 bg-black/60 backdrop-blur-xs max-w-md mx-auto">
                    {/* Backdrop closer */}
                    <div className="absolute inset-0" onClick={() => !isSubmitting && setIsCheckoutOpen(false)} />

                    {isSuccess ? (
                        <div className="relative bg-[#FFFAF3] rounded-t-[32px] w-full p-8 text-center border-t border-orange-100 shadow-2xl animate-in slide-in-from-bottom duration-300 z-10">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-8 h-8" strokeWidth={3} />
                            </div>
                            <h2 className="text-2xl font-bold text-stone-850 mb-2">Order Confirmed!</h2>
                            <p className="text-stone-500 text-sm mb-6">
                                Thank you! Your payment is successful, and your energized spiritual product order has been placed.
                            </p>
                            <button
                                onClick={() => {
                                    setIsCheckoutOpen(false);
                                    navigate("/profile?tab=shopify");
                                }}
                                className="w-full bg-[#FF7000] text-white font-bold py-3.5 rounded-2xl shadow-md shadow-orange-100 active:scale-95 transition-all text-sm"
                            >
                                Go to My Orders
                            </button>
                        </div>
                    ) : (
                        <div className="relative bg-[#FFFAF3] rounded-t-[32px] w-full max-h-[90vh] overflow-hidden flex flex-col border-t border-orange-100 shadow-2xl animate-in slide-in-from-bottom duration-300 z-10">
                            {/* Drag Indicator */}
                            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto my-3 shrink-0" />

                            <div className="flex items-center justify-between px-5 pb-3 border-b border-orange-50 shrink-0">
                                <h3 className="text-lg font-bold text-stone-800">Confirm Order Details</h3>
                                <button
                                    onClick={() => !isSubmitting && setIsCheckoutOpen(false)}
                                    className="p-1 rounded-full bg-stone-100 text-stone-500 hover:text-stone-700 active:scale-90"
                                >
                                    <X className="w-4.5 h-4.5" />
                                </button>
                            </div>

                            <form onSubmit={handleCheckoutSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
                                {/* Product Summary Card */}
                                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-orange-50 shadow-xs">
                                    <div className="w-16 h-16 bg-orange-50/20 rounded-xl border border-orange-100 overflow-hidden shrink-0">
                                        {checkoutProduct.featuredImage?.url ? (
                                            <img src={checkoutProduct.featuredImage.url} alt={checkoutProduct.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-300"><ShoppingBag className="w-6 h-6" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-stone-850 truncate">{checkoutProduct.title}</h4>
                                        <p className="text-sm font-black text-orange-600 mt-1">₹{unitPrice.toLocaleString("en-IN")}</p>
                                    </div>
                                    <div className="flex items-center gap-2 border border-orange-100 rounded-xl px-2 py-1 bg-orange-50/20">
                                        <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="p-0.5 text-stone-500 hover:text-stone-700 active:scale-90"><Minus className="w-3.5 h-3.5" /></button>
                                        <span className="text-xs font-bold text-stone-800 min-w-[12px] text-center">{qty}</span>
                                        <button type="button" onClick={() => setQty(qty + 1)} className="p-0.5 text-stone-500 hover:text-stone-700 active:scale-90"><Plus className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Your full name"
                                            value={checkoutForm.name}
                                            onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                                            className="mt-1 w-full border border-orange-100 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-white"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Phone Number</label>
                                        <div className="mt-1 flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-405">
                                            <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                                            <span>+91 {user?.phone}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Shipping Address</label>
                                        <input
                                            type="text"
                                            placeholder="House No, Street name, Locality"
                                            value={checkoutForm.addressLine}
                                            onChange={(e) => setCheckoutForm({ ...checkoutForm, addressLine: e.target.value })}
                                            className="mt-1 w-full border border-orange-100 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-white"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">City</label>
                                            <input
                                                type="text"
                                                placeholder="City"
                                                value={checkoutForm.city}
                                                onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                                                className="mt-1 w-full border border-orange-100 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-white"
                                                required
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">State</label>
                                            <input
                                                type="text"
                                                placeholder="State"
                                                value={checkoutForm.state}
                                                onChange={(e) => setCheckoutForm({ ...checkoutForm, state: e.target.value })}
                                                className="mt-1 w-full border border-orange-100 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-white"
                                                required
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Pincode</label>
                                        <input
                                            type="text"
                                            placeholder="6-digit pincode"
                                            maxLength={6}
                                            value={checkoutForm.pincode}
                                            onChange={(e) => setCheckoutForm({ ...checkoutForm, pincode: e.target.value.replace(/\D/g, "") })}
                                            className="mt-1 w-full border border-orange-100 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-white font-mono"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                {errorMsg && (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-xl text-xs font-semibold shrink-0">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{errorMsg}</span>
                                    </div>
                                )}

                                {/* Security / Trust badges */}
                                <div className="grid grid-cols-2 gap-2 bg-white rounded-2xl border border-stone-100 p-3 shrink-0">
                                    <div className="flex items-center gap-2 text-[10px] text-stone-500">
                                        <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span className="leading-tight">Genuine Products Blessed by Experts</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-stone-500">
                                        <Lock className="w-4 h-4 text-orange-500 shrink-0" />
                                        <span className="leading-tight">Secured by Razorpay Payments</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-650 hover:to-amber-650 active:scale-95 text-white font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all text-center flex items-center justify-center gap-2 text-sm shrink-0 disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Processing Secure Payment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-4 h-4" />
                                            <span>Pay ₹{totalPrice.toLocaleString("en-IN")} Securely</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
