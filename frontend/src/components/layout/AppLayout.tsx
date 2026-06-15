import { Outlet, useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";

const PANDIT_AVATAR =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png";

/**
 * App shell for the tabbed mobile experience: a mobile-width column with a
 * persistent bottom nav and the floating "Ask PanditJi" pill shown across tabs.
 */
export default function AppLayout() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full max-w-md mx-auto bg-[#FFFAF3] relative shadow-xl border-x border-orange-100/60">
            {/* Page content — padded so the bottom nav never overlaps it */}
            <div className="pb-24">
                <Outlet />
            </div>

            {/* Floating "Ask PanditJi" pill (constrained to the mobile column) */}
            <div className="fixed bottom-[84px] left-0 right-0 z-40 max-w-md mx-auto px-4 flex justify-end pointer-events-none">
                <button
                    onClick={() => navigate("/free-consultation")}
                    className="pointer-events-auto flex items-center gap-2 bg-white border-2 border-orange-300 rounded-full pl-1.5 pr-4 py-1.5 shadow-lg shadow-orange-200/60 active:scale-95 transition-transform"
                >
                    <img
                        src={PANDIT_AVATAR}
                        alt="Pandit Ji"
                        className="w-8 h-8 rounded-full object-contain bg-orange-50"
                    />
                    <span className="text-[13px] font-bold text-orange-600">Ask PanditJi</span>
                </button>
            </div>

            <BottomNav />
        </div>
    );
}
