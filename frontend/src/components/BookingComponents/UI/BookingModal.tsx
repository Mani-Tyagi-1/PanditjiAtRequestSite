import { useState, useEffect } from "react";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    pujaTitle: string;
    price: number;
}

export default function BookingModal({ isOpen, onClose, pujaTitle, price }: BookingModalProps) {
    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState<'online' | 'offline'>('online');
    const [saveAs, setSaveAs] = useState<'home' | 'work' | 'other'>('home');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    const handleFetchLocation = () => {
        setIsFetchingLocation(true);
        // Simulate a network request or geolocation API call
        setTimeout(() => {
            setIsFetchingLocation(false);
            alert("Location fetched successfully! (Simulated)");
            // In a real app, you would populate the address fields here
        }, 1500);
    };

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            document.body.style.overflow = 'hidden';
        } else {
            setTimeout(() => setMounted(false), 300);
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            clearTimeout(undefined);
        }
    }, [isOpen]);

    if (!isOpen && !mounted) return null;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
                .booking-modal { font-family: 'DM Sans', sans-serif; }
                .slide-up { animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .slide-down { animation: modalSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes modalSlideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes modalSlideDown {
                    from { transform: translateY(0); }
                    to { transform: translateY(100%); }
                }
            `}</style>

            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center booking-modal">
                {/* Backdrop overlay */}
                <div
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={onClose}
                />

                {/* Modal Content */}
                <div className={`relative w-full sm:max-w-md h-[95vh] sm:h-[85vh] bg-[#fdfdfd] sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden ${isOpen ? 'slide-up' : 'slide-down'}`}>

                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-stone-200 sticky top-0 z-10 shrink-0">
                        <button onClick={onClose} className="p-1 -ml-1 text-stone-700 active:scale-95 transition-transform">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h2 className="text-stone-800 font-medium text-base truncate flex-1">{pujaTitle}</h2>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto pb-32">

                        <div className="px-4 py-4 space-y-7">

                            {/* Mode Toggle */}
                            <div className="flex bg-stone-100 p-1 rounded-xl w-fit">
                                <button
                                    onClick={() => setMode('online')}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'online'
                                        ? 'bg-white text-orange-600 shadow-sm'
                                        : 'text-stone-500 hover:text-stone-700'
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${mode === 'online' ? 'bg-orange-500 animate-pulse' : 'bg-stone-300'}`} />
                                    Online Mode
                                </button>
                                <button
                                    onClick={() => setMode('offline')}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'offline'
                                        ? 'bg-white text-orange-600 shadow-sm'
                                        : 'text-stone-500 hover:text-stone-700'
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${mode === 'offline' ? 'bg-orange-500' : 'bg-stone-300'}`} />
                                    Offline Mode
                                </button>
                            </div>

                            {/* Preferences & Illustration Section */}
                            <div className="relative">
                                {/* Title */}
                                <h3 className="text-stone-800 font-medium text-[15px] mb-3">Fill Your Preferences</h3>

                                <div className="flex items-start">
                                    {/* Left Form Fields */}
                                    <div className="flex-1 space-y-3 pr-28 sm:pr-32">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="3/9/2026"
                                                className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                            />
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                    <circle cx="12" cy="15" r="1" fill="currentColor" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Select Time"
                                                className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-500 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                            />
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="M12 6v6l4 2" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Illustration */}
                                    <div className="absolute right-0 bottom-[-10px] w-[110px] sm:w-[130px] pointer-events-none">
                                        {/* You can replace this src with your actual transparent Pandit image */}
                                        <img
                                            src="https://png.pngtree.com/png-vector/20250731/ourmid/pngtree-indian-pujari-priest-cartoon-illustration-vector-png-image_16949581.webp"
                                            alt="Pandit Ji"
                                            className="w-full h-auto object-contain drop-shadow-lg [clip-path:inset(0_0_0_0)] rounded-xl filter contrast-125"
                                            style={{ mixBlendMode: 'multiply' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Info Banner */}
                        <div className="bg-[#FF6D00] text-white px-4 py-2.5 flex items-start gap-2.5 text-xs shadow-inner">
                            <div className="shrink-0 mt-0.5 border border-white/50 rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                <span className="text-[8px] font-bold">i</span>
                            </div>
                            <span className="font-medium leading-relaxed">
                                {mode === 'online'
                                    ? "Online puja — all items will be arranged virtually."
                                    : "Offline puja — Pandit Ji will visit your provided address."}
                            </span>
                        </div>

                        <div className="px-4 py-6 space-y-6">

                            {/* Bhakt Details */}
                            <div>
                                <h3 className="text-stone-800 font-medium text-[15px] mb-3">Fill Bhakt Details</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        defaultValue="Mani Tyagi g"
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Gotra*"
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-500 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                    />
                                    <input
                                        type="tel"
                                        defaultValue="7668155190"
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                    />
                                    <input
                                        type="email"
                                        defaultValue="test@gmail.com"
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                    />
                                    {/* Advanced Address Fields for Offline Mode */}
                                    {mode === 'offline' && (
                                        <div className="pt-4 pb-2 space-y-4 border-t border-stone-100 mt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-stone-800 font-semibold text-[14px]">Address Details</h4>
                                                <button
                                                    onClick={handleFetchLocation}
                                                    disabled={isFetchingLocation}
                                                    className="flex items-center gap-1.5 text-orange-600 text-xs font-bold hover:bg-orange-50 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                                                >
                                                    {isFetchingLocation ? (
                                                        <span className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
                                                    ) : (
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    )}
                                                    {isFetchingLocation ? 'Fetching...' : 'Use Current Location'}
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="House / Flat No.*"
                                                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Street / Area*"
                                                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Landmark (Optional)"
                                                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                />

                                                <div className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        placeholder="City*"
                                                        className="w-1/2 bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="State*"
                                                        className="w-1/2 bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                    />
                                                </div>

                                                <input
                                                    type="text"
                                                    placeholder="Pincode*"
                                                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-sm"
                                                />
                                            </div>

                                            {/* Save Address As */}
                                            <div className="pt-2">
                                                <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">Save Address As</p>
                                                <div className="flex gap-2">
                                                    {(['home', 'work', 'other'] as const).map((type) => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setSaveAs(type)}
                                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors border ${saveAs === type
                                                                    ? 'bg-orange-50 border-orange-200 text-orange-600'
                                                                    : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                                                                }`}
                                                        >
                                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Divider Line */}
                            <div className="h-2 w-full bg-[#f4f4f5] -mx-4 px-8" />

                            {/* Coupon Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-stone-800 font-medium text-[15px]">Have a Coupon?</h3>
                                    <button className="text-[#E65100] text-xs font-bold hover:underline">View All Coupons</button>
                                </div>
                                <div className="bg-[#FFF8F2] border border-[#FDE0C9] rounded-xl p-3 flex sm:flex-row flex-col gap-2.5">
                                    <div className="flex-1 relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-orange-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Enter coupon code"
                                            className="w-full bg-white border border-stone-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-300 shadow-sm placeholder:text-stone-400"
                                        />
                                    </div>
                                    <button disabled className="bg-[#C9C9C9] text-white text-sm font-semibold rounded-lg sm:px-8 py-2.5 sm:w-auto w-full transition-colors opacity-90">
                                        Apply
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Sticky Footer */}
                    <div className="absolute bottom-0 w-full bg-[#fdfdfd] shrink-0 border-t border-stone-200 px-4 pt-3 pb-safe-bottom shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-stone-800 font-medium text-[15px]">Order Summary</h3>
                        </div>

                        <button className="w-full bg-[#9E9E9E] hover:bg-[#8E8E8E] text-white rounded-xl py-3.5 px-5 flex items-center justify-between transition-colors shadow-md active:scale-[0.98] mb-4">
                            <span className="font-bold text-lg tracking-wide">₹{price}</span>
                            <span className="font-semibold text-sm">Schedule Pandit</span>
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
}
