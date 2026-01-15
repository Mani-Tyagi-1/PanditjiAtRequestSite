import { motion, AnimatePresence } from "framer-motion";
import { Link as ScrollLink } from "react-scroll";
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
    label: "Pandit Ji Registration",
    href: "https://partner.vedicvaibhav.in/affiliate-register",
    highlight: true,
  },
  { label: "About Us", href: "#about" },
  { label: "Contact Us", href: "#contact" },
];

const isHashLink = (href: string) => href.startsWith("#");
const isExternalLink = (href: string) => /^https?:\/\//i.test(href);

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((s) => !s);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const renderNavItem = (link: (typeof navLinks)[number], isMobile = false) => {
    const activePath =
      !isHashLink(link.href) && !isExternalLink(link.href)
        ? location.pathname === link.href
        : false;

    const baseClass = isMobile
      ? `block font-medium px-4 py-3 rounded-lg transition-all ${
          activePath
            ? "text-orange-500 bg-orange-50"
            : "text-gray-700 hover:bg-gray-100"
        }`
      : `cursor-pointer font-medium transition-all ${
          activePath
            ? "text-orange-500 underline underline-offset-8"
            : "text-black"
        }`;

    const highlightClass = isMobile
      ? "block bg-orange-500 text-white font-medium rounded-lg px-4 py-3 text-center shadow transition-all"
      : "cursor-pointer bg-orange-500 text-white font-medium rounded-full px-5 py-1 shadow transition-all";

    // 1) Hash links => react-scroll
    if (isHashLink(link.href)) {
      const targetId = link.href.replace("#", "");
      const cls = link.highlight ? highlightClass : baseClass;

      return (
        <ScrollLink
          to={targetId}
          smooth={true}
          duration={500}
          onClick={isMobile ? closeMobileMenu : undefined}
          className={cls}
          offset={-110} // ✅ adjust if section gets hidden behind sticky header
        >
          {link.label}
        </ScrollLink>
      );
    }

    // 2) External links => <a>
    if (isExternalLink(link.href)) {
      const cls = link.highlight ? highlightClass : baseClass;
      return (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={isMobile ? closeMobileMenu : undefined}
          className={cls}
        >
          {link.label}
        </a>
      );
    }

    // 3) Internal routes => react-router Link
    const cls = link.highlight ? highlightClass : baseClass;
    return (
      <Link
        to={link.href}
        onClick={isMobile ? closeMobileMenu : undefined}
        className={cls}
      >
        {link.label}
      </Link>
    );
  };

  return (
    // ✅ STAYS ON TOP WHILE SCROLLING (desktop + mobile)
    <header className="sticky top-0 z-30 w-full">
      {/* Top Bar */}
      <div className="bg-red-600 flex items-center justify-between px-4 md:px-10 lg:px-20 py-2 text-white text-xs md:text-sm">
        <div className="flex items-center gap-2 md:gap-6 flex-wrap">
          <span className="flex items-center gap-1">
            <FaEnvelope className="text-sm md:text-lg" />
            <a
              href="mailto:info@panditjitrequest.in?subject=Support%20Request&body=Hi%20Team,%0A"
              className="inline hover:underline"
              aria-label="Email info@panditjitrequest.in"
            >
              info@panditjitrequest.in
            </a>
          </span>

          <span className="flex items-center gap-1">
            <FaPhoneAlt className="text-sm md:text-lg" />
            <a
              href="tel:+919872788769"
              className="hover:underline"
              aria-label="Call +91 9872788769"
            >
              +91 9872788769
            </a>
          </span>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <a
            href="https://www.facebook.com/share/1ZT53FVEHJ/?mibextid=wwXIfr"
            className="hover:text-gray-200"
          >
            <FaFacebookF className="text-sm md:text-base" />
          </a>
          <a
            href="https://www.instagram.com/panditjiatrequest?igsh=Ym1sbzZkbnJwM3Jh&utm_source=qr"
            className="hover:text-gray-200"
          >
            <FaInstagram className="text-sm md:text-base" />
          </a>
          <a
            href="https://www.youtube.com/@TheVedicVaibhav?sub_confirmation=1"
            className="hover:text-gray-200"
          >
            <FaYoutube className="text-sm md:text-base" />
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="w-full flex items-center justify-between pl-2 md:px-10 lg:px-20 py-0 bg-white/95 backdrop-blur border-b border-black/5 relative">
        {/* Logo */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 60 }}
          className="flex items-center relative z-10"
        >
          <img
            src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
            alt="Pandit Ji Logo"
            className="w-18 h-18 md:w-16 md:h-16 object-contain"
          />
        </motion.div>

        {/* Desktop Nav Links */}
        <motion.ul
          className="hidden lg:flex items-center gap-6 xl:gap-8 bg-[#ffe3de] px-8 xl:px-10 py-5 rounded-bl-[2.5rem] rounded-br-[2.5rem]"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
        >
          {navLinks.map((link) => (
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
                  {renderNavItem(link, false)}
                </motion.div>
              ) : (
                renderNavItem(link, false)
              )}
            </motion.li>
          ))}
        </motion.ul>

        {/* Desktop Book Pandit Button */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 60 }}
          className="block relative z-10"
        >
          <a
            href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 text-white px-6 xl:px-8 py-2 rounded-full font-semibold text-sm xl:text-base shadow-md hover:bg-red-700 transition-all"
          >
            BOOK PANDIT JI
          </a>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 60 }}
          onClick={toggleMobileMenu}
          className="lg:hidden text-2xl text-gray-800 relative z-10"
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
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
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
                  <div className="flex items-start justify-between p-6 border-b">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3 text-amber-700/90">
                        <span className="h-px w-10 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                        <span className="text-lg">ॐ</span>
                        <span className="h-px w-10 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                      </div>

                      <h2 className="mt-1 text-xl md:text-3xl font-semibold tracking-wider text-gray-900">
                        Pandit Ji At Request
                      </h2>

                      <p className="mt-1 text-sm text-gray-600">
                        शुभ मुहूर्त • पूजा • मार्गदर्शन
                      </p>
                    </div>

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
                    {navLinks.map((link, index) => (
                      <motion.li
                        key={link.label}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {renderNavItem(link, true)}
                      </motion.li>
                    ))}
                  </ul>

                  {/* Mobile Book Pandit Button */}
                  <div className="p-6 border-t">
                    <a
                      href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMobileMenu}
                      className="block w-full bg-red-600 text-white px-6 py-3 rounded-full font-semibold text-center shadow-md hover:bg-red-700 transition-all"
                    >
                      BOOK PANDIT JI
                    </a>
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
