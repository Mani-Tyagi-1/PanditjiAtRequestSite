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
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";

// Global Auth Context & Modal
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ShopifyCartProvider } from "./context/ShopifyCartContext";
import ShopifyCartDrawer from "./components/booking/Shop/ShopifyCartDrawer";
import AppDownloadModal from "./components/AppDownloadModal";
import AppLayout from "./components/layout/AppLayout";
import { useCurrencyRoot } from "./utils/currency";

/**
 * The login modal is the ONLY thing in App's eager import graph that pulls in
 * framer-motion, and framer-motion is a 113 KB / 37.5 KB gz chunk of its own
 * (see `manualChunks` in vite.config.ts). Imported statically it was
 * `modulepreload`ed into the critical path of EVERY route on the site — paid
 * before first paint by every devotee, on a modal most of them never open.
 *
 * Lazy alone would not have moved it: the modal was rendered unconditionally
 * and only returned null once inside, so React.lazy would have resolved the
 * chunk on first render anyway. `LazyLoginModal` below is what makes the split
 * real — it reads the open flag and mounts nothing at all until the modal is
 * actually asked for.
 */
const LoginModal = React.lazy(() => import("./components/auth/LoginModal"));

// Analytics: one module for GA4 + Google Ads + Meta. See utils/analytics.ts.
import analytics from "./utils/analytics";
import { captureAttribution } from "./utils/attribution";

/**
 * Mounts the login modal only while it is open, so its chunk (and
 * framer-motion behind it) is fetched on the tap that opens it rather than on
 * first paint. Must live inside <AuthProvider> — it reads that context.
 */
function LazyLoginModal() {
  const { isLoginModalOpen } = useAuth();
  if (!isLoginModalOpen) return null;
  return (
    <Suspense fallback={null}>
      <LoginModal />
    </Suspense>
  );
}

// Lazy load all other pages
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const DeleteMyAccount = React.lazy(() => import("./pages/DeleteMyAccount"));
const DeleteUserAccount = React.lazy(() => import("./pages/DeleteUserAccount"));
const TermsAndConditions = React.lazy(() => import("./pages/TermsAndConditions"));
const CategoryPage = React.lazy(() => import("./components/booking/CategoryPage"));
const PujaDetailPage = React.lazy(() => import("./components/booking/PujaPage"));
// Savan 2026 campaign — live. Comment these out together with the routes below
// to stop it and keep the pages out of the bundle.
const SavanPujaPage = React.lazy(() => import("./pages/SavanPujaPage"));
const SavanPujaBookingPage = React.lazy(() => import("./pages/SavanPujaBookingPage"));
const KaalBhairavPage = React.lazy(() => import("./pages/KaalBhairav"));
const KaalBhairavBookingPage = React.lazy(() => import("./pages/KaalBhairavBookingPage"));
const BankeBihariPage = React.lazy(() => import("./pages/BankeBihari"));
const BankeBihariBookingPage = React.lazy(() => import("./pages/BankeBihariBookingPage"));
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
// Vedic Vivah Sanskar — the guided marriage journey (parity with the app)
const VivahPage = React.lazy(() => import("./pages/VivahPage"));
const VivahPackageDetailPage = React.lazy(() => import("./pages/VivahPackageDetailPage"));
const VivahCheckoutPage = React.lazy(() => import("./pages/VivahCheckoutPage"));
const VivahBlogDetailPage = React.lazy(() => import("./pages/VivahBlogPage"));
const VivahGuidesListPage = React.lazy(() =>
  import("./pages/VivahBlogPage").then((m) => ({ default: m.VivahBlogListPage }))
);

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

/**
 * Fires a page view on every SPA route change, to GA4 (via dataLayer → GTM)
 * and to the Meta Pixel.
 *
 * Both platforms need this for the same reason: their base snippets report a
 * page view exactly once, when the container loads. On a single-page app that
 * happens on the first URL only, so without this every route after the landing
 * page is invisible to both.
 *
 * Keyed on search as well as pathname — /shop/all and /shop?q=rudraksh are
 * different pages to a marketer even though the pathname alone can't tell.
 */
