import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

const PANDIT_AVATAR =
  "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png";

/**
 * App shell for the tabbed mobile experience: a mobile-width column with a
 * persistent bottom nav and the floating "Ask PanditJi" pill shown across tabs.
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

        {/* Floating "Ask PanditJi" pill (constrained to the mobile column) */}
        <div className="fixed bottom-[84px] left-0 right-0 z-40 max-w-md mx-auto px-4 flex justify-end pointer-events-none">
          <a
            href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (window.fbq) {
                window.fbq("track", "Ask PanditJi", {
                  content_name: "Ask PanditJi",
                  content_type: "consultation",
                });
              }
            }}
            className="pointer-events-auto flex items-center gap-2 bg-white border-2 border-orange-300 rounded-full pl-1.5 pr-4 py-1.5 shadow-lg shadow-orange-200/60 active:scale-95 transition-transform cursor-pointer"
          >
            <img
              src={PANDIT_AVATAR}
              alt="Pandit Ji"
              className="w-8 h-8 rounded-full object-contain bg-orange-50"
            />
            <span className="text-[13px] font-bold text-orange-600">
              Ask PanditJi
            </span>
          </a>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
