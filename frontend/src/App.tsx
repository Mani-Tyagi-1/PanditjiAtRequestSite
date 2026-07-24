// import React, { Suspense, useEffect } from "react";
// import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// // Global Auth Context & Modal
// import { AuthProvider } from "./context/AuthContext";
// import LoginModal from "./components/auth/LoginModal";

// // Eagerly load the critical path pages
// import LandingPage from "./pages/LandingPage";

// // Lazy load all other pages
// const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
// const DeleteMyAccount = React.lazy(() => import("./pages/DeleteMyAccount"));
// const DeleteUserAccount = React.lazy(() => import("./pages/DeleteUserAccount"));
// const TermsAndConditions = React.lazy(() => import("./pages/TermsAndConditions"));
// const CategoryPage = React.lazy(() => import("./components/booking/CategoryPage"));
// const PujaDetailPage = React.lazy(() => import("./components/booking/PujaPage"));
// const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
// const MyBookingsPage = React.lazy(() => import("./pages/MyBookingsPage"));
// const VideoCallPage = React.lazy(() => import("./video/VideoCallPage"));
// const AudioCallPage = React.lazy(() => import("./video/AudioCallPage"));
// const TrackPanditPage = React.lazy(() => import("./pages/TrackPanditPage"));
// const BlogDetailPage = React.lazy(() => import("./pages/BlogDetailPage"));
// const PujaEnquiryPage = React.lazy(() => import("./pages/PujaEnquiryPage"));
// const AllPanditsPage = React.lazy(() => import("./pages/AllPanditsPage"));
// const PanditDetailPage = React.lazy(() => import("./pages/PanditDetailPage"));
// const PanditPrivacyPolicy = React.lazy(() => import("./pages/PanditPrivacyPolicy"));
// const TermsAndConditionPandit = React.lazy(() => import("./pages/TermsAndConditionPandit"));
// const FreeConsultationPage = React.lazy(() => import("./pages/FreeConsultationPage"));
// const PaidConsultationPage = React.lazy(() => import("./pages/PaidConsultationPage"));

// // Fires PageView on every SPA route change so Meta Pixel tracks all pages
// function PixelPageTracker() {
//   const location = useLocation();
//   useEffect(() => {
//     if (window.fbq) {
//       window.fbq("track", "PageView");
//     }
//   }, [location.pathname]);
//   return null;
// }

// // Captures ?ref=CODE from URL on any page and stores in localStorage for 2 days
// function ReferralCapture() {
//   const location = useLocation();
//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const ref = params.get("ref");
//     if (ref && /^[A-Za-z0-9_-]{3,40}$/.test(ref)) {
//       localStorage.setItem(
//         "pjar_partner_ref",
//         JSON.stringify({ code: ref, storedAt: Date.now() })
//       );
//       // Remove ?ref from URL without a page reload
//       params.delete("ref");
//       const newSearch = params.toString();
//       window.history.replaceState(
//         {},
//         "",
//         location.pathname + (newSearch ? `?${newSearch}` : "") + location.hash
//       );
//     }
//   }, [location.search]);
//   return null;
// }

// function App() {
//   return (
//     <AuthProvider>
//       <LoginModal />
//       <PixelPageTracker />
//       <ReferralCapture />
//       <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>}>
//         <Routes>
//           <Route path="/" element={<LandingPage />} />
//           <Route path="/privacypolicy" element={<PrivacyPolicy />} />
//           <Route path="/termsandconditions" element={<TermsAndConditions />} />
//           <Route path="/privacypolicy-pandit" element={<PanditPrivacyPolicy />} />
//           <Route path="/termsandconditions-pandit" element={<TermsAndConditionPandit />} />
//           <Route path="/delete-pandit-account" element={<DeleteMyAccount />} />
//           <Route path="/delete-my-account" element={<DeleteUserAccount />} />
//           <Route path="/category" element={<CategoryPage />} />
//           <Route path="/category/:categoryId" element={<CategoryPage />} />
//           <Route path="/puja" element={<PujaDetailPage />} />
//           <Route path="/puja/:pujaId" element={<PujaDetailPage />} />
//           <Route path="/profile" element={<ProfilePage />} />
//           <Route path="/my-bookings" element={<MyBookingsPage />} />
//           <Route path="/video-call/:callId/:panditId" element={<VideoCallPage />} />
//           <Route path="/audio-call/:callId/:panditId" element={<AudioCallPage />} />
//           <Route path="/track-pandit/:panditId/:destLat/:destLng" element={<TrackPanditPage />} />
//           <Route path="/blog/:blogID" element={<BlogDetailPage />} />
//           <Route path="/puja/:pujaId/enquiry" element={<PujaEnquiryPage />} />
//           <Route path="/free-consultation" element={<FreeConsultationPage />} />
//           <Route path="/paid-consultation" element={<PaidConsultationPage />} />
//           {/* Pandit Listings & Profiles */}
//           <Route path="/all-pandits" element={<AllPanditsPage />} />
//           <Route path="/pandit/:panditId" element={<PanditDetailPage />} />

