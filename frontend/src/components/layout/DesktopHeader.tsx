import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    HouseIcon,
    FireIcon,
    GiftIcon,
    BankIcon,
    StorefrontIcon,
    PhoneCallIcon,
    UserCircleIcon,
    MagnifyingGlassIcon,
    WhatsappLogoIcon,
    CaretDownIcon,
    HeadsetIcon,
    CalendarCheckIcon,
    XIcon,
    type Icon,
} from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import API_URL from "../../utils/apiConfig";

const LOGO =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/pjar_logo-removebg-preview.png";

const WHATSAPP_URL =
    "https://wa.me/919056955311?text=" +
    encodeURIComponent("🙏 Namaste! I have a question and would like to chat with Pandit Ji.");

type NavItem = {
    label: string;
    path: string;
    icon: Icon;
    dropdown?: { label: string; to: string }[];
};

const NAV_ITEMS: NavItem[] = [
    { label: "Home", path: "/", icon: HouseIcon },
    {
        label: "Book Puja",
        path: "/book-puja",
        icon: FireIcon,
        dropdown: [
            { label: "At Home Puja", to: "/book-puja?tab=home" },
            { label: "Live Mandir Puja", to: "/book-puja?tab=mandir" },
            { label: "By Problem", to: "/book-puja?tab=problem" },
            { label: "Festival Specials", to: "/book-puja?tab=festival" },
        ],
    },
    {
        label: "Chadhava",
        path: "/chadhava",
        icon: GiftIcon,
        dropdown: [
            { label: "Festival Specials", to: "/chadhava?tab=festival" },
            { label: "Temple-wise", to: "/chadhava?tab=temple" },
            { label: "Upcoming", to: "/chadhava?tab=upcoming" },
            { label: "Live Chadhava", to: "/chadhava?tab=live" },
            { label: "Best Value", to: "/chadhava?tab=value" },
        ],
    },
    { label: "Kashi Ji", path: "/kashi", icon: BankIcon },
    { label: "Shop", path: "/shop", icon: StorefrontIcon },
    { label: "Consultation", path: "/paid-consultation", icon: HeadsetIcon },
    { label: "My Bookings", path: "/my-bookings", icon: CalendarCheckIcon },
];

type Pooja = {
    _id: string;
    poojaNameEng: string;
    poojaNameHindi?: string;
    poojaCardImage?: string;
    poojaPriceOnline?: number;
    poojaPriceOffline?: number;
};

/**
 * Shared top navigation for tablet/desktop (≥768px). Hidden on mobile, where
 * the bottom tab bar remains the primary navigation. Standalone pages (outside
 * the AppLayout shell) can render this directly — it hides itself below `md`.
 */
