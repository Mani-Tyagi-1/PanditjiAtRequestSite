import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginModal() {
    const { isLoginModalOpen, closeLoginModal, login } = useAuth();

    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!phone || phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch(`${apiUrl}/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, isNotifyOkay: true })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

            setStep('otp');
        } catch (err: any) {
            setError(err.message || 'An error occurred while sending OTP');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!otp || otp.length < 4) {
            setError('Please enter a valid OTP');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch(`${apiUrl}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Invalid OTP');

            // Success
            login(data.token, data.user);

            // Reset & Close
            setStep('phone');
            setPhone('');
            setOtp('');
            closeLoginModal();

        } catch (err: any) {
            setError(err.message || 'An error occurred while verifying OTP');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetAndClose = () => {
        setStep('phone');
        setPhone('');
        setOtp('');
        setError('');
        closeLoginModal();
    };

    if (!isLoginModalOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                {/* Backdrop overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={resetAndClose}
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl z-10"
                >
                    {/* Header Banner */}
                    <div className="bg-gradient-to-br from-orange-400 to-orange-500 p-6 text-center pt-8">
                        <h2 className="text-2xl font-bold text-white mb-1">
                            {step === 'phone' ? 'Welcome Back!' : 'Verify OTP'}
                        </h2>
                        <p className="text-orange-50 text-sm opacity-90">
                            {step === 'phone' ? 'Login or signup to continue' : `Sent to +91 ${phone}`}
                        </p>

                        <button
                            onClick={resetAndClose}
                            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {step === 'phone' ? (
                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-stone-700 mb-1.5 ml-1">Mobile Number</label>
                                    <div className="relative flex">
                                        <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-stone-300 bg-stone-50 text-stone-500 font-semibold sm:text-sm">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            maxLength={10}
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                            className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-xl focus:ring-orange-500 focus:border-orange-500 sm:text-sm border-stone-300 shadow-sm"
                                            placeholder="Enter 10 digit number"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing || phone.length !== 10}
                                    className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all ${isProcessing || phone.length !== 10
                                        ? 'bg-orange-300 cursor-not-allowed'
                                        : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98]'
                                        }`}
                                >
                                    {isProcessing ? 'Sending...' : 'Get OTP'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1.5 ml-1">
                                        <label className="block text-sm font-semibold text-stone-700">Enter OTP</label>
                                        <button type="button" onClick={() => setStep('phone')} className="text-xs text-orange-600 font-semibold hover:underline">Change Number</button>
                                    </div>

                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="block w-full px-4 py-3 rounded-xl focus:ring-orange-500 focus:border-orange-500 sm:text-lg tracking-widest text-center font-bold border-stone-300 shadow-sm"
                                        placeholder="• • • •"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing || otp.length < 4}
                                    className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all ${isProcessing || otp.length < 4
                                        ? 'bg-orange-300 cursor-not-allowed'
                                        : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98]'
                                        }`}
                                >
                                    {isProcessing ? 'Verifying...' : 'Verify & Secure Login'}
                                </button>
                            </form>
                        )}

                        <p className="mt-6 text-center text-[11px] text-stone-400">
                            By proceeding, you agree to our <a href="/termsandconditions" className="underline hover:text-orange-500">Terms of Service</a> & <a href="/privacypolicy" className="underline hover:text-orange-500">Privacy Policy</a>
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
