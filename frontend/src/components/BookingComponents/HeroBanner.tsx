import { useState } from "react";
import { MapPin, Search, ChevronDown, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    return (
        <div className="w-full" style={{ background: "linear-gradient(to bottom, #f3b287ff, #e8d19cff, #ffffff)" }}>
            <div className="w-full pt-3 md:pt-10 px-4 md:px-6 max-w-2xl mx-auto">
                {/* Location Bar + Language + Notification */}
                <div className="flex items-center justify-between mb-4">
                    {/* Location */}
                    <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-orange-600" />
                        <div>
                            <p className="text-sm font-semibold text-orange-600 leading-tight">
                                Current Location
                            </p>
                            <p className="text-xs text-gray-500">Add an address</p>
                        </div>
                    </div>

                    {/* Right side: Language + Bell */}
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-1 border border-black-700 rounded-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            English
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors">
                            <Bell className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Puja"
                        className="w-full pl-12 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                    />
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
                    <div className="relative z-10 p-5 md:p-8 flex flex-col justify-center min-h-[200px] max-w-[95%] md:max-w-[55%]">
                        <h2
                            className="text-lg md:text-2xl lg:text-3xl font-extrabold leading-tight mb-2"
                            style={{ color: "#2d1810" }}
                        >
                            BOOK PANDIT JI ONLINE & OFFLINE FOR ALL KIND OF POOJA!
                        </h2>
                        <p className="text-xs md:text-sm text-gray-700 mb-4 leading-relaxed">
                            Pandit Ji At Request — Your Trusted Partner for Vedic & Hindu Puja
                            Services.
                        </p>
                        <div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate("/booking-flow")}
                                className="inline-flex items-center bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                Book Pandit Ji
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroSection;
