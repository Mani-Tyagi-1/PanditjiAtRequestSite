import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    Calendar,
    Clock,
    User,
    Video,
    MapPin,
    Star,
    Phone
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

            const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";
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
            const callId = type === "audio" ? `${baseCallId}_AC` : baseCallId;
            const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";

            await axios.post(`${apiUrl}/calls/invite`, {
                fromUserId: user._id,
                toUserId: panditId,
                callId,
                callerName: user.name || user.userName || "User",
                callerId: user._id,
                fromAppType: "user",
                toAppType: "pandit",
                callType: type
            });

            if (type === 'video') {
                navigate(`/video-call/${callId}`, { replace: true });
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
            <div className="min-h-screen flex items-center justify-center bg-[#FFFAF5]">
                <div className="w-10 h-10 border-4 border-[#FF7000] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFAF5] p-6 text-center">
                <div className="bg-white p-8 rounded-[32px] shadow-lg border border-orange-50 max-w-sm">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
                    <p className="text-gray-600 mb-6 text-sm">{error}</p>
                    <button
                        onClick={fetchBookings}
                        className="w-full bg-[#FF7000] text-white font-bold py-3 rounded-xl shadow-md hover:bg-orange-600 transition-all"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => navigate("/profile")}
                        className="w-full mt-3 text-gray-500 font-semibold py-2 hover:underline"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFAF3] font-sans flex justify-center">
            <div className="w-full max-w-md bg-white min-h-screen shadow-sm relative pb-10">
                {/* Header */}
            <div className="bg-white px-4 pt-4 pb-0 sticky top-0 z-50 shadow-sm border-b border-orange-50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/profile")}
                            className="p-2 rounded-full bg-orange-50 active:scale-90 transition-all text-[#FF7000]"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">My Bookings</h1>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-4 border-t border-gray-50">
                    {["all", "online", "offline"].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setFilterMode(mode as any)}
                            className={`flex-1 py-3 text-sm font-bold capitalize relative transition-all ${filterMode === mode ? "text-[#FF7000]" : "text-gray-400"
                                }`}
                        >
                            {mode}
                            {filterMode === mode && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF7000] rounded-t-full"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 mt-2">
                {filteredBookings.length === 0 ? (
                    <div className="mt-10 flex flex-col items-center justify-center text-center px-10">
                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                            <Calendar className="w-10 h-10 text-[#FF7000] opacity-50" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 mb-2">
                            {filterMode === "all" ? "No Bookings Yet" : `No ${filterMode} Bookings`}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            {filterMode === "all"
                                ? "You haven't booked any pujas yet. Explore our services to get started!"
                                : `You don't have any ${filterMode} bookings at the moment.`}
                        </p>
                        {filterMode === "all" && (
                            <button
                                onClick={() => navigate("/")}
                                className="mt-8 px-8 py-3 bg-[#FF7000] text-white rounded-full font-bold shadow-lg shadow-orange-100 active:scale-95 transition-all"
                            >
                                Book a Puja
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 pt-2">
                        {filteredBookings.map((booking, index) => {
                            const date = new Date(booking.bookingDate);
                            const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                            const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                            const isToday = new Date().toDateString() === date.toDateString();

                            const isOnline = booking.poojaMode === 'online';
                            const isOffline = booking.poojaMode === 'offline';
                            const hasStartedJourney = !!booking.journeyStartTime;
                            const hasAssignedPandit = booking.assignedPandit && booking.assignedPandit.length > 0;

                            // Enable button if (Online + Today) OR (Offline + Journey Started)
                            const isActionEnabled = isOnline ? (isToday && hasAssignedPandit) : (isOffline && hasStartedJourney && hasAssignedPandit);

                            return (
                                <motion.div
                                    key={booking._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-[20px] overflow-hidden shadow-xl shadow-orange-100/50 border border-orange-100"
                                >
                                    {/* Card Header */}
                                    <div className="bg-[#FF7000] py-2 px-4 relative overflow-hidden">
                                        {/* Decorative Circle */}
                                        <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-10 -translate-y-10" />

                                        <div className="flex justify-between items-center relative z-10">
                                            <h3 className="text-white font-bold text-md">{booking.poojaNameEng || "Puja Service"}</h3>
                                            <div className="bg-white px-4 pb-[2px] rounded-full">
                                                <span className="text-[#FF7000] text-xs font-bold capitalize ">
                                                    {booking.poojaMode || 'Offline'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-2 space-y-2">
                                        {/* Devotee Section */}
                                        <div className="bg-[#FFF8F2] p-1 rounded-2xl flex items-center gap-4 border border-orange-50">
                                            <div className="w-8 h-8 bg-[#FFEBD9] rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-[#FF7000]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-[#FF7000] font-bold uppercase tracking-wider">Devotee Name</p>
                                                <p className="text-gray-800 font-bold text-lg">{booking.bhaktName || booking.userName || "Devotee"}</p>
                                            </div>
                                        </div>

                                        {/* Date & Time Row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-[#FFF8F2] px-2 py-1 rounded-2xl flex items-center gap-3 border border-orange-50">
                                                <div className="w-8 h-8 bg-[#FFEBD9] rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Calendar className="w-4 h-4 text-[#FF7000]" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-[#FF7000] font-bold uppercase tracking-wider">Date</p>
                                                    <p className="text-gray-800 font-bold text-sm">{formattedDate}</p>
                                                </div>
                                            </div>
                                            <div className="bg-[#FFF8F2] px-2 py-1 rounded-2xl flex items-center gap-3 border border-orange-50">
                                                <div className="w-8 h-8 bg-[#FFEBD9] rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Clock className="w-4 h-4 text-[#FF7000]" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-[#FF7000] font-bold uppercase tracking-wider">Time</p>
                                                    <p className="text-gray-800 font-bold text-sm tracking-tight">{formattedTime}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Call Action */}
                                        {isOnline ? (
                                            <button
                                                disabled={!isActionEnabled}
                                                onClick={() => startCall(booking.assignedPandit?.[0]?._id, 'video')}
                                                className={`w-full py-2 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isActionEnabled
                                                    ? "bg-[#FF7000] text-white shadow-lg shadow-orange-100"
                                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                    }`}
                                            >
                                                <Video className="w-5 h-5" />
                                                <span>Video Call</span>
                                            </button>
                                        ) : (
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    disabled={!hasAssignedPandit}
                                                    onClick={() => startCall(booking.assignedPandit?.[0]?._id, 'audio')}
                                                    className={`w-14 h-11 rounded-2xl font-bold flex items-center justify-center transition-all active:scale-[0.98] ${hasAssignedPandit
                                                        ? "bg-green-600 text-white shadow-lg shadow-green-100 hover:bg-green-700"
                                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                        }`}
                                                    title="Call Pandit"
                                                >
                                                    <Phone className="w-5 h-5" />
                                                </button>
                                                <button
                                                    disabled={!isActionEnabled}
                                                    onClick={() => {
                                                        if (hasAssignedPandit && booking.address?.coordinates) {
                                                            const { lat, lng } = booking.address.coordinates;
                                                            navigate(`/track-pandit/${booking.assignedPandit[0]._id}/${lat}/${lng}`);
                                                        }
                                                    }}
                                                    className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isActionEnabled
                                                        ? "bg-[#FF7000] text-white shadow-lg shadow-orange-100"
                                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                        }`}
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="text-sm">Track Panditji</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Assignment Status */}
                                        <div className="mt-2 border-2 border-dashed border-orange-200 rounded-2xl p-2 flex items-center justify-between bg-orange-50/30">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-orange-100/50 rounded-full flex items-center justify-center overflow-hidden border border-orange-200">
                                                    {booking.assignedPandit && booking.assignedPandit[0]?.profileImage ? (
                                                        <img
                                                            src={booking.assignedPandit[0].profileImage}
                                                            alt="Pandit Ji"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="w-5 h-5 text-[#FF7000]" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-[#FFB68D] font-bold uppercase tracking-wider">Pandit Ji assigned</p>
                                                    <p className="text-gray-800 font-bold text-sm">
                                                        {booking.assignedPandit && booking.assignedPandit.length > 0
                                                            ? `Pandit ${booking.assignedPandit[0].firstName} ${booking.assignedPandit[0].lastName}`
                                                            : "Not assigned yet"}
                                                    </p>
                                                </div>
                                            </div>
                                            {booking.assignedPandit && booking.assignedPandit.length > 0 && (
                                                <div className="bg-green-600 text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                                                    <Star className="w-3 h-3 fill-white" />
                                                    <span className="text-[10px] font-bold">{booking.assignedPandit[0].rating?.toFixed(1) || "5.0"}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
            </div>

            {/* Premium Notification Modal */}
            {alertConfig.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative border border-stone-100 animate-in fade-in zoom-in duration-300">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${alertConfig.type === 'error' ? 'bg-red-50 text-red-500' :
                                alertConfig.type === 'success' ? 'bg-green-50 text-green-500' :
                                    'bg-blue-50 text-blue-500'
                            }`}>
                            {alertConfig.type === 'error' && (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                            {alertConfig.type === 'success' && (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {alertConfig.type === 'info' && (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {alertConfig.title}
                        </h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            {alertConfig.message}
                        </p>

                        <button
                            onClick={() => {
                                setAlertConfig({ ...alertConfig, show: false });
                                if (alertConfig.onConfirm) alertConfig.onConfirm();
                            }}
                            className={`w-full py-4 px-6 rounded-2xl font-bold text-white transition-all shadow-md active:scale-95 ${alertConfig.type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-100' :
                                    alertConfig.type === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-100' :
                                        'bg-orange-500 hover:bg-orange-600 shadow-orange-100'
                                }`}
                        >
                            Understand
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBookingsPage;
