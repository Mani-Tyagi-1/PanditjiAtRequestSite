import { useState } from "react";
import {
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronUp,
    HelpCircle,
    Phone,
    PhoneCall,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { WhatsappLogoIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import API_URL from "../utils/apiConfig";
import DesktopHeader from "../components/layout/DesktopHeader";
import SiteFooter from "../components/layout/SiteFooter";
import TopPromoBar from "../components/layout/TopPromoBar";

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

// Same click-to-chat support line used across the site (AppLayout/SiteFooter/DesktopHeader).
const WHATSAPP_URL =
    "https://wa.me/919056955311?text=" +
    encodeURIComponent("🙏 Namaste! I'd like to know more about a Free Consultation.");

const FREE_CONSULT_FAQS = [
    {
        q: "Is this consultation really free?",
        a: "Yes — the free consultation callback has no charges or obligation. Pandit Ji simply calls you back to understand your concern.",
    },
    {
        q: "How soon will I get a callback?",
        a: "Our team reaches out at your preferred callback time. If you don't hear back, you can also reach us directly on WhatsApp.",
    },
    {
        q: "Can I ask about a specific puja?",
        a: "Yes — select a preferred pooja above, or describe your concern in your own words and Pandit Ji will guide you accordingly.",
    },
];

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
    const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            const apiUrl = API_URL;
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

            // Meta Pixel Tracking
            if (window.fbq) {
                window.fbq("track", "Consultation Form");
            }

            setSubmitted(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (<>
        <TopPromoBar />
        <DesktopHeader />
        <div className="min-h-screen max-w-md mx-auto bg-[#FFFAF3] pb-10 md:max-w-none md:mx-0 md:pb-20" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500;700&display=swap');
            `}</style>

            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 pt-6 pb-6 sticky top-0 z-10 shadow-md md:static md:px-8 md:pt-14 md:pb-14 lg:pt-16 lg:pb-16">
                <div className="max-w-md mx-auto flex items-center justify-between md:max-w-none md:justify-center lg:justify-between lg:gap-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-1 rounded-full bg-white/20 text-white cursor-pointer md:hidden">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="md:text-center lg:text-left">
                            <h2
                                className="text-white font-bold text-xl md:text-4xl lg:text-5xl md:tracking-tight"
                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                            >
                                Free Consultation
                            </h2>
                            <p className="text-orange-100 text-xs mt-0.5 md:text-base lg:text-lg md:mt-2">
                                Our expert will call you back shortly
                            </p>
                        </div>
                    </div>

                    {/* NEW: qualitative trust card beside the hero at lg+ — no invented review counts */}
                    <div className="hidden lg:flex lg:items-center lg:gap-3 lg:shrink-0 lg:bg-white/15 lg:border lg:border-white/25 lg:rounded-2xl lg:px-5 lg:py-4 lg:max-w-xs lg:backdrop-blur-sm">
                        <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white text-sm font-bold">Trusted by Thousands</p>
                            <p className="text-orange-100 text-xs mt-0.5 leading-snug">
                                Devotees turn to Pandit Ji for honest, personal guidance rooted in Vedic tradition.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto mt-6 px-5 md:max-w-none md:px-8 md:mt-10 lg:mt-12">
                {submitted ? (
                    <div className="bg-white rounded-3xl p-10 text-center shadow-xl border border-stone-100 mt-10 md:max-w-lg md:mx-auto md:p-12">
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
                            className="mt-8 bg-orange-500 text-white font-bold px-10 py-4 rounded-2xl text-sm shadow-lg shadow-orange-200 transition-transform active:scale-95 cursor-pointer md:hover:bg-orange-600 md:hover:-translate-y-0.5"
                        >
                            Go to Home
                        </button>
                    </div>
                ) : (
                    <>
                    {/* Desktop-only trust strip (hidden on mobile) */}
                    <div className="hidden md:grid md:grid-cols-3 md:gap-4 md:mb-8">
                        {[
                            { icon: PhoneCall, title: "Quick Callback", sub: "Our expert calls you back shortly" },
                            { icon: ShieldCheck, title: "100% Free", sub: "No charges, no obligation" },
                            { icon: Sparkles, title: "Personalised Guidance", sub: "Remedies suited to your concern" },
                        ].map(({ icon: Icon, title, sub }) => (
                            <div key={title} className="flex items-center gap-3 bg-white/60 border border-orange-100/60 rounded-2xl px-4 py-4 shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                    <Icon className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-stone-800">{title}</p>
                                    <p className="text-xs text-stone-500 mt-0.5">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden mb-10 md:rounded-[32px] md:mb-16">
                        <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6 md:px-10 md:py-10 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
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

                            <div className="md:col-span-2">
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

                            <div className="md:col-span-2">
                                <label className={LABEL_CLASS}>Preferred Pooja</label>
                                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
                                    {POOJA_OPTIONS.map((pooja) => {
                                        const isSelected = form.preferredPooja.includes(pooja);
                                        return (
                                            <button
                                                key={pooja}
                                                type="button"
                                                onClick={() => togglePooja(pooja)}
                                                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer md:p-3.5 ${isSelected
                                                        ? "border-orange-500 bg-orange-50"
                                                        : "border-stone-100 bg-stone-50 hover:bg-stone-100"
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-orange-500 bg-orange-500" : "border-stone-300 bg-white"
                                                    }`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className={`text-[11px] font-semibold tracking-tight leading-none md:text-xs ${isSelected ? "text-orange-700" : "text-stone-600"}`}>
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

                            <div className="md:col-span-2">
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
                                <p className="text-red-500 text-sm font-medium animate-pulse md:col-span-2">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold py-4 rounded-2xl shadow-xl shadow-orange-100 transition-all duration-200 text-sm disabled:opacity-60 cursor-pointer md:col-span-2 md:text-base md:hover:-translate-y-0.5 md:hover:shadow-lg"
                            >
                                {submitting ? "Submitting..." : "Book My Free Consultation"}
                            </button>
                        </form>
                    </div>

                    {/* NEW: FAQ block — tablet/desktop only, small honest static FAQ */}
                    <div className="hidden md:block mt-2 mb-14 lg:mb-16 max-w-3xl mx-auto">
                        <div className="flex items-center gap-2 justify-center mb-6">
                            <HelpCircle className="w-5 h-5 text-orange-500" />
                            <h3 className="text-xl lg:text-2xl font-bold text-stone-800" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                Frequently Asked Questions
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {FREE_CONSULT_FAQS.map((faq, index) => {
                                const isOpen = openFaq === index;
                                return (
                                    <div key={faq.q} className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => setOpenFaq(isOpen ? null : index)}
                                            className="w-full flex items-center justify-between text-left px-5 py-4 cursor-pointer hover:bg-orange-50/30 transition-colors"
                                        >
                                            <span className="text-sm lg:text-[15px] font-bold text-stone-800">{faq.q}</span>
                                            {isOpen ? (
                                                <ChevronUp className="w-4 h-4 text-stone-500 shrink-0 ml-3" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-stone-500 shrink-0 ml-3" />
                                            )}
                                        </button>
                                        {isOpen && (
                                            <div className="px-5 pb-4">
                                                <p className="text-sm text-stone-500 leading-relaxed">{faq.a}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* NEW: closing WhatsApp/Call CTA banner — tablet/desktop only */}
                    <div className="hidden md:flex md:flex-col md:items-center md:text-center lg:flex-row lg:text-left lg:justify-between mb-14 lg:mb-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl px-8 py-8 lg:px-10 gap-6">
                        <div>
                            <h3 className="text-white text-xl lg:text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                Still have questions?
                            </h3>
                            <p className="text-orange-100 text-sm mt-1">Our team is happy to help before you book.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-5 py-3 rounded-2xl text-sm shadow-lg cursor-pointer hover:-translate-y-0.5 transition-transform"
                            >
                                <WhatsappLogoIcon size={18} weight="fill" />
                                Chat on WhatsApp
                            </a>
                            <a
                                href="tel:+919056955311"
                                className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-bold px-5 py-3 rounded-2xl text-sm cursor-pointer hover:-translate-y-0.5 transition-transform"
                            >
                                <Phone className="w-4 h-4" />
                                Call Now
                            </a>
                        </div>
                    </div>
                    </>
                )}
            </div>
        </div>
        <SiteFooter />
    </>);
}