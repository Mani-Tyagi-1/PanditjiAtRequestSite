import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { FaUser, FaPhone, FaEnvelope, FaChevronLeft, FaSignOutAlt, FaCalendarAlt, FaVenusMars } from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import { decryptData } from "../utils/encryption";

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                } else {
                    setError("Failed to process user data.");
                }
            } else {
                setError("Unexpected response format from server.");
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-sm">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate("/")}
                        className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-orange-700 transition-all"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 pb-10">
            {/* Header */}
            <div className="bg-gradient-to-b from-orange-400 to-orange-500 pt-8 pb-7 mb-6 px-4 rounded-b-[2rem] relative shadow-lg">
                <div className="max-w-md mx-auto flex items-center justify-between text-white">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all"
                    >
                        <FaChevronLeft className="text-xl" />
                    </button>
                    <h1 className="text-xl font-bold">My Profile</h1>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all text-white"
                        title="Logout"
                    >
                        <FaSignOutAlt className="text-xl" />
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="max-w-md mx-auto px-4 -mt-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-xl p-6 border border-stone-100"
                >
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mb-4 border-4 border-white shadow-md">
                            <FaUser className="text-4xl text-orange-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {user?.given_name || user?.family_name ? `${user.given_name || ""} ${user.family_name || ""}`.trim() : "Vedic Vaibhav User"}
                        </h2>
                        <p className="text-gray-500 text-sm">{user?.phone || "No phone linked"}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <FaEnvelope className="text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Email Address</p>
                                <p className="text-gray-800 font-semibold">{user?.email || "Not provided"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <FaPhone className="text-green-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Mobile Number</p>
                                <p className="text-gray-800 font-semibold">+91 {user?.phone || "Not provided"}</p>
                            </div>
                        </div>

                        {user?.gender && (
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <FaVenusMars className="text-purple-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Gender</p>
                                    <p className="text-gray-800 font-semibold capitalize">{user.gender}</p>
                                </div>
                            </div>
                        )}

                        {user?.dob && (
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <FaCalendarAlt className="text-amber-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Date of Birth</p>
                                    <p className="text-gray-800 font-semibold">{user.dob}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-center text-xs text-gray-400 italic">
                            Member since {user?.addedOn ? new Date(user.addedOn).toLocaleDateString() : "2025"}
                        </p>
                    </div>
                </motion.div>

                {/* Account Actions */}
                <div className="mt-6 flex flex-col gap-3">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 bg-white text-red-500 font-bold py-4 rounded-2xl shadow-sm border border-red-50 hover:bg-red-50 transition-all"
                    >
                        <FaSignOutAlt />
                        Logout Session
                    </button>
                    <p className="text-center text-xs text-gray-400 px-8">
                        Your profile is secured using bank-grade AES-256 encryption.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
