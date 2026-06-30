import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

// Click-to-chat support line (same number used across the site / schema).
const WHATSAPP_URL =
  "https://wa.me/919056955311?text=" +
  encodeURIComponent("🙏 Namaste! I have a question and would like to chat with Pandit Ji.");

/**
 * App shell for the tabbed mobile experience: a mobile-width column with a
 * persistent bottom nav and the floating WhatsApp "Chat with Pandit Ji" pill
 * shown across tabs (instant communication / trust signal).
 */
export default function AppLayout() {

  return (
    <div
      className="min-h-screen w-full bg-[#FFFBF7] flex justify-center items-stretch overflow-x-hidden"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 50%, rgba(255, 250, 240, 0.4) 0%, rgba(255, 235, 215, 0.7) 100%), url("/images/bg_main.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Centered Mobile Container */}
      <div className="min-h-screen w-full max-w-md bg-[#FFFAF3] relative shadow-[0_0_60px_rgba(224,90,16,0.15)] border-x border-[#FFEFE2] flex flex-col justify-between">
        {/* Page content — padded so the bottom nav never overlaps it */}
        <div className="pb-24 flex-1">
          <Outlet />
        </div>

        {/* Floating WhatsApp "Chat with Pandit Ji" pill (constrained to the mobile column) */}
        <div className="fixed bottom-[84px] left-0 right-0 z-40 max-w-md mx-auto px-4 flex justify-end pointer-events-none">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with Pandit Ji on WhatsApp"
            onClick={() => {
              if (window.fbq) {
                window.fbq("track", "Contact", {
                  content_name: "WhatsApp Chat",
                  content_type: "consultation",
                });
              }
            }}
            className="pointer-events-auto w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-green-500/40 active:scale-90 transition-transform cursor-pointer"
          >
            {/* WhatsApp glyph */}
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.09c-.25.69-1.45 1.32-1.99 1.36-.51.04-1.16.22-3.7-.77-3.11-1.23-5.1-4.42-5.26-4.63-.15-.21-1.26-1.67-1.26-3.18s.8-2.26 1.08-2.57c.28-.31.61-.39.81-.39.2 0 .41 0 .59.01.19.01.44-.07.69.53.25.6.85 2.08.93 2.23.07.15.12.33.02.53-.1.21-.15.34-.3.52-.15.18-.31.4-.44.54-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12 1 2.07 1.31 2.37 1.46.3.15.47.13.65-.08.18-.21.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.71.81 2.01.95.3.15.5.22.57.34.07.13.07.72-.18 1.41Z"/>
            </svg>
          </a>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
