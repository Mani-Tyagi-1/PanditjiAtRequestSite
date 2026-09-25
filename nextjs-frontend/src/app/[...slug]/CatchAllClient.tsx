"use client";

import React, { use } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

// Dynamically import specific pages
const ChadhavaBookingPage = dynamic(() => import("@/views/ChadhavaBookingPage"), { ssr: false });
const ChadhavaDetailPage = dynamic(() => import("@/views/ChadhavaDetailPage"), { ssr: false });
const LiveMandirBookingPage = dynamic(() => import("@/views/LiveMandirBookingPage"), { ssr: false });
const LiveMandirPujaDetailPage = dynamic(() => import("@/views/LiveMandirPujaDetailPage"), { ssr: false });
const HolyPanditDetailPage = dynamic(() => import("@/views/HolyPanditDetailPage"), { ssr: false });
const ShopProductDetailPage = dynamic(() => import("@/views/ShopProductDetailPage"), { ssr: false });
const ShopifyProductDetailPage = dynamic(() => import("@/views/ShopifyProductDetailPage"), { ssr: false });
const PujaEnquiryPage = dynamic(() => import("@/views/PujaEnquiryPage"), { ssr: false });
const VideoCallPage = dynamic(() => import("@/video/VideoCallPage"), { ssr: false });
const AudioCallPage = dynamic(() => import("@/video/AudioCallPage"), { ssr: false });
const TrackPanditPage = dynamic(() => import("@/views/TrackPanditPage"), { ssr: false });
const DeleteMyAccount = dynamic(() => import("@/views/DeleteMyAccount"), { ssr: false });
const DeleteUserAccount = dynamic(() => import("@/views/DeleteUserAccount"), { ssr: false });
const PanditPrivacyPolicy = dynamic(() => import("@/views/PanditPrivacyPolicy"), { ssr: false });
const TermsAndConditionPandit = dynamic(() => import("@/views/TermsAndConditionPandit"), { ssr: false });
const ExpiredPujaRedirectPage = dynamic(() => import("@/views/ExpiredPujaRedirectPage"), { ssr: false });

export default function CatchAllClient({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug || [];
  const router = useRouter();

  // Campaign redirects
  useEffect(() => {
    if (slug[0] === "vivah") {
      if (slug[1] === "checkout") {
        router.replace("/vedic-vivah/checkout");
      } else if (slug[1] === "package" && slug[2]) {
        router.replace(`/vedic-vivah/package/${slug[2]}`);
      } else {
        router.replace("/vedic-vivah");
      }
    } else if (slug[0] === "kaal-bhairav-puja") {
      if (slug[1] === "booking") {
        router.replace("/kashi-kaal-bhairav-puja/booking");
      } else {
        router.replace("/kashi-kaal-bhairav-puja");
      }
    } else if (slug[0] === "banke-bihari-puja" || slug[0] === "janmashtami-puja") {
      if (slug[1] === "booking") {
        router.replace("/vrindavan-banke-bihari-puja/booking");
      } else {
        router.replace("/vrindavan-banke-bihari-puja");
      }
    } else if (slug[0] === "hanuman-puja") {
      if (slug[1] === "booking") {
        router.replace("/ayodhya-hanuman-garhi-puja/booking");
      } else {
        router.replace("/ayodhya-hanuman-garhi-puja");
      }
    }
  }, [slug, router]);

  // Route matches
  if (slug[0] === "chadhava") {
    if (slug[2] === "booking") {
      return <ChadhavaBookingPage />;
    }
    if (slug[1]) {
      return <ChadhavaDetailPage />;
    }
  }

  if (slug[0] === "live-mandir-puja") {
    if (slug[2] === "booking") {
      return <LiveMandirBookingPage />;
    }
    if (slug[1]) {
      return <LiveMandirPujaDetailPage />;
    }
  }

  if (slug[0] === "holy-pandit" && slug[1]) {
    return <HolyPanditDetailPage />;
  }

  if (slug[0] === "shop-product" && slug[1]) {
    return <ShopProductDetailPage />;
  }

  if (slug[0] === "shop") {
    if (slug[1] === "product" && slug[2]) {
      return <ShopifyProductDetailPage />;
    }
    if (slug[1] && slug[2]) {
      return <ShopifyProductDetailPage />;
    }
  }

  if (slug[0] === "puja" && slug[2] === "enquiry") {
    return <PujaEnquiryPage />;
  }

  if (slug[0] === "video-call") {
    return <VideoCallPage />;
  }

  if (slug[0] === "audio-call") {
    return <AudioCallPage />;
  }

  if (slug[0] === "track-pandit") {
    return <TrackPanditPage />;
  }

  if (slug[0] === "delete-pandit-account") {
    return <DeleteMyAccount />;
  }

  if (slug[0] === "delete-my-account") {
    return <DeleteUserAccount />;
  }

  if (slug[0] === "privacypolicy-pandit") {
    return <PanditPrivacyPolicy />;
  }

  if (slug[0] === "termsandconditions-pandit") {
    return <TermsAndConditionPandit />;
  }

  if (
    slug[0] === "mahakaal-savan-somwar-puja" ||
    slug[0] === "savan-puja" ||
    slug[0] === "kashi-mahadev-savan-puja"
  ) {
    return <ExpiredPujaRedirectPage />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-4">The requested page does not exist.</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-orange-600 text-white font-medium rounded-lg shadow hover:bg-orange-700 transition"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
