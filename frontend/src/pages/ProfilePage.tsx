import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Phone,
    Mail,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Calendar,
    Clock,
    MapPin,
    Bookmark,
    Edit3,
    Share2,
    Copy,
    Check,
    Gift,
    X,
    Users,
    IndianRupee,
    Percent,
    Wallet,
    CalendarClock,
    CheckCircle2,
    MailOpen,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { decryptData, encryptPayload } from "../utils/encryption";
import API_URL from "../utils/apiConfig";

interface UserData {
    _id: string;
    given_name?: string;
    family_name?: string;
    name?: string;
    phone: string;
    email?: string;
    gender?: string;
    dob?: string;
    birthTime?: string;
    birthPlace?: string;
    gotra?: string;
    picture?: string;
}

interface ReferralData {
    userReferralCode: string;
    referralEarnings: number;
    totalReferredPujas: number;
    referralPercentage: number;
}

interface ReferralBooking {
    bookingId: string;
    referredUserName: string;
    poojaName: string;
    amountEarned: number;
    totalBookingAmount: number;
    rewardPercentage: number;
    bookedAt: string;
}


const ProfileMenuItem = ({ icon: Icon, title, subtitle, onClick }: any) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 bg-white rounded-2xl mb-3 shadow-sm border border-orange-50 active:scale-[0.98] transition-all"
    >
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#FF7000]" />
            </div>
            <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
                <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300" />
    </button>
);

