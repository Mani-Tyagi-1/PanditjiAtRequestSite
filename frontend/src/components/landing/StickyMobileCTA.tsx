// import { motion } from "framer-motion";
import { Sparkles, Calendar } from "lucide-react";

export function StickyMobileCTA() {
  const handleScrollToPujas = () => {
    // Scroll smoothly to the Puja Categories/Listing Section
    const element = document.getElementById("pujas-section") || document.getElementById("featured-section") || document.querySelector("section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 500, behavior: "smooth" });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[80] md:hidden px-4 pb-4 pt-2 bg-gradient-to-t from-white via-white/95 to-transparent shrink-0">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-orange-100 p-3 shadow-[0_-12px_30px_rgba(249,115,22,0.08)] flex flex-col gap-2">
        {/* Urgent Note */}
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
          <p className="text-[9px] text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1">
            🔥 Slots filling fast in Delhi NCR <span className="text-orange-500 font-extrabold">• No Payment Upfront</span>
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleScrollToPujas}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:scale-[0.98] text-white font-extrabold text-xs py-3 rounded-xl shadow-md shadow-orange-100 flex items-center justify-center gap-2 uppercase tracking-wider transition-all"
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Reserve Your Puja Slot</span>
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
        </button>
      </div>
    </div>
  );
}