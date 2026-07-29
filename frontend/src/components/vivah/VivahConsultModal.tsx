import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PhoneCall, Loader2 } from "lucide-react";
import API_URL from "../../utils/apiConfig";
import { VIVAH_CONSULT } from "../../data/vivahContent";
import { currentUser, pixelVivahLead } from "../../data/vivahApi";

/**
 * "Talk to a Pandit Ji — free" callback form.
 *
 * Posts the SAME body to the SAME endpoint as the app
 * (`POST /bookings/vedic-vivah/consultation`), so a website consultation lands
 * in `vedic_vivah_bookings` as `bookingType: "consultation"` exactly like an
 * app one — only `platform` differs ("web" vs "app"), and that is stamped
 * server-side.
 *
 * One deliberate improvement over the app: the app swallows a failed submit
 * with a console.log and no visible feedback. Here the family sees a real
 * error and can retry.
 */

const LABEL = "block text-[11.5px] font-semibold text-stone-500 mb-1.5";
const FIELD =
  "w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-[14px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all";

export default function VivahConsultModal({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  /** Called after a successful submit so the page can cancel its dwell nudge. */
  onSubmitted?: () => void;
}) {
  const user = currentUser();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Prefill from the signed-in family once the session hydrates.
  useEffect(() => {
    if (!open) return;
    const u = currentUser();
    setName((v) => v || u?.name || "");
    setPhone((v) => v || String(u?.phone || "").replace(/\D/g, "").slice(-10));
  }, [open]);

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!open && !success) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, success]);

  const valid =
    name.trim().length > 0 && phone.replace(/\D/g, "").length === 10 && city.trim().length > 0;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/bookings/vedic-vivah/consultation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?._id,
          devoteeName: name.trim(),
          whatsapp: phone.replace(/\D/g, ""),
          consultationMessage: message.trim(),
          address: {
            street: address.trim(),
            city: city.trim(),
            pincode: pincode.trim(),
            state: "",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.success !== true) {
        throw new Error(data?.message || "Please try again.");
      }
      pixelVivahLead("Free consultation");
      onSubmitted?.();
      onClose();
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || "Could not send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── The form sheet ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] px-0 sm:px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={VIVAH_CONSULT.title}
              className="w-full sm:max-w-lg bg-[#FFFDF9] rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-[#FFFDF9] px-5 pt-4 pb-3 border-b border-[#FFEFE2] rounded-t-3xl">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-200 sm:hidden" />
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h2
                      className="text-[20px] font-bold text-stone-800"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {VIVAH_CONSULT.title}
                    </h2>
                    <p className="text-[12.5px] text-stone-500 mt-0.5">{VIVAH_CONSULT.subtitle}</p>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center active:scale-90 transition-transform shrink-0"
                  >
                    <X className="w-4 h-4 text-stone-600" />
                  </button>
                </div>
              </div>

              <div className="px-5 py-4 space-y-3.5">
                <p className="text-[12.5px] leading-relaxed text-stone-600 bg-[#FFF6EC] border border-[#FFE3CC] rounded-2xl p-3.5">
                  {VIVAH_CONSULT.blurb}
                </p>

                <div>
                  <label className={LABEL}>Full Name</label>
                  <input
                    className={FIELD}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className={LABEL}>WhatsApp Number</label>
                  <input
                    className={FIELD}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile"
                    inputMode="numeric"
                    autoComplete="tel-national"
                  />
                </div>

                <div>
                  <label className={LABEL}>Address (where the ceremony will be held)</label>
                  <input
                    className={FIELD}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / street / area (optional)"
                    autoComplete="street-address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>City</label>
                    <input
                      className={FIELD}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      autoComplete="address-level2"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Pincode</label>
                    <input
                      className={FIELD}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Pincode"
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>What would you like help with? (optional)</label>
                  <textarea
                    className={`${FIELD} min-h-[84px] resize-y`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. muhurat dates, which rituals we need, our tradition…"
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="text-[12.5px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2"
                  >
                    {error}
                  </p>
                )}

                <button
                  onClick={submit}
                  disabled={!valid || submitting}
                  className="w-full bg-gradient-to-r from-[#E25800] to-[#FF8A2B] text-white font-bold text-[14.5px] py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-transform"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4" />
                      Request a free callback
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-stone-400 pb-2">
                  No login needed · No charge · Our Vivah expert will call you back.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success confirmation ── */}
      <AnimatePresence>
        {success && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm bg-[#FFFDF9] rounded-3xl p-6 text-center shadow-2xl"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
            >
              <div className="w-16 h-16 rounded-full bg-[#FFF0E2] mx-auto flex items-center justify-center text-[30px]">
                🙏
              </div>
              <h3
                className="text-[22px] font-bold text-stone-800 mt-4"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Request Received 🙏
              </h3>
              <p className="text-[13px] text-stone-500 mt-2 leading-relaxed">
                Our Vivah expert will call you back shortly. 🙏 We'll help you plan the muhurat, the
                rituals and everything your family needs.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-5 w-full bg-gradient-to-r from-[#E25800] to-[#FF8A2B] text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform"
              >
                Om Shubham 🪔
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
