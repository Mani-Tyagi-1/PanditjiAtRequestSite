import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const INPUT_CLASS =
    "mt-1 w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-stone-50 transition-colors";
const LABEL_CLASS = "text-xs font-semibold text-stone-500 uppercase tracking-wide";

export default function PujaEnquiryPage() {
    const { pujaId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [pujaName, setPujaName] = useState("");
    const [pujaImage, setPujaImage] = useState("");
    const [loadingPuja, setLoadingPuja] = useState(true);

    const [form, setForm] = useState({
        fullName: user?.name || user?.fullName || "",
        phone: user?.phone || user?.mobileNumber || "",
        astrologerAdvised: "" as "yes" | "no" | "",
        timing: "" as "immediately" | "within7days" | "justenquiring" | "",
        city: user?.city || "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPuja = async () => {
            if (!pujaId) return;
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "https://panditjiatrequest.com/api";
                const res = await fetch(`${apiUrl}/fetch-pooja-by-id/${pujaId}`);
                const data = await res.json();
                const pooja = data?.pooja || data;
                if (pooja) {
                    setPujaName(pooja.poojaNameEng || "");
                    setPujaImage(pooja.poojaMainImage || pooja.poojaCardImage || "");
                }
            } catch {
                // silently ignore
            } finally {
                setLoadingPuja(false);
            }
        };
        fetchPuja();
    }, [pujaId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.fullName || !form.phone || !form.astrologerAdvised || !form.timing || !form.city) {
            setError("Please fill in all fields.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "https://panditjiatrequest.com/api";
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
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500&display=swap');
                * { box-sizing: border-box; }
            `}</style>

            <div
                className="min-h-screen bg-[#FFFAF3] flex justify-center"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
                <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-sm">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 pt-5 pb-5 relative">
                        <button
                            onClick={() => navigate(-1)}
                            className="absolute left-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="text-center pt-8 pb-2">
                            {pujaImage && !loadingPuja && (
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 mx-auto mb-3 bg-amber-100">
                                    <img src={pujaImage} alt={pujaName} className="w-full h-full object-contain" />
                                </div>
                            )}
                            <p className="text-orange-100 text-[10px] font-semibold uppercase tracking-widest mb-1">
                                Quick Enquiry
                            </p>
                            <h1
                                className="text-white font-extrabold leading-tight"
                                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px" }}
                            >
                                {loadingPuja ? "Loading..." : pujaName || "Puja Enquiry"}
                            </h1>
                            <p className="text-orange-100 text-xs mt-1.5">
                                We'll reach out to help you arrange this puja
                            </p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto">
                        {submitted ? (
                            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
                                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2
                                    className="text-stone-800 font-bold text-xl"
                                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                >
                                    Enquiry Submitted! 🙏
                                </h2>
                                <p className="text-stone-500 text-sm mt-2 max-w-xs">
                                    Our pandit will contact you shortly to help arrange your puja.
                                </p>
                                <button
                                    onClick={() => navigate(`/puja/${pujaId}`)}
                                    className="mt-8 bg-orange-500 text-white font-semibold px-10 py-3.5 rounded-2xl text-sm shadow-lg shadow-orange-200"
                                >
                                    Back to Puja
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="px-5 py-6 space-y-5">
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
                                    className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-200 transition-all duration-200 text-sm disabled:opacity-60"
                                >
                                    {submitting ? "Submitting..." : "Submit Enquiry 🙏"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
