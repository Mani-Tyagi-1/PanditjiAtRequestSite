
// interface PujaCardProps {
//     image: string;
//     title: string;
//     description: string;
//     price: number | string;
//     buttonText?: string;
// }

// const PujaCard = ({ image, title, description, price, buttonText = "Book Now" }: PujaCardProps) => {
//     return (
//         <div className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full">

//             {/* Image Section */}
//             <div className="relative aspect-[4/3] overflow-hidden bg-orange-50">
//                 <img
//                     src={image}
//                     alt={title}
//                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//                 />
//                 {/* Optional: Add a subtle overlay gradient if text ever needs to go on the image */}
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//             </div>

//             {/* Content Section */}
//             <div className="p-5 flex flex-col flex-grow">
//                 <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
//                     {title}
//                 </h3>

//                 <p className="text-sm text-gray-600 mb-6 line-clamp-2 flex-grow">
//                     {description}
//                 </p>

//                 {/* Footer: Price & Button */}
//                 <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
//                     <div className="flex flex-col">
//                         <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Starting at</span>
//                         <span className="text-xl font-bold text-orange-600">₹{price}</span>
//                     </div>

//                     <button className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all active:scale-95">
//                         {buttonText}
//                     </button>
//                 </div>
//             </div>

//         </div>
//     );
// };

// export default PujaCard;



import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface PujaCardProps {
    id?: string | number;
    image: string;
    title: string;
    subtitle: string;
    price: number;
    badge?: string;
    badgeColor?: string;
    onBook?: () => void;
    duration?: string;
}

export default function PujaCard({
    id,
    image,
    title,
    price,
    badge,
    badgeColor = "bg-orange-500",
    onBook,
    duration,
}: PujaCardProps) {
    const [_pressed, setPressed] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        .puja-card { font-family: 'DM Sans', sans-serif; }
        .puja-title { font-family: 'Cormorant Garamond', serif; }
        .puja-img { transition: transform 0.45s cubic-bezier(.22,1,.36,1); }
        .puja-card:hover .puja-img { transform: scale(1.06); }
        .book-btn { transition: all 0.2s ease; }
        .book-btn:active { transform: scale(0.96); }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .puja-card:hover .price-text {
          background: linear-gradient(90deg, #c2410c, #f97316, #c2410c);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 1.8s linear infinite;
        }
      `}</style>

            <div
                className="puja-card group relative bg-white rounded-2xl overflow-visible shadow-sm hover:shadow-xl transition-shadow duration-400 border border-stone-100 flex flex-col cursor-pointer h-full"
                onClick={() => {
                    navigate(id ? `/puja/${id}` : '/puja');
                    window.scrollTo(0, 0);
                }}
            >

                {/* Badge — sits half-outside the card */}
                {badge && (
                    <span className={`absolute -top-2 left-0 z-10 ${badgeColor} text-white text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full shadow`}>
                        {badge}
                    </span>
                )}

                {/* Image */}
                <div className="relative overflow-hidden aspect-square bg-amber-50 rounded-t-2xl flex items-center justify-center">
                    <img
                        src={image}
                        alt={title}
                        className="puja-img w-full h-full object-contain"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />



                    {/* Duration pill */}
                    {duration && (
                        <span className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                            </svg>
                            {duration}
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-1 gap-1.5">
                    <h3 className="puja-title text-stone-800 font-semibold leading-snug" style={{ fontSize: "16px" }}>
                        {title}
                    </h3>
                    {/* <p className="text-stone-400 text-xs font-light leading-relaxed line-clamp-2">{subtitle}</p> */}

                    {/* Price + CTA row */}
                    <div className="flex items-center justify-between mt-auto px-1">
                        <div>
                            <p className="text-[10px] text-stone-400 font-light">Starting at</p>
                            <p className="price-text text-orange-600 font-semibold text-base" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                ₹{price.toLocaleString("en-IN")}
                            </p>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onBook) onBook();
                                navigate(id ? `/puja/${id}` : '/puja');
                                window.scrollTo(0, 0);
                            }}
                            onMouseDown={(e) => { e.stopPropagation(); setPressed(true); }}
                            onMouseUp={(e) => { e.stopPropagation(); setPressed(false); }}
                            className="book-btn bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-2 py-2 rounded-xl shadow-md shadow-orange-200 flex items-center gap-1.5"
                        >
                            Book Now
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}