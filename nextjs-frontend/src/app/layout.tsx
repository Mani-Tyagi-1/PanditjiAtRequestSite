import React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import ClientProviders from "../components/ClientProviders";

export const metadata: Metadata = {
  title: "Book Pandit Ji Online | Vedic Pujas, Chadhava & Astrological Services - PanditJi At Request",
  description:
    "Book verified Vedic Pandits for online & in-person pujas, sacred temple chadhava in Kashi & Ayodhya, and authentic spiritual items.",
  icons: {
    icon: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <noscript>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" />
        </noscript>
        <link
          rel="preconnect"
          href="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com" />
        <link rel="preconnect" href="https://images.weserv.nl" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased text-[#222222] bg-white" suppressHydrationWarning>
        {/* Fonts: injected as a non-render-blocking stylesheet (display=swap keeps text visible). */}
        <Script id="load-fonts" strategy="beforeInteractive">
          {`var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap';document.head.appendChild(l);`}
        </Script>

        {/* Google Consent Mode v2 */}
        <Script id="google-consent" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            gtag('consent', 'default', {
              ad_storage: 'granted',
              ad_user_data: 'granted',
              ad_personalization: 'granted',
              analytics_storage: 'granted',
              functionality_storage: 'granted',
              security_storage: 'granted'
            });
            gtag('set', 'url_passthrough', true);
            gtag('set', 'ads_data_redaction', true);
          `}
        </Script>

        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function (w, d, s, l, i) {
              w[l] = w[l] || []; w[l].push({
                'gtm.start': new Date().getTime(), event: 'gtm.js'
              }); var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
                'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
            })(window, document, 'script', 'dataLayer', 'GTM-MVRGQH4N');
          `}
        </Script>

        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MVRGQH4N"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <ClientProviders>
          <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            {children}
          </React.Suspense>
        </ClientProviders>
      </body>
    </html>
  );
}
