"use client";

import React, { Suspense, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ShopifyCartProvider, useShopifyCart } from "../context/ShopifyCartContext";
import AppDownloadModal from "./AppDownloadModal";
import ConsentBanner from "./ConsentBanner";
import { useCurrencyRoot } from "../utils/currency";
import analytics from "../utils/analytics";
import { HelmetProvider } from "react-helmet-async";
import { LazyMotion } from "framer-motion";
import { useLocation, SearchParamsProvider } from "../compat/react-router-dom";

const loadMotionFeatures = () => import("./motionFeatures").then((mod) => mod.default);

const LoginModal = React.lazy(() => import("./auth/LoginModal"));
const ShopifyCartDrawer = React.lazy(() => import("./booking/Shop/ShopifyCartDrawer"));

// The drawer renders nothing while closed, so its code is only fetched the first time
// the cart is opened instead of shipping in every route's initial bundle.
function LazyCartDrawer() {
  const { isOpen } = useShopifyCart();
  const [hasOpened, setHasOpened] = useState(false);
  if (isOpen && !hasOpened) setHasOpened(true);
  if (!hasOpened) return null;
  return (
    <Suspense fallback={null}>
      <ShopifyCartDrawer />
    </Suspense>
  );
}

function LazyLoginModal() {
  const { isLoginModalOpen } = useAuth();
  if (!isLoginModalOpen) return null;
  return (
    <Suspense fallback={null}>
      <LoginModal />
    </Suspense>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash) return;
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
}

function AnalyticsPageTracker() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window !== "undefined") {
      analytics.pageView(location.pathname + location.search);
    }
  }, [location.pathname, location.search]);
  return null;
}

function ReferralCapture() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref && /^[A-Za-z0-9_-]{3,40}$/.test(ref)) {
      localStorage.setItem(
        "pjar_partner_ref",
        JSON.stringify({ code: ref, storedAt: Date.now() })
      );
      try {
        sessionStorage.setItem("pjar_ref_arrival", ref);
      } catch {
        // private mode
      }
      params.delete("ref");
      const newSearch = params.toString();
      window.history.replaceState(
        {},
        "",
        location.pathname + (newSearch ? `?${newSearch}` : "") + location.hash
      );
    }
  }, [location.search, location.pathname, location.hash]);
  return null;
}

function CurrencyInitializer() {
  useCurrencyRoot();
  return null;
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <SearchParamsProvider>
        <AuthProvider>
          <ShopifyCartProvider>
            <LazyMotion features={loadMotionFeatures} strict={false}>
            <CurrencyInitializer />
            <LazyLoginModal />
            <LazyCartDrawer />
            <Suspense fallback={null}>
              <ScrollToTop />
              <AnalyticsPageTracker />
              <ReferralCapture />
            </Suspense>
            <Suspense fallback={null}>
              <AppDownloadModal />
            </Suspense>
            <ConsentBanner />
            {children}
            </LazyMotion>
          </ShopifyCartProvider>
        </AuthProvider>
      </SearchParamsProvider>
    </HelmetProvider>
  );
}