//           {/* <Route path="/.well-known/assetlinks.json" element={<assetlinks.json />} /> */}

//           {/* Redirect example */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </Suspense>
//     </AuthProvider>
//   );
// }

// export default App;



import React, { Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Global Auth Context & Modal
import { AuthProvider } from "./context/AuthContext";
import { ShopifyCartProvider } from "./context/ShopifyCartContext";
import LoginModal from "./components/auth/LoginModal";
import ShopifyCartDrawer from "./components/booking/Shop/ShopifyCartDrawer";
import AppDownloadModal from "./components/AppDownloadModal";
import AppLayout from "./components/layout/AppLayout";

// Lazy load all other pages
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const DeleteMyAccount = React.lazy(() => import("./pages/DeleteMyAccount"));
const DeleteUserAccount = React.lazy(() => import("./pages/DeleteUserAccount"));
const TermsAndConditions = React.lazy(() => import("./pages/TermsAndConditions"));
const CategoryPage = React.lazy(() => import("./components/booking/CategoryPage"));
const PujaDetailPage = React.lazy(() => import("./components/booking/PujaPage"));
const SavanPujaPage = React.lazy(() => import("./pages/SavanPujaPage"));
const SavanPujaBookingPage = React.lazy(() => import("./pages/SavanPujaBookingPage"));
const KaalBhairavPage = React.lazy(() => import("./pages/KaalBhairav"));
const KaalBhairavBookingPage = React.lazy(() => import("./pages/KaalBhairavBookingPage"));
const Hanumanjipage = React.lazy(() => import("./pages/Hanumanjipage"));
const HanumanBookingPage = React.lazy(() => import("./pages/HanumanBookingPage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const MyBookingsPage = React.lazy(() => import("./pages/MyBookingsPage"));
const VideoCallPage = React.lazy(() => import("./video/VideoCallPage"));
const AudioCallPage = React.lazy(() => import("./video/AudioCallPage"));
const TrackPanditPage = React.lazy(() => import("./pages/TrackPanditPage"));
const BlogDetailPage = React.lazy(() => import("./pages/BlogDetailPage"));
const PujaEnquiryPage = React.lazy(() => import("./pages/PujaEnquiryPage"));
const AllPanditsPage = React.lazy(() => import("./pages/AllPanditsPage"));
const PanditDetailPage = React.lazy(() => import("./pages/PanditDetailPage"));
const PanditPrivacyPolicy = React.lazy(() => import("./pages/PanditPrivacyPolicy"));
const TermsAndConditionPandit = React.lazy(() => import("./pages/TermsAndConditionPandit"));
const FreeConsultationPage = React.lazy(() => import("./pages/FreeConsultationPage"));
const PaidConsultationPage = React.lazy(() => import("./pages/PaidConsultationPage"));
const LiveMandirPujaDetailPage = React.lazy(() => import("./pages/LiveMandirPujaDetailPage"));
const LiveMandirBookingPage = React.lazy(() => import("./pages/LiveMandirBookingPage"));
const HolyPanditDetailPage = React.lazy(() => import("./pages/HolyPanditDetailPage"));
const ChadhavaDetailPage = React.lazy(() => import("./pages/ChadhavaDetailPage"));
const ChadhavaBookingPage = React.lazy(() => import("./pages/ChadhavaBookingPage"));
const ShopProductDetailPage = React.lazy(() => import("./pages/ShopProductDetailPage"));
const ShopifyProductDetailPage = React.lazy(() => import("./pages/ShopifyProductDetailPage"));
const HomePage = React.lazy(() => import("./pages/HomePage"));
const BookPujaPage = React.lazy(() => import("./pages/BookPujaPage"));
const ChadhavaPage = React.lazy(() => import("./pages/ChadhavaPage"));
const KashiPage = React.lazy(() => import("./pages/KashiPage"));
const ShopPage = React.lazy(() => import("./pages/ShopPage"));
const BlogListPage = React.lazy(() => import("./pages/BlogListPage"));

// Resets scroll to the top on every route change so a new page never opens
// mid-way down (React Router otherwise keeps the previous scroll offset).
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Respect in-page anchor links (#section) — don't yank those to the top.
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Fires PageView on every SPA route change so Meta Pixel tracks all pages
function PixelPageTracker() {
  const location = useLocation();
  useEffect(() => {
    if (window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [location.pathname]);
  return null;
}

// Captures ?ref=CODE from URL on any page and stores in localStorage for 2 days
function ReferralCapture() {
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref && /^[A-Za-z0-9_-]{3,40}$/.test(ref)) {
      localStorage.setItem(
        "pjar_partner_ref",
        JSON.stringify({ code: ref, storedAt: Date.now() })
      );
      // This is the last code that can still see ?ref= before the URL is rewritten below,
      // so record the arrival here. `pjar_partner_ref` above outlives the visit by design
      // (checkout attribution) and must never be used to decide whether someone *just*
      // arrived via an invite — this marker is what AppDownloadModal gates on.
      try {
        sessionStorage.setItem("pjar_ref_arrival", ref);
      } catch {
        /* private mode — modal falls back to reading ?ref= off the URL */
      }
      // Remove ?ref from URL without a page reload
      params.delete("ref");
      const newSearch = params.toString();
      window.history.replaceState(
        {},
        "",
        location.pathname + (newSearch ? `?${newSearch}` : "") + location.hash
      );
    }
  }, [location.search]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <ShopifyCartProvider>
      <LoginModal />
      <ShopifyCartDrawer />
      <ScrollToTop />
      <PixelPageTracker />
      <ReferralCapture />
      <AppDownloadModal />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>}>
        <Routes>
          {/* App shell with persistent bottom nav */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/book-puja" element={<BookPujaPage />} />
            <Route path="/chadhava" element={<ChadhavaPage />} />
            <Route path="/kashi" element={<KashiPage />} />
            <Route path="/shop" element={<ShopPage />} />
            {/* Selected category lives in the URL, e.g. /shop/rudraksh, /shop/all */}
            <Route path="/shop/:category" element={<ShopPage />} />
            <Route path="/account" element={<ProfilePage />} />
          </Route>

          <Route path="/privacypolicy" element={<PrivacyPolicy />} />
          <Route path="/termsandconditions" element={<TermsAndConditions />} />
          <Route path="/privacypolicy-pandit" element={<PanditPrivacyPolicy />} />
          <Route path="/termsandconditions-pandit" element={<TermsAndConditionPandit />} />
          <Route path="/delete-pandit-account" element={<DeleteMyAccount />} />
          <Route path="/delete-my-account" element={<DeleteUserAccount />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/puja" element={<PujaDetailPage />} />
          {/* Retired campaign (Maa Chintpurni / Shri Durga Mata) — the dedicated
              pages are gone, but these slugs were used in ads and WhatsApp
              shares, so send that traffic to the puja catalog instead of 404. */}
          <Route path="/maa-chintpurni-puja" element={<Navigate to="/puja" replace />} />
          <Route path="/maa-chintpurni-puja/booking" element={<Navigate to="/puja" replace />} />
          <Route path="/shri-durga-mata-puja-home" element={<Navigate to="/puja" replace />} />
          <Route path="/shri-durga-mata-puja-home/booking" element={<Navigate to="/puja" replace />} />
          {/* Savan 2026 — Mahadev Rudrabhishek at Kashi on the first Savan Somwar */}
          <Route path="/kashi-mahadev-savan-puja" element={<SavanPujaPage />} />
          <Route path="/kashi-mahadev-savan-puja/booking" element={<SavanPujaBookingPage />} />
          {/* Short alias — easier to type/share in ads & WhatsApp */}
          <Route path="/savan-puja" element={<Navigate to="/kashi-mahadev-savan-puja" replace />} />
          <Route path="/savan-puja/booking" element={<Navigate to="/kashi-mahadev-savan-puja/booking" replace />} />
          {/* Earlier Ujjain slug — redirect so any shared links keep working */}
          <Route path="/mahakaal-savan-somwar-puja" element={<Navigate to="/kashi-mahadev-savan-puja" replace />} />
          <Route path="/mahakaal-savan-somwar-puja/booking" element={<Navigate to="/kashi-mahadev-savan-puja/booking" replace />} />
          {/* Kaal Bhairav — Kalashtami puja at Shri Kaal Bhairav Mandir, Kashi */}
          <Route path="/kashi-kaal-bhairav-puja" element={<KaalBhairavPage />} />
          <Route path="/kashi-kaal-bhairav-puja/booking" element={<KaalBhairavBookingPage />} />
          {/* Short alias — easier to type/share in ads & WhatsApp */}
          <Route path="/kaal-bhairav-puja" element={<Navigate to="/kashi-kaal-bhairav-puja" replace />} />
          <Route path="/kaal-bhairav-puja/booking" element={<Navigate to="/kashi-kaal-bhairav-puja/booking" replace />} />
          {/* Hanuman — Bada Mangal puja at Shri Hanuman Garhi Mandir, Ayodhya */}
          <Route path="/ayodhya-hanuman-garhi-puja" element={<Hanumanjipage />} />
          <Route path="/ayodhya-hanuman-garhi-puja/booking" element={<HanumanBookingPage />} />
          {/* Short alias — easier to type/share in ads & WhatsApp */}
          <Route path="/hanuman-puja" element={<Navigate to="/ayodhya-hanuman-garhi-puja" replace />} />
          <Route path="/hanuman-puja/booking" element={<Navigate to="/ayodhya-hanuman-garhi-puja/booking" replace />} />
          <Route path="/puja/:pujaId" element={<PujaDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/video-call/:callId/:panditId" element={<VideoCallPage />} />
          <Route path="/audio-call/:callId/:panditId" element={<AudioCallPage />} />
          <Route path="/track-pandit/:panditId/:destLat/:destLng" element={<TrackPanditPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:blogID" element={<BlogDetailPage />} />
          <Route path="/puja/:pujaId/enquiry" element={<PujaEnquiryPage />} />
          <Route path="/free-consultation" element={<FreeConsultationPage />} />
          <Route path="/paid-consultation" element={<PaidConsultationPage />} />
          {/* Pandit Listings & Profiles */}
          <Route path="/all-pandits" element={<AllPanditsPage />} />
          <Route path="/pandit/:panditId" element={<PanditDetailPage />} />

          {/* Detail pages for dynamic sharing */}
          <Route path="/live-mandir-puja/:slug/booking" element={<LiveMandirBookingPage />} />
          <Route path="/live-mandir-puja/:slug" element={<LiveMandirPujaDetailPage />} />
          <Route path="/holy-pandit/:slug" element={<HolyPanditDetailPage />} />
          <Route path="/chadhava/:slug/booking" element={<ChadhavaBookingPage />} />
          <Route path="/chadhava/:slug" element={<ChadhavaDetailPage />} />
          <Route path="/shop-product/:slug" element={<ShopProductDetailPage />} />
          {/* Legacy product URL — kept so already-shared links keep working */}
          <Route path="/shop/product/:handle" element={<ShopifyProductDetailPage />} />
          {/* Current shape: /shop/<category>/<product-handle> */}
          <Route path="/shop/:category/:handle" element={<ShopifyProductDetailPage />} />

          {/* <Route path="/.well-known/assetlinks.json" element={<assetlinks.json />} /> */}

          {/* Redirect example */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </ShopifyCartProvider>
    </AuthProvider>
  );
}

export default App;
