import { useNavigate } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import SectionHeader from "./SectionHeader";

interface City {
    id: string;
    name: string;
    image: string;
}

const VARANASI_IMAGE = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/varanasi.webp";

const ROW1_CITIES: City[] = [
    { id: "prayagraj", name: "Prayagraj", image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/prayagraj.webp" },
    { id: "ujjain", name: "Ujjain", image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/ujjain.webp" },
    { id: "haridwar", name: "Haridwar", image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/haridwar.webp" },
    { id: "delhi", name: "Delhi", image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/delhi.webp" },
    { id: "bengaluru", name: "Bengaluru", image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/bengaluru.webp" },
];

const ROW2_ITEMS = [
    { type: "city", id: "jaipur", name: "Jaipur", image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/jaipur.webp" },
    { type: "city", id: "ayodhya", name: "Ayodhya", image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/ayodhya.webp" },
    { type: "city", id: "mumbai", name: "Mumbai", image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/mumbai.webp" },
];

export default function AvailableCities() {
    const navigate = useNavigate();

    return (
        <section className="px-4 pt-6 md:px-8 lg:px-10 md:pt-12 lg:pt-16 md:w-full">
            <SectionHeader
                title="Available in Your City"
                icon={MapPin}
                subtitle="Find us in holy destinations"
            />

            <div className="mt-3 bg-[#FFFDF9] border border-orange-200/60 rounded-[32px] p-4 shadow-[0_4px_20px_rgba(255,109,4,0.03)] md:mt-6 md:rounded-[40px] md:p-6 lg:p-8">
                {/* Varanasi Featured Card */}
                <button
                    onClick={() => navigate("/kashi")}
                    className="w-full bg-[#FFFBF4] border border-orange-200/70 rounded-[24px] p-4 flex items-center justify-between text-left active:scale-[0.98] transition-all shadow-sm cursor-pointer md:rounded-[28px] md:p-8 md:duration-300 md:hover:shadow-md md:hover:border-orange-300/70"
                >
                    <div className="flex-1 pr-3 flex flex-col justify-center">
                        <h3
                            className="text-[28px] font-bold text-[#2E1E12] leading-none md:text-5xl"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            Kashi
                        </h3>

                        <div className="mt-2.5 self-start inline-flex items-center gap-1.5 border border-orange-300/80 bg-white px-2.5 py-0.5 rounded-full md:mt-4 md:px-3.5 md:py-1">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#FF6D04] flex items-center justify-center shrink-0 md:w-4.5 md:h-4.5">
                                <Star className="w-2 h-2 fill-white text-white md:w-2.5 md:h-2.5" />
                            </span>
                            <span className="text-[10px] font-bold text-[#FF6D04] tracking-wide md:text-xs">
                                Spiritual capital of India
                            </span>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-orange-400/50 md:mt-4">
                            <span className="h-[1px] w-10 bg-orange-300/70 md:w-16" />
                            <span className="text-[10px] text-[#FF6D04] md:text-xs">✿</span>
                            <span className="h-[1px] w-10 bg-orange-300/70 md:w-16" />
                        </div>
                    </div>

                    <div className="w-[100px] h-[100px] bg-white border border-orange-200/60 rounded-2xl flex flex-col items-center justify-between p-2 shrink-0 shadow-sm md:w-[150px] md:h-[150px] md:p-3 md:rounded-3xl">
                        <img
                            src={VARANASI_IMAGE}
                            alt="Varanasi"
                            className="w-14 h-14 object-contain mt-0.5 rounded-lg md:w-[88px] md:h-[88px] md:rounded-xl"
                            onError={(e) => {
                                e.currentTarget.src = "/images/temple_sketch.png";
                            }}
                            loading="lazy"
                        />
                        <span
                            className="text-[10.5px] font-bold text-stone-700 leading-none pb-0.5 md:text-base"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            Varanasi
                        </span>
                    </div>
                </button>

                {/* Symmetrical Grid rows */}
                <div className="mt-3.5 space-y-2 md:mt-5 md:space-y-3 lg:space-y-4">
                    {/* Row 1: 5 Cities */}
                    <div className="grid grid-cols-5 gap-2 md:gap-3 lg:gap-4">
                        {ROW1_CITIES.map(({ id, name, image }) => (
                            <button
                                key={id}
                                onClick={() => navigate("/book-puja")}
                                className="bg-[#FFFBF4] border border-orange-200/50 rounded-2xl p-1.5 flex flex-col items-center justify-between aspect-square active:scale-95 transition-all shadow-sm cursor-pointer md:rounded-3xl md:p-3 md:justify-center md:gap-3 md:duration-300 md:hover:shadow-md md:hover:-translate-y-0.5 md:hover:border-orange-300/70"
                            >
                                <img
                                    src={image}
                                    alt={name}
                                    className="w-10 h-10 object-contain mt-0.5 rounded-lg md:w-16 md:h-16 lg:w-20 lg:h-20 md:rounded-xl"
                                    onError={(e) => {
                                        e.currentTarget.src = "/images/temple_sketch.png";
                                    }}
                                    loading="lazy"
                                />
                                <span
                                    className="text-[10px] font-bold text-stone-700 leading-none pb-0.5 truncate w-full text-center md:text-sm lg:text-base"
                                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                >
                                    {name}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Row 2: Centered 3 Cities */}
                    <div className="flex justify-center gap-2 md:gap-3 lg:gap-4">
                        {ROW2_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => navigate("/book-puja")}
                                className="w-[18%] bg-[#FFFBF4] border border-orange-200/50 rounded-2xl p-1.5 flex flex-col items-center justify-between aspect-square active:scale-95 transition-all shadow-sm cursor-pointer md:rounded-3xl md:p-3 md:justify-center md:gap-3 md:duration-300 md:hover:shadow-md md:hover:-translate-y-0.5 md:hover:border-orange-300/70"
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-10 h-10 object-contain mt-0.5 rounded-lg md:w-16 md:h-16 lg:w-20 lg:h-20 md:rounded-xl"
                                    onError={(e) => {
                                        e.currentTarget.src = "/images/temple_sketch.png";
                                    }}
                                    loading="lazy"
                                />
                                <span
                                    className="text-[10px] font-bold text-stone-700 leading-none pb-0.5 truncate w-full text-center md:text-sm lg:text-base"
                                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                >
                                    {item.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
