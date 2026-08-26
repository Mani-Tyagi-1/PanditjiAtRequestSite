import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useRef } from "react";

const VISIBLE_MS = 3500;

export default function MahakaalCompletionPopup({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => onCloseRef.current(), VISIBLE_MS);
        return () => clearTimeout(timer);
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed top-[64px] left-0 right-0 z-[45] mx-auto max-w-md px-3 pointer-events-none"
                    initial={{ opacity: 0, y: -18, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -14, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 26 }}
                >
                    <div
                        role="status"
                        aria-live="polite"
                        className="pointer-events-auto flex items-start gap-2.5 rounded-2xl bg-[#7A1622] px-3 py-2.5 text-[#FFF8E7] ring-1 ring-white/25 shadow-[0_14px_36px_rgba(0,0,0,.34)]"
                    >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15">
                            <Check className="h-4 w-4 text-[#FFD98A]" strokeWidth={3} />
                        </span>
                        <p className="min-w-0 flex-1 text-[12px] font-semibold leading-snug">
                           🙏 This sacred puja has concluded with divine blessings. May the Divine’s grace always be with you and your loved ones. Continue your devotion with Krishna Janmashtami Sewa.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Dismiss message"
                            className="shrink-0 rounded-full p-1 text-white/70 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <X className="h-3.5 w-3.5" strokeWidth={3} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
