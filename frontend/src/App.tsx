import React, { Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Global Auth Context & Modal
import { AuthProvider } from "./context/AuthContext";
import LoginModal from "./components/Auth/LoginModal";

// Eagerly load the critical path pages
import LandingPage from "./pages/LandingPage";

// Lazy load all other pages
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const DeleteMyAccount = React.lazy(() => import("./pages/DeleteMyAccount"));
const DeleteUserAccount = React.lazy(() => import("./pages/DeleteUserAccount"));
const TermsAndConditions = React.lazy(() => import("./pages/TermsAndConditions"));
const CategoryPage = React.lazy(() => import("./components/BookingComponents/CategoryPage"));
const PujaDetailPage = React.lazy(() => import("./components/BookingComponents/PujaPage"));
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
      <LoginModal />
      <PixelPageTracker />
      <ReferralCapture />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacypolicy" element={<PrivacyPolicy />} />
          <Route path="/termsandconditions" element={<TermsAndConditions />} />
          <Route path="/privacypolicy-pandit" element={<PanditPrivacyPolicy />} />
          <Route path="/termsandconditions-pandit" element={<TermsAndConditionPandit />} />
          <Route path="/delete-pandit-account" element={<DeleteMyAccount />} />
          <Route path="/delete-my-account" element={<DeleteUserAccount />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/puja" element={<PujaDetailPage />} />
          <Route path="/puja/:pujaId" element={<PujaDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/video-call/:callId/:panditId" element={<VideoCallPage />} />
          <Route path="/audio-call/:callId/:panditId" element={<AudioCallPage />} />
          <Route path="/track-pandit/:panditId/:destLat/:destLng" element={<TrackPanditPage />} />
          <Route path="/blog/:blogID" element={<BlogDetailPage />} />
          <Route path="/puja/:pujaId/enquiry" element={<PujaEnquiryPage />} />
          <Route path="/free-consultation" element={<FreeConsultationPage />} />
          <Route path="/paid-consultation" element={<PaidConsultationPage />} />
          {/* Pandit Listings & Profiles */}
          <Route path="/all-pandits" element={<AllPanditsPage />} />
          <Route path="/pandit/:panditId" element={<PanditDetailPage />} />

          {/* <Route path="/.well-known/assetlinks.json" element={<assetlinks.json />} /> */}

          {/* Redirect example */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
