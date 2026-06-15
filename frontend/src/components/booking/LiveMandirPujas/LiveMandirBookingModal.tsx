import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, MapPin, Clock, Check, ChevronLeft, ChevronRight,
    Star, ShieldCheck, Video, Gift, CalendarDays,
} from "lucide-react";
import type { LiveMandirPuja, LiveMandirPackage } from "./liveMandirData";
import API_URL from "../../../utils/apiConfig";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    puja: LiveMandirPuja | null;
}

type Step = "package" | "details" | "review" | "success";

const STEP_ORDER: Step[] = ["package", "details", "review"];

const INPUT =
    "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all";
const LABEL = "text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block";

export default function LiveMandirBookingModal({ isOpen, onClose, puja }: Props) {
    const [step, setStep] = useState<Step>("package");
    const [selectedPkg, setSelectedPkg] = useState<LiveMandirPackage | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", gotra: "", phone: "", members: "", wish: "" });

    // Reset whenever a new puja is opened
    useEffect(() => {
        if (isOpen && puja) {
            setStep("package");
            setSelectedPkg(puja.packages.find((p) => p.popular) || puja.packages[0]);
            setSubmitting(false);
            setError("");
            setForm({ name: "", gotra: "", phone: "", members: "", wish: "" });
        }
    }, [isOpen, puja]);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = prev; };
        }
    }, [isOpen]);

    if (!puja) return null;

    const stepIndex = STEP_ORDER.indexOf(step);

    const goNext = () => {
        setError("");
        if (step === "package") {
            if (!selectedPkg) { setError("Please select a seva package."); return; }
            setStep("details");
        } else if (step === "details") {
            if (!form.name.trim()) { setError("Please enter the devotee's name."); return; }
            if (form.phone.replace(/\D/g, "").length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
            setStep("review");
        }
    };

    const goBack = () => {
        setError("");
        if (step === "details") setStep("package");
        else if (step === "review") setStep("details");
    };

    const handleConfirm = async () => {
        if (!selectedPkg) return;
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch(`${API_URL}/live-mandir-bookings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pujaSlug: puja.id,
                    pujaName: puja.pujaName,
                    templeName: puja.templeName,
                    packageId: selectedPkg.id,
                    packageName: selectedPkg.name,
                    amount: selectedPkg.price,
                    devoteeName: form.name.trim(),
                    gotra: form.gotra.trim(),
                    members: form.members.trim(),
                    phone: form.phone.replace(/\D/g, ""),
                    wish: form.wish.trim(),
                }),
            });
            if (!res.ok) throw new Error("Failed");
            if (window.fbq) {
                window.fbq("track", "Purchase", {
                    content_name: `${puja.pujaName} - ${puja.templeName}`,
                    content_type: "live_mandir_puja",
                    value: selectedPkg.price,
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
                <div className="fixed inset-0 z-[200] flex items-end justify-center lmb-modal">
                    <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                        .lmb-modal { font-family: 'DM Sans', sans-serif; }
                        .lmb-serif { font-family: 'Cormorant Garamond', serif; }
                    `}</style>

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 32, stiffness: 320 }}
                        className="relative w-full max-w-md bg-[#FFFAF3] rounded-t-3xl flex flex-col overflow-hidden"
                        style={{ maxHeight: "94vh" }}
                    >
                        {/* ── Header ── */}
                        <div className="relative shrink-0">
                            <div className="relative h-[124px] overflow-hidden">
                                <img src={puja.image} alt={puja.templeName} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />
                            </div>

                            {/* drag handle */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/60" />

                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-black/35 backdrop-blur-sm text-white active:scale-95 transition-transform"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>

                            <div className="absolute bottom-3 left-4 right-4 text-white">
                                <div className="flex items-center gap-1 text-orange-200 mb-0.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-bold uppercase tracking-wide">
                                        {puja.templeName} · {puja.templeLocation}
                                    </span>
                                </div>
                                <h2 className="lmb-serif font-bold leading-none" style={{ fontSize: "26px" }}>
                                    {puja.pujaName} <span className="text-amber-200 text-[18px]">{puja.pujaNameHindi}</span>
                                </h2>
                                <div className="flex items-center gap-3 mt-1.5 text-[11px] font-medium text-white/90">
                                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {puja.scheduledDate}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {puja.scheduledTime}</span>
                                    <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-300 text-amber-300" /> {puja.rating.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Step indicator ── */}
                        {step !== "success" && (
                            <div className="flex items-center gap-1.5 px-5 py-3 shrink-0 bg-[#FFFAF3]">
                                {STEP_ORDER.map((s, i) => (
                                    <div key={s} className="flex-1 flex items-center gap-1.5">
                                        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? "bg-orange-500" : "bg-stone-200"}`} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Scrollable content ── */}
                        <div className="flex-1 overflow-y-auto px-5 pb-3">
                            <AnimatePresence mode="wait">
                                {/* STEP 1 — PACKAGE */}
                                {step === "package" && (
                                    <motion.div key="package" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                                        <SectionTitle eyebrow="Step 1" title="Choose your Seva" />
                                        <div className="space-y-3 mt-3">
                                            {puja.packages.map((pkg) => {
                                                const active = selectedPkg?.id === pkg.id;
                                                return (
                                                    <button
                                                        key={pkg.id}
                                                        onClick={() => setSelectedPkg(pkg)}
                                                        className={`relative w-full text-left rounded-2xl border-2 p-3.5 transition-all ${active ? "border-orange-500 bg-orange-50/60 shadow-md shadow-orange-100" : "border-stone-200 bg-white"}`}
                                                    >
                                                        {pkg.popular && (
                                                            <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                                ★ Most Chosen
                                                            </span>
                                                        )}
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-orange-500 bg-orange-500" : "border-stone-300"}`}>
                                                                        {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                                    </span>
                                                                    <h4 className="font-bold text-stone-800 text-[14px]">{pkg.name}</h4>
                                                                </div>
                                                                <p className="text-[12px] text-stone-500 mt-1 ml-6.5 leading-snug">{pkg.description}</p>
                                                            </div>
                                                            <span className="font-bold text-stone-900 text-[16px] shrink-0">₹{pkg.price.toLocaleString("en-IN")}</span>
                                                        </div>
                                                        <ul className="mt-2.5 ml-6.5 space-y-1">
                                                            {pkg.perks.map((perk) => (
                                                                <li key={perk} className="flex items-center gap-1.5 text-[11.5px] text-stone-600">
                                                                    <Check className="w-3 h-3 text-emerald-500 shrink-0" strokeWidth={3} />
                                                                    {perk}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Trust strip */}
                                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                            {[
                                                { icon: Video, label: "Live HD Video" },
                                                { icon: Gift, label: "Prasad at Home" },
                                                { icon: ShieldCheck, label: "Verified Pandit" },
                                            ].map(({ icon: Icon, label }) => (
                                                <div key={label} className="bg-white border border-stone-100 rounded-xl py-2.5 flex flex-col items-center gap-1">
                                                    <Icon className="w-4 h-4 text-orange-500" />
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
                                            The puja will be performed in this name & gotra. Your sankalp is taken before the deity. 🙏
                                        </p>
                                        <div className="space-y-3.5">
                                            <div>
                                                <label className={LABEL}>Devotee's Full Name *</label>
                                                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name for the sankalp" className={INPUT} />
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <label className={LABEL}>Gotra</label>
                                                    <input value={form.gotra} onChange={(e) => setForm((f) => ({ ...f, gotra: e.target.value }))} placeholder="e.g. Kashyap" className={INPUT} />
                                                </div>
                                                <div className="flex-1">
                                                    <label className={LABEL}>Members</label>
                                                    <input value={form.members} onChange={(e) => setForm((f) => ({ ...f, members: e.target.value.replace(/\D/g, "") }))} placeholder="No. of people" inputMode="numeric" className={INPUT} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={LABEL}>Mobile Number *</label>
                                                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="10-digit WhatsApp number" inputMode="numeric" className={INPUT} />
                                                <p className="text-[10.5px] text-stone-400 mt-1.5">Live link & prasad updates are sent here.</p>
                                            </div>
                                            <div>
                                                <label className={LABEL}>Your Wish / Prayer (optional)</label>
                                                <textarea value={form.wish} onChange={(e) => setForm((f) => ({ ...f, wish: e.target.value }))} placeholder="Share the intention behind this puja…" rows={2} className={`${INPUT} resize-none`} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3 — REVIEW */}
                                {step === "review" && selectedPkg && (
                                    <motion.div key="review" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                                        <SectionTitle eyebrow="Step 3" title="Review & Confirm" />
                                        <div className="mt-3 bg-white rounded-2xl border border-stone-100 overflow-hidden">
                                            <Row label="Puja" value={`${puja.pujaName} (${puja.pujaNameHindi})`} />
                                            <Row label="Mandir" value={`${puja.templeName}, ${puja.templeLocation}`} />
                                            <Row label="Schedule" value={`${puja.scheduledDate} · ${puja.scheduledTime}`} />
                                            <Row label="Seva" value={selectedPkg.name} />
                                            <Row label="Devotee" value={form.name + (form.gotra ? ` · ${form.gotra} gotra` : "")} />
                                            <Row label="Contact" value={`+91 ${form.phone}`} />
                                            {form.wish && <Row label="Wish" value={form.wish} />}
                                        </div>

                                        {/* Price summary */}
                                        <div className="mt-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-4">
                                            <div className="flex items-center justify-between text-[13px] text-stone-600">
                                                <span>Seva amount</span>
                                                <span>₹{selectedPkg.price.toLocaleString("en-IN")}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[13px] text-emerald-600 mt-1">
                                                <span>Prasad delivery</span>
                                                <span className="font-semibold">FREE</span>
                                            </div>
                                            <div className="my-2.5 h-px bg-orange-100" />
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-stone-800">Total Payable</span>
                                                <span className="font-bold text-orange-600 text-[20px]">₹{selectedPkg.price.toLocaleString("en-IN")}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-start gap-2 text-[11px] text-stone-500 bg-white border border-stone-100 rounded-xl p-3">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>100% secure. A pandit ji will call you to confirm the muhurat before the puja. Full refund if not performed.</span>
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
                                        <h3 className="lmb-serif font-bold text-stone-800 mt-5" style={{ fontSize: "26px" }}>
                                            Booking Confirmed! 🙏
                                        </h3>
                                        <p className="text-[13px] text-stone-500 mt-2 max-w-[280px] leading-relaxed">
                                            Your <span className="font-semibold text-stone-700">{puja.pujaName}</span> at{" "}
                                            <span className="font-semibold text-stone-700">{puja.templeName}</span> is reserved. Our pandit ji will WhatsApp the live link & details on{" "}
                                            <span className="font-semibold text-stone-700">+91 {form.phone}</span> shortly.
                                        </p>
                                        <div className="mt-5 w-full bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0">
                                                <Video className="w-5 h-5 text-orange-500" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[12px] font-bold text-stone-700">Live on {puja.scheduledDate}</p>
                                                <p className="text-[11px] text-stone-500">{puja.scheduledTime} · {puja.durationMins} min · {puja.templeName}</p>
                                            </div>
                                        </div>
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
                                {step !== "package" && (
                                    <button onClick={goBack} className="w-12 h-12 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 active:scale-95 transition-transform shrink-0">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                )}
                                <div className="flex-1 flex items-center justify-between">
                                    <div className="leading-none">
                                        <span className="text-[10px] text-stone-400 font-semibold uppercase">Total</span>
                                        <p className="text-[18px] font-bold text-stone-900">₹{(selectedPkg?.price || 0).toLocaleString("en-IN")}</p>
                                    </div>
                                    {step === "review" ? (
                                        <button onClick={handleConfirm} disabled={submitting} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-transform disabled:opacity-60">
                                            {submitting ? (
                                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Confirming…</>
                                            ) : (
                                                <>Confirm Booking <Check className="w-4 h-4" strokeWidth={3} /></>
                                            )}
                                        </button>
                                    ) : (
                                        <button onClick={goNext} className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-transform">
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

// ── Small helpers ──
function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
    return (
        <div>
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-orange-500">{eyebrow}</span>
            <h3 className="lmb-serif font-bold text-stone-800 leading-tight" style={{ fontSize: "23px" }}>{title}</h3>
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
