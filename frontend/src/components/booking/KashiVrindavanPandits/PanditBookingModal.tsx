import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, MapPin, Check, ChevronLeft, ChevronRight, Star,
    BadgeCheck, Clock, ShieldCheck, Home, CalendarDays,
} from "lucide-react";
import type { HolyPandit, PanditService } from "./kashiVrindavanData";
import API_URL from "../../../utils/apiConfig";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    pandit: HolyPandit | null;
}

type Step = "service" | "details" | "review" | "success";
const STEP_ORDER: Step[] = ["service", "details", "review"];

const INPUT =
    "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all";
const LABEL = "text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block";

export default function PanditBookingModal({ isOpen, onClose, pandit }: Props) {
    const [step, setStep] = useState<Step>("service");
    const [selected, setSelected] = useState<PanditService | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        name: "", gotra: "", phone: "", date: "", address: "", city: "", wish: "",
    });

    const minDate = new Date(new Date().setDate(new Date().getDate() + 1))
        .toISOString()
        .split("T")[0];

    useEffect(() => {
        if (isOpen && pandit) {
            setStep("service");
            setSelected(pandit.services.find((s) => s.popular) || pandit.services[0]);
            setSubmitting(false);
            setError("");
            setForm({ name: "", gotra: "", phone: "", date: "", address: "", city: "", wish: "" });
        }
    }, [isOpen, pandit]);

    useEffect(() => {
        if (isOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = prev; };
        }
    }, [isOpen]);

    if (!pandit) return null;

    const stepIndex = STEP_ORDER.indexOf(step);
    const amount = selected?.price || 0;

    const goNext = () => {
        setError("");
        if (step === "service") {
            if (!selected) { setError("Please select a ritual."); return; }
            setStep("details");
        } else if (step === "details") {
            if (!form.name.trim()) { setError("Please enter your name."); return; }
            if (form.phone.replace(/\D/g, "").length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
            if (!form.date) { setError("Please pick a date for the ritual."); return; }
            if (!form.address.trim() || !form.city.trim()) { setError("Please enter the address where the ritual will be performed."); return; }
            setStep("review");
        }
    };

    const goBack = () => {
        setError("");
        if (step === "details") setStep("service");
        else if (step === "review") setStep("details");
    };

    const handleConfirm = async () => {
        if (!selected) return;
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch(`${API_URL}/holy-pandit-bookings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    panditSlug: pandit.id,
                    panditName: pandit.name,
                    panditCity: pandit.city,
                    serviceId: selected.id,
                    serviceName: selected.name,
                    amount: selected.price,
                    bhaktName: form.name.trim(),
                    gotra: form.gotra.trim(),
                    phone: form.phone.replace(/\D/g, ""),
                    ritualDate: form.date,
                    address: form.address.trim(),
                    city: form.city.trim(),
                    wish: form.wish.trim(),
                }),
            });
            if (!res.ok) throw new Error("Failed");
            if (window.fbq) {
                window.fbq("track", "Purchase", {
                    content_name: `${pandit.name} - ${selected.name}`,
                    content_type: "holy_pandit_booking",
                    value: selected.price,
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
                <div className="fixed inset-0 z-[200] flex items-end justify-center kvp-modal md:items-center md:p-6">
                    <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                        .kvp-modal { font-family: 'DM Sans', sans-serif; }
                        .kvp-serif { font-family: 'Cormorant Garamond', serif; }
                    `}</style>

                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 32, stiffness: 320 }}
                        className="relative w-full max-w-md bg-[#FAFAFF] rounded-t-3xl flex flex-col overflow-hidden md:rounded-3xl md:max-w-lg lg:max-w-xl md:shadow-2xl md:shadow-indigo-950/40"
                        style={{ maxHeight: "94vh" }}
                    >
                        {/* ── Header ── */}
                        <div className="relative shrink-0 bg-gradient-to-br from-indigo-600 to-violet-600 px-5 pt-5 pb-4 md:px-7 md:pt-6 md:pb-5">
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/40 md:hidden" />
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white active:scale-95 transition-transform cursor-pointer md:transition-all md:hover:bg-white/30"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <img src={pandit.image} alt={pandit.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/40" />
                                <div className="text-white">
                                    <div className="flex items-center gap-1 text-indigo-100">
                                        <MapPin className="w-3 h-3" />
                                        <span className="text-[10.5px] font-bold uppercase tracking-wide">{pandit.city}</span>
                                        {pandit.verified && <BadgeCheck className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <h2 className="kvp-serif font-bold leading-none mt-0.5" style={{ fontSize: "23px" }}>{pandit.name}</h2>
                                    <div className="flex items-center gap-2 mt-1 text-[11px] text-indigo-100 font-medium">
                                        <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-300 text-amber-300" /> {pandit.rating.toFixed(1)}</span>
                                        <span>•</span>
                                        <span>{pandit.experienceYears} yrs exp</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Step indicator ── */}
                        {step !== "success" && (
                            <div className="flex items-center gap-1.5 px-5 py-3 shrink-0 md:px-7">
                                {STEP_ORDER.map((s, i) => (
                                    <div key={s} className="flex-1 flex items-center gap-1.5">
                                        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? "bg-indigo-600" : "bg-stone-200"}`} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Content ── */}
                        <div className="flex-1 overflow-y-auto px-5 pb-3 md:px-7 md:pb-4">
                            <AnimatePresence mode="wait">
                                {/* STEP 1 — SERVICE */}
                                {step === "service" && (
                                    <motion.div key="service" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                                        <SectionTitle eyebrow="Step 1" title="Choose the Ritual" />
                                        <p className="text-[12px] text-stone-500 mt-1 mb-3">
                                            Pandit ji will travel from {pandit.city} to perform the ritual at your home. 🙏
                                        </p>
                                        <div className="space-y-3">
                                            {pandit.services.map((svc) => {
                                                const active = selected?.id === svc.id;
                                                return (
                                                    <button
                                                        key={svc.id}
                                                        onClick={() => setSelected(svc)}
                                                        className={`relative w-full text-left rounded-2xl border-2 p-3.5 transition-all cursor-pointer ${active ? "border-indigo-500 bg-indigo-50/60 shadow-md shadow-indigo-100" : "border-stone-200 bg-white md:hover:border-indigo-300 md:hover:bg-indigo-50/30"}`}
                                                    >
                                                        {svc.popular && (
                                                            <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">★ Most Booked</span>
                                                        )}
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-indigo-500 bg-indigo-500" : "border-stone-300"}`}>
                                                                        {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                                    </span>
                                                                    <h4 className="font-bold text-stone-800 text-[14px]">{svc.name}</h4>
                                                                </div>
                                                                <p className="text-[12px] text-stone-500 mt-1 ml-6.5 leading-snug">{svc.description}</p>
                                                                <p className="text-[11px] text-stone-400 mt-1 ml-6.5 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" /> approx {svc.durationHours} hrs
                                                                </p>
                                                            </div>
                                                            <span className="font-bold text-stone-900 text-[16px] shrink-0">₹{svc.price.toLocaleString("en-IN")}</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                            {[
                                                { icon: Home, label: "At Your Home" },
                                                { icon: ShieldCheck, label: "Verified Pandit" },
                                                { icon: Check, label: "Samagri Guidance" },
                                            ].map(({ icon: Icon, label }) => (
                                                <div key={label} className="bg-white border border-stone-100 rounded-xl py-2.5 flex flex-col items-center gap-1">
                                                    <Icon className="w-4 h-4 text-indigo-500" />
                                                    <span className="text-[9.5px] font-semibold text-stone-500 leading-tight">{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 2 — DETAILS */}
                                {step === "details" && (
                                    <motion.div key="details" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                                        <SectionTitle eyebrow="Step 2" title="Your Details" />
                                        <div className="space-y-3.5 mt-3">
                                            <div>
                                                <label className={LABEL}>Your Full Name *</label>
                                                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name for the sankalp" className={INPUT} />
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <label className={LABEL}>Gotra</label>
                                                    <input value={form.gotra} onChange={(e) => setForm((f) => ({ ...f, gotra: e.target.value }))} placeholder="e.g. Kashyap" className={INPUT} />
                                                </div>
                                                <div className="flex-1">
                                                    <label className={LABEL}>Mobile *</label>
                                                    <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="10-digit" inputMode="numeric" className={INPUT} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={LABEL}>Preferred Date *</label>
                                                <input type="date" min={minDate} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={INPUT} />
                                            </div>
                                            <div>
                                                <label className={LABEL}>Address (where ritual is performed) *</label>
                                                <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="House no., street, area" rows={2} className={`${INPUT} resize-none`} />
                                            </div>
                                            <div>
                                                <label className={LABEL}>City *</label>
                                                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Your city" className={INPUT} />
                                            </div>
                                            <div>
                                                <label className={LABEL}>Note / Special request (optional)</label>
                                                <textarea value={form.wish} onChange={(e) => setForm((f) => ({ ...f, wish: e.target.value }))} placeholder="Anything pandit ji should know…" rows={2} className={`${INPUT} resize-none`} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3 — REVIEW */}
                                {step === "review" && selected && (
                                    <motion.div key="review" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                                        <SectionTitle eyebrow="Step 3" title="Review & Confirm" />
                                        <div className="mt-3 bg-white rounded-2xl border border-stone-100 overflow-hidden">
                                            <Row label="Pandit" value={`${pandit.name} (${pandit.city})`} />
                                            <Row label="Ritual" value={`${selected.name} · approx ${selected.durationHours} hrs`} />
                                            <Row label="Date" value={form.date} />
                                            <Row label="Devotee" value={form.name + (form.gotra ? ` · ${form.gotra} gotra` : "")} />
                                            <Row label="Contact" value={`+91 ${form.phone}`} />
                                            <Row label="Venue" value={`${form.address}, ${form.city}`} />
                                            {form.wish && <Row label="Note" value={form.wish} />}
                                        </div>

                                        <div className="mt-3 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-4">
                                            <div className="flex items-center justify-between text-[13px] text-stone-600">
                                                <span>Dakshina (ritual)</span>
                                                <span>₹{amount.toLocaleString("en-IN")}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[13px] text-emerald-600 mt-1">
                                                <span>Travel from {pandit.city}</span>
                                                <span className="font-semibold">Included</span>
                                            </div>
                                            <div className="my-2.5 h-px bg-indigo-100" />
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-stone-800">Total Payable</span>
                                                <span className="font-bold text-indigo-600 text-[20px]">₹{amount.toLocaleString("en-IN")}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-start gap-2 text-[11px] text-stone-500 bg-white border border-stone-100 rounded-xl p-3">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Pandit ji will call to confirm the muhurat & samagri list. No payment now — pay after the booking is confirmed.</span>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SUCCESS */}
                                {step === "success" && (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-10 px-2">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                                            className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-200">
                                            <Check className="w-10 h-10 text-white" strokeWidth={3} />
                                        </motion.div>
                                        <h3 className="kvp-serif font-bold text-stone-800 mt-5" style={{ fontSize: "26px" }}>Booking Requested! 🙏</h3>
                                        <p className="text-[13px] text-stone-500 mt-2 max-w-[280px] leading-relaxed">
                                            <span className="font-semibold text-stone-700">{pandit.name}</span> from {pandit.city} will perform your <span className="font-semibold text-stone-700">{selected?.name}</span> on <span className="font-semibold text-stone-700">{form.date}</span>. We'll WhatsApp confirmation on <span className="font-semibold text-stone-700">+91 {form.phone}</span>.
                                        </p>
                                        <div className="mt-5 w-full bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0">
                                                <CalendarDays className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[12px] font-bold text-stone-700">{selected?.name}</p>
                                                <p className="text-[11px] text-stone-500">{form.date} · {form.city}</p>
                                            </div>
                                        </div>
                                        <button onClick={onClose} className="mt-6 w-full bg-stone-800 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform cursor-pointer md:transition-all md:hover:bg-stone-700">Done</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {error && step !== "success" && (
                                <p className="text-red-500 text-[12px] font-semibold mt-3 text-center">{error}</p>
                            )}
                        </div>

                        {/* ── Sticky footer ── */}
                        {step !== "success" && (
                            <div className="shrink-0 bg-white/90 backdrop-blur-sm border-t border-stone-100 px-5 py-3.5 flex items-center gap-3 md:px-7 md:py-4">
                                {step !== "service" && (
                                    <button onClick={goBack} className="w-12 h-12 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 active:scale-95 transition-transform shrink-0 cursor-pointer md:transition-all md:hover:bg-stone-50 md:hover:text-stone-700">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                )}
                                <div className="flex-1 flex items-center justify-between">
                                    <div className="leading-none">
                                        <span className="text-[10px] text-stone-400 font-semibold uppercase">Total</span>
                                        <p className="text-[18px] font-bold text-stone-900">₹{amount.toLocaleString("en-IN")}</p>
                                    </div>
                                    {step === "review" ? (
                                        <button onClick={handleConfirm} disabled={submitting} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-transform disabled:opacity-60 cursor-pointer md:transition-all md:hover:shadow-xl md:hover:brightness-110">
                                            {submitting ? (
                                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Booking…</>
                                            ) : (
                                                <>Confirm Booking <Check className="w-4 h-4" strokeWidth={3} /></>
                                            )}
                                        </button>
                                    ) : (
                                        <button onClick={goNext} className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-transform cursor-pointer md:transition-all md:hover:shadow-xl md:hover:brightness-110">
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

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
    return (
        <div>
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-indigo-500">{eyebrow}</span>
            <h3 className="kvp-serif font-bold text-stone-800 leading-tight" style={{ fontSize: "23px" }}>{title}</h3>
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
