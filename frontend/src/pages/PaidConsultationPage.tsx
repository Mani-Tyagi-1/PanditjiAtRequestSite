import { useEffect, useState } from "react";
import { Check, ChevronLeft, Clock, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../utils/apiConfig";

const TIME_SLOTS = ["9-11", "11-1", "3-5", "5-7"];

const INPUT_CLASS =
  "mt-1 w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-stone-50 transition-all";
const LABEL_CLASS = "text-xs font-semibold text-stone-500 uppercase tracking-wide";

export default function PaidConsultationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    city: "",
    concern: "",
    preferredTimeSlot: "",
  });
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
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((current) => ({ ...current, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.fullName.trim() ||
      !form.mobileNumber.trim() ||
      !form.city.trim() ||
      !form.concern.trim() ||
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
          concern: form.concern,
          preferredTimeSlot: form.preferredTimeSlot,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || "Failed to initialize payment.");
      }

      const RazorpayCtor = (window as any).Razorpay;
      if (!RazorpayCtor) {
        throw new Error("Razorpay SDK failed to load. Please refresh and try again.");
      }

      const rzp = new RazorpayCtor({
        key: orderData.razorpayKeyId,
        amount: Number(orderData.amount) * 100,
        currency: orderData.currency || "INR",
        name: "PanditJiAtRequest",
        description: "Personalised Consultation",
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: form.fullName,
          contact: form.mobileNumber,
        },
        theme: {
          color: "#F97316",
        },
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
              window.fbq("track", "Purchase", {
                content_name: "Personalised Consultation",
                content_type: "service",
                value: orderData.amount,
                currency: orderData.currency || "INR",
              });
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

      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 pt-6 pb-6 sticky top-0 z-10 shadow-md">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full bg-white/20 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2
              className="text-white font-extrabold text-xl"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Personalised Consultation
            </h2>
            <p className="text-orange-100 text-xs mt-0.5">
              Book a dedicated guidance slot with our expert pandit
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto mt-2 px-2">
        {submitted ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-xl border border-stone-100 mt-10">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 mx-auto">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h3
              className="text-stone-800 font-bold text-2xl"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Details Received
            </h3>
            <p className="text-stone-500 text-sm mt-3 leading-relaxed">
              Your payment is confirmed. Our team will call you at your preferred time slot.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-8 bg-orange-500 text-white font-bold px-10 py-4 rounded-2xl text-sm shadow-lg shadow-orange-200 transition-transform active:scale-95"
            >
              Go to Home
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden mb-3">
            <form onSubmit={handleSubmit} className="px-3 py-2 space-y-4">
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
                  What is your concern? <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="concern"
                  value={form.concern}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us what you need guidance for..."
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  Preferred Time Slot <span className="text-red-400">*</span>
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {TIME_SLOTS.map((slot) => {
                    const selected = form.preferredTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, preferredTimeSlot: slot }))}
                        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition-all ${
                          selected
                            ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                            : "border-stone-100 bg-stone-50 text-stone-500 hover:bg-stone-100"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold py-4 rounded-2xl shadow-xl shadow-orange-100 transition-all duration-200 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {submitting ? "Processing..." : "Pay Now"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
