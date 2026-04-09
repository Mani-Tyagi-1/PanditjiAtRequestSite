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
import { X, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [showAppPopup, setShowAppPopup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAppPopup(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
      <AnimatePresence>
        {showAppPopup && (
          <div className="fixed top-35 left-0 right-0 z-[100] flex justify-center px-2 pointer-events-none">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: -20 }}
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: 1, 
                y: 0 
              }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{
                scale: {
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                opacity: { duration: 0.3 },
                y: { duration: 0.3 }
              }}
              onClick={() => window.open("https://play.google.com/store/apps/details?id=com.panditJiAtReqapp", "_blank")}
              className="pointer-events-auto bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-3 flex items-center gap-4 border border-orange-100 max-w-sm w-full cursor-pointer hover:bg-white transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Smartphone className="text-white w-6 h-6" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-xs font-bold text-gray-800">Better Experience on App</h3>
                <p className="text-[10px] text-gray-500">Faster booking & real-time updates</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-orange-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-sm">
                  INSTALL NOW 
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAppPopup(false);
                  }}
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
