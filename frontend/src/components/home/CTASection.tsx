import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { GooglePlayLogoIcon, WhatsappLogoIcon } from "@phosphor-icons/react";

// Same click-to-chat number / Play Store link used across the site
// (SiteFooter.tsx, AppLayout.tsx, AppDownloadTopBar.tsx) — reused here, not new.
const WHATSAPP_URL =
    "https://wa.me/919056955311?text=" +
    encodeURIComponent("🙏 Namaste! I have a question and would like to chat with Pandit Ji.");
const PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=com.panditJiAtReqapp&hl=en_IN";

export default function CTASection() {
    const navigate = useNavigate();

    return (
        <>
            <section className="px-4 pt-6 pb-4 md:px-8 lg:px-10 md:pt-12 lg:pt-16 md:pb-10 lg:pb-14 md:w-full">
                <div
                    className="relative overflow-hidden rounded-[28px] border border-orange-200/60 p-5 flex items-center justify-end shadow-sm bg-cover bg-center min-h-[140px] md:grid md:grid-cols-2 md:items-center md:p-10 lg:p-14 md:min-h-[260px] lg:min-h-[300px] md:rounded-[36px] md:shadow-md"
                    style={{
                        backgroundImage: "url('https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/WhatsApp%20Image%202026-06-15%20at%205.28.13%20PM.jpeg'), linear-gradient(135deg, #FFF6E7 0%, #FFEED4 50%, #FFDFB3 100%)"
                    }}
                >
                    {/* Background decorative glowing element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-300/10 rounded-full blur-2xl pointer-events-none md:w-56 md:h-56" />
                    <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-white/40 rounded-full blur-xl pointer-events-none md:w-48 md:h-48" />

                    {/* Right side: content, width constrained to sit alongside left bg graphics */}
                    <div className="w-[62%] z-10 flex flex-col justify-center pl-2 md:w-auto md:col-start-2 md:pl-6 lg:pl-10">
                        <h3 className="text-[17px] font-bold text-[#2E1E12] leading-tight md:text-3xl lg:text-[38px] md:tracking-tight">
                            Ready to Book a Pandit or Pooja?
                        </h3>
                        <p className="text-[11px] text-[#5C4D40] leading-snug mt-1 font-semibold md:text-[15px] lg:text-lg md:mt-3 md:leading-relaxed">
                            Get blessings, guidance & peace of mind, right at your doorstep.
                        </p>
                        <button
                            onClick={() => navigate("/book-puja")}
                            className="mt-3 self-start inline-flex items-center gap-1.5 bg-[#FF6D04] hover:bg-[#E25800] text-white font-bold text-[12px] px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer md:mt-6 md:text-[15px] md:px-8 md:py-3.5 md:rounded-2xl md:hover:shadow-lg md:hover:-translate-y-0.5"
                        >
                            Book Now <ChevronRight className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* App download / WhatsApp help split banner — desktop/tablet only, new section */}
            <section className="hidden md:block md:w-full md:px-8 lg:px-10 md:pb-10 lg:pb-14">
                <div
                    className="relative overflow-hidden rounded-[32px] md:grid md:grid-cols-2 md:gap-10 md:p-10 lg:p-14 shadow-lg"
                    style={{ background: "linear-gradient(120deg, #E05A10 0%, #FF6D04 55%, #FF8A3D 100%)" }}
                >
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10">
                        <h3 className="text-white text-2xl lg:text-3xl font-bold tracking-tight">
                            Take Devotion With You
                        </h3>
                        <p className="mt-2 text-orange-50 text-sm lg:text-base leading-relaxed">
                            Download the Pandit Ji At Request App
                        </p>
                        <a
                            href={PLAY_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                                if (window.fbq) {
                                    window.fbq("track", "App Download");
                                }
                            }}
                            className="mt-5 inline-flex items-center gap-2 bg-white text-orange-700 font-bold text-[13.5px] px-5 py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                        >
                            <GooglePlayLogoIcon size={18} weight="fill" /> Download App
                        </a>
                    </div>

                    <div className="relative z-10 md:border-l md:border-white/25 md:pl-10 flex flex-col justify-center mt-8 md:mt-0">
                        <h3 className="text-white text-2xl lg:text-3xl font-bold tracking-tight">
                            Need Help? We're Here
                        </h3>
                        <p className="mt-2 text-orange-50 text-sm lg:text-base leading-relaxed">
                            Chat with us on WhatsApp for quick support
                        </p>
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 w-fit inline-flex items-center gap-2 bg-white text-orange-700 font-bold text-[13.5px] px-5 py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                        >
                            <WhatsappLogoIcon size={18} weight="fill" /> Chat on WhatsApp
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
