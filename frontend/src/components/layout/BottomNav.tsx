import { Home, Flower2, Gift, Landmark, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

type Tab = {
    label: string;
    path: string;
    icon: typeof Home;
};

const TABS: Tab[] = [
    { label: "Home", path: "/home", icon: Home },
    { label: "Book Puja", path: "/book-puja", icon: Flower2 },
    { label: "Chadhava", path: "/chadhava", icon: Gift },
    { label: "Kashi Ji", path: "/kashi", icon: Landmark },
    { label: "Account", path: "/account", icon: User },
];

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-white border-t border-orange-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="flex items-stretch justify-between px-2 pt-2 pb-2.5">
                {TABS.map(({ label, path, icon: Icon }) => {
                    const active = location.pathname === path;
                    return (
                        <button
                            key={path}
                            onClick={() => navigate(path)}
                            className="flex-1 flex flex-col items-center gap-1 py-1 active:scale-95 transition-transform"
                        >
                            <Icon
                                className={`w-[22px] h-[22px] transition-colors ${active ? "text-orange-600" : "text-stone-400"}`}
                                strokeWidth={active ? 2.4 : 2}
                            />
                            <span
                                className={`text-[10.5px] font-semibold transition-colors ${active ? "text-orange-600" : "text-stone-400"}`}
                            >
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
