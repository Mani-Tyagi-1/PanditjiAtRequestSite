// import FeaturedPujas from "../components/BookingComponents/UpcomingPooja";
import HeroBanner from "../components/BookingComponents/HeroBanner";
import HowItWorks from "../components/BookingComponents/HowItWorksSection";
import RecomendedForYou from "../components/BookingComponents/RecomendedForYou";
import ServicesSection from "../components/BookingComponents/ServicesSection";
// import WhyChooseUs from "../components/BookingComponents/WhyChoseUs";
import Footer from "../components/Footer";
import Testimonials from "../components/BookingComponents/Testimonials";
import BlogsPage from "../components/BookingComponents/BlogsPage";
import { Navigation } from "../components/NewComponents/Navigation";
// import { DeathRituals } from "../components/NewComponents/DeathRituals";
import { PanditSection } from "../components/NewComponents/PanditSection";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConsultancyModal from "../components/BookingComponents/ConsultancyModal";
import { Helmet } from "react-helmet-async";

// Import new conversion & trust components
import { UrgencyBanner } from "../components/NewComponents/UrgencyBanner";
import { ServiceCitiesSection } from "../components/NewComponents/ServiceCitiesSection";
import { SamagriIncludedSection } from "../components/NewComponents/SamagriIncludedSection";
// import { PanditTrustSection } from "../components/NewComponents/PanditTrustSection";
// import { NRIVirtualPujaSection } from "../components/NewComponents/NRIVirtualPujaSection";
import { PreviousPujaVideosSection } from "../components/NewComponents/PreviousPujaVideosSection";
import { FAQSection } from "../components/NewComponents/FAQSection";
import { StickyMobileCTA } from "../components/NewComponents/StickyMobileCTA";

export default function LandingPage() {
  const navigate = useNavigate();
  const [showConsultancyPopup, setShowConsultancyPopup] = useState(false);
  const [showConsultancySection, setShowConsultancySection] = useState(false);
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
      <Helmet>
        <title>Book Pandit Ji Online for Pooja at Home | Pandit Ji At Request</title>
        <meta name="description" content="Book verified Pandit Ji online for home pooja, havan, rituals, consultation, and online/offline puja services. Pandit Ji At Request makes pooja booking easy, trusted, and convenient." />
        <meta name="keywords" content="book pandit ji online, pandit ji booking, pandit near me, pooja booking online, book pandit for pooja, pandit for home pooja, online pandit ji consultation, havan booking, griha pravesh pandit, satyanarayan pooja pandit, hindu pooja services, online pooja booking, pandit ji at request" />
      </Helmet>

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
              onClick={() => { navigate("/paid-consultation"); setShowConsultancyPopup(false); }}
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
                <h3 className="text-xs font-bold text-gray-800 leading-tight">Book Personalised Consultation</h3>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">Get dedicated guidance from our pandit</p>
              </div>

              {/* CTA + close */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="bg-green-500 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-sm whitespace-nowrap">
                  Consult Now
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConsultancyPopup(false);
                    setShowConsultancySection(true);
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

      <UrgencyBanner />
      <Navigation />
      <div className="w-full max-w-md relative">
        <HeroBanner />
        {showConsultancySection && (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="px-4 pt-2 pb-2 "
          >
            <div
              onClick={() => navigate("/paid-consultation")}
              className="bg-white border border-green-200 rounded-2xl p-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] grid grid-cols-[44px_minmax(0,1fr)] gap-3 cursor-pointer hover:bg-green-50/40 transition-colors"
            >
              <div className="w-9 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-800 leading-snug">
                  Book Your Consultation
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-snug">
                  Get dedicated guidance from our pandit
                </p>
              </div>

              <span className="col-span-2 w-full bg-green-500 text-white text-xs font-bold px-3 py-2.5 rounded-lg shadow-sm text-center">
                Book your Personal Consultant Now
              </span>
            </div>
          </motion.section>
        )}
        <ServicesSection />
        {/* <DeathRituals /> */}
        <ServiceCitiesSection />
        <RecomendedForYou />
        <HowItWorks />
        {/* <FeaturedPujas /> */}
        {/* <PanditTrustSection /> */}
        <SamagriIncludedSection />
        {/* <NRIVirtualPujaSection /> */}
        <PreviousPujaVideosSection />
        <PanditSection />
        {/* <WhyChooseUs /> */}
        <Testimonials />
        <FAQSection />
        <BlogsPage />
        <Footer />
        
        {/* Floating WhatsApp Support Bubble */}
        <a
          href="https://wa.me/919310065096?text=Namaste!%20I%20have%20a%20question%20about%20booking%20a%20puja."
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-4 z-[90] bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 rounded-full shadow-xl shadow-green-200/50 hover:shadow-green-300 transition-all duration-300 transform hover:scale-105 active:scale-95 animate-bounce md:hidden flex items-center justify-center border border-white"
        >
          <svg className="w-5.5 h-5.5 fill-white" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.713-1.463L0 24zm6.75-2.885c1.62.962 3.21 1.484 4.957 1.485 5.567 0 10.09-4.517 10.093-10.088a9.883 9.883 0 0 0-2.91-7.103 9.873 9.873 0 0 0-7.11-2.909c-5.57 0-10.093 4.518-10.097 10.093-.001 1.868.49 3.698 1.42 5.305L1.31 22.69l6.5-.758.003-.003-.006-.118zM8.618 6.425c.15-.327.306-.333.447-.333.116-.005.249-.005.382-.005.133 0 .349.05.531.25.183.2.73 1.78.796 1.913.067.133.11.29.022.464-.088.174-.133.278-.266.432-.133.154-.279.344-.398.462-.133.133-.272.278-.116.54.156.262.693 1.14 1.485 1.844.974.867 1.792 1.14 2.058 1.273.266.133.42.11.576-.067.156-.178.664-.772.842-1.035.178-.263.354-.22.597-.13.243.088 1.543.727 1.81.859.266.133.443.2.509.31.066.11.066.64-.155 1.263-.221.623-1.284 1.219-1.77 1.265-.487.046-.942-.11-2.993-.91-2.47-.963-4.05-3.522-4.172-3.687-.122-.165-.968-1.284-.968-2.45 0-1.165.61-1.737.828-1.979z"/>
          </svg>
        </a>

        {/* Sticky Mobile CTA */}
        <StickyMobileCTA />
      </div>
    </>
  );
}
