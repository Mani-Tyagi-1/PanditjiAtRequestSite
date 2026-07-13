import { motion } from "framer-motion";
import { Check, ShoppingBag, Truck, PackageCheck } from "lucide-react";

interface OrderSuccessModalProps {
    mode: "online" | "cod";
    onContinueShopping: () => void;
    onSeeOrders: () => void;
}

const CONFETTI_COLORS = ["#F97316", "#FBBF24", "#34D399", "#60A5FA", "#F472B6", "#A78BFA"];

// Deterministic-enough confetti pieces; randomised per mount for a lively burst.
const CONFETTI = Array.from({ length: 44 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.2 + Math.random() * 1.8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 6,
    rotate: Math.random() * 360,
    round: i % 3 === 0,
}));

// A celebratory order-confirmation modal shown after both prepaid and COD orders.
export default function OrderSuccessModal({ mode, onContinueShopping, onSeeOrders }: OrderSuccessModalProps) {
    const isCod = mode === "cod";

    return (
        <div className="fixed inset-0 z-[400] max-w-md mx-auto flex items-center justify-center p-5 md:max-w-none md:p-6">
            <style>{`
                @keyframes pjar-confetti-fall {
                    0%   { transform: translateY(-12vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
                }
            `}</style>

            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

            {/* Confetti layer */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {CONFETTI.map((c, i) => (
                    <span
                        key={i}
                        style={{
                            position: "absolute",
                            top: "-5vh",
                            left: `${c.left}%`,
                            width: c.size,
                            height: c.size,
                            backgroundColor: c.color,
                            borderRadius: c.round ? "9999px" : "2px",
                            transform: `rotate(${c.rotate}deg)`,
                            animation: `pjar-confetti-fall ${c.duration}s linear ${c.delay}s infinite`,
                        }}
                    />
                ))}
            </div>

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="relative w-full bg-[#FFFAF3] rounded-3xl shadow-2xl p-7 text-center overflow-hidden md:max-w-md lg:max-w-lg md:p-10"
            >
                {/* Animated badge */}
                <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
                    className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-inner"
                >
                    <Check className="w-10 h-10" strokeWidth={3} />
                </motion.div>

                <p className="text-3xl mb-1">🎉</p>
                <h2 className="text-2xl font-bold text-stone-850 md:text-3xl md:tracking-tight">Congratulations!</h2>
                <p className="text-[13px] font-bold text-orange-600 mt-1">
                    {isCod ? "Your COD order is placed" : "Your order is confirmed"}
                </p>

                <p className="text-[13px] text-stone-500 leading-relaxed mt-3 px-1">
                    {isCod ? (
                        <>Thank you for shopping with us! 🚚 Pay in cash when it arrives — you'll receive your order soon at your doorstep.</>
                    ) : (
                        <>Thank you! Your payment was successful and your order is on its way. You'll receive it soon at your doorstep.</>
                    )}
                </p>

                {/* Little status pill */}
                <div className="mt-4 inline-flex items-center gap-2 bg-white border border-orange-100 rounded-full px-3.5 py-1.5 shadow-xs">
                    {isCod ? <Truck className="w-4 h-4 text-orange-500" /> : <PackageCheck className="w-4 h-4 text-emerald-500" />}
                    <span className="text-[11.5px] font-semibold text-stone-600">
                        {isCod ? "Order placed · Pay on delivery" : "Payment received · Order confirmed"}
                    </span>
                </div>

                {/* Buttons */}
                <div className="mt-6 space-y-2.5">
                    <button
                        type="button"
                        onClick={onSeeOrders}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-orange-100 active:scale-95 transition-all text-sm cursor-pointer md:hover:shadow-lg md:hover:brightness-105"
                    >
                        See My Orders
                    </button>
                    <button
                        type="button"
                        onClick={onContinueShopping}
                        className="w-full bg-white border-2 border-orange-200 text-orange-600 font-bold py-3 rounded-2xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer md:hover:bg-orange-50 md:hover:border-orange-300"
                    >
                        <ShoppingBag className="w-4 h-4" /> Continue Shopping
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
