import { HouseIcon, FireIcon, GiftIcon, BankIcon, StorefrontIcon, type Icon } from "@phosphor-icons/react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

type Tab = {
    label: string;
    path: string;
    icon: Icon;
};

const TABS: Tab[] = [
    { label: "Home", path: "/", icon: HouseIcon },
    { label: "Book Puja", path: "/book-puja", icon: FireIcon },
    { label: "Shop", path: "/shop", icon: StorefrontIcon },
    { label: "Chadhava", path: "/chadhava", icon: GiftIcon },
    { label: "Kashi Ji", path: "/kashi", icon: BankIcon },
];

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleTabClick = (path: string) => {
        navigate(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-white border-t border-orange-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between px-2 pt-2 pb-2.5">
                {TABS.map(({ label, path, icon: TabIcon }) => {
                    const active = location.pathname === path;
                    const isShop = label === "Shop";

                    if (isShop) {
                        return (
                            <button
                                key={path}
                                onClick={() => handleTabClick(path)}
                                className="flex-1 flex flex-col items-center justify-end h-12 relative active:scale-95 transition-transform"
                            >
                                <motion.div
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.15 }}
                                    className={`flex items-center justify-center w-12 h-12 rounded-full absolute -top-5 border-4 border-white transition-all shadow-md ${
                                        active
                                            ? "bg-[#E05A10] text-white shadow-orange-500/40"
                                            : "bg-[#FFF2E6] text-orange-600 shadow-orange-100"
                                    }`}
                                >
                                    <TabIcon
                                        size={22}
                                        weight={active ? "fill" : "regular"}
                                    />
                                </motion.div>
                                <span
                                    className={`text-[10.5px] font-semibold transition-colors mt-auto ${
                                        active ? "text-orange-600" : "text-stone-400"
                                    }`}
                                >
                                    {label}
                                </span>
                            </button>
                        );
                    }

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
