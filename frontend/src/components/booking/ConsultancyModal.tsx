import { useState, useEffect } from "react";
import API_URL from "../../utils/apiConfig";
import { X } from "lucide-react";

const HELP_OPTIONS = [
    "Choosing the right pooja",
    "Career growth",
    "Marriage & relationships",
    "Peace at home",
    "Health concerns",
    "New home / Griha pravesh",
    "Business prosperity",
    "Other",
];

const POOJA_TYPE_OPTIONS = ["Home visit (Offline)", "Online / Video call", "No preference"];

const CALLBACK_OPTIONS = [
    "Morning (9 AM – 12 PM)",
    "Afternoon (12 PM – 4 PM)",
    "Evening (4 PM – 7 PM)",
    "Anytime",
];

const INPUT_CLASS =
    "mt-1 w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-stone-50";
const LABEL_CLASS = "text-xs font-semibold text-stone-500 uppercase tracking-wide";

interface ConsultancyModalProps {
    isOpen: boolean;
    onClose: () => void;
    prefillName?: string;
    prefillPhone?: string;
}

export default function ConsultancyModal({
    isOpen,
    onClose,
    prefillName = "",
    prefillPhone = "",
}: ConsultancyModalProps) {
    const [form, setForm] = useState({
        fullName: prefillName,
        mobileNumber: prefillPhone,
        helpWith: "",
        concern: "",
        poojaType: "",
        city: "",
        callbackTime: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setForm((f) => ({
                ...f,
                fullName: prefillName || f.fullName,
                mobileNumber: prefillPhone || f.mobileNumber,
            }));
            setSubmitted(false);
            setError("");
        }
    }, [isOpen, prefillName, prefillPhone]);

    if (!isOpen) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.fullName || !form.mobileNumber || !form.concern || !form.city) {
            setError("Please fill in all required fields.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            const apiUrl = API_URL;
            const res = await fetch(`${apiUrl}/consultancy-leads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, isFromSite: true }),
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
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden"
                style={{ maxHeight: "92vh" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 pt-5 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2
                                className="text-white font-extrabold text-xl"
                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                            >
                                Free Consultation
                            </h2>
                            <p className="text-orange-100 text-xs mt-0.5">
                                Our expert will call you back shortly
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 88px)" }}>
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <svg
                                    className="w-8 h-8 text-green-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <h3
                                className="text-stone-800 font-bold text-lg"
                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                            >
                                Request Submitted!
                            </h3>
                            <p className="text-stone-500 text-sm mt-1">
                                Our pandit will call you back at your preferred time. 🙏
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-6 bg-orange-500 text-white font-semibold px-8 py-3 rounded-2xl text-sm"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                            <div>
                                <label className={LABEL_CLASS}>
                                    Full Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    placeholder="Your full name"
                                    className={INPUT_CLASS}
                                />
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>
                                    Mobile Number <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="mobileNumber"
                                    value={form.mobileNumber}
                                    onChange={handleChange}
                                    placeholder="10-digit mobile number"
                                    inputMode="numeric"
                                    maxLength={10}
                                    className={INPUT_CLASS}
                                />
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>What do you need help with?</label>
                                <select
                                    name="helpWith"
                                    value={form.helpWith}
                                    onChange={handleChange}
                                    className={INPUT_CLASS}
                                >
                                    <option value="">Select what you need help with</option>
                                    {HELP_OPTIONS.map((o) => (
                                        <option key={o} value={o}>{o}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>
                                    What is your concern? <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    name="concern"
                                    value={form.concern}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="e.g. I want to know which pooja is right for peace at home / career growth / marriage..."
                                    className={`${INPUT_CLASS} resize-none`}
                                />
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>Preferred Pooja Type</label>
                                <select
                                    name="poojaType"
                                    value={form.poojaType}
                                    onChange={handleChange}
                                    className={INPUT_CLASS}
                                >
                                    <option value="">Select puja location preference</option>
                                    {POOJA_TYPE_OPTIONS.map((o) => (
                                        <option key={o} value={o}>{o}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>
                                    Your City <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="Enter your city"
                                    className={INPUT_CLASS}
                                />
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>Preferred Callback Time</label>
                                <select
                                    name="callbackTime"
                                    value={form.callbackTime}
                                    onChange={handleChange}
                                    className={INPUT_CLASS}
                                >
                                    <option value="">When should we call you?</option>
                                    {CALLBACK_OPTIONS.map((o) => (
                                        <option key={o} value={o}>{o}</option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <p className="text-red-500 text-xs font-medium">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-200 transition-all duration-200 text-sm disabled:opacity-60 mb-2"
                            >
                                {submitting ? "Submitting..." : "Submit Request"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
