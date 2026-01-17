import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { motion } from "framer-motion";

const Footer: React.FC = () => {
  return (
    <footer
      className="bg-[#f2e3e0] py-6 md:py-4 relative"
      style={{
        backgroundImage:
          "url('https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/image%201521.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#CC3600] opacity-30"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 z-10">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-20 text-center md:text-left mb-6 md:mb-4">
          {/* Left Column: Logo + Text */}
          <div className="space-y-3 md:space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="flex items-center justify-center md:justify-start"
            >
              <img
                src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
                alt="Pandit Ji At Request"
                className="h-16 sm:h-20 md:h-24"
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-sm md:text-md px-2 md:px-0"
            >
              "Book Qualified Pandit Ji Anytime Anywhere"
              <br />
              Pandit Ji at Request is the most trusted platform for availing
              Vedic and Hindu Puja Services like performing Vedic Rituals,
              Religious Ceremonies, Vastu Yagya, and many more.
            </motion.p>
          </div>

          {/* Center Column: Quick Links */}
          <div className="space-y-3 md:space-y-4 md:mt-8">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-lg md:text-xl font-semibold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Quick Links
            </motion.h3>

            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="space-y-2"
            >
              <li>
                <a
                  href="/about"
                  className="text-sm hover:text-[#ff7a00] transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-sm hover:text-[#ff7a00] transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="https://partner.vedicvaibhav.in/affiliate-register"
                  className="text-sm hover:text-[#ff7a00] transition-colors"
                >
                  Register as Pandit Ji
                </a>
              </li>
              <li>
                <a
                  href="/privacypolicy"
                  className="text-sm hover:text-[#ff7a00] transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/termsandconditions"
                  className="text-sm hover:text-[#ff7a00] transition-colors"
                >
                  Terms and Conditions
                </a>
              </li>
            </motion.ul>
          </div>

          {/* Right Column: Social Media */}
          <div className="space-y-3 md:space-y-4 md:mt-8">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-lg md:text-xl font-semibold"
            >
              Stay In Touch With Us
            </motion.h3>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="flex justify-center md:justify-start gap-4 text-2xl"
            >
              <a
                href="https://www.facebook.com/share/1ZT53FVEHJ/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#CC3600] hover:text-white transition-all duration-300"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://www.instagram.com/panditjiatrequest?igsh=Ym1sbzZkbnJwM3Jh&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#CC3600] hover:text-white transition-all duration-300"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.youtube.com/@TheVedicVaibhav?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#CC3600] hover:text-white transition-all duration-300"
              >
                <FaYoutube />
              </a>
            </motion.div>
          </div>
        </div>

        <div className="w-full h-[2px] bg-[#D98C72] my-4"></div>

        {/* Footer Bottom: Copyright */}
        <div className="mt-4 md:mt-7 text-center text-xs md:text-sm font-light">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <a
              href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/image%201520.png"
                alt="Available on google play store"
                className="h-10 sm:h-12"
              />
            </a>
            <p className="px-2">
              Copyright © 2025 Pandit Ji At Request. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
