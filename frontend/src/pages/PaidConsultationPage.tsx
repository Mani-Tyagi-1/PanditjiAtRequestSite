import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  HeartHandshake,
  HelpCircle,
  ListChecks,
  Shield,
  ShieldCheck,
  Lock,
  CheckCircle,
  Phone,
  Video,
} from "lucide-react";
import { WhatsappLogoIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import API_URL from "../utils/apiConfig";
import { useAuth } from "../context/AuthContext";
import DesktopHeader from "../components/layout/DesktopHeader";
import SiteFooter from "../components/layout/SiteFooter";
import TopPromoBar from "../components/layout/TopPromoBar";

const TIME_SLOTS = [
  { value: "9-11", display: "9 AM - 11 AM", period: "Morning" },
  { value: "11-1", display: "11 AM - 1 PM", period: "Morning" },
  { value: "3-5", display: "3 PM - 5 PM", period: "Afternoon" },
  { value: "5-7", display: "5 PM - 7 PM", period: "Evening" },
];

// Additive optional field — mirrors the `concern`/`wish` optional-field pattern
// already used elsewhere in this codebase's booking payloads (see
// MyBookingsPage.tsx's `booking.wish || booking.concern`).
const CONCERN_OPTIONS = [
  "Career & Job",
  "Marriage & Love",
  "Health & Wellbeing",
  "Finance & Business",
  "Family & Relationships",
  "Dosha & Remedies",
  "Other",
];

// Real pandit photo already used in this codebase (HOLY_PANDITS, Kashi Vrindavan
// Pandits section) — reused here for the honest, non-named "Meet Your Guide" card.
const GUIDE_IMAGE =
  "/images/pandit_kashi.jpg";

// Same click-to-chat support line used across the site (AppLayout/SiteFooter/DesktopHeader).
const WHATSAPP_URL =
  "https://wa.me/919056955311?text=" +
  encodeURIComponent("🙏 Namaste! I'd like to know more about a Personalised Consultation.");

const CONSULT_FAQS = [
  {
    q: "How soon will Pandit Ji call me?",
    a: "Pandit Ji calls you within your chosen time slot on the day you book. If a slot is unavailable, our team will reach out to reschedule.",
  },
  {
    q: "Is my consultation private?",
    a: "Yes — every consultation is a private, one-on-one call or video call between you and Pandit Ji. Your details are never shared.",
  },
  {
    q: "What if I need to reschedule?",
    a: "Message us on WhatsApp with your booking details and we'll help you find a new time slot that works for you.",
  },
  {
    q: "What's the difference between a call and a video consultation?",
    a: "Both are 30-minute personalised sessions with Pandit Ji — a voice call is audio-only, while a video call lets you speak face-to-face.",
  },
];

const INPUT_CLASS =
  "mt-1 w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-stone-50 transition-all";
const LABEL_CLASS = "text-xs font-semibold text-stone-500 uppercase tracking-wide";

export default function PaidConsultationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryParams = new URLSearchParams(window.location.search);
  const [consultType, setConsultType] = useState<"voice" | "video">(
    queryParams.get("type") === "video" ? "video" : "voice"
  );

  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    city: "",
    preferredTimeSlot: "5-7", // ← Default is now 5-7 PM
  });
  const [amount, setAmount] = useState(consultType === "video" ? 201 : 101);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  // Additive optional field — see CONCERN_OPTIONS above. Does not affect required-field validation.
  const [concerns, setConcerns] = useState<string[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));

  const handleTimeSlotSelect = (slotValue: string) => {
    setForm((current) => ({ ...current, preferredTimeSlot: slotValue }));
  };

  const handleTypeChange = (type: "voice" | "video") => {
    setConsultType(type);
    setAmount(type === "video" ? 201 : 101);
    setError("");
  };

  const toggleConcern = (option: string) => {
    setConcerns((current) =>
      current.includes(option) ? current.filter((c) => c !== option) : [...current, option]
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (
      !form.fullName.trim() ||
      !form.mobileNumber.trim() ||
      !form.city.trim() ||
      !form.preferredTimeSlot
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(form.mobileNumber.trim())) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const orderRes = await fetch(`${API_URL}/paid-consultations/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          mobileNumber: form.mobileNumber,
          city: form.city,
          preferredTimeSlot: form.preferredTimeSlot,
          type: consultType,
          // Additive optional field — backend already tolerates extra concern/wish
          // keys on booking payloads (see MyBookingsPage.tsx's wish||concern usage).
          concern: concerns.join(", "),
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || "Failed to initialize payment.");
      }

      setAmount(Number(orderData.amount) || 101);

      const RazorpayCtor = (window as any).Razorpay;
      if (!RazorpayCtor) {
        throw new Error("Razorpay SDK failed to load. Please refresh and try again.");
      }

      const prefillEmail = user?.email || `user${form.mobileNumber.trim()}@panditjiatrequest.com`;

      const rzp = new RazorpayCtor({
        key: orderData.razorpayKeyId,
        amount: Number(orderData.amount) * 100,
        currency: orderData.currency || "INR",
        name: "PanditJiAtRequest",
        description: `Personalised Consultation - ₹${orderData.amount || 101}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: form.fullName,
          contact: user?.phone || form.mobileNumber,
          email: prefillEmail,
        },
        theme: { color: "#F97316" },
        handler: async function (response: any) {
          try {
            const completeRes = await fetch(`${API_URL}/paid-consultations/complete-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                consultationId: orderData.consultationId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const completeData = await completeRes.json();
            if (!completeRes.ok) {
              throw new Error(completeData.message || "Payment verification failed.");
            }

            if (window.fbq) {
              // eventID must match server CAPI event_id for deduplication
              window.fbq("track", "Purchase", {
                content_name: consultType === "video" ? "Video Call Consultation" : "Audio Call Consultation",
                content_type: consultType === "video" ? "video_call" : "audio_call",
                value: orderData.amount,
                currency: orderData.currency || "INR",
              }, { eventID: `consultation_purchase_${response.razorpay_order_id}` });
            }

            setSubmitted(true);
          } catch (paymentError: any) {
            setError(paymentError.message || "Payment verification failed. Please contact support.");
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setError("Payment was cancelled. Please try again.");
            setSubmitting(false);
          },
        },
      });

      rzp.on("payment.failed", function (response: any) {
        setError(response?.error?.description || "Payment failed. Please try again.");
        setSubmitting(false);
      });

      if (window.fbq) {
        window.fbq("track", "InitiateCheckout", {
          content_name: consultType === "video" ? "Video Call Consultation" : "Audio Call Consultation",
          content_type: consultType === "video" ? "video_call" : "audio_call",
          value: Number(orderData.amount) || amount,
          currency: orderData.currency || "INR",
        });
      }

      rzp.open();
    } catch (submitError: any) {
      setError(submitError.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (<>
    <TopPromoBar />
    <DesktopHeader />
    <div className="min-h-screen max-w-md mx-auto bg-[#FFFAF3] pb-7 md:max-w-none md:mx-0 md:pb-24 lg:pb-16" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500;700&display=swap');
      `}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 pt-6 pb-6 sticky top-0 z-10 shadow-md md:static md:px-8 md:pt-14 md:pb-14 lg:pt-16 lg:pb-16">
        <div className="max-w-md mx-auto flex items-center gap-3 md:max-w-none md:justify-center lg:justify-between lg:gap-10">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full bg-white/20 text-white cursor-pointer md:hidden">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="md:text-center lg:text-left">
            <h2 className="text-white font-bold text-xl md:text-4xl lg:text-5xl md:tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Personalised Consultation
            </h2>
            <p className="text-orange-100 text-xs mt-0.5 md:text-base lg:text-lg md:mt-2">
              Book a dedicated guidance slot with our expert Pandit Ji
            </p>
            {/* NEW: qualitative glass trust chips under the subtitle — tablet/desktop only */}
            <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2.5 md:mt-5 md:justify-center lg:justify-start">
              {[
                "100% Private & Confidential",
                "Expert Guidance & Remedies",
                "Pay Securely via Razorpay",
              ].map((chip) => (
                <span
                  key={chip}
                  className="bg-white/15 border border-white/25 rounded-full px-3.5 py-1.5 text-white text-[12px] font-semibold"
                >
                  ✓ {chip}
                </span>
              ))}
            </div>
          </div>

          {/* NEW: hero pandit photo (same image as Meet Your Guide) with the qualitative
              trust card overlapping its bottom-left corner — lg+ only, no invented review counts */}
          <div className="hidden lg:block lg:relative lg:shrink-0">
            <div className="rounded-3xl overflow-hidden lg:w-[300px] xl:w-[340px] lg:h-[240px] xl:h-[260px] ring-1 ring-white/30 shadow-2xl shadow-orange-900/25">
              <img
                src={GUIDE_IMAGE}
                alt="Our Pandit Ji"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-6 flex items-center gap-3 bg-orange-950/45 border border-white/25 rounded-2xl px-5 py-4 max-w-xs backdrop-blur-md shadow-xl">
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
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 md:max-w-none md:px-8 md:pt-10 lg:pt-12 lg:px-10">
        {submitted ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-xl border border-stone-100 mt-10 md:max-w-lg md:mx-auto md:p-12">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 mx-auto">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-stone-800 font-bold text-3xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Payment Successful!
            </h3>
            <p className="text-stone-500 text-sm mt-3 leading-relaxed">
              Thank you! Our expert Pandit Ji will call you at your preferred time slot (5-7 PM).
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-8 w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-orange-200 transition-transform active:scale-95 cursor-pointer md:hover:bg-orange-600 md:hover:-translate-y-0.5"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <>
            {/* lg+: two-column layout with sticky payment rail (style-inert on mobile) */}
            <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10 lg:items-start">
            <div className="lg:min-w-0">
            {/* Consultation Type Tabs */}
            <div className="flex bg-white border border-stone-100 rounded-2xl p-1 mb-5 shadow-sm md:p-1.5 md:mb-6">
              {([
                { key: "voice", label: "Talk on Call", icon: Phone, sub: "Speak directly with Pandit Ji" },
                { key: "video", label: "Video Call", icon: Video, sub: "Face-to-face guidance" },
              ] as const).map(({ key, label, icon: Icon, sub }) => {
                const active = consultType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTypeChange(key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer md:py-3 md:text-base md:flex-col md:gap-1.5 ${
                      active
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                        : "text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {label}
                    </span>
                    {/* NEW: purely additive tab subtext, tablet/desktop only */}
                    <span className={`hidden md:block text-[11px] font-normal normal-case ${active ? "text-white/80" : "text-stone-400"}`}>
                      {sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Special Offer Banner */}
            <div className="bg-white border border-orange-200 rounded-3xl p-5 mb-6 shadow-sm md:p-7 md:mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-2xl">
                    🔥 SPECIAL INTRODUCTORY OFFER
                  </div>
                  <p className="text-3xl font-bold text-stone-800 mt-3 md:text-4xl">Only ₹{amount}</p>
                  <p className="text-stone-500 text-sm md:text-[15px]">for 30-minute personalised consultation</p>
                </div>
                <div className="text-4xl md:text-6xl">🪔</div>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden mb-28 md:rounded-[32px] lg:mb-12">
              <div className="px-5 py-6 space-y-6 md:px-8 md:py-8 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
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
                  <label className={LABEL_CLASS}>
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Enter your city"
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={LABEL_CLASS}>
                    Preferred Time Slot <span className="text-red-400">*</span>
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                    {TIME_SLOTS.map((slot) => {
                      const selected = form.preferredTimeSlot === slot.value;
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => handleTimeSlotSelect(slot.value)}
                          className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 px-4 py-4 text-sm font-medium transition-all cursor-pointer md:hover:-translate-y-0.5 md:hover:shadow-md ${
                            selected
                              ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                              : "border-stone-200 bg-stone-50 hover:border-stone-300 text-stone-600"
                          }`}
                        >
                          <Clock className="w-5 h-5" />
                          <span className="font-semibold">{slot.display}</span>
                          <span className="text-xs text-stone-500">{slot.period}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* NEW: optional concern chip multi-select — tablet/desktop only, additive field */}
                <div className="hidden md:block md:col-span-2">
                  <label className={LABEL_CLASS}>
                    What do you need help with? <span className="text-stone-400 normal-case font-normal">(optional)</span>
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {CONCERN_OPTIONS.map((option) => {
                      const selected = concerns.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleConcern(option)}
                          className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all cursor-pointer ${
                            selected
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* What You'll Get */}
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-sm md:col-span-2 md:p-5">
                  <p className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    WHAT YOU'LL GET
                  </p>
                  <ul className="space-y-2 text-stone-600 text-[13px] md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-2.5 md:space-y-0 md:text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">✓</span>30-minute dedicated one-on-one {consultType === "video" ? "video call" : "call"}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">✓</span>Personalised guidance &amp; remedies
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">✓</span>100% private &amp; confidential
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">✓</span>Pandit Ji will call you at chosen slot
                    </li>
                  </ul>
                </div>

                {error && <p className="text-red-500 text-sm font-medium text-center md:col-span-2">{error}</p>}
              </div>
            </form>
            </div>

            {/* Desktop-only sticky payment card (lg+) — same handlers as the mobile pay bar */}
            <aside className="hidden lg:block lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-6">
                <p className={LABEL_CLASS}>Booking Summary</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-stone-500">
                      {consultType === "video" ? <Video className="w-4 h-4 text-orange-500" /> : <Phone className="w-4 h-4 text-orange-500" />}
                      Consultation
                    </span>
                    <span className="font-semibold text-stone-700">{consultType === "video" ? "Video Call" : "Talk on Call"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-stone-500">
                      <Clock className="w-4 h-4 text-orange-500" />
                      Time Slot
                    </span>
                    <span className="font-semibold text-stone-700">
                      {TIME_SLOTS.find((slot) => slot.value === form.preferredTimeSlot)?.display || "Not selected"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-dashed border-stone-200 pt-3">
                    <span className="text-stone-500">Total</span>
                    <span className="text-2xl font-bold text-stone-800">₹{amount}</span>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-6 w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:-translate-y-0.5 text-white font-bold py-4 rounded-2xl shadow-xl shadow-orange-200 transition-all duration-200 text-base flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
                >
                  <CreditCard className="w-5 h-5" />
                  {submitting ? "Processing..." : `Pay ₹${amount} Securely Now`}
                </button>
                <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-stone-400">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>Secured by Razorpay</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>100% Safe</span>
                  </div>
                </div>
              </div>
            </aside>
            </div>

            {/* NEW: Why People Consult / How It Works / Meet Your Guide — tablet/desktop only */}
            <div className="hidden md:block mt-14 lg:mt-16">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h3 className="text-2xl lg:text-3xl font-bold text-stone-800" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Why Devotees Consult Pandit Ji
                </h3>
                <p className="text-stone-500 text-sm mt-2">Honest, personal guidance rooted in Vedic tradition</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                <div className="bg-white border border-stone-100 rounded-3xl p-6 lg:p-8 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                    <HeartHandshake className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-bold text-stone-800 text-lg mb-2">Why People Consult</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">
                    From career worries to family matters, devotees turn to Pandit Ji for clarity, remedies, and
                    reassurance rooted in Vedic wisdom.
                  </p>
                </div>
                <div className="bg-white border border-stone-100 rounded-3xl p-6 lg:p-8 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                    <ListChecks className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-bold text-stone-800 text-lg mb-2">How the Consultation Works</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">
                    Fill in the form, choose a slot, and complete a secure payment. Pandit Ji calls you at your chosen
                    time for a private, unhurried conversation.
                  </p>
                </div>
                <div className="bg-white border border-stone-100 rounded-3xl p-6 lg:p-8 shadow-sm">
                  <img
                    src={GUIDE_IMAGE}
                    alt="Our Pandit Ji"
                    className="w-14 h-14 rounded-full object-cover mb-4 border-2 border-orange-200"
                  />
                  <h4 className="font-bold text-stone-800 text-lg mb-2">Meet Your Guide</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">
                    Our Pandit Ji brings 10+ years of experience guiding devotees with authentic Vedic knowledge and
                    heartfelt care.
                  </p>
                </div>
              </div>
            </div>

            {/* NEW: FAQ accordion — tablet/desktop only, small honest static FAQ */}
            <div className="hidden md:block mt-14 lg:mt-16 max-w-3xl mx-auto lg:max-w-4xl">
              <div className="flex items-center gap-2 justify-center mb-6">
                <HelpCircle className="w-5 h-5 text-orange-500" />
                <h3 className="text-xl lg:text-2xl font-bold text-stone-800" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Frequently Asked Questions
                </h3>
              </div>
              {/* lg+: two accordion stacks side by side (grid is style-inert below lg) */}
              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-3 lg:space-y-0 lg:items-start">
                {CONSULT_FAQS.map((faq, index) => {
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
            <div className="hidden md:flex md:flex-col md:items-center md:text-center lg:flex-row lg:text-left lg:justify-between mt-14 lg:mt-16 mb-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl px-8 py-8 lg:px-10 gap-6">
              <div>
                <h3 className="text-white text-xl lg:text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Still have questions?
                </h3>
                <p className="text-orange-100 text-sm mt-1">Our team is happy to help you choose the right consultation.</p>
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

      {/* Sticky Pay Button - always visible at bottom */}
      {!submitted && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t shadow-2xl px-4 py-4 z-50 md:max-w-2xl md:bottom-6 md:rounded-2xl md:border md:border-stone-200 md:px-6 lg:hidden">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.97] text-white font-bold py-4 rounded-3xl shadow-xl shadow-orange-200 transition-all duration-200 text-base flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
          >
            <CreditCard className="w-5 h-5" />
            {submitting ? "Processing..." : `Pay ₹${amount} Securely Now`}
          </button>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-stone-400">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Secured by Razorpay</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>100% Safe</span>
            </div>
          </div>
        </div>
      )}
    </div>
    <SiteFooter />
  </>);
}