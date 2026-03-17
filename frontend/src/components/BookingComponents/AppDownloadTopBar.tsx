import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import { FaTimes } from "react-icons/fa";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.panditJiAtReqapp";

const marqueeItems = [
    // "🕉 Book Pandit Ji in minutes",
    // "✨ 5000+ Verified Pandits",
    // "🌟 10,000+ Bookings completed",
    "🌟Download the app now and get 20% off your first booking🌟",
];

export default function AppDownloadTopBar() {
    const [dismissed, _setDismissed] = useState(false);

    return (
        <AnimatePresence>
            {!dismissed && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div
                        className="relative w-full flex items-center justify-between px-3 py-2 gap-2"
                        style={{
                            background: "linear-gradient(90deg, #c2410c 0%, #ea580c 40%, #dc2626 100%)",
                        }}
                    >
                        {/* Subtle shimmer overlay */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background:
                                    "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
                                backgroundSize: "200% 100%",
                            }}
                            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Scrolling marquee text */}
                        <div className="flex-1 overflow-hidden relative">
                            <motion.div
                                className="flex gap-10 whitespace-nowrap"
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                            >
                                {[...marqueeItems, ...marqueeItems].map((item, i) => (
                                    <span
                                        key={i}
                                        className="text-white text-xs font-medium tracking-wide"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </motion.div>
                        </div>

                        {/* CTA Button */}
                        <motion.a
                            href={PLAY_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1.5 bg-white text-orange-700 text-[11px] font-bold px-3 py-1 rounded-full shadow-md hover:shadow-orange-200 transition-shadow z-10"
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            <motion.span
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                ↓
                            </motion.span>
                            Download App
                        </motion.a>

                        {/* Dismiss */}
                        {/* <button
                            onClick={() => setDismissed(true)}
                            className="shrink-0 text-white/70 hover:text-white transition-colors z-10 p-0.5"
                            aria-label="Dismiss"
                        >
                            <FaTimes className="w-3 h-3" />
                        </button> */}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
