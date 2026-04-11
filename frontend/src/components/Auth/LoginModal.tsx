import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../api/apiClient';

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Update this path according to your actual logo location
  const logoUrl =
    'https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await apiClient.post('/send-otp', { phone, isNotifyOkay: true });

      // If success is false but status is 200 (legacy), handle it
      if (res.data.success === false) {
        throw new Error(res.data.message || 'Failed to send OTP');
      }

      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while sending OTP');
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
      const res = await apiClient.post('/verify-otp', { phone, otp });
      const data = res.data;

      // apiClient auto-unwraps the 'data' field if present
      // If it returns { success, message, data: { token, user } }, 
      // then res.data is { token, user }
      
      const token = data.token;
      const userObj = data.user;

      if (!token || !userObj) {
        // Handle case where data wasn't unwrapped as expected or success was false
        if (data.success === false) {
          throw new Error(data.message || 'Invalid OTP');
        }
      }

      login(token, userObj);

      setStep('phone');
      setPhone('');
      setOtp('');
      closeLoginModal();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while verifying OTP');
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
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-[6px]"
          onClick={resetAndClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 24 }}
          transition={{ duration: 0.22 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.22)]"
        >
          {/* Decorative top section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#FFEDD5] via-[#FFF7ED] to-[#FEF3C7] px-6 pb-6 pt-7">
            <div className="absolute inset-0 opacity-40">
              <div className="absolute -top-10 -left-10 h-28 w-28 rounded-full bg-orange-200 blur-2xl" />
              <div className="absolute top-8 right-0 h-24 w-24 rounded-full bg-amber-200 blur-2xl" />
              <div className="absolute bottom-0 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full bg-orange-100 blur-2xl" />
            </div>

            <button
              onClick={resetAndClose}
              className="absolute right-4 top-4 z-20 rounded-full bg-white/80 p-2 text-stone-600 shadow-sm transition hover:bg-white"
              aria-label="Close modal"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md ring-4 ring-orange-100">
                <img
                  src={logoUrl}
                  alt="Pandit Ji At Request"
                  className="h-16 w-16 object-contain"
                />
              </div>

              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-600">
                Pandit Ji At Request
              </p>

              <h2 className="text-2xl font-bold text-stone-900">
                {step === 'phone' ? 'Secure Login' : 'Verify Your OTP'}
              </h2>

              <p className="mt-1 max-w-[280px] text-sm text-stone-600">
                {step === 'phone'
                  ? 'Login or sign up to continue your spiritual booking journey.'
                  : `We have sent an OTP to +91 ${phone}`}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 pt-5">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-700">
                    Mobile Number
                  </label>

                  <div className="flex overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 shadow-sm transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100">
                    <div className="flex items-center border-r border-stone-200 px-4 text-sm font-semibold text-stone-600">
                      +91
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-transparent px-4 py-4 text-sm font-medium text-stone-800 outline-none placeholder:text-stone-400"
                      placeholder="Enter 10 digit mobile number"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || phone.length !== 10}
                  className={`w-full rounded-2xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all ${isProcessing || phone.length !== 10
                      ? 'cursor-not-allowed bg-orange-300'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-[1.01] hover:shadow-xl active:scale-[0.99]'
                    }`}
                >
                  {isProcessing ? 'Sending OTP...' : 'Get OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-stone-700">Enter OTP</label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('phone');
                        setOtp('');
                        setError('');
                      }}
                      className="text-xs font-semibold text-orange-600 transition hover:text-orange-700 hover:underline"
                    >
                      Change Number
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-center text-xl font-bold tracking-[0.45em] text-stone-800 shadow-sm outline-none transition placeholder:tracking-[0.3em] placeholder:text-stone-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    placeholder="• • • •"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || otp.length < 4}
                  className={`w-full rounded-2xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all ${isProcessing || otp.length < 4
                      ? 'cursor-not-allowed bg-orange-300'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-[1.01] hover:shadow-xl active:scale-[0.99]'
                    }`}
                >
                  {isProcessing ? 'Verifying...' : 'Verify & Login'}
                </button>
              </form>
            )}

            {/* Bottom trust strip */}
            <div className="mt-5 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 text-center">
              <p className="text-xs font-medium text-stone-600">
                Safe, quick and seamless access for puja bookings and spiritual services.
              </p>
            </div>

            <p className="mt-5 text-center text-[11px] leading-5 text-stone-400">
              By proceeding, you agree to our{' '}
              <a
                href="/termsandconditions"
                className="font-medium text-stone-500 underline transition hover:text-orange-500"
              >
                Terms of Service
              </a>{' '}
              &{' '}
              <a
                href="/privacypolicy"
                className="font-medium text-stone-500 underline transition hover:text-orange-500"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}