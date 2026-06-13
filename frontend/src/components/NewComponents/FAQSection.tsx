import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, Sparkles } from "lucide-react";

const FAQS = [
  {
    question: "Is the Puja Samagri really included in the booking?",
    answer: "Yes, absolutely! We provide a complete, premium samagri kit (roli, chawal, incense, ghee, copper kalash, flowers, havan wood) aligned with shastrik vidhi. You do not need to buy anything yourself.",
  },
  {
    question: "How is payment collected if there is no upfront fee?",
    answer: "Bookings are 100% free to submit. Once we assign your Pandit Ji, you will receive a WhatsApp message with booking confirmation details. After the puja is completed successfully, you can pay directly via the secure link sent on WhatsApp.",
  },
  {
    question: "How are the Pandit Jis certified and verified?",
    answer: "Every Pandit Ji in our network has been trained at traditional Gurukuls or has graduated from Sanskrit universities. We strictly verify their chanting proficiency, background history, and identity credentials before onboarding.",
  },
  {
    question: "Can I reschedule or cancel my booking later?",
    answer: "Rescheduling or cancellation is fully flexible and free. You can coordinate your preferred timing directly with our support team or the assigned Pandit Ji via WhatsApp.",
  },
  {
    question: "How do virtual pujas work for NRIs or remote devotees?",
    answer: "For virtual pujas, we set up a dedicated HD live stream. The Pandit Ji performs the Sankalp in your family's name, chants the mantras, and walks you through the home offerings in real-time. Prasad is shipped to your international address afterwards.",
  },
];

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-8 px-4 bg-white rounded-3xl border border-orange-100/50 shadow-sm max-w-sm mx-auto my-6">
      <div className="text-center mb-6">
        <div className="flex items-center gap-2 justify-center mb-1">
          <div className="h-px w-6 bg-orange-300" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Doubts Resolved
          </span>
          <div className="h-px w-6 bg-orange-300" />
        </div>
        <h2 className="text-xl font-bold text-stone-800">
          Frequently Asked{" "}
          <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            Questions
          </span>
        </h2>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                isOpen ? "border-orange-300 bg-orange-50/10 shadow-sm" : "border-stone-150 bg-white"
              }`}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="text-xs font-bold text-stone-700 leading-snug">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-orange-500 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 pt-1 text-[11px] text-stone-500 leading-relaxed font-light border-t border-orange-50/50">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-5 text-center">
        <p className="text-[10px] text-stone-400 font-semibold flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-orange-500" /> Have more specific questions?
        </p>
        <a
          href="https://wa.me/919310065096?text=Namaste!%20I%20have%20some%20questions%20regarding%20puja%20bookings."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs font-bold text-orange-600 hover:text-orange-700 underline"
        >
          Chat directly with us on WhatsApp
        </a>
      </div>
    </section>
  );
}