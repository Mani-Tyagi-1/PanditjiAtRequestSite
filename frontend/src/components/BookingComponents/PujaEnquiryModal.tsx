import { useState, useEffect } from "react";
import API_URL from "../../utils/apiConfig";
import { X } from "lucide-react";

const INPUT_CLASS =
    "mt-1 w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-stone-50 transition-colors";
const LABEL_CLASS = "text-xs font-semibold text-stone-500 uppercase tracking-wide";

interface PujaEnquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    pujaId: string;
    pujaName: string;
    prefillName?: string;
    prefillPhone?: string;
    prefillCity?: string;
}

export default function PujaEnquiryModal({
    isOpen,
    onClose,
    pujaId,
    pujaName,
    prefillName = "",
    prefillPhone = "",
    prefillCity = "",
}: PujaEnquiryModalProps) {
    const [form, setForm] = useState({
        fullName: prefillName,
        phone: prefillPhone,
        astrologerAdvised: "" as "yes" | "no" | "",
        timing: "" as "immediately" | "within7days" | "justenquiring" | "",
        city: prefillCity,
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setForm({
                fullName: prefillName || "",
                phone: prefillPhone || "",
                astrologerAdvised: "",
                timing: "",
                city: prefillCity || "",
            });
            setSubmitted(false);
            setError("");
        }
    }, [isOpen, prefillName, prefillPhone, prefillCity]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.fullName || !form.phone || !form.astrologerAdvised || !form.timing || !form.city) {
            setError("Please fill in all fields.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            const apiUrl = API_URL;
            const timingLabel =
                form.timing === "immediately" ? "Immediately" :
                form.timing === "within7days" ? "Within 7 Days" :
                "Just Enquiring";
            const res = await fetch(`${apiUrl}/puja-enquiries`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: form.fullName,
                    phone: form.phone,
                    astrologerAdvised: form.astrologerAdvised,
                    timing: timingLabel,
                    city: form.city,
                    pujaId,
                    pujaName,
                }),
            });
            if (!res.ok) throw new Error("Failed");
            setSubmitted(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden"
                style={{ maxHeight: "92vh", animation: "slideUp 0.32s cubic-bezier(0.32,0.72,0,1) both" }}
                onClick={(e) => e.stopPropagation()}
            >
                <style>{`
                    @keyframes slideUp {
                        from { transform: translateY(100%); opacity: 0.6; }
                        to   { transform: translateY(0);    opacity: 1; }
                    }
                `}</style>

                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 pt-5 pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 pr-3">
                            <p className="text-orange-100 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                                Quick Enquiry
                            </p>
                            <h2
                                className="text-white font-extrabold leading-tight"
                                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px" }}
                            >
                                {pujaName || "Puja Enquiry"}
                            </h2>
                            <p className="text-orange-100 text-xs mt-1">
                                We'll reach out to help you arrange this puja
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white shrink-0 mt-0.5"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 100px)" }}>
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3
                                className="text-stone-800 font-bold text-lg"
                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                            >
                                Enquiry Submitted! 🙏
                            </h3>
                            <p className="text-stone-500 text-sm mt-1">
                                Our pandit will contact you shortly to help arrange your puja.
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-6 bg-orange-500 text-white font-semibold px-8 py-3 rounded-2xl text-sm"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className={LABEL_CLASS}>
                                    Full Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    value={form.fullName}
                                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                                    placeholder="Your full name"
                                    className={INPUT_CLASS}
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className={LABEL_CLASS}>
                                    Phone Number <span className="text-red-400">*</span>
                                </label>
                                <input
                                    value={form.phone}
                                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                    placeholder="10-digit mobile number"
                                    inputMode="numeric"
                                    maxLength={10}
                                    className={INPUT_CLASS}
                                />
                            </div>

                            {/* Astrologer Advised */}
                            <div>
                                <label className={LABEL_CLASS}>
                                    Has an astrologer advised {pujaName || "this Pooja"}?{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <div className="mt-2 flex gap-3">
                                    {(["yes", "no"] as const).map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, astrologerAdvised: val }))}
                                            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-150 ${
                                                form.astrologerAdvised === val
                                                    ? "border-orange-500 bg-orange-50 text-orange-600"
                                                    : "border-stone-200 bg-stone-50 text-stone-500"
                                            }`}
                                        >
                                            {val === "yes" ? "✓ Yes" : "✗ No"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Timing */}
                            <div>
                                <label className={LABEL_CLASS}>
                                    When do you want to do the Pooja?{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <div className="mt-2 flex flex-col gap-2">
                                    {(
                                        [
                                            { val: "immediately", label: "⚡ Immediately" },
                                            { val: "within7days", label: "📅 Within 7 Days" },
                                            { val: "justenquiring", label: "🔍 Just Enquiring" },
                                        ] as const
                                    ).map(({ val, label }) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, timing: val }))}
                                            className={`w-full py-2.5 px-4 rounded-xl border-2 text-sm font-semibold text-left transition-all duration-150 ${
                                                form.timing === val
                                                    ? "border-orange-500 bg-orange-50 text-orange-600"
                                                    : "border-stone-200 bg-stone-50 text-stone-500"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* City */}
                            <div>
                                <label className={LABEL_CLASS}>
                                    City <span className="text-red-400">*</span>
                                </label>
                                <input
                                    value={form.city}
                                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                                    placeholder="Enter your city"
                                    className={INPUT_CLASS}
                                />
                            </div>

                            {error && (
                                <p className="text-red-500 text-xs font-medium">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-200 transition-all duration-200 text-sm disabled:opacity-60 mb-2"
                            >
                                {submitting ? "Submitting..." : "Submit Enquiry 🙏"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
