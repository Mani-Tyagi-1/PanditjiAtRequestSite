import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, User, Phone, Mail, Check } from "lucide-react";
import API_URL from "../utils/apiConfig";
import { useAuth } from "../context/AuthContext";

const KASHI_BG =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/ChatGPT%20Image%20Jun%2015,%202026,%2012_15_58%20PM%20(1).png";

export default function KashiPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [form, setForm] = useState({
        devoteeName: "",
        mobileNumber: user?.phone || "",
        email: user?.email || "",
        ritualDetails: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        setError("");
        if (!form.devoteeName.trim()) {
            setError("Please enter the devotee's name.");
            return;
        }
        if (form.mobileNumber.replace(/\D/g, "").length !== 10) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/kashi-requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    devoteeName: form.devoteeName.trim(),
                    mobileNumber: form.mobileNumber.replace(/\D/g, ""),
                    email: form.email.trim(),
                    ritualDetails: form.ritualDetails.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to submit request.");
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen font-sans overflow-hidden">
            <Helmet>
                <title>Kashi Vishwanath Dham | Pandit Ji At Request</title>
            </Helmet>

            {/* Sacred backdrop */}
            <div className="absolute inset-0 z-0">
                <img src={KASHI_BG} alt="Kashi" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#FBEAD0]/65 via-[#FFF6E9]/55 to-[#FFFAF3]/95" />
            </div>

            {/* Content above backdrop */}
            <div className="relative z-10">

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4">
                <button
                    onClick={() => navigate("/home")}
                    className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                >
                    <ArrowLeft className="w-4.5 h-4.5 text-stone-700" />
                </button>
                <h1 className="text-[20px] font-bold text-stone-800">Kashi Vishwanath Dham</h1>
                <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm text-orange-600 text-xl font-bold">
                    ॐ
                </span>
            </div>

            {/* Mantra */}
            <div className="text-center px-6 mt-4">
                <h2 className="text-[30px] font-bold text-orange-700" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    || हर हर महादेव ||
                </h2>
                <div className="flex items-center justify-center gap-2 my-2 text-amber-500">
                    <span className="h-px w-16 bg-amber-300" />◆<span className="h-px w-16 bg-amber-300" />
                </div>
                <p className="text-[13.5px] text-stone-600 leading-relaxed">
                    Bring the sacred blessings of Mahadev to your home. Invite verified Vedic Pandits from Kashi Ji
                    or book holy Poojas to be performed directly in Kashi.
                </p>
            </div>

            {/* Form card */}
            <div className="px-4 mt-5">
                {submitted ? (
                    <div className="bg-white rounded-3xl shadow-lg border border-orange-100 p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                            <Check className="w-8 h-8 text-emerald-600" strokeWidth={3} />
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-stone-800" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            Request Received 🙏
                        </h3>
                        <p className="mt-2 text-[13px] text-stone-500 leading-relaxed">
                            Har Har Mahadev! Our team will contact you shortly on{" "}
                            <span className="font-semibold text-stone-700">+91 {form.mobileNumber}</span> to arrange your
                            Pooja / Pandit Ji from Kashi.
                        </p>
                        <button
                            onClick={() => navigate("/home")}
                            className="mt-6 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform"
                        >
                            Back to Home
                        </button>
                    </div>
                ) : (
                    <div className="bg-white/45 rounded-3xl shadow-lg border border-white/60 p-5">
                        {/* Card title */}
                        <div className="flex items-center justify-center gap-2">
                            <span className="w-9 h-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">🪔</span>
                            <h3 className="text-[18px] font-bold text-stone-800">✦ Pooja &amp; Pandit Request ✦</h3>
                        </div>
                        <div className="flex items-center justify-center gap-2 my-3 text-amber-400">
                            <span className="h-px w-20 bg-amber-200" />◆<span className="h-px w-20 bg-amber-200" />
                        </div>

                        <div className="space-y-3">
                            <Field icon={<User className="w-5 h-5 text-orange-500" />} label="Devotee Name">
                                <input
                                    value={form.devoteeName}
                                    onChange={(e) => update("devoteeName", e.target.value)}
                                    placeholder="Enter your full name"
                                    className={INPUT}
                                />
                            </Field>

                            <Field icon={<Phone className="w-5 h-5 text-orange-500" />} label="Mobile Number">
                                <input
                                    value={form.mobileNumber}
                                    onChange={(e) => update("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    placeholder="10-digit mobile number"
                                    inputMode="numeric"
                                    className={INPUT}
                                />
                            </Field>

                            <Field icon={<Mail className="w-5 h-5 text-orange-500" />} label="Email Address (Optional)">
                                <input
                                    value={form.email}
                                    onChange={(e) => update("email", e.target.value)}
                                    placeholder="Enter email address"
                                    className={INPUT}
                                />
                            </Field>

                            <Field icon={<span className="text-orange-500 text-lg leading-none">🔱</span>} label="Ritual & Pooja Details">
                                <textarea
                                    value={form.ritualDetails}
                                    onChange={(e) => update("ritualDetails", e.target.value)}
                                    placeholder="Describe your ritual requirements (e.g., invite Kashi Pandit Ji to your home, or perform a specific Pooja in Kashi Ji)"
                                    rows={3}
                                    className={`${INPUT} resize-none`}
                                />
                            </Field>
                        </div>

                        {error && <p className="text-red-500 text-[12.5px] font-semibold text-center mt-3">{error}</p>}

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200/70 active:scale-95 transition-transform disabled:opacity-60"
                        >
                            🔱 {submitting ? "Submitting…" : "Request Pandit / Pooja Booking"}
                        </button>
                    </div>
                )}
            </div>

            <div className="h-6" />
            </div>
        </div>
    );
}

const INPUT =
    "w-full bg-transparent text-[15px] font-bold text-stone-800 placeholder:text-[14px] placeholder:font-medium placeholder:text-stone-400 focus:outline-none";

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 bg-white border border-stone-200 rounded-2xl px-4 py-3">
            <span className="mt-1 shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
                <span className="block text-[11.5px] font-semibold text-stone-400">{label}</span>
                {children}
            </div>
        </div>
    );
}