export default function DesktopHeader() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, openLoginModal, logout } = useAuth();

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [allPoojas, setAllPoojas] = useState<Pooja[] | null>(null);
    const [results, setResults] = useState<Pooja[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);
    const accountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
            if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    useEffect(() => {
        if (!searchOpen || allPoojas !== null) return;
        axios
            .get(`${API_URL}/fetch-all-poojas`)
            .then(({ data }) => setAllPoojas(data?.poojas || []))
            .catch(() => setAllPoojas([]));
    }, [searchOpen, allPoojas]);

    useEffect(() => {
        if (!allPoojas || !query.trim()) {
            setResults([]);
            return;
        }
        const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
        setResults(
            allPoojas
                .filter((p) => {
                    const name = p.poojaNameEng.toLowerCase();
                    const hindi = (p.poojaNameHindi || "").toLowerCase();
                    return tokens.every((t) => name.includes(t) || hindi.includes(t));
                })
                .slice(0, 6)
        );
    }, [query, allPoojas]);

    const priceOf = (p: Pooja) => p.poojaPriceOnline || p.poojaPriceOffline || 0;
    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="hidden md:block sticky top-0 z-40 bg-[#FFFAF3]/90 backdrop-blur-xl border-b border-orange-100/70 shadow-[0_2px_20px_rgba(224,90,16,0.06)]">
            {/* Decorative saffron strip */}
            <div className="h-0.5 bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600" />

            <div className="px-6 lg:px-10 h-[68px] flex items-center justify-between gap-3">
                {/* Logo */}
                <Link
                    to="/"
                    aria-label="Pandit Ji At Request — Home"
                    className="shrink-0 flex items-center hover:opacity-90 transition-opacity"
                >
                    <img
                        src={LOGO}
                        alt="Pandit Ji At Request"
                        className="h-11 lg:h-12 w-auto object-contain"
                    />
                </Link>

                {/* Primary navigation */}
                <nav aria-label="Primary" className="flex items-center gap-0.5 lg:gap-1">
                    {NAV_ITEMS.map(({ label, path, icon: NavIcon, dropdown }) => {
                        const active = isActive(path);
                        return (
                            <div
                                key={path}
                                className="relative"
                                onMouseEnter={() => dropdown && setOpenDropdown(label)}
                                onMouseLeave={() => dropdown && setOpenDropdown(null)}
                            >
                                <Link
                                    to={path}
                                    aria-current={active ? "page" : undefined}
                                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-full text-[13px] lg:text-[13.5px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                        active
                                            ? "bg-[#E05A10] text-white shadow-md shadow-orange-600/25"
                                            : "text-stone-600 hover:bg-orange-100/60 hover:text-orange-700"
                                    }`}
                                >
                                    <NavIcon size={16} weight={active ? "fill" : "regular"} />
                                    {label}
                                    {dropdown && <CaretDownIcon size={11} weight="bold" />}
                                </Link>

                                {dropdown && openDropdown === label && (
                                    <div className="absolute top-full left-0 pt-2 w-56 z-50">
                                        <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-2">
                                            {dropdown.map((item) => (
                                                <Link
                                                    key={item.to}
                                                    to={item.to}
                                                    className="block px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-orange-50 hover:text-orange-700 transition-colors cursor-pointer"
                                                >
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-2 lg:gap-2.5">
                    {/* Search */}
                    <div className="relative" ref={searchRef}>
                        <button
                            onClick={() => setSearchOpen((v) => !v)}
                            aria-label="Search poojas"
                            className="w-10 h-10 rounded-full bg-white border border-orange-100 flex items-center justify-center text-stone-600 hover:text-orange-700 hover:border-orange-200 hover:bg-orange-50 shadow-sm transition-all duration-200 cursor-pointer"
                        >
                            <MagnifyingGlassIcon size={18} />
                        </button>

                        {searchOpen && (
                            <div className="absolute top-full right-0 pt-2 w-[380px] z-50">
                                <div className="bg-white rounded-2xl shadow-2xl border border-orange-100 p-3">
                                    <div className="flex items-center gap-2 bg-orange-50/60 rounded-xl px-3.5 py-2.5 border border-orange-100">
                                        <MagnifyingGlassIcon size={17} className="text-stone-400 shrink-0" />
                                        <input
                                            autoFocus
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Search puja, temple, or seva…"
                                            className="w-full bg-transparent text-[13.5px] text-stone-800 placeholder-stone-400 outline-none"
                                        />
                                        {query && (
                                            <button onClick={() => setQuery("")} className="text-stone-400 hover:text-stone-600 cursor-pointer shrink-0">
                                                <XIcon size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {results.length > 0 && (
                                        <div className="mt-2 max-h-80 overflow-y-auto space-y-1">
                                            {results.map((p) => (
                                                <button
                                                    key={p._id}
                                                    onClick={() => {
                                                        setSearchOpen(false);
                                                        setQuery("");
                                                        navigate(`/puja/${p._id}`);
                                                    }}
                                                    className="w-full flex items-center gap-3 p-2 hover:bg-orange-50/60 rounded-xl transition-colors text-left cursor-pointer"
                                                >
                                                    <div className="w-11 h-11 rounded-lg bg-orange-100 overflow-hidden shrink-0">
                                                        {p.poojaCardImage && (
                                                            <img src={p.poojaCardImage} alt={p.poojaNameEng} className="w-full h-full object-cover" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-bold text-stone-800 truncate">{p.poojaNameEng}</p>
                                                    </div>
                                                    <span className="text-[13px] font-bold text-orange-600 shrink-0">₹{priceOf(p)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {query.trim() && results.length === 0 && (
                                        <p className="mt-3 text-[12.5px] text-stone-400 text-center py-2">
                                            No results found for "{query}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* WhatsApp */}
                    <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Chat on WhatsApp"
                        className="w-10 h-10 rounded-full bg-[#25D366]/12 border border-[#25D366]/25 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-all duration-200 cursor-pointer"
                    >
                        <WhatsappLogoIcon size={19} weight="fill" />
                    </a>

                    <Link
                        to="/paid-consultation"
                        className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[13.5px] font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                        <PhoneCallIcon size={17} weight="fill" />
                        Consult Now
                    </Link>

                    {/* Account */}
                    <div className="relative" ref={accountRef}>
                        <button
                            onClick={() => {
                                if (!user) {
                                    openLoginModal();
                                    return;
                                }
                                setAccountOpen((v) => !v);
                            }}
                            aria-label={user ? "Account menu" : "Login or register"}
                            title={user ? "My Account" : "Login / Register"}
                            className="flex items-center gap-1 pl-1 pr-1.5 lg:pr-2 h-10 rounded-full bg-white border border-orange-100 text-stone-600 hover:text-orange-700 hover:border-orange-200 hover:bg-orange-50 shadow-sm transition-all duration-200 cursor-pointer"
                        >
                            <UserCircleIcon size={25} weight={user ? "fill" : "regular"} />
                            {user && <CaretDownIcon size={11} weight="bold" className="hidden lg:block" />}
                        </button>

                        {user && accountOpen && (
                            <div className="absolute top-full right-0 pt-2 w-52 z-50">
                                <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-2">
                                    <p className="px-3.5 pt-2 pb-2 text-[12px] font-semibold text-stone-400 truncate border-b border-orange-50 mb-1">
                                        {user.name || user.phone}
                                    </p>
                                    <Link
                                        to="/account"
                                        onClick={() => setAccountOpen(false)}
                                        className="block px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-orange-50 hover:text-orange-700 transition-colors cursor-pointer"
                                    >
                                        My Profile
                                    </Link>
                                    <Link
                                        to="/my-bookings"
                                        onClick={() => setAccountOpen(false)}
                                        className="block px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-orange-50 hover:text-orange-700 transition-colors cursor-pointer"
                                    >
                                        My Bookings
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setAccountOpen(false);
                                            logout();
                                            navigate("/");
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
