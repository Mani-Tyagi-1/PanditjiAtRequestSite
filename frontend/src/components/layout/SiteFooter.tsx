import { Link } from "react-router-dom";
import {
    PhoneCallIcon,
    WhatsappLogoIcon,
    GooglePlayLogoIcon,
    FlowerLotusIcon,
    EnvelopeSimpleIcon,
    FacebookLogoIcon,
    InstagramLogoIcon,
    YoutubeLogoIcon,
} from "@phosphor-icons/react";

const LOGO =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/pjar_logo-removebg-preview.png";

const WHATSAPP_URL =
    "https://wa.me/919056955311?text=" +
    encodeURIComponent("🙏 Namaste! I have a question and would like to chat with Pandit Ji.");

const PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=com.panditJiAtReqapp&hl=en_IN";

const SUPPORT_EMAIL = "support@panditjiatrequest.com";

const SOCIAL_LINKS = [
    { label: "Facebook", href: "https://facebook.com", icon: FacebookLogoIcon },
    { label: "Instagram", href: "https://instagram.com", icon: InstagramLogoIcon },
    { label: "YouTube", href: "https://youtube.com", icon: YoutubeLogoIcon },
    { label: "WhatsApp", href: WHATSAPP_URL, icon: WhatsappLogoIcon },
];

const SERVICES = [
    { label: "Book Puja at Home", to: "/book-puja" },
    { label: "Chadhava Sewa", to: "/chadhava" },
    { label: "Kashi & Vrindavan Pujas", to: "/kashi" },
    { label: "Live Mandir Puja", to: "/book-puja?tab=mandir" },
    { label: "Puja Samagri Shop", to: "/shop" },
    { label: "Consult a Pandit Ji", to: "/paid-consultation" },
];

const QUICK_LINKS = [
    { label: "Verified Pandits", to: "/all-pandits" },
    { label: "My Bookings", to: "/my-bookings" },
    { label: "Blog & Articles", to: "/blog" },
    { label: "Free Consultation", to: "/free-consultation" },
    { label: "About Us", to: "/" },
];

const HELP_LINKS = [
    { label: "How It Works", to: "/#how-it-works" },
    { label: "Privacy Policy", to: "/privacypolicy" },
    { label: "Terms & Conditions", to: "/termsandconditions" },
    { label: "Refund & Cancellation", to: "/termsandconditions" },
    { label: "FAQs", to: "/#faq" },
];

/**
 * Rich site footer for tablet/desktop (≥768px). Mobile keeps its slim
 * per-page copyright line, so this hides itself below `md`.
 */
