import { useState } from "react";
import { Check, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const POOJA_OPTIONS = [
    "Mangal Dosh Pooja",
    "Satyanarayan Pooja",
    "Pitru Dosh Pooja",
    "Grah Shanti Pooja",
    "Vastu Shanti Pooja",
    "Sundarkand Path",
    "Navgraha Shanti Pooja",
    "Other"
];

const CALLBACK_OPTIONS = [
    "Morning (9 AM – 12 PM)",
    "Afternoon (12 PM – 4 PM)",
    "Evening (4 PM – 7 PM)",
    "Anytime",
];

const INPUT_CLASS =
    "mt-1 w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-stone-50 transition-all";
const LABEL_CLASS = "text-xs font-semibold text-stone-500 uppercase tracking-wide";

export default function FreeConsultationPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: "",
        mobileNumber: "",
        helpWith: "",
        concern: "",
        preferredPooja: [] as string[],
        otherPoojaText: "",
        city: "",
        callbackTime: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const togglePooja = (pooja: string) => {
        setForm(f => {
            const current = f.preferredPooja;
            if (current.includes(pooja)) {
                return { ...f, preferredPooja: current.filter(p => p !== pooja) };
            } else {
                return { ...f, preferredPooja: [...current, pooja] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.fullName || !form.mobileNumber || !form.concern || !form.city) {
            setError("Please fill in all required fields.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "https://panditjiatrequest.com/api";
            const res = await fetch(`${apiUrl}/consultancy-leads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    fullName: form.fullName,
                    mobileNumber: form.mobileNumber,
                    helpWith: form.helpWith,
                    concern: form.concern,
                    poojaType: form.preferredPooja.join(", "),
                    otherPoojaText: form.preferredPooja.includes("Other") ? form.otherPoojaText : "",
                    city: form.city,
                    callbackTime: form.callbackTime,
                    isFromSite: true 
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
        <div className="min-h-screen max-w-md mx-auto bg-[#FFFAF3] pb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500;700&display=swap');
            `}</style>

            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 pt-6 pb-6 sticky top-0 z-10 shadow-md">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-1 rounded-full bg-white/20 text-white">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
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
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto mt-6 px-5">
                {submitted ? (
                    <div className="bg-white rounded-3xl p-10 text-center shadow-xl border border-stone-100 mt-10">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 mx-auto">
                            <Check className="w-10 h-10 text-green-500" />
                        </div>
                        <h3
                            className="text-stone-800 font-bold text-2xl"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            Request Submitted!
                        </h3>
                        <p className="text-stone-500 text-sm mt-3 leading-relaxed">
                            Thank you for reaching out. Our pandit will call you back at your preferred time to guide you further. 🙏
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="mt-8 bg-orange-500 text-white font-bold px-10 py-4 rounded-2xl text-sm shadow-lg shadow-orange-200 transition-transform active:scale-95"
                        >
                            Go to Home
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden mb-10">
                        <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
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
                                    <option value="">Select option</option>
                                    {HELP_OPTIONS.map((o) => (
                                        <option key={o} value={o}>{o}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>Preferred Pooja</label>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    {POOJA_OPTIONS.map((pooja) => {
                                        const isSelected = form.preferredPooja.includes(pooja);
                                        return (
                                            <button
                                                key={pooja}
                                                type="button"
                                                onClick={() => togglePooja(pooja)}
                                                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                                                    isSelected 
                                                        ? "border-orange-500 bg-orange-50" 
                                                        : "border-stone-100 bg-stone-50 hover:bg-stone-100"
                                                }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                    isSelected ? "border-orange-500 bg-orange-500" : "border-stone-300 bg-white"
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className={`text-[11px] font-semibold tracking-tight leading-none ${isSelected ? "text-orange-700" : "text-stone-600"}`}>
                                                    {pooja}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {form.preferredPooja.includes("Other") && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className={LABEL_CLASS}>Specify Other Pooja</label>
                                        <textarea
                                            name="otherPoojaText"
                                            value={form.otherPoojaText}
                                            onChange={handleChange}
                                            placeholder="Please describe the puja you are looking for..."
                                            rows={2}
                                            className={`${INPUT_CLASS} resize-none`}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>
                                    What is your concern? <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    name="concern"
                                    value={form.concern}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Tell us about your requirement or concern..."
                                    className={`${INPUT_CLASS} resize-none`}
                                />
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
                                <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold py-4 rounded-2xl shadow-xl shadow-orange-100 transition-all duration-200 text-sm disabled:opacity-60"
                            >
                                {submitting ? "Submitting..." : "Book My Free Consultation"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
