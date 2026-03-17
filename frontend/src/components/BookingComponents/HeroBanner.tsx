import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import axios from "axios";

const navLinks = [
    { label: "Book Puja Now", href: "/" },
    { label: "Pandit Ji Registration", href: "/join-as-panditji#register-as-panditji", highlight: true },
    { label: "Booking Flow", href: "/join-as-panditji#booking-flow" },


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
            <div className="w-full" style={{ background: "linear-gradient(to bottom, #f3b287ff, #e8d19cff, #ffffff)" }}>
                <div className="w-full pt-3 md:pt-3 px-4 md:px-6 max-w-2xl mx-auto">
                    {/* Top Nav inside Hero Banner */}
                    <div className="flex items-center justify-between mb-4 relative z-20">
                        <motion.img
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.05 }}
                            src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
                            alt="Pandit Ji Logo"
                            className="w-16 h-16 object-contain cursor-pointer"
                            onClick={() => navigate('/')}
                        />

                        <div className="flex items-center gap-3">
                            {isLoggedIn ? (
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-sm border border-orange-200 text-orange-700 font-semibold shadow-sm hover:bg-orange-50 transition-colors"
                                >
                                    <FaUserCircle className="w-5 h-5" />
                                    <span className="text-sm">Profile</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="px-4 py-1.5 rounded-full bg-orange-600 text-white font-semibold text-sm shadow-md hover:bg-orange-700 transition-colors"
                                >
                                    Login
                                </button>
                            )}

                            {/* Hamburger Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                className="p-2 text-gray-800 hover:text-orange-600 transition-colors bg-white/50 backdrop-blur-sm rounded-full shadow-sm"
                            >
                                <FaBars className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-2 z-30">
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
                                    <a href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp">Download App Now</a>

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
                            className="fixed top-0 right-0 h-full w-[280px] bg-white shadow-2xl z-[100] flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-start justify-between p-6 border-b">
                                <div className="text-center w-full">
                                    <h2 className="text-xl font-semibold tracking-wide text-gray-900">
                                        Pandit Ji At Request
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        शुभ मुहूर्त • पूजा • मार्गदर्शन
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-2xl text-gray-600"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Drawer Links */}
                            <ul className="flex flex-col gap-2 p-6 flex-1">
                                {navLinks.map((link, index) => (
                                    <motion.li
                                        key={link.label}
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        {link.highlight ? (
                                            <a
                                                href={link.href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block bg-orange-500 text-white font-medium rounded-lg px-4 py-3 text-center shadow transition-all mt-2"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                to={link.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="block font-medium px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                                            >
                                                {link.label}
                                            </Link>
                                        )}
                                    </motion.li>
                                ))}
                            </ul>

                            {/* Drawer CTA */}
                            <div className="p-6 border-t gap-4 flex items-center justify-center flex-col">
                                <img src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/image%201520.png" alt="" />
                                <a
                                    href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full bg-red-600 text-white px-6 py-3 rounded-full font-semibold text-center shadow-md hover:bg-red-700 transition-all"
                                >
                                    Download App Now
                                </a>
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
