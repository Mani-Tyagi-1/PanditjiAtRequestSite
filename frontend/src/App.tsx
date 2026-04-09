import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Home";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DeleteMyAccount from "./pages/DeleteMyAccount";
import TermsAndConditions from "./pages/TermsAndConditions";
import { BookingFlow } from "./components/NewComponents/BookingFlow";
import LandingPage from "./pages/LandingPage";
import CategoryPage from "./components/BookingComponents/CategoryPage";
import PujaDetailPage from "./components/BookingComponents/PujaPage";
import ProfilePage from "./pages/ProfilePage";
import MyBookingsPage from "./pages/MyBookingsPage";
import VideoCallPage from "./video/VideoCallPage";
import AudioCallPage from "./video/AudioCallPage";
import TrackPanditPage from "./pages/TrackPanditPage";
import BlogDetailPage from "./pages/BlogDetailPage";

// Global Auth Context & Modal
import { AuthProvider } from "./context/AuthContext";
import LoginModal from "./components/Auth/LoginModal";
import PanditPrivacyPolicy from "./pages/PanditPrivacyPolicy";
import TermsAndConditionPandit from "./pages/TermsAndConditionPandit";

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

function App() {
  return (
    <AuthProvider>
      <LoginModal />
      <PixelPageTracker />
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/termsandconditions" element={<TermsAndConditions />} />
        <Route path="/privacypolicy-pandit" element={<PanditPrivacyPolicy />} />
        <Route path="/termsandconditions-pandit" element={<TermsAndConditionPandit />} />

        <Route path="/delete-my-account" element={<DeleteMyAccount />} />
        <Route path="/booking-flow" element={<BookingFlow />} />
        <Route path="/join-as-panditji" element={<Home />} />
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

        {/* <Route path="/.well-known/assetlinks.json" element={<assetlinks.json />} /> */}

        {/* Redirect example */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