export default function SiteFooter() {
    return (
        <footer className="hidden md:block bg-gradient-to-b from-[#2A1608] to-[#1B0E05] text-stone-300 mt-16">
            {/* Decorative saffron strip */}
            <div className="h-1 bg-gradient-to-r from-orange-700 via-amber-400 to-orange-700" />

            <div className="px-6 lg:px-10 pt-14 pb-10">
                <div className="grid grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr] gap-10 lg:gap-8">
                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-1">
                        <div className="bg-[#FFFAF3] rounded-2xl px-4 py-3 inline-flex items-center">
                            <img
                                src={LOGO}
                                alt="Pandit Ji At Request"
                                className="h-12 w-auto object-contain"
                                loading="lazy"
                            />
                        </div>
                        <p className="mt-4 text-[13.5px] leading-relaxed text-stone-400 max-w-sm">
                            Connecting devotees with sacred temples, verified pandits &amp;
                            authentic sevas with devotion and trust.
                        </p>
                        <p className="mt-3 text-[13px] font-semibold text-amber-300/90 flex items-center gap-1.5">
                            <FlowerLotusIcon size={16} weight="fill" />
                            शुभ मुहूर्त • पूजा • मार्गदर्शन
                        </p>
                        <div className="mt-4">
                            <p className="text-[11.5px] font-bold uppercase tracking-wider text-stone-500 mb-2.5">
                                Follow Us
                            </p>
                            <div className="flex items-center gap-2.5">
                                {SOCIAL_LINKS.map(({ label, href, icon: SocialIcon }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={label}
                                        className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-stone-300 hover:text-amber-300 hover:border-amber-300/40 hover:bg-white/10 transition-colors"
                                    >
                                        <SocialIcon size={16} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-[13px] font-bold uppercase tracking-wider text-amber-400 mb-4">
                            Our Services
                        </h3>
                        <ul className="space-y-2.5">
                            {SERVICES.map((l) => (
                                <li key={l.label}>
                                    <Link
                                        to={l.to}
                                        className="text-[13.5px] text-stone-300 hover:text-amber-300 transition-colors"
                                    >
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h3 className="text-[13px] font-bold uppercase tracking-wider text-amber-400 mb-4">
                            Quick Links
                        </h3>
                        <ul className="space-y-2.5">
                            {QUICK_LINKS.map((l) => (
                                <li key={l.label}>
                                    <Link
                                        to={l.to}
                                        className="text-[13.5px] text-stone-300 hover:text-amber-300 transition-colors"
                                    >
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Help & Support */}
                    <div>
                        <h3 className="text-[13px] font-bold uppercase tracking-wider text-amber-400 mb-4">
                            Help &amp; Support
                        </h3>
                        <ul className="space-y-2.5">
                            {HELP_LINKS.map((l) => (
                                <li key={l.label}>
                                    <Link
                                        to={l.to}
                                        className="text-[13.5px] text-stone-300 hover:text-amber-300 transition-colors"
                                    >
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact / App */}
                    <div className="col-span-2 lg:col-span-1">
                        <h3 className="text-[13px] font-bold uppercase tracking-wider text-amber-400 mb-4">
                            Reach Pandit Ji
                        </h3>
                        <div className="space-y-3">
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors group"
                            >
                                <span className="w-9 h-9 rounded-full bg-[#25D366]/15 flex items-center justify-center text-[#25D366] shrink-0">
                                    <WhatsappLogoIcon size={20} weight="fill" />
                                </span>
                                <span>
                                    <span className="block text-[13.5px] font-semibold text-white group-hover:text-amber-200 transition-colors">
                                        Chat on WhatsApp
                                    </span>
                                    <span className="block text-[12px] text-stone-400">
                                        +91 90569 55311
                                    </span>
                                </span>
                            </a>
                            <Link
                                to="/paid-consultation"
                                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors group"
                            >
                                <span className="w-9 h-9 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-400 shrink-0">
                                    <PhoneCallIcon size={19} weight="fill" />
                                </span>
                                <span className="block text-[13.5px] font-semibold text-white group-hover:text-amber-200 transition-colors">
                                    Talk to Pandit Ji on Call
                                </span>
                            </Link>
                            <a
                                href={`mailto:${SUPPORT_EMAIL}`}
                                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors group"
                            >
                                <span className="w-9 h-9 rounded-full bg-sky-400/15 flex items-center justify-center text-sky-300 shrink-0">
                                    <EnvelopeSimpleIcon size={19} weight="fill" />
                                </span>
                                <span>
                                    <span className="block text-[13.5px] font-semibold text-white group-hover:text-amber-200 transition-colors">
                                        Email Support
                                    </span>
                                    <span className="block text-[12px] text-stone-400 truncate">
                                        {SUPPORT_EMAIL}
                                    </span>
                                </span>
                            </a>
                            <a
                                href={PLAY_STORE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl px-4 py-3 text-[13.5px] font-bold shadow-lg shadow-orange-900/40 transition-all"
                            >
                                <GooglePlayLogoIcon size={19} weight="fill" />
                                Download the App
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/10">
                <div className="px-6 lg:px-10 py-5 flex flex-col lg:flex-row items-center justify-between gap-2">
                    <p className="text-[12.5px] text-stone-500">
                        &copy; {new Date().getFullYear()} VEDICVAIBHAV DOT COM PRIVATE LIMITED. All
                        Rights Reserved.
                    </p>
                    <p className="text-[12.5px] text-stone-500">
                        Made with devotion in India 🇮🇳
                    </p>
                </div>
            </div>
        </footer>
    );
}
