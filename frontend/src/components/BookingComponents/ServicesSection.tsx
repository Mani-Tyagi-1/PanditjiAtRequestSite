const services = [
    { title: "Puja", img: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/category-images/category-images_1771234666851.png" },
    { title: "Jaap", img: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/category-images/category-images_1771234657517.png" },
    { title: "Festive", img: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/category-images/category-images_1771234650321.png" },
    { title: "Hawan", img: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/category-images/category-images_1771234600889.png" },
    { title: "Rashi Fal Pooja", img: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/category-images/category-images_1771234639920.png" },
    { title: "Dosh Nivaran", img: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/category-images/category-images_1771234631877.png" },
    { title: "Remedies Pooja", img: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/category-images/category-images_1771234620032.png" },
    { title: "Occasions Pooja", img: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/category-images/category-images_1771234611308.png" },
];

const items = [
    { title: "Verified" },
    { title: "Trusted" },
    { title: "5+ Year Experience" },
];

import { useNavigate } from "react-router-dom";

export default function PujaServices() {
    const navigate = useNavigate();
    return (
        <>
            <div className="w-full  flex justify-center bg-gradient-to-b from-white via-orange-200 via-orange-300 via-orange-300 pt-7 pb-5">
                <div className="w-full max-w-4xl px-4">
                    {/* Header */}
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex-1 h-[2px] bg-yellow-500"></div>
                        <div
                            className="flex items-center justify-center text-white font-bold px-10 py-1.5 mx-2 bg-center bg-no-repeat bg-[length:100%_100%] drop-shadow-sm min-w-[140px]"
                            style={{ backgroundImage: 'url("https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/gradientBox.png")' }}
                        >
                            Puja Services
                        </div>
                        <div className="flex-1 h-[2px] bg-yellow-500"></div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                        {services.map((service, index) => (
                            <div
                                key={index}
                                onClick={() => navigate(`/category/${encodeURIComponent(service.title)}`)}
                                className="bg-white rounded-2xl border border-orange-200 shadow-md hover:shadow-lg transition p-1 flex flex-col items-center text-center cursor-pointer"
                            >
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <img
                                        src={service.img}
                                        alt={service.title}
                                        className="w-10 h-10 object-contain"
                                    />
                                </div>

                                <p className="text-gray-700 font-semibold text-sm leading-tight">
                                    {service.title}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full flex justify-center">
                <div className="bg-white/80 backdrop-blur-md  flex items-center justify-center gap-5">
                    {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 border border-green-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 111.414-1.414L8.5 11.586l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </span>
                            {item.title}
                        </div>
                    ))}
                </div>
            </div>

        </>
    );
}
