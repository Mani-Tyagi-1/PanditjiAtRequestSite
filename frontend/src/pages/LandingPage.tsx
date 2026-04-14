import FeaturedPujas from "../components/BookingComponents/UpcomingPooja";
import HeroBanner from "../components/BookingComponents/HeroBanner";
import HowItWorks from "../components/BookingComponents/HowItWorksSection";
import RecomendedForYou from "../components/BookingComponents/RecomendedForYou";
import ServicesSection from "../components/BookingComponents/ServicesSection";
import WhyChooseUs from "../components/BookingComponents/WhyChoseUs";
import Footer from "../components/Footer";
import Testimonials from "../components/BookingComponents/Testimonials";
import BlogsPage from "../components/BookingComponents/BlogsPage";
import { Navigation } from "../components/NewComponents/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import ConsultancyModal from "../components/BookingComponents/ConsultancyModal";

export default function LandingPage() {
  const [showConsultancyPopup, setShowConsultancyPopup] = useState(false);
  const [showConsultancyModal, setShowConsultancyModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConsultancyPopup(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  /* ── App install popup (disabled) ────────────────────────────
  const [showAppPopup, setShowAppPopup] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => { setShowAppPopup(true); }, 2000);
    return () => clearTimeout(timer);
  }, []);
  ── end disabled block ── */

  useEffect(() => {
    if (window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: "Home Page",
        content_type: "website",
      });
    }
  }, []);

  return (
    <>
      {/* Consultancy form modal */}
      <ConsultancyModal isOpen={showConsultancyModal} onClose={() => setShowConsultancyModal(false)} />

      <AnimatePresence>
        {showConsultancyPopup && (
          <div className="fixed top-35 left-0 right-0 z-[100] flex justify-center px-2 pointer-events-none">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: -20 }}
              animate={{ scale: [1, 1.03, 1], opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{
                scale: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 0.3 },
                y: { duration: 0.3 },
              }}
              onClick={() => { setShowConsultancyModal(true); setShowConsultancyPopup(false); }}
              className="pointer-events-auto bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-3 flex items-center gap-3 border border-green-200 max-w-sm w-full cursor-pointer hover:bg-white transition-colors"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-gray-800 leading-tight">Get Expert Guidance — It's FREE!</h3>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">Talk to our pandit for the right pooja advice</p>
              </div>

              {/* CTA + close */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="bg-green-500 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-sm whitespace-nowrap">
                  Book FREE Call
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowConsultancyPopup(false); }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Navigation />
      <div className="w-full max-w-md mx-auto">
        <HeroBanner />
        <ServicesSection />
        <RecomendedForYou />
        <HowItWorks />
        <FeaturedPujas />
        <WhyChooseUs />
        <Testimonials />
        <BlogsPage />
        <Footer />
      </div>
    </>
  );
}