const EditInput = ({ icon: Icon, label, value, onChange, disabled, type = "text", placeholder }: any) => (
    <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">{label}</label>
        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${disabled ? 'bg-gray-50 border-gray-100' : 'bg-white border-orange-100 focus-within:border-[#FF7000] shadow-sm'}`}>
            <Icon className={`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-[#FF7000]'}`} />
            <input
                type={type}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-300"
            />
        </div>
    </div>
);

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<"view" | "edit" | "referral-bookings">("view");
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Referral state
    const [referralData, setReferralData] = useState<ReferralData | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);

    // Referral bookings state
    const [referralBookings, setReferralBookings] = useState<ReferralBooking[]>([]);
    const [referralBookingsLoading, setReferralBookingsLoading] = useState(false);

    // Payout state
    const [payoutModal, setPayoutModal] = useState<"confirm" | "not-allowed" | null>(null);
    const [payoutDone, setPayoutDone] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<UserData>>({});
    const [isSaving, setIsSaving] = useState(false);

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

    const fetchReferralData = async (userId: string) => {
        try {
            const token = localStorage.getItem("user_token");
            const apiUrl = API_URL;
            const response = await axios.get(`${apiUrl}/users/${userId}/my-referral`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data?.encrypted) {
                const decrypted = decryptData(response.data.encrypted);
                if (decrypted?.success) {
                    setReferralData({
                        userReferralCode: decrypted.userReferralCode,
                        referralEarnings: decrypted.referralEarnings ?? 0,
                        totalReferredPujas: decrypted.totalReferredPujas ?? 0,
                        referralPercentage: decrypted.referralPercentage ?? 5,
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching referral data:", err);
        }
    };

    const handlePayoutRequest = () => {
        const today = new Date().getDate();
        if (today >= 1 && today <= 17) {
            setPayoutModal("confirm");
        } else {
            setPayoutModal("not-allowed");
        }
    };

    const openGmailPayout = () => {
        const stored = localStorage.getItem("user_data");
        const parsedUser = stored ? JSON.parse(stored) : null;

        const name = user
            ? `${user.given_name || ""} ${user.family_name || ""}`.trim() || user.name || "User"
            : parsedUser?.name || "User";
        const phone = user?.phone || parsedUser?.phone || "N/A";
        const userId = parsedUser?._id || "N/A";
        const code = referralData?.userReferralCode || "N/A";
        const amount = referralData?.referralEarnings ?? 0;

        const subject = encodeURIComponent(`Referral Payout Request – ${name}`);
        const body = encodeURIComponent(
            `Hello PanditJi At Request Team,\n\n` +
            `I would like to request a payout of my referral earnings.\n\n` +
            `Details:\n` +
            `  Name        : ${name}\n` +
            `  Phone       : ${phone}\n` +
            `  User ID     : ${userId}\n` +
            `  Referral Code : ${code}\n` +
            `  Amount      : ₹${amount}\n\n` +
            `Please process the payout at the earliest convenience.\n\n` +
            `Thank you.`
        );

        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=vedicvaibhav92%40gmail.com&su=${subject}&body=${body}`;
        window.open(gmailUrl, "_blank", "noopener,noreferrer");

        setPayoutModal(null);
        setPayoutDone(true);
        setTimeout(() => setPayoutDone(false), 4000);
    };

    const fetchReferralBookings = async (userId: string) => {
        setReferralBookingsLoading(true);
        try {
            const token = localStorage.getItem("user_token");
            const apiUrl = API_URL;
            const response = await axios.get(`${apiUrl}/users/${userId}/referral-bookings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data?.encrypted) {
                const decrypted = decryptData(response.data.encrypted);
                if (decrypted?.success) {
                    setReferralBookings(decrypted.referralBookings || []);
                }
            }
        } catch (err) {
            console.error("Error fetching referral bookings:", err);
        } finally {
            setReferralBookingsLoading(false);
        }
    };

    const handleCopyCode = async () => {
        if (!referralData?.userReferralCode) return;
        try {
            await navigator.clipboard.writeText(referralData.userReferralCode);
        } catch {
            // clipboard API unavailable — silently ignore
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        if (!referralData?.userReferralCode) return;
        const shareText = `Book a Pandit easily with PanditJi At Request! Use my referral code *${referralData.userReferralCode}* and earn ${referralData.referralPercentage}% rewards. Download now: https://panditjiatrequest.com`;
        if (navigator.share) {
            try {
                await navigator.share({ title: "PanditJi At Request", text: shareText });
                return;
            } catch {
                // user cancelled — fall through to modal
            }
        }
        setShowShareModal(true);
    };

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem("user_token");
            const userDataString = localStorage.getItem("user_data");

            if (!token || !userDataString) {
                navigate("/");
                return;
            }

            const storedUser = JSON.parse(userDataString);
            const userId = storedUser._id;

            // Fetch referral data in parallel (non-blocking)
            fetchReferralData(userId);

            const apiUrl = API_URL;
            const response = await axios.get(`${apiUrl}/profile/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.encrypted) {
                const decrypted = decryptData(response.data.encrypted);
                if (decrypted && decrypted.user) {
                    setUser(decrypted.user);
                    setFormData(decrypted.user);
                } else {
                    setError("Failed to process user data.");
                }
            }
        } catch (err: any) {
            console.error("Error fetching profile:", err);
            setError(err.response?.data?.message || "Failed to fetch profile details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        logout();
        navigate("/");
        setIsLogoutModalOpen(false);
    };

    const handleSave = async () => {
        if (!user?._id) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem("user_token");
            const apiUrl = API_URL;

            // Prepare payload
            const payload = {
                firstname: formData.given_name,
                lastname: formData.family_name,
                phone: formData.phone,
                gender: formData.gender,
                dob: formData.dob,
                email: formData.email,
                birthTime: formData.birthTime,
                birthPlace: formData.birthPlace,
                gotra: formData.gotra
            };

            // Use the standard encryptPayload helper
            const encryptedPayload = encryptPayload(payload);

            await axios.put(`${apiUrl}/updateProfile/${user._id}`,
                encryptedPayload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Update local state
            await fetchUserProfile();
            setMode("view");
        } catch (err: any) {
            console.error("Error updating profile:", err);
            triggerAlert("Update Failed", err.response?.data?.message || "Failed to update profile.", "error");
        } finally {
            setIsSaving(false);
        }
    };

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
                        onClick={() => { setError(null); fetchUserProfile(); }}
                        className="w-full bg-[#FF7000] text-white font-bold py-3 rounded-xl shadow-md hover:bg-orange-600 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const isLockedView = mode === "referral-bookings";

    return (
        <div className={`font-sans flex justify-center ${isLockedView ? "h-screen overflow-hidden" : "min-h-screen"}`}>
            <div className={`w-full max-w-md bg-white shadow-sm relative ${isLockedView ? "h-screen overflow-hidden" : "min-h-screen pb-24"}`}>
                <AnimatePresence mode="wait">
                    {mode === "view" && (
                        <motion.div
                            key="view"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="px-4"
                        >
                            {/* Navigation Header */}
                            <div className="flex items-center gap-4 pt-6 pb-2">
                                <button
                                    onClick={() => navigate("/landing-page")}
                                    className="p-2 rounded-full bg-white shadow-sm border border-orange-50 active:scale-90 transition-all text-[#FF7000]"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <h1 className="text-xl font-bold text-gray-800">Profile</h1>
                            </div>

                            {/* Header Profile Card */}
                            <div className="mt-4 mb-8">
                                <div className="relative bg-[#FFEDE0] rounded-[32px] p-6 pt-10 overflow-hidden border border-orange-100 shadow-sm">
                                    {/* Decorative circles */}
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-orange-200/30 rounded-full -translate-x-12 -translate-y-12" />

                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-orange-100">
                                            <img
                                                src={user?.picture || "https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png"}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-gray-800 leading-tight">
                                                {user?.given_name} {user?.family_name}
                                            </h2>
                                            <div className="flex items-center gap-1 mt-1 text-gray-500 mb-4">
                                                <Phone className="w-3.5 h-3.5" />
                                                <span className="text-sm">+91 {user?.phone}</span>
                                            </div>
                                            <button
                                                onClick={() => setMode("edit")}
                                                className="flex items-center gap-2 bg-[#FF7000] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                Edit Profile
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Referral Rewards Card */}
                            {referralData && (
                                <div className="mb-4 bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden">
                                    {/* Top row */}
                                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                                                <Gift className="w-5 h-5 text-[#FF7000]" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-gray-800 text-sm">Referral Rewards</span>
                                                    <span className="bg-[#FF7000] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        {referralData.referralPercentage}% Reward
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">Share PanditJi links to earn rewards</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats row */}
                                    <div className="flex items-center border-t border-orange-50">
                                        <div className="flex-1 flex flex-col items-center py-3">
                                            <span className="text-lg font-bold text-[#FF7000]">₹{referralData.referralEarnings}</span>
                                            <span className="text-[11px] text-gray-400 mt-0.5">Total Earned</span>
                                        </div>
                                        <div className="w-px h-10 bg-orange-100" />
                                        <div className="flex-1 flex flex-col items-center py-3">
                                            <span className="text-lg font-bold text-[#FF7000]">{referralData.totalReferredPujas}</span>
                                            <span className="text-[11px] text-gray-400 mt-0.5">Pujas Referred</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Menu Items */}
                            <div className="space-y-1">
                                <ProfileMenuItem
                                    icon={User}
                                    title="My Profile"
                                    subtitle="Tap to open"
                                    onClick={() => setMode("edit")}
                                />
                                {/* <ProfileMenuItem
                                icon={Users}
                                title="Family"
                                subtitle="Tap to open"
                                onClick={() => { }}
                            /> */}
                                <ProfileMenuItem
                                    icon={Calendar}
                                    title="My Puja Booking"
                                    subtitle="Tap to open"
                                    onClick={() => navigate("/my-bookings")}
                                />
                                <ProfileMenuItem
                                    icon={Users}
                                    title="Referral Bookings"
                                    subtitle="Pujas booked via your referral"
                                    onClick={() => {
                                        const stored = localStorage.getItem("user_data");
                                        if (stored) fetchReferralBookings(JSON.parse(stored)._id);
                                        setMode("referral-bookings");
                                    }}
                                />
                                {/* <ProfileMenuItem
                                icon={Info}
                                title="About Us"
                                subtitle="Tap to open"
                                onClick={() => navigate("/about")}
                            /> */}
                                {/* <ProfileMenuItem
                                icon={HelpCircle}
                                title="FAQs & Help Center"
                                subtitle="Tap to open"
                                onClick={() => navigate("/help")}
                            /> */}
                            </div>

                            {/* Logout Section */}
                            <div className="mt-12 flex flex-col items-center gap-6">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-red-100 text-red-500 font-bold bg-white shadow-sm active:scale-95 transition-all"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Log Out
                                </button>

                                <div className="flex flex-col items-center opacity-50 pointer-events-none scale-90">
                                    <img src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png" alt="Emblem" className="w-20 h-20 object-contain mb-2" />
                                    <span className="text-xs font-semibold text-gray-400">ver 2.41</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {mode === "edit" && (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="min-h-screen bg-[#FFF8F3]"
                        >
                            {/* Compact Header */}
                            <div className="bg-gradient-to-br from-[#FF7000] to-[#FF9A45] px-4 pt-5 pb-14 relative">
                                <div className="flex items-center gap-3 text-white mb-0">
                                    <button
                                        onClick={() => setMode("view")}
                                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 transition-all border border-white/20"
                                        aria-label="Back to Profile"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h1 className="text-lg font-bold leading-tight">Edit Profile</h1>
                                        <p className="text-white/75 text-[10px]">Personal & astro details for accurate Pooja</p>
                                    </div>
                                </div>

                                {/* Profile card overlap */}
                                <div className="absolute left-4 right-4 -bottom-10">
                                    <div className="bg-white rounded-2xl px-5 py-3 flex items-center gap-4 shadow-lg border border-orange-100">
                                        <div className="w-14 h-14 rounded-full border-2 border-orange-200 overflow-hidden bg-orange-50 flex-shrink-0">
                                            <img
                                                src={user?.picture || "https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png"}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-gray-800 font-bold text-sm leading-tight">{user?.given_name} {user?.family_name}</h3>
                                            <p className="text-orange-400 text-xs">{user?.phone ? `+91 ${user.phone}` : ""}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form — desktop gets 2-col grid */}
                            <div className="px-4 mt-12 pb-6 mx-auto">
                                <div className="grid grid-cols-1 gap-3">

                                    {/* Basic Details */}
                                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                                                <User className="w-3.5 h-3.5 text-[#FF7000]" />
                                            </div>
                                            <h2 className="font-bold text-gray-800 text-sm">Basic Details</h2>
                                        </div>

                                        <EditInput
                                            label="First Name"
                                            icon={Edit3}
                                            value={formData.given_name}
                                            onChange={(v: string) => setFormData({ ...formData, given_name: v })}
                                        />
                                        <EditInput
                                            label="Last Name"
                                            icon={Edit3}
                                            value={formData.family_name}
                                            onChange={(v: string) => setFormData({ ...formData, family_name: v })}
                                        />
                                        <EditInput
                                            label="Mobile Number"
                                            icon={Phone}
                                            value={formData.phone}
                                            disabled={true}
                                        />
                                        <p className="text-[10px] text-gray-400 -mt-2 mb-3 ml-1">Mobile number cannot be changed</p>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-semibold text-gray-700 ml-1">Gender</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["Male", "Female", "Other"].map((g) => (
                                                    <button
                                                        key={g}
                                                        onClick={() => setFormData({ ...formData, gender: g })}
                                                        className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border transition-all text-xs font-medium ${formData.gender === g ? 'bg-[#FF7000] border-[#FF7000] text-white shadow-md shadow-orange-100' : 'bg-orange-50/60 border-orange-100 text-gray-500 hover:border-orange-200'}`}
                                                    >
                                                        <User className="w-3 h-3" />
                                                        {g}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Astro Details */}
                                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                                                <Bookmark className="w-3.5 h-3.5 text-[#FF7000]" />
                                            </div>
                                            <h2 className="font-bold text-gray-800 text-sm">Astro Details</h2>
                                        </div>

                                        <EditInput
                                            label="Date of Birth"
                                            icon={Calendar}
                                            type="date"
                                            value={formData.dob}
                                            onChange={(v: string) => setFormData({ ...formData, dob: v })}
                                        />
                                        <EditInput
                                            label="Birth Time"
                                            icon={Clock}
                                            type="time"
                                            value={formData.birthTime}
                                            onChange={(v: string) => setFormData({ ...formData, birthTime: v })}
                                        />
                                        <EditInput
                                            label="Birth Place"
                                            icon={MapPin}
                                            placeholder="Enter birth city"
                                            value={formData.birthPlace}
                                            onChange={(v: string) => setFormData({ ...formData, birthPlace: v })}
                                        />
                                        <EditInput
                                            label="Gotra"
                                            icon={Bookmark}
                                            placeholder="Enter your gotra"
                                            value={formData.gotra}
                                            onChange={(v: string) => setFormData({ ...formData, gotra: v })}
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1 ml-1">Helps Purohit perform Sankalp correctly.</p>
                                    </div>

                                    {/* Contact */}
                                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                                                <Mail className="w-3.5 h-3.5 text-[#FF7000]" />
                                            </div>
                                            <h2 className="font-bold text-gray-800 text-sm">Contact</h2>
                                        </div>
                                        <div>
                                            <EditInput
                                                label="Email"
                                                icon={Mail}
                                                type="email"
                                                value={formData.email}
                                                onChange={(v: string) => setFormData({ ...formData, email: v })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button + note */}
                                <div className="mt-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="w-full bg-[#FF7000] hover:bg-[#e56200] disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-orange-200 transition-all active:scale-[0.98] text-sm"
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                    <p className="text-center text-[10px] text-gray-400 mt-2">
                                        Your details are used only to perform Pooja correctly and securely.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {mode === "referral-bookings" && (
                        <motion.div
                            key="referral-bookings"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-screen bg-[#FFF8F3] relative flex flex-col overflow-hidden"
                        >
                            {/* Background watermark emblem */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                <img
                                    src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
                                    alt=""
                                    aria-hidden="true"
                                    className="w-72 h-72 object-contain opacity-[0.2] select-none"
                                />
                            </div>

                            {/* Header — fixed height, never scrolls */}
                            <div className="relative z-10 flex-shrink-0 bg-gradient-to-br from-[#FF7000] to-[#FF9A45] px-4 pt-5 pb-6">
                                <div className="flex items-center gap-3 text-white">
                                    <button
                                        onClick={() => setMode("view")}
                                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 transition-all border border-white/20"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h1 className="text-lg font-bold leading-tight">Referral Bookings</h1>
                                        <p className="text-white/75 text-[10px]">Pujas booked via your referral code</p>
                                    </div>
                                </div>

                                {/* Summary pills */}
                                {referralData && (
                                    <div className="flex gap-3 mt-4">
                                        <div className="flex-1 flex items-center gap-2 bg-white/20 rounded-2xl px-3 py-2.5">
                                            <IndianRupee className="w-4 h-4 text-white/80 shrink-0" />
                                            <div>
                                                <p className="text-white font-bold text-base leading-none">₹{referralData.referralEarnings}</p>
                                                <p className="text-white/70 text-[10px] mt-0.5">Total Earned</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex items-center gap-2 bg-white/20 rounded-2xl px-3 py-2.5">
                                            <Users className="w-4 h-4 text-white/80 shrink-0" />
                                            <div>
                                                <p className="text-white font-bold text-base leading-none">{referralData.totalReferredPujas}</p>
                                                <p className="text-white/70 text-[10px] mt-0.5">Pujas Referred</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex items-center gap-2 bg-white/20 rounded-2xl px-3 py-2.5">
                                            <Percent className="w-4 h-4 text-white/80 shrink-0" />
                                            <div>
                                                <p className="text-white font-bold text-base leading-none">{referralData.referralPercentage}%</p>
                                                <p className="text-white/70 text-[10px] mt-0.5">Reward Rate</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* List — scrolls independently, header stays fixed */}
                            <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-3 scrollbar-hide">
                                {referralBookingsLoading ? (
                                    <div className="flex justify-center py-16">
                                        <div className="w-9 h-9 border-4 border-[#FF7000] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : referralBookings.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                            <Gift className="w-8 h-8 text-orange-300" />
                                        </div>
                                        <p className="text-gray-700 font-semibold text-sm">No referral bookings yet</p>
                                        <p className="text-gray-400 text-xs mt-1 max-w-[220px]">
                                            Share your referral code with friends. When they book a puja, it shows here.
                                        </p>
                                    </div>
                                ) : (
                                    referralBookings.map((booking) => (
                                        <div
                                            key={booking.bookingId}
                                            className="bg-white rounded-2xl border border-orange-50 shadow-sm overflow-hidden"
                                        >
                                            {/* Top row */}
                                            <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 text-sm truncate">{booking.poojaName}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                        <Users className="w-3 h-3 shrink-0" />
                                                        {booking.referredUserName}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full border border-green-100">
                                                    +₹{booking.amountEarned}
                                                </span>
                                            </div>

                                            {/* Divider + meta */}
                                            <div className="flex items-center border-t border-orange-50">
                                                <div className="flex-1 px-4 py-2">
                                                    <p className="text-[10px] text-gray-400">Booking Value</p>
                                                    <p className="text-xs font-semibold text-gray-700">₹{booking.totalBookingAmount}</p>
                                                </div>
                                                <div className="w-px h-8 bg-orange-50" />
                                                <div className="flex-1 px-4 py-2">
                                                    <p className="text-[10px] text-gray-400">Reward</p>
                                                    <p className="text-xs font-semibold text-gray-700">{booking.rewardPercentage}%</p>
                                                </div>
                                                <div className="w-px h-8 bg-orange-50" />
                                                <div className="flex-1 px-4 py-2">
                                                    <p className="text-[10px] text-gray-400">Date</p>
                                                    <p className="text-xs font-semibold text-gray-700">
                                                        {new Date(booking.bookedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Sticky payout button */}
                            {referralData && referralData.referralEarnings > 0 && (
                                <div className="fixed bottom-0 left-0 right-0 z-40">
                                    <div className="w-full max-w-md mx-auto px-4 py-3 bg-white/90 backdrop-blur-md border-t border-orange-100">
                                        {payoutDone ? (
                                            <div className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-green-50 border border-green-100 text-green-600 font-bold text-sm">
                                                <CheckCircle2 className="w-5 h-5" />
                                                Payout request submitted!
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handlePayoutRequest}
                                                className="w-full flex items-center justify-center gap-2 bg-[#FF7000] text-white font-bold py-3.5 rounded-2xl shadow-md shadow-orange-200 active:scale-[0.98] transition-all text-sm"
                                            >
                                                <Wallet className="w-4 h-4" />
                                                Request Payout  •  ₹{referralData.referralEarnings}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Share Referral Modal */}
                <AnimatePresence>
                    {showShareModal && referralData && (
                        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowShareModal(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 100 }}
                                className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[32px] p-6 shadow-2xl"
                            >
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-500 active:scale-90 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="flex flex-col items-center text-center pt-2">
                                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-3">
                                        <Gift className="w-7 h-7 text-[#FF7000]" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800">Your Referral Code</h2>
                                    <p className="text-xs text-gray-400 mt-1 mb-5">
                                        Share this code with friends. You earn{" "}
                                        <span className="text-[#FF7000] font-semibold">{referralData.referralPercentage}%</span> when they book a Puja.
                                    </p>

                                    {/* Code display */}
                                    <div className="flex items-center gap-3 w-full bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 mb-4">
                                        <span className="flex-1 text-center text-xl font-bold tracking-widest text-[#FF7000]">
                                            {referralData.userReferralCode}
                                        </span>
                                        <button
                                            onClick={handleCopyCode}
                                            className="flex items-center gap-1.5 bg-[#FF7000] text-white text-xs font-bold px-3 py-1.5 rounded-xl active:scale-90 transition-all shadow-md shadow-orange-100"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copied ? "Copied!" : "Copy"}
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleNativeShare}
                                        className="w-full flex items-center justify-center gap-2 bg-[#FF7000] text-white font-bold py-3.5 rounded-2xl shadow-md shadow-orange-200 active:scale-[0.98] transition-all"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Share with Friends
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── Payout Confirm Modal (date 1–6) ── */}
                <AnimatePresence>
                    {payoutModal === "confirm" && referralData && (
                        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setPayoutModal(null)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
                                className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[32px] p-7 shadow-2xl"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                        <div className="w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center">
                                            <Wallet className="w-6 h-6 text-[#FF7000]" />
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-1">Request Payout</h2>
                                    <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                                        This will open Gmail with a pre-filled request to our team.
                                        Just hit <span className="font-bold text-gray-600">Send</span> and we'll process
                                        your payout within 3–5 business days.
                                    </p>

                                    {/* Amount + recipient pill */}
                                    <div className="w-full bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3 mb-6 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400 font-medium">Amount</span>
                                            <span className="text-base font-bold text-[#FF7000]">₹{referralData.referralEarnings}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400 font-medium">To</span>
                                            <span className="text-xs font-semibold text-gray-600">vedicvaibhav92@gmail.com</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col w-full gap-3">
                                        <button
                                            onClick={openGmailPayout}
                                            className="w-full py-3.5 bg-[#FF7000] text-white font-bold rounded-2xl shadow-md shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        >
                                            <MailOpen className="w-4 h-4" />
                                            Open Gmail to Request
                                        </button>
                                        <button
                                            onClick={() => setPayoutModal(null)}
                                            className="w-full py-3.5 bg-gray-50 text-gray-500 font-bold rounded-2xl active:scale-[0.98] transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── Payout Not-Allowed Modal (outside 1–6) ── */}
                <AnimatePresence>
                    {payoutModal === "not-allowed" && (
                        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setPayoutModal(null)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
                                className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[32px] p-7 shadow-2xl"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                        <div className="w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center">
                                            <CalendarClock className="w-6 h-6 text-[#FF7000]" />
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-2">Not Available Yet</h2>
                                    <p className="text-gray-500 text-sm mb-3 leading-relaxed">
                                        Payout requests are only allowed between the{" "}
                                        <span className="font-bold text-gray-700">1st and 6th</span> of each month.
                                    </p>

                                    {/* Next window pill */}
                                    <div className="w-full flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 mb-6">
                                        <CalendarClock className="w-5 h-5 text-[#FF7000] shrink-0" />
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-400 font-medium">Next payout window opens</p>
                                            <p className="text-sm font-bold text-gray-700">
                                                1st {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                                                    .toLocaleString("en-IN", { month: "long", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setPayoutModal(null)}
                                        className="w-full py-3.5 bg-[#FF7000] text-white font-bold rounded-2xl shadow-md shadow-orange-200 active:scale-[0.98] transition-all"
                                    >
                                        Got it
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Logout Confirmation Modal */}
                <AnimatePresence>
                    {isLogoutModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 100 }}
                                className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[32px] p-8 shadow-2xl overflow-hidden"
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full translate-x-16 -translate-y-16" />

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                                            <LogOut className="w-7 h-7 text-red-500" />
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Logout</h2>
                                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                        Are you sure you want to log out from <br />
                                        <span className="font-bold text-gray-700">Panditji At Request?</span>
                                    </p>

                                    <div className="flex flex-col w-full gap-3">
                                        <button
                                            onClick={confirmLogout}
                                            className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-100 active:scale-[0.98] transition-all"
                                        >
                                            Yes, Log Me Out
                                        </button>
                                        <button
                                            onClick={() => setIsLogoutModalOpen(false)}
                                            className="w-full py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl active:scale-[0.98] transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
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

export default ProfilePage;
