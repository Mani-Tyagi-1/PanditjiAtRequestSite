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
      <div className="relative max-w-md mx-auto px-6 z-10">
        {/* Footer Content */}
        <div className="flex flex-col items-center text-center space-y-10 mb-8">
          {/* Left Column: Logo + Text */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="flex justify-center"
            >
              <img
                src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
                alt="Pandit Ji At Request"
                className="h-20"
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-sm leading-relaxed text-stone-700 px-4"
            >
              "Book Qualified Pandit Ji Anytime Anywhere"
              <br />
              <span className="opacity-80">
                Pandit Ji at Request is the most trusted platform for Vedic and Hindu rituals.
              </span>
            </motion.p>
          </div>

          {/* Center Column: Quick Links */}
          <div className="space-y-4 w-full">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-lg font-bold text-stone-800"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Quick Links
            </motion.h3>

            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm"
            >
              <li><a href="/about" className="hover:text-[#ff7a00] transition-colors">About Us</a></li>
              <li><a href="/contact" className="hover:text-[#ff7a00] transition-colors">Contact Us</a></li>
              <li><a href="https://partner.vedicvaibhav.in/affiliate-register" className="hover:text-[#ff7a00] transition-colors">Affiliate</a></li>
              <li><a href="/privacypolicy" className="hover:text-[#ff7a00] transition-colors">Privacy</a></li>
              <li className="col-span-2"><a href="/termsandconditions" className="hover:text-[#ff7a00] transition-colors">Terms & Conditions</a></li>
            </motion.ul>
          </div>

          {/* Right Column: Social Media */}
          <div className="space-y-4">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-lg font-bold text-stone-800"
            >
              Stay In Touch
            </motion.h3>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="flex justify-center gap-6 text-2xl"
            >
              <a
                href="https://www.facebook.com/share/1ZT53FVEHJ/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-800 hover:text-orange-600 transition-all duration-300"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://www.instagram.com/panditjiatrequest?igsh=Ym1sbzZkbnJwM3Jh&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-800 hover:text-orange-600 transition-all duration-300"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.youtube.com/@TheVedicVaibhav?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-800 hover:text-orange-600 transition-all duration-300"
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
