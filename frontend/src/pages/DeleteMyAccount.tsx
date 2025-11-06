import React, { useState } from "react";
import axios from "axios";

const DeleteMyAccount = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Handle phone number input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
  };

  // Handle OTP input change
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
  };

  // Send OTP to the backend API
  const sendOtp = async () => {
    if (phone.length === 10) {
      setError("");
      setOtpSent(true);

      try {
        // Send phone number to backend to request OTP
        const response = await axios.post(
          "http://localhost:5000/api/delete-account",
          { phone }
        );
        if (response.status === 200) {
          console.log("OTP sent to:", phone);
        }
      } catch (err) {
        setError("Failed to send OTP. Please try again.");
        console.error("Error sending OTP:", err);
      }
    } else {
      setError("Please enter a valid phone number.");
    }
  };

  // Verify OTP and delete account via backend API
  const handleDeleteAccount = async () => {
    if (otp.length === 6) {
      setError("");

      try {
        // Send OTP to backend to verify and delete account
        const response = await axios.post(
          "http://localhost:5000/api/verify-otp-and-delete",
          {
            phone,
            otp,
          }
        );

        if (response.status === 200) {
          setSuccess(true);
        }
      } catch (err) {
        setError("Invalid OTP. Please try again.");
        console.error("Error verifying OTP and deleting account:", err);
      }
    } else {
      setError("Please enter a valid 6-digit OTP.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Delete My Account
        </h1>

        <p className="text-lg text-center text-gray-600">
          We’re sorry to see you go! To delete your account, please enter your
          phone number and the OTP sent to your phone.
        </p>

        {error && (
          <div className="bg-red-100 text-red-800 text-sm p-2 rounded-md">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-md text-center">
            <h2 className="text-xl font-semibold">
              Your account has been deleted successfully!
            </h2>
            <p>
              We’re sorry to see you go, but we hope to see you again someday.
            </p>
          </div>
        ) : (
          <>
            {!otpSent ? (
              <div>
                <label htmlFor="phone" className="block text-gray-600">
                  Enter your phone number:
                </label>
                <input
                  type="text"
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full mt-2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="10-digit phone number"
                />
                <button
                  onClick={sendOtp}
                  className="w-full mt-4 bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 transition"
                >
                  Send OTP
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="otp" className="block text-gray-600">
                  Enter the OTP sent to your phone:
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={handleOtpChange}
                  className="w-full mt-2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="6-digit OTP"
                />
                <button
                  onClick={handleDeleteAccount}
                  className="w-full mt-4 bg-red-600 text-white p-3 rounded-md hover:bg-red-700 transition"
                >
                  Confirm Account Deletion
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteMyAccount;
