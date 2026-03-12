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
    Camera,
    Info,
    HelpCircle,
    Users,
    Edit3
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { decryptData, encryptPayload } from "../utils/encryption";

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

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<"view" | "edit">("view");

    // Form State
    const [formData, setFormData] = useState<Partial<UserData>>({});
    const [isSaving, setIsSaving] = useState(false);

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

            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
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
        logout();
        navigate("/");
    };

    const handleSave = async () => {
        if (!user?._id) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem("user_token");
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
            
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
            alert(err.response?.data?.message || "Failed to update profile.");
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

    return (
        <div className="min-h-screen bg-[#FFFAF5] pb-24 font-sans">
            <AnimatePresence mode="wait">
                {mode === "view" ? (
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
                                onClick={() => navigate(-1)} 
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

                        {/* Menu Items */}
                        <div className="space-y-1">
                            <ProfileMenuItem 
                                icon={User} 
                                title="My Profile" 
                                subtitle="Tap to open" 
                                onClick={() => setMode("edit")}
                            />
                            <ProfileMenuItem 
                                icon={Users} 
                                title="Family" 
                                subtitle="Tap to open" 
                                onClick={() => {}}
                            />
                            <ProfileMenuItem 
                                icon={Calendar} 
                                title="My Puja Booking" 
                                subtitle="Tap to open" 
                                onClick={() => navigate("/my-bookings")}
                            />
                            <ProfileMenuItem 
                                icon={Info} 
                                title="About Us" 
                                subtitle="Tap to open" 
                                onClick={() => navigate("/about")}
                            />
                            <ProfileMenuItem 
                                icon={HelpCircle} 
                                title="FAQs & Help Center" 
                                subtitle="Tap to open" 
                                onClick={() => navigate("/help")}
                            />
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

                            <div className="flex flex-col items-center opacity-40 grayscale pointer-events-none scale-75">
                                <img src="/logo.png" alt="Emblem" className="w-20 h-20 object-contain mb-2" />
                                <span className="text-xs font-semibold text-gray-400">ver 2.41</span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="edit"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {/* Header */}
                        <div className="bg-[#FF7000] px-4 pt-8 pb-20 relative">
                            <div className="flex items-center gap-4 text-white mb-6">
                                <button 
                                    onClick={() => setMode("view")} 
                                    className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 transition-all shadow-sm border border-white/10"
                                    aria-label="Back to Profile"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <div>
                                    <h1 className="text-xl font-bold">Edit Profile</h1>
                                    <p className="text-white/80 text-[10px]">Personal & astro details for accurate Pooja</p>
                                </div>
                            </div>
                            
                            {/* Profile Image card overlay */}
                            <div className="absolute left-4 right-4 -bottom-16">
                                <div className="bg-[#FF7000] rounded-3xl p-6 flex flex-col items-center justify-center">
                                    <div className="relative">
                                        <div className="w-28 h-28 rounded-full border-4 border-white/30 shadow-xl overflow-hidden bg-white">
                                            <img 
                                                src={user?.picture || "https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png"} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-lg border border-orange-50 text-[#FF7000] active:scale-90 transition-all">
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="text-white font-bold text-lg mt-3">{user?.given_name} {user?.family_name}</h3>
                                    <p className="text-white/80 text-sm">{user?.phone ? `+91 ${user.phone}` : ""}</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Sections */}
                        <div className="px-4 mt-20 space-y-4">
                            {/* Basic Details */}
                            <div className="bg-white rounded-[28px] p-5 shadow-sm border border-orange-50">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                                        <User className="w-4 h-4 text-[#FF7000]" />
                                    </div>
                                    <h2 className="font-bold text-gray-800">Basic Details</h2>
                                </div>
                                
                                <EditInput 
                                    label="First Name" 
                                    icon={Edit3} 
                                    value={formData.given_name}
                                    onChange={(v: string) => setFormData({...formData, given_name: v})}
                                />
                                <EditInput 
                                    label="Last Name" 
                                    icon={Edit3}
                                    value={formData.family_name}
                                    onChange={(v: string) => setFormData({...formData, family_name: v})}
                                />
                                <EditInput 
                                    label="Mobile Number" 
                                    icon={Phone} 
                                    value={formData.phone}
                                    disabled={true}
                                />
                                <p className="text-[10px] text-gray-400 -mt-2 ml-1 mb-4">Mobile number cannot be changed</p>
                                
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-700 ml-1">Gender</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {["Male", "Female", "Other"].map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setFormData({...formData, gender: g})}
                                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-sm font-medium ${formData.gender === g ? 'bg-[#FF7000] border-[#FF7000] text-white shadow-md' : 'bg-white border-orange-100 text-gray-500'}`}
                                            >
                                                <User className="w-4 h-4" />
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Astro Details */}
                            <div className="bg-white rounded-[28px] p-5 shadow-sm border border-orange-50">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                                        <Bookmark className="w-4 h-4 text-[#FF7000]" />
                                    </div>
                                    <h2 className="font-bold text-gray-800">Astro Details</h2>
                                </div>

                                <EditInput 
                                    label="Date of Birth" 
                                    icon={Calendar} 
                                    type="date"
                                    value={formData.dob}
                                    onChange={(v: string) => setFormData({...formData, dob: v})}
                                />
                                <EditInput 
                                    label="Birth Time" 
                                    icon={Clock} 
                                    type="time"
                                    value={formData.birthTime}
                                    onChange={(v: string) => setFormData({...formData, birthTime: v})}
                                />
                                <EditInput 
                                    label="Birth Place" 
                                    icon={MapPin}
                                    placeholder="Enter birth city"
                                    value={formData.birthPlace}
                                    onChange={(v: string) => setFormData({...formData, birthPlace: v})}
                                />
                                <EditInput 
                                    label="Gotra" 
                                    icon={Bookmark}
                                    placeholder="Enter your gotra"
                                    value={formData.gotra}
                                    onChange={(v: string) => setFormData({...formData, gotra: v})}
                                />
                                <p className="text-[10px] text-gray-400 mt-1 ml-1">Helps Purohit perform Sankalp correctly.</p>
                            </div>

                            {/* Contact Section */}
                            <div className="bg-white rounded-[28px] p-5 shadow-sm border border-orange-50">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                                        <Mail className="w-4 h-4 text-[#FF7000]" />
                                    </div>
                                    <h2 className="font-bold text-gray-800">Contact</h2>
                                </div>
                                <EditInput 
                                    label="Email" 
                                    icon={Mail} 
                                    type="email"
                                    value={formData.email}
                                    onChange={(v: string) => setFormData({...formData, email: v})}
                                />
                            </div>

                            <p className="text-center text-[10px] text-gray-400 px-8 py-4">
                                Your details are used only to perform Pooja correctly and securely.
                            </p>

                            {/* Save Button */}
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-[#FFB58A] hover:bg-[#FF7000] disabled:opacity-50 text-white font-bold py-4 rounded-[20px] shadow-lg shadow-orange-100 transition-all mb-10 active:scale-[0.98]"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfilePage;
