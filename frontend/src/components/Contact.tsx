import { motion } from "framer-motion";

const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Form */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-4xl font-semibold text-[#FF5F01] leading-tight"
            >
              Get in Touch
            </motion.h2>
            <p className="text-lg text-gray-600 mt-4">
              Any question or remarks? Let us know!
            </p>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="mt-8 space-y-6"
            >
              <div>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <textarea
                  placeholder="Type your message here"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full bg-[#FF5F01] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all"
                >
                  Submit
                </button>
              </div>
            </motion.form>
          </div>

          {/* Right Column: Image */}
          <div className="hidden md:block relative">
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
