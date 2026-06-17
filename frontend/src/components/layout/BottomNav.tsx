import { HouseIcon, FireIcon, GiftIcon, BankIcon, UserCircleIcon, type Icon } from "@phosphor-icons/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type Tab = {
    label: string;
    path: string;
    icon: Icon;
};

const TABS: Tab[] = [
    { label: "Home", path: "/", icon: HouseIcon },
    { label: "Book Puja", path: "/book-puja", icon: FireIcon },
    { label: "Chadhava", path: "/chadhava", icon: GiftIcon },
    { label: "Kashi Ji", path: "/kashi", icon: BankIcon },
    { label: "Account", path: "/account", icon: UserCircleIcon },
];

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, openLoginModal } = useAuth();

    const handleTabClick = (path: string) => {
        // Account tab requires login — show the login screen for logged-out users
        if (path === "/account" && !user) {
            openLoginModal();
            return;
        }
        navigate(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-white border-t border-orange-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="flex items-stretch justify-between px-2 pt-2 pb-2.5">
                {TABS.map(({ label, path, icon: TabIcon }) => {
                    const active = location.pathname === path;
                    return (
                        <button
                            key={path}
                            onClick={() => handleTabClick(path)}
                            className="flex-1 flex flex-col items-center gap-1 py-1 active:scale-95 transition-transform"
                        >
                            <TabIcon
                                size={23}
                                weight={active ? "fill" : "regular"}
                                className={`transition-colors ${active ? "text-orange-600" : "text-stone-400"}`}
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
