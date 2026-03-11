import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DeleteMyAccount from "./pages/DeleteMyAccount";
import TermsAndConditions from "./pages/TermsAndConditions";
import { BookingFlow } from "./components/NewComponents/BookingFlow";
import LandingPage from "./pages/LandingPage";
import CategoryPage from "./components/BookingComponents/CategoryPage";
import PujaDetailPage from "./components/BookingComponents/PujaPage";
import ProfilePage from "./pages/ProfilePage";

// Global Auth Context & Modal
import { AuthProvider } from "./context/AuthContext";
import LoginModal from "./components/Auth/LoginModal";

function App() {
  return (
    <AuthProvider>
      <LoginModal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/termsandconditions" element={<TermsAndConditions />} />
        <Route path="/delete-my-account" element={<DeleteMyAccount />} />
        <Route path="/booking-flow" element={<BookingFlow />} />
        <Route path="/landing-page" element={<LandingPage />} />
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/puja" element={<PujaDetailPage />} />
        <Route path="/puja/:pujaId" element={<PujaDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* <Route path="/.well-known/assetlinks.json" element={<assetlinks.json />} /> */}

        {/* Redirect example */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
