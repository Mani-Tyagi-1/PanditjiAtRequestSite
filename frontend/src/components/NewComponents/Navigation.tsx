import { motion } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = useMemo(
    () => [
      { name: "Home", href: "/" },
      { name: "Booking Flow", href: "/booking-flow" },
      { name: "Services", href: "#services" },
      { name: "About Us", href: "#about" },
      { name: "Contact", href: "#contact" },
    ],
    []
  );

  const isHash = (href: string) => href.startsWith("#");
  const isRoute = (href: string) => href.startsWith("/");

  const scrollToHash = (hash: string) => {
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;

    // adjust for fixed navbar height
    const yOffset = -90;
    const y = el.getBoundingClientRect().top + window.scrollY + yOffset;

    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNavClick = (href: string) => {
    setIsOpen(false);

    // hash section
    if (isHash(href)) {
      // if you are not on home page, go home first then scroll
      if (location.pathname !== "/") {
        navigate("/");

        // wait for DOM to render then scroll
        requestAnimationFrame(() => {
          setTimeout(() => scrollToHash(href), 50);
        });
      } else {
        scrollToHash(href);
      }
      return;
    }

    // route navigation is handled by <Link>, so nothing here
  };

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-50 via-white to-orange-50 backdrop-blur-md border-b border-orange-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-16 h-16 relative">
              <img
                src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
                alt="Pandit Ji At Request"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Pandit Ji At Request
              </h1>
              <p className="text-xs text-gray-600">
                Sacred Services At Your Doorstep
              </p>
            </div>
          </motion.div>

          {/* Desktop Navbar */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => {
              // ROUTE LINKS (no reload)
              if (isRoute(item.href)) {
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group"
                  >
                    <Link
                      to={item.href}
                      className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
                    >
                      {item.name}
                    </Link>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 group-hover:w-full transition-all duration-300" />
                  </motion.div>
                );
              }

              // HASH LINKS (smooth scroll)
              return (
                <motion.button
                  key={item.name}
                  type="button"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleNavClick(item.href)}
                  className="text-gray-700 hover:text-orange-600 transition-colors font-medium relative group"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 group-hover:w-full transition-all duration-300" />
                </motion.button>
              );
            })}

            {/* external link => keep <a> */}
            <a
              href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp"
              target="_blank"
              rel="noreferrer"
            >
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 hover:cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Book Pandit Ji</span>
              </motion.button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 hover:text-orange-600 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navbar */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pb-4"
          >
            {navItems.map((item) => {
              if (isRoute(item.href)) {
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block py-3 text-gray-700 hover:text-orange-600 transition-colors font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                );
              }

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleNavClick(item.href)}
                  className="block w-full text-left py-3 text-gray-700 hover:text-orange-600 transition-colors font-medium"
                >
                  {item.name}
                </button>
              );
            })}

            <a
              href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp"
              target="_blank"
              rel="noreferrer"
            >
              <button className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg flex items-center justify-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Book Pandit Ji</span>
              </button>
            </a>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
