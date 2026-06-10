import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, MapPin, Check, ChevronLeft, ChevronRight, Star,
    ShieldCheck, Gift, Sparkles, Plus, Flower2,
} from "lucide-react";
import {
    PRASAD_BOX_UPSELL,
    type Chadhava,
    type ChadhavaOffering,
    type AddOnProduct,
} from "./chadhavaData";
import API_URL from "../../../utils/apiConfig";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    chadhava: Chadhava | null;
}

type Step = "offering" | "details" | "review" | "success";
const STEP_ORDER: Step[] = ["offering", "details", "review"];

const INPUT =
    "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all";
const LABEL = "text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block";

export default function ChadhavaBookingModal({ isOpen, onClose, chadhava }: Props) {
    const [step, setStep] = useState<Step>("offering");
    const [selected, setSelected] = useState<ChadhavaOffering | null>(null);
    const [addPrasad, setAddPrasad] = useState(false);
    const [addSpiritual, setAddSpiritual] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", gotra: "", phone: "", wish: "" });

    useEffect(() => {
        if (isOpen && chadhava) {
            setStep("offering");
            setSelected(chadhava.offerings.find((o) => o.popular) || chadhava.offerings[0]);
            setAddPrasad(false);
            setAddSpiritual(false);
            setSubmitting(false);
            setError("");
            setForm({ name: "", gotra: "", phone: "", wish: "" });
        }
    }, [isOpen, chadhava]);

    useEffect(() => {
        if (isOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = prev; };
        }
    }, [isOpen]);

    if (!chadhava) return null;

    const spiritualProduct = chadhava.spiritualProduct;
    const stepIndex = STEP_ORDER.indexOf(step);
    const offeringPrice = selected?.price || 0;
    const prasadPrice = addPrasad ? PRASAD_BOX_UPSELL.price : 0;
    const spiritualPrice = addSpiritual ? spiritualProduct.price : 0;
    const total = offeringPrice + prasadPrice + spiritualPrice;

    const goNext = () => {
        setError("");
        if (step === "offering") {
            if (!selected) { setError("Please select an offering."); return; }
            setStep("details");
        } else if (step === "details") {
            if (!form.name.trim()) { setError("Please enter the devotee's name."); return; }
            if (form.phone.replace(/\D/g, "").length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
            setStep("review");
        }
    };

    const goBack = () => {
        setError("");
        if (step === "details") setStep("offering");
        else if (step === "review") setStep("details");
    };

    const handleConfirm = async () => {
        if (!selected) return;
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch(`${API_URL}/chadhava-bookings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chadhavaSlug: chadhava.id,
                    deity: chadhava.deity,
                    templeName: chadhava.templeName,
                    offeringId: selected.id,
                    offeringName: selected.name,
                    offeringPrice: selected.price,
                    addPrasadBox: addPrasad,
                    addSpiritualProduct: addSpiritual,
                    spiritualProductName: spiritualProduct.name,
                    spiritualProductPrice: spiritualProduct.price,
                    devoteeName: form.name.trim(),
                    gotra: form.gotra.trim(),
                    phone: form.phone.replace(/\D/g, ""),
                    wish: form.wish.trim(),
                }),
            });
            if (!res.ok) throw new Error("Failed");
            if (window.fbq) {
                window.fbq("track", "Purchase", {
                    content_name: `Chadhava - ${chadhava.deity} - ${chadhava.templeName}`,
                    content_type: "chadhava",
                    value: total,
                    currency: "INR",
                });
            }
            setStep("success");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center cdb-modal">
                    <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                        .cdb-modal { font-family: 'DM Sans', sans-serif; }
                        .cdb-serif { font-family: 'Cormorant Garamond', serif; }
                    `}</style>

                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 32, stiffness: 320 }}
                        className="relative w-full max-w-md bg-[#FFFAF6] rounded-t-3xl flex flex-col overflow-hidden"
                        style={{ maxHeight: "94vh" }}
                    >
                        {/* ── Header ── */}
                        <div className="relative shrink-0">
                            <div className="relative h-[124px] overflow-hidden">
                                <img src={chadhava.image} alt={chadhava.templeName} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />
                            </div>
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/60" />
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-black/35 backdrop-blur-sm text-white active:scale-95 transition-transform"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                            <div className="absolute bottom-3 left-4 right-4 text-white">
                                <div className="flex items-center gap-1 text-rose-200 mb-0.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-bold uppercase tracking-wide">
                                        {chadhava.templeName} · {chadhava.templeLocation}
                                    </span>
                                </div>
                                <h2 className="cdb-serif font-bold leading-none" style={{ fontSize: "26px" }}>
                                    {chadhava.deity} <span className="text-rose-100 text-[18px]">{chadhava.deityHindi}</span>
                                </h2>
                                <div className="flex items-center gap-3 mt-1.5 text-[11px] font-medium text-white/90">
                                    <span className="flex items-center gap-1"><Flower2 className="w-3 h-3" /> Chadhava</span>
                                    <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-300 text-amber-300" /> {chadhava.rating.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Step indicator ── */}
                        {step !== "success" && (
                            <div className="flex items-center gap-1.5 px-5 py-3 shrink-0 bg-[#FFFAF6]">
                                {STEP_ORDER.map((s, i) => (
                                    <div key={s} className="flex-1 flex items-center gap-1.5">
                                        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? "bg-rose-500" : "bg-stone-200"}`} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Content ── */}
                        <div className="flex-1 overflow-y-auto px-5 pb-3">
                            <AnimatePresence mode="wait">
                                {/* STEP 1 — OFFERING */}
                                {step === "offering" && (
                                    <motion.div key="offering" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                                        <SectionTitle eyebrow="Step 1" title="Choose your Chadhava" />
                                        <div className="grid grid-cols-2 gap-2.5 mt-3">
                                            {chadhava.offerings.map((o) => {
                                                const active = selected?.id === o.id;
                                                return (
                                                    <button
                                                        key={o.id}
                                                        onClick={() => setSelected(o)}
                                                        className={`relative text-left rounded-2xl border-2 p-3 transition-all ${active ? "border-rose-500 bg-rose-50/60 shadow-md shadow-rose-100" : "border-stone-200 bg-white"}`}
                                                    >
                                                        {o.popular && (
                                                            <span className="absolute -top-2.5 right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">★ Popular</span>
                                                        )}
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-2xl">{o.icon}</span>
                                                            <span className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${active ? "border-rose-500 bg-rose-500" : "border-stone-300"}`}>
                                                                {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-stone-800 text-[13.5px] mt-1.5">{o.name}</h4>
                                                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{o.description}</p>
                                                        <p className="font-extrabold text-stone-900 text-[15px] mt-1.5">₹{o.price.toLocaleString("en-IN")}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                            {[
                                                { icon: Flower2, label: "Offered in Temple" },
                                                { icon: Gift, label: "Prasad at Home" },
                                                { icon: ShieldCheck, label: "Photo / Video Proof" },
                                            ].map(({ icon: Icon, label }) => (
                                                <div key={label} className="bg-white border border-stone-100 rounded-xl py-2.5 flex flex-col items-center gap-1">
                                                    <Icon className="w-4 h-4 text-rose-500" />
                                                    <span className="text-[9.5px] font-semibold text-stone-500 leading-tight">{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 2 — DETAILS */}
                                {step === "details" && (
                                    <motion.div key="details" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                                        <SectionTitle eyebrow="Step 2" title="Sankalp Details" />
                                        <p className="text-[12px] text-stone-500 mt-1 mb-4">
                                            The chadhava will be offered to {chadhava.deity} in this name & gotra. 🙏
                                        </p>
                                        <div className="space-y-3.5">
                                            <div>
                                                <label className={LABEL}>Devotee's Full Name *</label>
                                                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name for the sankalp" className={INPUT} />
                                            </div>
                                            <div>
                                                <label className={LABEL}>Gotra</label>
                                                <input value={form.gotra} onChange={(e) => setForm((f) => ({ ...f, gotra: e.target.value }))} placeholder="e.g. Kashyap" className={INPUT} />
                                            </div>
                                            <div>
                                                <label className={LABEL}>Mobile Number *</label>
                                                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="10-digit WhatsApp number" inputMode="numeric" className={INPUT} />
                                                <p className="text-[10.5px] text-stone-400 mt-1.5">Offering proof & prasad updates are sent here.</p>
                                            </div>
                                            <div>
                                                <label className={LABEL}>Your Wish / Prayer (optional)</label>
                                                <textarea value={form.wish} onChange={(e) => setForm((f) => ({ ...f, wish: e.target.value }))} placeholder="Share the intention behind this offering…" rows={2} className={`${INPUT} resize-none`} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3 — REVIEW (with prasad-box upsell) */}
                                {step === "review" && selected && (
                                    <motion.div key="review" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                                        <SectionTitle eyebrow="Step 3" title="Review & Confirm" />
                                        <div className="mt-3 bg-white rounded-2xl border border-stone-100 overflow-hidden">
                                            <Row label="Chadhava" value={`${selected.icon} ${selected.name}`} />
                                            <Row label="Temple" value={`${chadhava.templeName}, ${chadhava.templeLocation}`} />
                                            <Row label="Deity" value={`${chadhava.deity} (${chadhava.deityHindi})`} />
                                            <Row label="Devotee" value={form.name + (form.gotra ? ` · ${form.gotra} gotra` : "")} />
                                            <Row label="Contact" value={`+91 ${form.phone}`} />
                                            {form.wish && <Row label="Wish" value={form.wish} />}
                                        </div>

                                        {/* ── UPSELLS ── */}
                                        <div className="mt-4">
                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                <span className="text-[11px] font-extrabold uppercase tracking-wide text-amber-600">
                                                    Complete your offering
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                <UpsellCard
                                                    product={PRASAD_BOX_UPSELL}
                                                    added={addPrasad}
                                                    onToggle={() => setAddPrasad((v) => !v)}
                                                    variant="amber"
                                                    ribbon="Recommended"
                                                    socialProof="🔥 82% of devotees add a prasad box with their chadhava"
                                                />
                                                <UpsellCard
                                                    product={spiritualProduct}
                                                    added={addSpiritual}
                                                    onToggle={() => setAddSpiritual((v) => !v)}
                                                    variant="violet"
                                                    ribbon="Devotee Favourite"
                                                    socialProof={`🙏 A blessed keepsake of ${chadhava.deity} for your home mandir`}
                                                />
                                            </div>
                                        </div>

                                        {/* Price summary */}
                                        <div className="mt-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-100 p-4">
                                            <div className="flex items-center justify-between text-[13px] text-stone-600">
                                                <span>{selected.name}</span>
                                                <span>₹{offeringPrice.toLocaleString("en-IN")}</span>
                                            </div>
                                            <AnimatePresence>
                                                {addPrasad && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                                        className="flex items-center justify-between text-[13px] text-stone-600 mt-1 overflow-hidden"
                                                    >
                                                        <span>{PRASAD_BOX_UPSELL.name}</span>
                                                        <span>₹{PRASAD_BOX_UPSELL.price}</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <AnimatePresence>
                                                {addSpiritual && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                                        className="flex items-center justify-between text-[13px] text-stone-600 mt-1 overflow-hidden"
                                                    >
                                                        <span>{spiritualProduct.name}</span>
                                                        <span>₹{spiritualProduct.price}</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <div className="my-2.5 h-px bg-rose-100" />
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-stone-800">Total Payable</span>
                                                <span className="font-extrabold text-rose-600 text-[20px]">₹{total.toLocaleString("en-IN")}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-start gap-2 text-[11px] text-stone-500 bg-white border border-stone-100 rounded-xl p-3">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>You'll receive a photo/video of your chadhava being offered. 100% secure & fully refundable if not performed.</span>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SUCCESS */}
                                {step === "success" && (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-10 px-2">
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                                            className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-200"
                                        >
                                            <Check className="w-10 h-10 text-white" strokeWidth={3} />
                                        </motion.div>
                                        <h3 className="cdb-serif font-bold text-stone-800 mt-5" style={{ fontSize: "26px" }}>
                                            Chadhava Booked! 🙏
                                        </h3>
                                        <p className="text-[13px] text-stone-500 mt-2 max-w-[280px] leading-relaxed">
                                            Your <span className="font-semibold text-stone-700">{selected?.name}</span> will be offered to{" "}
                                            <span className="font-semibold text-stone-700">{chadhava.deity}</span>.
                                            {(addPrasad || addSpiritual) && ` Your ${[addPrasad && "prasad box", addSpiritual && spiritualProduct.name].filter(Boolean).join(" & ")} will be dispatched after the offering.`} We'll WhatsApp the proof on{" "}
                                            <span className="font-semibold text-stone-700">+91 {form.phone}</span>.
                                        </p>
                                        <button onClick={onClose} className="mt-6 w-full bg-stone-800 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform">
                                            Done
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {error && step !== "success" && (
                                <p className="text-red-500 text-[12px] font-semibold mt-3 text-center">{error}</p>
                            )}
                        </div>

                        {/* ── Sticky footer ── */}
                        {step !== "success" && (
                            <div className="shrink-0 bg-white/90 backdrop-blur-sm border-t border-stone-100 px-5 py-3.5 flex items-center gap-3">
                                {step !== "offering" && (
                                    <button onClick={goBack} className="w-12 h-12 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 active:scale-95 transition-transform shrink-0">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                )}
                                <div className="flex-1 flex items-center justify-between">
                                    <div className="leading-none">
                                        <span className="text-[10px] text-stone-400 font-semibold uppercase">Total</span>
                                        <p className="text-[18px] font-extrabold text-stone-900">₹{total.toLocaleString("en-IN")}</p>
                                    </div>
                                    {step === "review" ? (
                                        <button onClick={handleConfirm} disabled={submitting} className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-transform disabled:opacity-60">
                                            {submitting ? (
                                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Confirming…</>
                                            ) : (
                                                <>Confirm & Offer <Check className="w-4 h-4" strokeWidth={3} /></>
                                            )}
                                        </button>
                                    ) : (
                                        <button onClick={goNext} className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-transform">
                                            Continue <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Reusable upsell product card (prasad box / deity keepsake)
const UPSELL_VARIANTS = {
    amber: {
        active: "border-amber-400 bg-amber-50/70 shadow-md shadow-amber-100",
        ribbon: "from-amber-400 to-yellow-500 text-amber-950",
        imgBorder: "border-amber-100",
        chip: "text-amber-700 border-amber-100",
        addBtn: "bg-amber-500",
    },
    violet: {
        active: "border-violet-400 bg-violet-50/70 shadow-md shadow-violet-100",
        ribbon: "from-violet-500 to-purple-500 text-white",
        imgBorder: "border-violet-100",
        chip: "text-violet-700 border-violet-100",
        addBtn: "bg-violet-500",
    },
} as const;

function UpsellCard({
    product, added, onToggle, variant, ribbon, socialProof,
}: {
    product: AddOnProduct;
    added: boolean;
    onToggle: () => void;
    variant: keyof typeof UPSELL_VARIANTS;
    ribbon: string;
    socialProof: string;
}) {
    const v = UPSELL_VARIANTS[variant];
    return (
        <motion.button
            type="button"
            onClick={onToggle}
            whileTap={{ scale: 0.99 }}
            className={`relative w-full text-left rounded-2xl border-2 p-3 transition-all overflow-hidden ${added ? v.active : "border-stone-200 bg-white"}`}
        >
            <span className={`absolute top-0 right-0 bg-gradient-to-l ${v.ribbon} text-[9px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wide`}>
                {ribbon}
            </span>

            <div className="flex gap-3">
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className={`w-[78px] h-[78px] rounded-xl object-cover shrink-0 border ${v.imgBorder}`}
                />
                <div className="flex-1 min-w-0 pt-0.5">
                    <h4 className="font-bold text-stone-800 text-[14px] leading-tight pr-20">{product.name}</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{product.tagline}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[15px] font-extrabold text-stone-900">₹{product.price}</span>
                        <span className="text-[12px] text-stone-400 line-through">₹{product.originalPrice}</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            Save ₹{product.originalPrice - product.price}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2.5">
                {product.items.map((item) => (
                    <span key={item} className={`text-[10px] font-semibold bg-white border px-2 py-0.5 rounded-full ${v.chip}`}>
                        {item}
                    </span>
                ))}
            </div>

            <div className={`mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-bold transition-colors ${added ? "bg-emerald-500 text-white" : `${v.addBtn} text-white`}`}>
                {added ? (
                    <><Check className="w-4 h-4" strokeWidth={3} /> Added to your booking</>
                ) : (
                    <><Plus className="w-4 h-4" strokeWidth={3} /> Add · ₹{product.price}</>
                )}
            </div>
            <p className="text-[10px] text-stone-400 text-center mt-1.5">{socialProof}</p>
        </motion.button>
    );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
    return (
        <div>
            <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-rose-500">{eyebrow}</span>
            <h3 className="cdb-serif font-bold text-stone-800 leading-tight" style={{ fontSize: "23px" }}>{title}</h3>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3 px-4 py-2.5 border-b border-stone-50 last:border-0">
            <span className="text-[11.5px] font-semibold text-stone-400 uppercase tracking-wide shrink-0">{label}</span>
            <span className="text-[12.5px] font-medium text-stone-700 text-right">{value}</span>
        </div>
    );
}
