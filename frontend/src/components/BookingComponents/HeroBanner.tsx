import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import axios from "axios";
import AppDownloadTopBar from "./AppDownloadTopBar";

const navLinks = [
    { label: "Profile", href: "/profile", icon: "👤" },
    { label: "My Bookings", href: "/my-bookings", icon: "📖" },
    { label: "Book Puja Now", href: "/category/685b290c922c7df97c114213", icon: "🪔" },
    { label: "Pandit Ji Registration", href: "/join-as-panditji#register-as-panditji", icon: "🙏" },
    { label: "Booking Flow", href: "/join-as-panditji#booking-flow", icon: "📋" },
];

const HeroSection = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [allPujas, setAllPujas] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Fetch all pujas for search
    useEffect(() => {
        const fetchAllPujas = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.0.188:8000/api';
                const { data } = await axios.get(`${apiUrl}/fetch-all-poojas`);
                if (data && data.poojas) {
                    setAllPujas(data.poojas);
                }
            } catch (err) {
                console.error("Error fetching pujas for search:", err);
            }
        };
        fetchAllPujas();
    }, []);

    // Filter pujas based on search query
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setSearchResults([]);
            return;
        }
        const filtered = allPujas.filter(puja =>
            puja.poojaNameEng.toLowerCase().includes(searchQuery.toLowerCase()) ||
            puja.poojaNameHindi.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 6)); // Limit to 6 results
    }, [searchQuery, allPujas]);

    // Login State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginStep, setLoginStep] = useState<1 | 2>(1);
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('user_token');
        const userData = localStorage.getItem('user_data');
        if (token && userData) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleSendOtp = async () => {
        if (phone.length !== 10) return alert("Please enter a valid 10-digit number.");
        setIsSubmitting(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.0.188:8000/api';
            await axios.post(`${apiUrl}/send-otp`, { phone, isNotifyOkay: true });
            setLoginStep(2);
        } catch (err) {
            console.error(err);
            alert("Failed to send OTP. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return alert("Please enter the OTP.");
        setIsSubmitting(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.0.188:8000/api';
            const { data } = await axios.post(`${apiUrl}/verify-otp`, { phone, otp });
            localStorage.setItem('user_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            setIsLoggedIn(true);
            setIsLoginModalOpen(false);
            setLoginStep(1);
            setPhone("");
            setOtp("");
        } catch (err) {
            console.error(err);
            alert("Incorrect or expired OTP.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (!isMenuOpen && !isLoginModalOpen) {
            document.body.style.overflow = "unset";
            return;
        }
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [isMenuOpen, isLoginModalOpen]);

    return (
        <>
            <AppDownloadTopBar />
            <div className="w-full" style={{ background: "linear-gradient(to bottom, #f3b287ff, #e8d19cff, #ffffff)" }}>
                <div className="w-full px-4 md:px-6 max-w-2xl mx-auto ">
                    {/* Top Nav inside Hero Banner */}
                    <div className="flex items-center justify-center gap-4 mb-1 relative z-20 ">
                        <motion.img
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.05 }}
                            src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
                            alt="Pandit Ji Logo"
                            className="w-16 h-16 object-contain cursor-pointer"
                            onClick={() => setIsMenuOpen(true)}
                        />

                        {/* Search Bar */}
                    <div className="relative w-full z-30">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Puja"
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                        />

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-80 overflow-y-auto"
                                >
                                    {searchResults.map((puja) => (
                                        <div
                                            key={puja._id}
                                            onClick={() => {
                                                navigate(`/puja/${puja._id}`);
                                                setSearchQuery("");
                                            }}
                                            className="flex items-center gap-3 p-3 hover:bg-orange-50 cursor-pointer transition-colors border-b last:border-0 border-gray-50"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-orange-50 overflow-hidden flex-shrink-0">
                                                <img
                                                    src={puja.poojaCardImage}
                                                    alt={puja.poojaNameEng}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">
                                                    {puja.poojaNameEng}
                                                </p>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {puja.poojaNameHindi}
                                                </p>
                                            </div>
                                            <div className="text-orange-600 font-bold text-xs">
                                                ₹{puja.poojaPriceOnline || puja.poojaPriceOffline}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                        <div className="flex items-center ">
                           

                            {/* Hamburger Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                className="p-2 text-gray-800 hover:text-orange-600 transition-colors "
                            >
                                <FaBars className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    

                    {/* Hero Banner Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="relative w-full rounded-2xl overflow-hidden shadow-lg"
                        style={{ maxHeight: "180px" }}
                    >
                        {/* Background Image */}
                        <img
                            src="https://media.istockphoto.com/id/2179080860/photo/close-up-of-oil-lamp-puja-thali-with-flower-and-indian-sweet-on-diwali-festival-in-india.webp?a=1&b=1&s=612x612&w=0&k=20&c=Yybxp1U4Xjoa9p2dOLnaOGYf3UKNVR93H9dybXdavdM="
                            alt="Sacred deity"
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Gradient Overlay — warm fade from left so text is readable */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    "linear-gradient(to right, #fef3e2 0%, #fef3e2e6 35%, #fde8c8aa 55%, transparent 70%)",
                            }}
                        />

                        {/* Text Content */}
                        <div className="relative z-10 p-3 md:p-3 flex flex-col justify-center min-h-[200px] max-w-[95%] md:max-w-[95%]">
                            <h2
                                className="text-lg md:text-lg lg:text-lg font-extrabold leading-tight mb-2"
                                style={{ color: "#2d1810" }}
                            >
                                BOOK PANDIT JI ONLINE & OFFLINE FOR ALL KIND OF POOJA!
                            </h2>
                            <p className="text-xs md:text-xs text-gray-700 mb-4 leading-relaxed">
                                Pandit Ji At Request — Your Trusted Partner for Vedic & Hindu Puja
                                Services.
                            </p>
                            <div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    // onClick={() => navigate("/booking-flow")}
                                    className="inline-flex items-center bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold px-5 py-2 rounded-lg shadow-md hover:shadow-md transition-all"
                                >
                                    <a href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp" target="_blank" rel="noopener noreferrer">
                                        Download App Now
                                    </a>

                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Mobile Nav Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99]"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-[300px] bg-[#FFFAF3] shadow-2xl z-[100] flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div
                                className="relative px-5 pt-6 pb-5"
                                style={{
                                    background: "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)",
                                }}
                            >
                                {/* Close button */}
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white/90 hover:bg-white/25 transition-colors"
                                >
                                    <FaTimes className="w-3.5 h-3.5" />
                                </button>

                                {/* Logo + brand */}
                                <div className="flex items-center gap-3 mb-3">
                                    <img
                                        src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
                                        alt="Logo"
                                        className="w-12 h-12 object-contain rounded-xl bg-white/20 p-1"
                                    />
                                    <div>
                                        <h2 className="text-base font-bold text-white leading-tight">
                                            Pandit Ji At Request
                                        </h2>
                                        <p className="text-[11px] text-orange-100 font-medium mt-0.5">
                                            शुभ मुहूर्त • पूजा • मार्गदर्शन
                                        </p>
                                    </div>
                                </div>

                                {/* Decorative divider */}
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-px bg-white/20" />
                                    <span className="text-white/50 text-[10px]">🕉</span>
                                    <div className="flex-1 h-px bg-white/20" />
                                </div>
                            </div>

                            {/* Navigation Links */}
                            <nav className="flex-1 px-4 py-4 overflow-y-auto">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 px-3 mb-2">
                                    Menu
                                </p>
                                <ul className="flex flex-col gap-1">
                                    {!isLoggedIn && (
                                        <li>
                                            <button
                                                onClick={() => { setIsMenuOpen(false); setIsLoginModalOpen(true); }}
                                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 hover:bg-orange-50 hover:text-orange-700 transition-colors group"
                                            >
                                                <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-orange-50 group-hover:bg-orange-100 text-base transition-colors flex-shrink-0">🔐</span>
                                                <span className="text-sm font-medium">Login / Register</span>
                                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-auto text-stone-300 group-hover:text-orange-400 transition-colors">
                                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </li>
                                    )}
                                    {navLinks
                                        .filter(link => isLoggedIn || (link.label !== "Profile" && link.label !== "My Bookings"))
                                        .map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                to={link.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 hover:bg-orange-50 hover:text-orange-700 transition-colors group"
                                            >
                                                <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-orange-50 group-hover:bg-orange-100 text-base transition-colors flex-shrink-0">
                                                    {link.icon}
                                                </span>
                                                <span className="text-sm font-medium">
                                                    {link.label}
                                                </span>
                                                <svg
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                    className="w-4 h-4 ml-auto text-stone-300 group-hover:text-orange-400 transition-colors"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>

                            {/* Drawer Footer CTA */}
                            <div className="p-4 border-t border-orange-100">
                                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 flex flex-col items-center gap-3">
                                    <a href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp" target="_blank" rel="noopener noreferrer">
                                        <img
                                            src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/image%201520.png"
                                            alt="App preview"
                                            className="h-16 object-contain"
                                        />
                                    </a>
                                    <p className="text-[11px] text-stone-500 text-center font-medium">
                                        Get ₹100 off your first booking
                                    </p>
                                    <a
                                        href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm text-center shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        Download App Now
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Login Modal Overlay */}
            <AnimatePresence>
                {isLoginModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center px-4"
                            onClick={() => {
                                if (!isSubmitting) setIsLoginModalOpen(false);
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
                            >
                                {/* Modal Header */}
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50">
                                    <h3 className="font-bold text-gray-800 text-lg">
                                        {loginStep === 1 ? "Login / Register" : "Verify OTP"}
                                    </h3>
                                    <button
                                        onClick={() => !isSubmitting && setIsLoginModalOpen(false)}
                                        className="p-1 rounded-full text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
                                        disabled={isSubmitting}
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6">
                                    {loginStep === 1 ? (
                                        <>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Enter your mobile number to get an OTP.
                                            </p>
                                            <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }}>
                                                <div className="relative mb-5">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                                                    <input
                                                        type="tel"
                                                        maxLength={10}
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                                        placeholder="Mobile Number"
                                                        className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-800 font-medium"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || phone.length !== 10}
                                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex justify-center items-center"
                                                >
                                                    {isSubmitting ? (
                                                        <span className="w-5 h-5 border-2 border-white/50 border-t-transparent rounded-full animate-spin"></span>
                                                    ) : "Send OTP"}
                                                </button>
                                            </form>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-500 mb-4">
                                                We sent a verification code to <span className="font-bold text-gray-800">+91 {phone}</span>
                                            </p>
                                            <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}>
                                                <div className="mb-5">
                                                    <input
                                                        type="text"
                                                        maxLength={4}
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                        placeholder="Enter OTP"
                                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-center text-lg tracking-[0.5em] font-bold text-gray-800"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || otp.length < 4}
                                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex justify-center items-center mb-3"
                                                >
                                                    {isSubmitting ? (
                                                        <span className="w-5 h-5 border-2 border-white/50 border-t-transparent rounded-full animate-spin"></span>
                                                    ) : "Verify & Login"}
                                                </button>
                                            </form>

                                            <div className="text-center">
                                                <button
                                                    onClick={() => setLoginStep(1)}
                                                    className="text-sm text-gray-500 hover:text-orange-600 underline"
                                                    disabled={isSubmitting}
                                                >
                                                    Change Number?
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default HeroSection;