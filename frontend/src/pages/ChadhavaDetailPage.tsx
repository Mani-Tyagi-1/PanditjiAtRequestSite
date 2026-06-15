import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarDays, Star, Minus, Plus, Gift, Check, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";
import API_URL from "../utils/apiConfig";
import { type Chadhava, type ChadhavaSelection } from "../components/booking/ChadhavaBooking/chadhavaData";
import ChadhavaBookingModal from "../components/booking/ChadhavaBooking/ChadhavaBookingModal";

export default function ChadhavaDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [chadhava, setChadhava] = useState<Chadhava | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [qty, setQty] = useState<Record<string, number>>({});
    const [addPrasad, setAddPrasad] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_URL}/chadhavas/${slug}`);
                if (!res.ok) throw new Error("Chadhava not found");
                const json = await res.json();
                setChadhava(json.data);
            } catch (err) {
                console.error("Error fetching chadhava details:", err);
                setError("Failed to load offering details. It may not exist or is inactive.");
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    const itemByCode = useMemo(() => {
        const map = new Map<string, { name: string; price: number; max: number }>();
        chadhava?.sections.forEach((s) =>
            s.items.forEach((i) => map.set(i.code, { name: i.itemName, price: i.itemPrice, max: i.maxQuantity }))
        );
        return map;
    }, [chadhava]);

    const setItemQty = (code: string, next: number) => {
        const max = itemByCode.get(code)?.max ?? 10;
        const clamped = Math.max(0, Math.min(next, max));
        setQty((q) => {
            const copy = { ...q };
            if (clamped === 0) delete copy[code];
            else copy[code] = clamped;
            return copy;
        });
    };

    const selections: ChadhavaSelection[] = useMemo(
        () =>
            Object.entries(qty).map(([code, quantity]) => {
                const meta = itemByCode.get(code)!;
                return { code, name: meta.name, unitPrice: meta.price, quantity };
            }),
        [qty, itemByCode]
    );

    const prasadPrice = addPrasad && chadhava?.prasad?.enabled ? chadhava.prasad.price : 0;
    const itemsTotal = selections.reduce((s, x) => s + x.unitPrice * x.quantity, 0);
    const grandTotal = itemsTotal + prasadPrice;
    const sevasSelected = selections.length;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFAF6] w-full max-w-md mx-auto border-x border-rose-100 animate-pulse">
                <div className="h-56 bg-stone-200" />
                <div className="p-5 space-y-4">
                    <div className="h-6 bg-stone-200 rounded w-1/3" />
                    <div className="h-24 bg-stone-200 rounded-2xl" />
                    <div className="h-24 bg-stone-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error || !chadhava) {
        return (
            <div className="min-h-screen bg-[#FFFAF6] flex flex-col items-center justify-center p-6 text-center w-full max-w-md mx-auto border-x border-rose-100">
                <span className="text-4xl">🌺</span>
                <h2 className="text-lg font-bold text-stone-800 mt-4">Error Loading Chadhava</h2>
                <p className="text-xs text-stone-500 mt-2 max-w-[280px]">{error || "The requested chadhava does not exist."}</p>
                <button onClick={() => navigate("/chadhava")} className="mt-6 bg-rose-600 text-white font-bold px-6 py-2.5 rounded-xl active:scale-95 transition-all">
                    Back to Chadhava
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFAF6] pb-28 font-sans w-full max-w-md mx-auto border-x border-rose-100 relative">
            <Helmet>
                <title>{`${chadhava.deity} Chadhava at ${chadhava.templeName} | Pandit Ji At Request`}</title>
            </Helmet>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#FFFAF6]/95 backdrop-blur-md border-b border-rose-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-rose-200/50 shadow-sm active:scale-90 transition-transform">
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>
                <h1 className="text-[15px] font-bold text-stone-800">Chadhava Details</h1>
            </div>

            {/* Hero banner */}
            <div className="relative h-52">
                <img src={chadhava.image} alt={chadhava.deity} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#7a1c12]/95 via-[#9b2d18]/55 to-black/25" />
                {!!chadhava.tags?.length && (
                    <span className="absolute top-3 left-3 bg-amber-400 text-amber-950 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                        {chadhava.tags[0]}
                    </span>
                )}
                <span className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/45 backdrop-blur-sm text-white text-[12px] font-bold px-2 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {chadhava.rating.toFixed(1)}
                </span>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h2 className="text-[26px] font-bold leading-none" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        {chadhava.deity}
                    </h2>
                    {chadhava.deityHindi && <p className="text-[13px] text-rose-100 mt-1">{chadhava.deityHindi}</p>}
                </div>
            </div>

            {/* Info card */}
            <div className="px-4 -mt-4 relative z-10">
                <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-[13px] text-stone-700">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="font-semibold">{chadhava.templeName}{chadhava.templeLocation ? `, ${chadhava.templeLocation}` : ""}</span>
                    </div>
                    {chadhava.offeringDay && (
                        <div className="flex items-center gap-2 text-[13px] text-stone-600">
                            <CalendarDays className="w-4 h-4 text-orange-500 shrink-0" />
                            <span>{chadhava.offeringDay}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Select Seva */}
            <div className="px-4 pt-5">
                <h3 className="text-[20px] font-bold text-stone-900">Select Seva Offering</h3>
                <p className="text-[12.5px] text-stone-500 mt-0.5">Chadhava offered in your Name &amp; Gotra</p>
            </div>

            {chadhava.sections.map((section) => (
                <div key={section.sectionName} className="px-4 pt-4">
                    <h4 className="flex items-center gap-1.5 text-[14px] font-bold text-orange-600 mb-2.5">
                        <span>🌸</span> {section.sectionName}
                    </h4>
                    <div className="space-y-3">
                        {section.items.filter((i) => i.isActive !== false).map((item) => {
                            const count = qty[item.code] || 0;
                            return (
                                <div key={item.code} className={`bg-white rounded-2xl border p-3 flex gap-3 transition-colors ${count > 0 ? "border-orange-300" : "border-stone-200"}`}>
                                    <img src={item.itemImage} alt={item.itemName} loading="lazy" className="w-20 h-20 rounded-xl object-cover bg-rose-50 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h5 className="text-[14px] font-bold text-stone-800">{item.itemName}</h5>
                                            {item.popular && (
                                                <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">★ Popular</span>
                                            )}
                                        </div>
                                        <p className="text-[11.5px] text-stone-500 mt-0.5 leading-snug line-clamp-2">{item.itemDesc}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[15px] font-bold text-stone-900">₹{item.itemPrice.toLocaleString("en-IN")}</span>
                                            {count === 0 ? (
                                                <button
                                                    onClick={() => setItemQty(item.code, 1)}
                                                    className="bg-orange-500 text-white text-[12px] font-bold px-5 py-1.5 rounded-lg active:scale-95 transition-transform"
                                                >
                                                    ADD
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2.5 border border-orange-300 rounded-lg px-1.5 py-1">
                                                    <button onClick={() => setItemQty(item.code, count - 1)} className="w-5 h-5 flex items-center justify-center text-orange-600 active:scale-90">
                                                        <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                                                    </button>
                                                    <span className="text-[13px] font-bold text-stone-800 w-4 text-center">{count}</span>
                                                    <button onClick={() => setItemQty(item.code, count + 1)} className="w-5 h-5 flex items-center justify-center text-orange-600 active:scale-90">
                                                        <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Prasad add-on */}
            {chadhava.prasad?.enabled && (
                <div className="px-4 pt-4">
                    <button
                        onClick={() => setAddPrasad((v) => !v)}
                        className={`w-full text-left bg-white rounded-2xl border-2 p-3 flex gap-3 items-center transition-colors ${addPrasad ? "border-emerald-400 bg-emerald-50/40" : "border-dashed border-amber-300"}`}
                    >
                        <span className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <Gift className="w-5 h-5 text-amber-600" />
                        </span>
                        <div className="flex-1 min-w-0">
                            <h5 className="text-[13.5px] font-bold text-stone-800">{chadhava.prasad.name}</h5>
                            <p className="text-[11px] text-stone-500 leading-snug">{chadhava.prasad.desc}</p>
                        </div>
                        <span className={`flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-lg ${addPrasad ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                            {addPrasad ? <><Check className="w-3.5 h-3.5" strokeWidth={3} /> Added</> : `Add ₹${chadhava.prasad.price}`}
                        </span>
                    </button>
                </div>
            )}

            {/* Trust */}
            <div className="px-4 pt-4">
                <div className="bg-white border border-stone-100 rounded-xl py-3 px-4 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-stone-500 leading-snug">
                        You'll receive a photo/video of your chadhava being offered. 100% secure payment & refund guarantee if the ritual is not performed.
                    </p>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-stone-100 px-4 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="leading-none">
                    <span className="text-[11px] text-stone-500 font-semibold">Sevas Selected: {sevasSelected}</span>
                    <p className="text-[20px] font-bold text-rose-600 mt-0.5">₹{grandTotal.toLocaleString("en-IN")}</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    disabled={sevasSelected === 0}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-orange-200/70 active:scale-95 transition-transform disabled:opacity-50 disabled:shadow-none"
                >
                    Proceed Seva ›
                </button>
            </div>

            <ChadhavaBookingModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                chadhava={chadhava}
                selections={selections}
                addPrasad={addPrasad}
                prasadPrice={prasadPrice}
            />
        </div>
    );
}
