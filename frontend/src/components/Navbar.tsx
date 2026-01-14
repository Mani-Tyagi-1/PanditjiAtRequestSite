import { motion, AnimatePresence } from "framer-motion";
import { Link as ScrollLink } from "react-scroll"; // Importing react-scroll Link
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const navLinks = [
  { label: "Home", href: "/" },
  {
    label: "Pandit Registration",
    href: "https://partner.vedicvaibhav.in/affiliate-register",
    highlight: true,
  },
  { label: "Videos", href: "/videos" },
  { label: "About Us", href: "#about" }, // Updated to use id-based scrolling
  { label: "Contact Us", href: "#contact" }, // Updated to use id-based scrolling
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="w-full">
      {/* Top Bar */}
      <div className="bg-red-600 flex items-center justify-between px-4 md:px-10 lg:px-20 py-2 text-white text-xs md:text-sm">
        <div className="flex items-center gap-2 md:gap-6 flex-wrap">
          <span className="flex items-center gap-1">
            <FaEnvelope className="text-sm md:text-lg" />
            <span className="hidden sm:inline">info@panditjitrequest.in</span>
            <span className="sm:hidden">info@pandit...</span>
          </span>
          <span className="flex items-center gap-1">
            <FaPhoneAlt className="text-sm md:text-lg" />
            <span>+91 7880652040</span>
          </span>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <a href="#" className="hover:text-gray-200">
            <FaFacebookF className="text-sm md:text-base" />
          </a>
          <a href="#" className="hover:text-gray-200">
            <FaInstagram className="text-sm md:text-base" />
          </a>
          <a href="#" className="hover:text-gray-200">
            <FaYoutube className="text-sm md:text-base" />
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="w-full flex items-center justify-between px-4 md:px-10 lg:px-20 py-3 md:py-0 bg-white relative">
        {/* Logo */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 60 }}
          className="flex items-center z-50"
        >
          <img
            src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
            alt="Pandit Ji Logo"
            className="w-12 h-12 md:w-16 md:h-16 object-contain"
          />
        </motion.div>

        {/* Desktop Nav Links */}
        <motion.ul
          className="hidden lg:flex items-center gap-6 xl:gap-8 bg-[#ffe3de] px-8 xl:px-10 py-5 rounded-bl-[2.5rem] rounded-br-[2.5rem] "
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.09 } },
          }}
        >
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <motion.li
                key={link.label}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ type: "spring", stiffness: 70 }}
              >
                {link.highlight ? (
                  <motion.div whileHover={{ scale: 1.07 }}>
                    <ScrollLink
                      to={link.href.slice(1)} // Remove "#" for scroll behavior
                      smooth={true}
                      duration={500}
                      className="cursor-pointer bg-orange-500 text-white font-medium rounded-full px-5 py-1 shadow transition-all"
                    >
                      {link.label}
                    </ScrollLink>
                  </motion.div>
                ) : (
                  <ScrollLink
                    to={link.href.slice(1)} // Remove "#" for scroll behavior
                    smooth={true}
                    duration={500}
                    className={`cursor-pointer font-medium transition-all ${
                      isActive
                        ? "text-orange-500 underline underline-offset-8"
                        : "text-black"
                    }`}
                  >
                    {link.label}
                  </ScrollLink>
                )}
              </motion.li>
            );
          })}
        </motion.ul>

        {/* Desktop Book Pandit Button */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 60 }}
          className="block"
        >
          <Link
            to="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp"
            className="bg-red-600 text-white px-6 xl:px-8 py-2 rounded-full font-semibold text-sm xl:text-base shadow-md hover:bg-red-700 transition-all"
          >
            BOOK PANDIT
          </Link>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 60 }}
          onClick={toggleMobileMenu}
          className="lg:hidden text-2xl text-gray-800 z-50"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </motion.button>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={closeMobileMenu}
              />

              {/* Mobile Menu */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-[280px] bg-white shadow-2xl z-50 lg:hidden"
              >
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Menu
                    </h2>
                    <button
                      onClick={closeMobileMenu}
                      className="text-2xl text-gray-600"
                      aria-label="Close menu"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  {/* Mobile Nav Links */}
                  <ul className="flex flex-col gap-2 p-6 flex-1">
                    {navLinks.map((link, index) => {
                      const isActive = location.pathname === link.href;
                      return (
                        <motion.li
                          key={link.label}
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {link.highlight ? (
                            <ScrollLink
                              to={link.href.slice(1)} // Remove "#" for scroll behavior
                              smooth={true}
                              duration={500}
                              onClick={closeMobileMenu}
                              className="block bg-orange-500 text-white font-medium rounded-lg px-4 py-3 text-center shadow transition-all"
                            >
                              {link.label}
                            </ScrollLink>
                          ) : (
                            <ScrollLink
                              to={link.href.slice(1)} // Remove "#" for scroll behavior
                              smooth={true}
                              duration={500}
                              onClick={closeMobileMenu}
                              className={`block font-medium px-4 py-3 rounded-lg transition-all ${
                                isActive
                                  ? "text-orange-500 bg-orange-50"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {link.label}
                            </ScrollLink>
                          )}
                        </motion.li>
                      );
                    })}
                  </ul>

                  {/* Mobile Book Pandit Button */}
                  <div className="p-6 border-t">
                    <Link
                      to="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp"
                      onClick={closeMobileMenu}
                      className="block w-full bg-red-600 text-white px-6 py-3 rounded-full font-semibold text-center shadow-md hover:bg-red-700 transition-all"
                    >
                      BOOK PANDIT
                    </Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Navbar;
