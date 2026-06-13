import { useState, useEffect } from "react";
import { X, Clock, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "🔥 Limited puja slots available today in selected cities",
  "⚡ Same-day booking available — Book now, pay later on WhatsApp",
  "🕉️ Festival muhurat slots filling fast — Reserve your puja now",
  "✅ Verified pandits available in your city — Slots open today",
  "🌍 NRI virtual puja slots available across 5000+ cities worldwide",
];

export function UrgencyBanner() {
  const [visible, setVisible] = useState(true);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-1.5 max-w-md mx-auto">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                <Flame className="w-3 h-3 text-yellow-300 animate-pulse" />
                <Clock className="w-3 h-3 text-orange-100" />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="text-white text-[11px] font-medium truncate"
                >
                  {MESSAGES[msgIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="ml-2 shrink-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