function AnalyticsPageTracker() {
  const location = useLocation();
  useEffect(() => {
    analytics.pageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

/**
 * Records which campaign the devotee arrived on, for every page of every
 * visit, so the booking they eventually make can carry it.
 *
 * Mounted beside <ReferralCapture/> and doing a deliberately similar job, but
 * they are not interchangeable: `?ref=` is an OFFLINE partner tie-up that pays
 * a commission, while this is the paid/organic channel the click came from.
 * A booking can carry both, and the ad spend report needs this one.
 *
 * Keyed on `location.search` as well as the pathname because that is where the
 * UTM parameters live. Unlike <ReferralCapture/> this does NOT strip them from
 * the URL — GA4 and the ad platforms read the same parameters off the address
 * bar, and removing them would break their own attribution.
 */
function AttributionCapture() {
  const location = useLocation();
  useEffect(() => {
    captureAttribution();
  }, [location.pathname, location.search]);
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

// /vivah/package/:packageId → /vedic-vivah/package/:packageId. A plain <Navigate>
// can't carry the :packageId through, so this tiny component reads it and
// rebuilds the canonical URL (preserving any router state handed over).
function VivahPackageRedirect() {
  const { packageId } = useParams();
  const location = useLocation();
  return (
    <Navigate to={`/vedic-vivah/package/${packageId}`} replace state={location.state} />
  );
}

function App() {
  // The site's ONE currency subscription. Every price on every page is rendered
  // by a plain `money()` call rather than a hook, so this is what makes them all
  // repaint when the country changes — nothing here is React.memo'd, so the
  // re-render reaches the whole tree.
  useCurrencyRoot();

  return (
    <AuthProvider>
      <ShopifyCartProvider>
      <LazyLoginModal />
      <ShopifyCartDrawer />
      <ScrollToTop />
      <AnalyticsPageTracker />
      <AttributionCapture />
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
          {/* Savan 2026 — Mahadev Rudrabhishek at Shri Mahakaleshwar, Ujjain on
              the last Savan Somwar. To stop the campaign, comment this block out
              again (plus the lazy imports above) so all of these slugs fall
              through to the catch-all and land on the home page.

              The canonical slug is KASHI_MAHADEV_PUJA_SLUG in
              data/kashiMahadevPuja.ts — keep the path below and that constant
              the same string, or the page renders at one url and links to,
              canonicalises to and preloads another. */}
          <Route path="/mahakaal-savan-somwar-puja" element={<SavanPujaPage />} />
          <Route path="/mahakaal-savan-somwar-puja/booking" element={<SavanPujaBookingPage />} />
          {/* Short alias — easier to type/share in ads & WhatsApp */}
          <Route path="/savan-puja" element={<Navigate to="/mahakaal-savan-somwar-puja" replace />} />
          <Route path="/savan-puja/booking" element={<Navigate to="/mahakaal-savan-somwar-puja/booking" replace />} />
          {/* Earlier Kashi slug — the campaign ran here while the puja was at
              Kashi Vishwanath, so live ad links and WhatsApp shares still point
              at it. Redirect, never delete. */}
          <Route path="/kashi-mahadev-savan-puja" element={<Navigate to="/mahakaal-savan-somwar-puja" replace />} />
          <Route path="/kashi-mahadev-savan-puja/booking" element={<Navigate to="/mahakaal-savan-somwar-puja/booking" replace />} />
          {/* Kaal Bhairav — Kalashtami puja at Shri Kaal Bhairav Mandir, Kashi */}
          <Route path="/kashi-kaal-bhairav-puja" element={<KaalBhairavPage />} />
          <Route path="/kashi-kaal-bhairav-puja/booking" element={<KaalBhairavBookingPage />} />
          {/* Short alias — easier to type/share in ads & WhatsApp */}
          <Route path="/kaal-bhairav-puja" element={<Navigate to="/kashi-kaal-bhairav-puja" replace />} />
          <Route path="/kaal-bhairav-puja/booking" element={<Navigate to="/kashi-kaal-bhairav-puja/booking" replace />} />
          {/* Banke Bihari — Janmashtami puja at Shri Banke Bihari Ji Mandir, Vrindavan */}
          <Route path="/vrindavan-banke-bihari-puja" element={<BankeBihariPage />} />
          <Route path="/vrindavan-banke-bihari-puja/booking" element={<BankeBihariBookingPage />} />
          {/* Short aliases — easier to type/share in ads & WhatsApp */}
          <Route path="/banke-bihari-puja" element={<Navigate to="/vrindavan-banke-bihari-puja" replace />} />
          <Route path="/banke-bihari-puja/booking" element={<Navigate to="/vrindavan-banke-bihari-puja/booking" replace />} />
          <Route path="/janmashtami-puja" element={<Navigate to="/vrindavan-banke-bihari-puja" replace />} />
          <Route path="/janmashtami-puja/booking" element={<Navigate to="/vrindavan-banke-bihari-puja/booking" replace />} />
          {/* Hanuman — Bada Mangal puja at Shri Hanuman Garhi Mandir, Ayodhya */}
          <Route path="/ayodhya-hanuman-garhi-puja" element={<Hanumanjipage />} />
          <Route path="/ayodhya-hanuman-garhi-puja/booking" element={<HanumanBookingPage />} />
          {/* Short alias — easier to type/share in ads & WhatsApp */}
          <Route path="/hanuman-puja" element={<Navigate to="/ayodhya-hanuman-garhi-puja" replace />} />
          <Route path="/hanuman-puja/booking" element={<Navigate to="/ayodhya-hanuman-garhi-puja/booking" replace />} />
          {/* ── Vedic Vivah Sanskar ──────────────────────────────────────
              Canonical path is /vedic-vivah, matching the SEO canonicalUrl the
              admin catalog serves (and what the app's /seo endpoint returns).
              The shorter /vivah slugs are kept as redirects because they're
              easier to type in ads and WhatsApp. */}
          <Route path="/vedic-vivah" element={<VivahPage />} />
          <Route path="/vedic-vivah/checkout" element={<VivahCheckoutPage />} />
          <Route path="/vedic-vivah/package/:packageId" element={<VivahPackageDetailPage />} />
          {/* SEO guide hub — JSON-driven posts targeting vivah head keywords */}
          <Route path="/vedic-vivah/guides" element={<VivahGuidesListPage />} />
          <Route path="/vedic-vivah/guides/:slug" element={<VivahBlogDetailPage />} />
          <Route path="/vivah" element={<Navigate to="/vedic-vivah" replace />} />
          <Route path="/vivah/checkout" element={<Navigate to="/vedic-vivah/checkout" replace />} />
          <Route path="/vivah/package/:packageId" element={<VivahPackageRedirect />} />

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
