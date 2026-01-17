import React, { useState } from "react";
import { motion } from "framer-motion";

const WEB3FORMS_ACCESS_KEY = (import.meta as any).env
  ?.VITE_WEB3FORMS_ACCESS_KEY as string | undefined;

const ContactSection: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | {
    type: "success" | "error";
    msg: string;
  }>(null);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const validatePhone = (value: string) =>
    /^[6-9]\d{9}$/.test(value.trim()); // Indian mobile validation

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const n = name.trim();
    const em = email.trim();
    const ph = phone.trim();
    const msg = message.trim();

    if (!n) return setStatus({ type: "error", msg: "Please enter your name." });
    if (!em || !validateEmail(em))
      return setStatus({ type: "error", msg: "Please enter a valid email." });
    if (!ph || !validatePhone(ph))
      return setStatus({
        type: "error",
        msg: "Please enter a valid 10-digit mobile number.",
      });
    if (!msg || msg.length < 10)
      return setStatus({
        type: "error",
        msg: "Message must be at least 10 characters.",
      });

    try {
      setLoading(true);

      const payload = {
        access_key: WEB3FORMS_ACCESS_KEY,
        name: n,
        email: em,
        phone: ph,
        message: msg,
        subject: `New Contact Form Message - ${n}`,
        from_name: "PanditJiAtRequest Website",
      };

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data?.success !== true) {
        throw new Error(data?.message || "Failed to send message.");
      }

      setStatus({
        type: "success",
        msg: "✅ Message sent! We’ll contact you soon.",
      });
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err: any) {
      setStatus({
        type: "error",
        msg: err?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="bg-white md:py-20 py-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-4xl font-semibold text-[#FF5F01]"
            >
              Get in Touch
            </motion.h2>

            <p className="text-lg text-gray-600 mt-4">
              Any question or remarks? Let us know!
            </p>

            {status && (
              <div
                className={`mt-6 rounded-lg px-4 py-3 text-sm font-medium ${
                  status.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {status.msg}
              </div>
            )}

            <motion.form
              onSubmit={onSubmit}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80 }}
              className="mt-8 space-y-6"
            >
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />

              <input
                type="tel"
                placeholder="Enter your mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />

              <textarea
                placeholder="Type your message here"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white py-3 rounded-lg font-semibold ${
                  loading
                    ? "bg-orange-400 cursor-not-allowed"
                    : "bg-[#FF5F01] hover:bg-orange-600"
                }`}
              >
                {loading ? "Sending..." : "Submit"}
              </button>
            </motion.form>
          </div>

          {/* Right Column */}
          <div className="hidden md:block">
            <img
              src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/getintouchimg.webp"
              alt="Pandit Ji Contact"
              className="w-[500px] rounded-lg object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
