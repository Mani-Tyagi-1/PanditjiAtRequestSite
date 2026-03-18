import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Calendar,
    Clock,
    User,
    Video,
    MapPin,
    Star,
    Phone,
    Wifi,
    WifiOff,
    CheckCircle2,
    AlertCircle,
    Info,
    Loader2,
} from "lucide-react";

const MyBookingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<"all" | "online" | "offline">("all");

    const [alertConfig, setAlertConfig] = useState<{
        show: boolean;
        title: string;
        message: string;
        type: "error" | "info" | "success";
        onConfirm?: () => void;
    }>({
        show: false,
        title: "",
        message: "",
        type: "info",
    });

    const triggerAlert = (
        title: string,
        message: string,
        type: "error" | "info" | "success" = "info",
        onConfirm?: () => void
    ) => {
        setAlertConfig({ show: true, title, message, type, onConfirm });
    };

    const fetchBookings = async () => {
        try {
            const userDataString = localStorage.getItem("user_data");
            if (!userDataString) {
                navigate("/");
                return;
            }

            const user = JSON.parse(userDataString);
            const userPhone = user.phone;

            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
            const response = await axios.get(`${apiUrl}/bookings/get-pending-poojabookings/${userPhone}`);

            setBookings(response.data || []);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching bookings:", err);
            setError("Failed to load bookings. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const startCall = async (panditId: string, type: 'video' | 'audio' = 'video') => {
        try {
            const userDataString = localStorage.getItem("user_data");
            if (!userDataString) return;
            const user = JSON.parse(userDataString);

            const baseCallId = crypto.randomUUID();
            const callId = type === "audio" ? `${baseCallId}_AC` : `${baseCallId}_VC`;
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
            const status = type === "video" ? "ringing" : "call-ringing";

            await axios.post(`${apiUrl}/calls/invite`, {
                fromUserId: user._id,
                toUserId: panditId,
                callId,
                callerName: user.name || user.userName || "User",
                callerId: user._id,
                fromAppType: "user",
                toAppType: "pandit",
                callType: type,
                status: status,
            });

            if (type === 'video') {
                navigate(`/video-call/${callId}/${panditId}`, { replace: true });
            } else {
                navigate(`/audio-call/${callId}/${panditId}`, { replace: true });
            }
        } catch (err) {
            console.error("Error starting call:", err);
            triggerAlert("Call Error", "Failed to start call. Please try again.", "error");
        }
    };

    const filteredBookings = bookings.filter(booking => {
        if (filterMode === "all") return true;
        return booking.poojaMode === filterMode;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFAF5] gap-3">
                <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#FF7000] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <div className="absolute inset-2 rounded-full bg-orange-50 flex items-center justify-center">
                        <span className="text-lg">🪔</span>
                    </div>
                </div>
                <p className="text-sm text-orange-400 font-semibold tracking-wide">Loading your bookings…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFAF5] p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-7 rounded-3xl shadow-xl border border-orange-50 max-w-sm w-full"
                >
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Something went wrong</h2>
                    <p className="text-gray-500 mb-5 text-sm">{error}</p>
                    <button
                        onClick={fetchBookings}
                        className="w-full bg-[#FF7000] text-white font-bold py-3 rounded-2xl shadow-md shadow-orange-100 active:scale-95 transition-all text-sm"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => navigate("/profile")}
                        className="w-full mt-2 text-gray-400 font-semibold py-2 text-sm hover:text-gray-600 transition-colors"
                    >
                        Back to Profile
                    </button>
                </motion.div>
            </div>
        );
    }

    const filterLabels: Record<string, { label: string; icon: React.ReactNode }> = {
        all: { label: "All", icon: <Calendar className="w-3.5 h-3.5" /> },
        online: { label: "Online", icon: <Wifi className="w-3.5 h-3.5" /> },
        offline: { label: "Offline", icon: <WifiOff className="w-3.5 h-3.5" /> },
    };

    return (
        <div className="min-h-screen bg-[#FFF7F0] font-sans flex justify-center">
            <div className="w-full max-w-md bg-[#FFF7F0] min-h-screen relative pb-8">

                {/* ── Sticky Header ── */}
                <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100/60 shadow-sm">
                    {/* Top row */}
                    <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                        <button
                            onClick={() => navigate("/profile")}
                            className="w-9 h-9 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF7000] active:scale-90 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-lg font-bold text-gray-800 leading-tight">My Bookings</h1>
                            <p className="text-[10px] text-orange-400 font-medium">
                                {bookings.length} active {bookings.length === 1 ? "booking" : "bookings"}
                            </p>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="px-4 pb-3 flex gap-2">
                        {(["all", "online", "offline"] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setFilterMode(mode)}
                                className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${filterMode === mode
                                        ? "bg-[#FF7000] text-white shadow-md shadow-orange-200"
                                        : "bg-orange-50 text-orange-400 border border-orange-100"
                                    }`}
                            >
                                {filterLabels[mode].icon}
                                {filterLabels[mode].label}
                                {filterMode === mode && (
                                    <motion.span
                                        layoutId="pill"
                                        className="absolute inset-0 rounded-full bg-[#FF7000] -z-10"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="px-4 mt-3">
                    <AnimatePresence mode="wait">
                        {filteredBookings.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-16 flex flex-col items-center justify-center text-center px-8"
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mb-5 shadow-inner">
                                    <span className="text-3xl">🪔</span>
                                </div>
                                <h2 className="text-base font-bold text-gray-800 mb-1">
                                    {filterMode === "all" ? "No Bookings Yet" : `No ${filterLabels[filterMode].label} Bookings`}
                                </h2>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    {filterMode === "all"
                                        ? "You haven't booked any pujas yet. Explore our services to get started!"
                                        : `You don't have any ${filterMode} bookings at the moment.`}
                                </p>
                                {filterMode === "all" && (
                                    <button
                                        onClick={() => navigate("/")}
                                        className="mt-6 px-7 py-2.5 bg-[#FF7000] text-white rounded-full font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all text-sm"
                                    >
                                        Book a Puja
                                    </button>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                {filteredBookings.map((booking, index) => {
                                    const date = new Date(booking.bookingDate);
                                    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                    const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

                                    const now = new Date();
                                    now.setHours(0, 0, 0, 0);
                                    const bookingDateOnly = new Date(date);
                                    bookingDateOnly.setHours(0, 0, 0, 0);

                                    const isToday = bookingDateOnly.getTime() === now.getTime();
                                    const isPast = bookingDateOnly.getTime() < now.getTime();

                                    const isOnline = booking.poojaMode === 'online';
                                    const isOffline = booking.poojaMode === 'offline';
                                    const hasStartedJourney = !!booking.journeyStartTime;
                                    const hasAssignedPandit = booking.assignedPandit && booking.assignedPandit.length > 0;

                                    const isActionEnabled = isOnline ? (isToday && hasAssignedPandit) : (isOffline && isToday && hasStartedJourney && hasAssignedPandit);
                                    const isAudioCallEnabled = isOffline && hasAssignedPandit && isToday;

                                    return (
                                        <motion.div
                                            key={booking._id}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.07, type: "spring", stiffness: 300, damping: 28 }}
                                            className={`bg-white rounded-3xl overflow-hidden shadow-lg shadow-orange-100/60 border border-orange-100/80 transition-all ${isPast ? "opacity-75 grayscale-[30%] scale-[0.98]" : ""
                                                }`}
                                        >
                                            {/* ── Card Header Band ── */}
                                            <div className={`relative px-4 py-3 overflow-hidden ${isPast ? "bg-gray-400" : "bg-gradient-to-r from-[#FF7000] to-[#FF9A45]"
                                                }`}>
                                                {/* Decorative blobs */}
                                                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
                                                <div className="absolute -bottom-5 -left-3 w-12 h-12 bg-white/10 rounded-full" />

                                                <div className="relative flex items-center justify-between">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                                        <span className="text-lg">{isPast ? "✅" : "🪔"}</span>
                                                        <h3 className="text-white font-bold text-sm leading-tight truncate">
                                                            {booking.poojaNameEng || "Puja Service"}
                                                            {isPast && <span className="ml-2 text-[10px] uppercase tracking-wider opacity-80">(Completed)</span>}
                                                        </h3>
                                                    </div>
                                                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${isPast
                                                            ? "bg-white/20 text-white"
                                                            : (isOnline ? "bg-white text-[#FF7000]" : "bg-white/20 text-white border border-white/30")
                                                        }`}>
                                                        {isOnline
                                                            ? <><Wifi className="w-3 h-3" /> Online</>
                                                            : <><WifiOff className="w-3 h-3" /> Offline</>
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            {/* ── Card Body ── */}
                                            <div className="p-3 space-y-2.5">

                                                {/* Devotee + Date/Time row */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    {/* Devotee */}
                                                    <div className="col-span-1 bg-[#FFF8F2] rounded-2xl p-2.5 flex flex-col items-center justify-center border border-orange-50 text-center">
                                                        <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                                                            <User className="w-3.5 h-3.5 text-[#FF7000]" />
                                                        </div>
                                                        <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider leading-none mb-0.5">Devotee</p>
                                                        <p className="text-gray-800 font-bold text-xs leading-tight line-clamp-1">
                                                            {booking.bhaktName || booking.userName || "Devotee"}
                                                        </p>
                                                    </div>

                                                    {/* Date */}
                                                    <div className="col-span-1 bg-[#FFF8F2] rounded-2xl p-2.5 flex flex-col items-center justify-center border border-orange-50 text-center">
                                                        <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                                                            <Calendar className="w-3.5 h-3.5 text-[#FF7000]" />
                                                        </div>
                                                        <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider leading-none mb-0.5">Date</p>
                                                        <p className="text-gray-800 font-bold text-[11px] leading-tight">{formattedDate}</p>
                                                        {isToday && (
                                                            <span className="text-[9px] bg-orange-500 text-white rounded-full px-1.5 py-0.5 font-bold mt-0.5">Today</span>
                                                        )}
                                                    </div>

                                                    {/* Time */}
                                                    <div className="col-span-1 bg-[#FFF8F2] rounded-2xl p-2.5 flex flex-col items-center justify-center border border-orange-50 text-center">
                                                        <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                                                            <Clock className="w-3.5 h-3.5 text-[#FF7000]" />
                                                        </div>
                                                        <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider leading-none mb-0.5">Time</p>
                                                        <p className="text-gray-800 font-bold text-[11px] leading-tight">{formattedTime}</p>
                                                    </div>
                                                </div>

                                                {/* ── Pandit Assignment Strip ── */}
                                                <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-[#FFF8F2] rounded-2xl px-3 py-2.5 border border-orange-100/70">
                                                    <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                        {booking.assignedPandit?.[0]?.profileImage ? (
                                                            <img
                                                                src={booking.assignedPandit[0].profileImage}
                                                                alt="Pandit Ji"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="w-5 h-5 text-[#FF7000]" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider leading-none mb-0.5">
                                                            {hasAssignedPandit ? "Pandit Ji Assigned" : "Awaiting Assignment"}
                                                        </p>
                                                        <p className="text-gray-800 font-bold text-sm truncate">
                                                            {hasAssignedPandit
                                                                ? `Pandit ${booking.assignedPandit[0].firstName} ${booking.assignedPandit[0].lastName}`
                                                                : "Not assigned yet"}
                                                        </p>
                                                    </div>
                                                    {hasAssignedPandit ? (
                                                        <div className="flex items-center gap-1 bg-emerald-500 text-white px-2.5 py-1 rounded-xl shadow-sm flex-shrink-0">
                                                            <Star className="w-3 h-3 fill-white" />
                                                            <span className="text-[11px] font-bold">{booking.assignedPandit[0].rating?.toFixed(1) || "5.0"}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                                            <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* ── Action Buttons ── */}
                                                {hasAssignedPandit && (
                                                    isOnline ? (
                                                        <button
                                                            disabled={!isActionEnabled}
                                                            onClick={() => startCall(booking.assignedPandit?.[0]?._id, 'video')}
                                                            className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] ${isActionEnabled
                                                                    ? "bg-gradient-to-r from-[#FF7000] to-[#FF9A45] text-white shadow-md shadow-orange-200"
                                                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                }`}
                                                        >
                                                            <Video className="w-4 h-4" />
                                                            {isActionEnabled ? "Join Video Call" : (isOnline && !isToday ? "Video Call Restricted" : "Video Call — Not Available Yet")}
                                                        </button>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button
                                                                disabled={!isAudioCallEnabled}
                                                                onClick={() => startCall(booking.assignedPandit?.[0]?._id, 'audio')}
                                                                className={`w-12 h-11 rounded-2xl font-bold flex items-center justify-center transition-all active:scale-[0.98] flex-shrink-0 ${isAudioCallEnabled
                                                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-100"
                                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                    }`}
                                                                title={isAudioCallEnabled ? "Call Panditji" : (isToday ? "Call Panditji — Awaiting Assignment" : "Call Restricted to Booking Date")}
                                                            >
                                                                <Phone className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                disabled={!isActionEnabled}
                                                                onClick={() => {
                                                                    if (hasAssignedPandit && booking.address?.coordinates) {
                                                                        const { lat, lng } = booking.address.coordinates;
                                                                        navigate(`/track-pandit/${booking.assignedPandit[0]._id}/${lat}/${lng}`);
                                                                    }
                                                                }}
                                                                className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] ${isActionEnabled
                                                                        ? "bg-gradient-to-r from-[#FF7000] to-[#FF9A45] text-white shadow-md shadow-orange-200"
                                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                    }`}
                                                            >
                                                                <MapPin className="w-4 h-4" />
                                                                {isActionEnabled ? "Track Panditji" : (isToday ? "Awaiting Departure" : "Tracking Restricted")}
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Alert Modal ── */}
            <AnimatePresence>
                {alertConfig.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-end justify-center p-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setAlertConfig({ ...alertConfig, show: false })}
                    >
                        <motion.div
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 80, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 340, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[32px] p-7 w-full max-w-md text-center shadow-2xl"
                        >
                            {/* Drag handle */}
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${alertConfig.type === 'error' ? 'bg-red-50' :
                                    alertConfig.type === 'success' ? 'bg-emerald-50' :
                                        'bg-orange-50'
                                }`}>
                                {alertConfig.type === 'error' && <AlertCircle className="w-7 h-7 text-red-400" />}
                                {alertConfig.type === 'success' && <CheckCircle2 className="w-7 h-7 text-emerald-400" />}
                                {alertConfig.type === 'info' && <Info className="w-7 h-7 text-orange-400" />}
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 mb-1">{alertConfig.title}</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">{alertConfig.message}</p>

                            <button
                                onClick={() => {
                                    setAlertConfig({ ...alertConfig, show: false });
                                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                                }}
                                className={`w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 shadow-md ${alertConfig.type === 'error' ? 'bg-red-500 shadow-red-100' :
                                        alertConfig.type === 'success' ? 'bg-emerald-500 shadow-emerald-100' :
                                            'bg-[#FF7000] shadow-orange-100'
                                    }`}
                            >
                                Got it
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyBookingsPage;