import { useEffect, useState } from "react";
import { Check, ChevronLeft, Clock, CreditCard, Shield, Lock, CheckCircle, Phone, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../utils/apiConfig";
import { useAuth } from "../context/AuthContext";
import { money } from "../utils/currency";
import { isIndia } from "../utils/currency";
import analytics, { type AnalyticsItem } from "../utils/analytics";

/**
 * The consultation as a GA4 line item.
 *
 * Split by call type rather than reported as one generic "consultation", so
 * Ads can see which of the two actually converts and bid accordingly.
 */
const consultationGa4ItemsFor = (
  consultType: string,
  price: number,
): AnalyticsItem[] => [
  {
    id: consultType === "video" ? "consultation_video" : "consultation_audio",
    name: consultType === "video" ? "Video Call Consultation" : "Audio Call Consultation",
    price,
    quantity: 1,
    category: "Consultation",
    variant: consultType === "video" ? "video" : "audio",
  },
];

const TIME_SLOTS = [
  { value: "9-11", display: "9 AM - 11 AM", period: "Morning" },
  { value: "11-1", display: "11 AM - 1 PM", period: "Morning" },
  { value: "3-5", display: "3 PM - 5 PM", period: "Afternoon" },
  { value: "5-7", display: "5 PM - 7 PM", period: "Evening" },
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
    email: "",
    city: "",
    preferredTimeSlot: "5-7", // ← Default is now 5-7 PM
  });
  const [amount, setAmount] = useState(consultType === "video" ? 201 : 101);

  /** This page's consultation as a GA4 line item, priced at `price`. */
  const consultationGa4Items = (price: number) =>
    consultationGa4ItemsFor(consultType, price);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

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

    if (!isIndia() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError("Please enter a valid email — it's how we send your booking confirmation.");
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
          // The server needs an address to confirm to — without this the
          // consultation booking has no email to send the receipt to.
          email: form.email.trim(),
          city: form.city,
          preferredTimeSlot: form.preferredTimeSlot,
          type: consultType,
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

      const prefillEmail = form.email.trim() || user?.email || `user${form.mobileNumber.trim()}@panditjiatrequest.com`;

      const rzp = new RazorpayCtor({
        key: orderData.razorpayKeyId,
        amount: Number(orderData.amount) * 100,
        currency: orderData.currency || "INR",
        name: "PanditJiAtRequest",
        description: `Personalised Consultation - ${money(orderData.amount || 101)}`,
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

            analytics.purchase({
              transactionId: response.razorpay_order_id,
              items: consultationGa4Items(Number(orderData.amount) || amount),
              value: Number(orderData.amount) || amount,
              currency: orderData.currency || "INR",
              meta: {
                event: "Purchase",
                // eventID must match server CAPI event_id for deduplication
                eventId: `consultation_purchase_${response.razorpay_order_id}`,
                params: {
                  content_name: consultType === "video" ? "Video Call Consultation" : "Audio Call Consultation",
                  content_type: consultType === "video" ? "video_call" : "audio_call",
                  value: orderData.amount,
                  currency: orderData.currency || "INR",
                },
              },
            });

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

      {
        const checkoutValue = Number(orderData.amount) || amount;
        analytics.beginCheckout({
          items: consultationGa4Items(checkoutValue),
          value: checkoutValue,
          currency: orderData.currency || "INR",
          meta: {
            event: "InitiateCheckout",
            params: {
              content_name: consultType === "video" ? "Video Call Consultation" : "Audio Call Consultation",
              content_type: consultType === "video" ? "video_call" : "audio_call",
              value: checkoutValue,
              currency: orderData.currency || "INR",
            },
          },
        });
        analytics.addPaymentInfo({
          items: consultationGa4Items(checkoutValue),
          value: checkoutValue,
          currency: orderData.currency || "INR",
        });
        // Lets the Razorpay webhook attribute the purchase to this visitor even
        // if the tab is gone before payment settles.
        analytics.stashOrderAttribution(orderData.razorpayOrderId);
      }

      rzp.open();
    } catch (submitError: any) {
      setError(submitError.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#FFFAF3] pb-7" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500;700&display=swap');
      `}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 pt-6 pb-6 sticky top-0 z-10 shadow-md">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full bg-white/20 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-white font-bold text-xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Personalised Consultation
            </h2>
            <p className="text-orange-100 text-xs mt-0.5">
              Book a dedicated guidance slot with our expert Pandit Ji
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        {submitted ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-xl border border-stone-100 mt-10">
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
              className="mt-8 w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-orange-200 transition-transform active:scale-95"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <>
            {/* Consultation Type Tabs */}
            <div className="flex bg-white border border-stone-100 rounded-2xl p-1 mb-5 shadow-sm">
              {([
                { key: "voice", label: "Talk on Call", icon: Phone },
                { key: "video", label: "Video Call", icon: Video },
              ] as const).map(({ key, label, icon: Icon }) => {
                const active = consultType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTypeChange(key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      active
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                        : "text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Special Offer Banner */}
            <div className="bg-white border border-orange-200 rounded-3xl p-5 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-2xl">
                    🔥 SPECIAL INTRODUCTORY OFFER
                  </div>
                  <p className="text-3xl font-bold text-stone-800 mt-3">Only {money(amount)}</p>
                  <p className="text-stone-500 text-sm">for 30-minute personalised consultation</p>
                </div>
                <div className="text-4xl">🪔</div>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden mb-28">
              <div className="px-5 py-6 space-y-6">
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
                  {/* Email — REQUIRED outside India, optional at home. Abroad
                      there is no OTP to log in with, so the confirmation email
                      is the devotee's only record of the booking. */}
                  <label className={LABEL_CLASS}>
                    Email {isIndia() ? <span className="opacity-70 font-normal">(optional)</span> : <span className="text-red-400">*</span>}
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={isIndia() ? "For a copy of your booking" : "For your booking confirmation"}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
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

                <div>
                  <label className={LABEL_CLASS}>
                    Preferred Time Slot <span className="text-red-400">*</span>
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {TIME_SLOTS.map((slot) => {
                      const selected = form.preferredTimeSlot === slot.value;
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => handleTimeSlotSelect(slot.value)}
                          className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 px-4 py-4 text-sm font-medium transition-all ${
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

                {/* What You'll Get */}
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-sm">
                  <p className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    WHAT YOU'LL GET
                  </p>
                  <ul className="space-y-2 text-stone-600 text-[13px]">
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

                {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
              </div>
            </form>
          </>
        )}
      </div>

      {/* Sticky Pay Button - always visible at bottom */}
      {!submitted && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t shadow-2xl px-4 py-4 z-50">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.97] text-white font-bold py-4 rounded-3xl shadow-xl shadow-orange-200 transition-all duration-200 text-base flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <CreditCard className="w-5 h-5" />
            {submitting ? "Processing..." : `Pay ${money(amount)} Securely Now`}
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
  );
}
