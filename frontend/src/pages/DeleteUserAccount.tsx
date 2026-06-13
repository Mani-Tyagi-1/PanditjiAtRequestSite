import React, { useState } from "react";
import axios from "axios";
import { Phone, Shield, Trash2, ChevronLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import API_URL from "../utils/apiConfig";

const DeleteUserAccount: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "done">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API_URL}/user/delete-account`, { phone });
      setStep("otp");
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(msg || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API_URL}/user/verify-otp-and-delete`, { phone, otp });
      setStep("done");
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(msg || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#FF7000] to-[#FF9A45] px-4 pt-5 pb-8">
        <div className="flex items-center gap-3 text-white">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 transition-all border border-white/20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold leading-tight">Delete Account</h1>
            <p className="text-white/75 text-[10px]">This action is permanent and cannot be undone</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-4 pb-10 max-w-md mx-auto w-full">
        {step === "done" ? (
          <div className="mt-8 bg-white rounded-[28px] p-8 shadow-sm border border-orange-50 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-7 h-7 text-green-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Account Deleted</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your account and all associated data have been permanently deleted. We're sorry to see you go.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-8 w-full bg-[#FF7000] text-white font-bold py-3.5 rounded-2xl shadow-md shadow-orange-200 active:scale-[0.98] transition-all text-sm"
            >
              Go to Home
            </button>
          </div>
        ) : (
          <>
            {/* Warning card */}
            <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-600 text-xs leading-relaxed">
                Deleting your account will permanently remove all your bookings, referral earnings, and personal data. This cannot be undone.
              </p>
            </div>

            {/* Step card */}
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-orange-50">
              {step === "phone" && (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-[#FF7000]" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-800 text-sm">Enter your phone number</h2>
                      <p className="text-xs text-gray-400">We'll send a verification OTP</p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100">
                      {error}
                    </div>
                  )}

                  <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
                    Phone Number
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-orange-100 bg-white focus-within:border-[#FF7000] shadow-sm mb-5 transition-all">
                    <Phone className="w-4 h-4 text-[#FF7000] shrink-0" />
                    <span className="text-sm text-gray-400">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="10-digit number"
                      className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-300"
                    />
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full bg-[#FF7000] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-orange-200 active:scale-[0.98] transition-all text-sm"
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </>
              )}

              {step === "otp" && (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-[#FF7000]" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-800 text-sm">Enter OTP</h2>
                      <p className="text-xs text-gray-400">Sent to +91 {phone}</p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100">
                      {error}
                    </div>
                  )}

                  <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">
                    6-digit OTP
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-orange-100 bg-white focus-within:border-[#FF7000] shadow-sm mb-5 transition-all">
                    <Shield className="w-4 h-4 text-[#FF7000] shrink-0" />
                    <input
                      type="tel"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter OTP"
                      className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-300 tracking-widest"
                    />
                  </div>

                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-red-100 active:scale-[0.98] transition-all text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    {loading ? "Deleting..." : "Confirm & Delete Account"}
                  </button>

                  <button
                    onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                    className="w-full mt-3 py-3 text-gray-500 font-semibold text-sm active:scale-[0.98] transition-all"
                  >
                    Change Phone Number
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteUserAccount;
