
// import PujaCard from './UI/PujaCard'; // Adjust the import path as needed

// const FeaturedPujas = () => {
//   // Dummy data based on your screenshots and general puja offerings
//   const pujas = [
//     {
//       id: 1,
//       title: "Mata Ki Chowki With Bhajan",
//       description: "A vibrant devotional celebration of the Divine Mother with soul-stirring bhajans.",
//       price: "17,000",
//       image: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=800&auto=format&fit=crop", // Replace with your actual image path
//       buttonText: "Book Now"
//     },
//     {
//       id: 2,
//       title: "Shri Ashta Lakshmi Pooja",
//       description: "Invoke the eight forms of prosperity and wealth with this highly auspicious pooja.",
//       price: "3,100",
//       image: "https://images.unsplash.com/photo-1590055531615-f16d36ffe8ea?q=80&w=800&auto=format&fit=crop", // Replace with your actual image path
//       buttonText: "Book Now"
//     },
//     {
//       id: 3,
//       title: "Shri Lakshmi Pooja",
//       description: "Traditional pooja for inviting wealth, fortune, and prosperity into your home.",
//       price: "2,100",
//       image: "https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=800&auto=format&fit=crop", // Replace with your actual image path
//       buttonText: "Book Pandit Ji"
//     },
//     {
//       id: 4,
//       title: "Satyanarayan Katha",
//       description: "Perform the sacred Katha to bring peace, happiness, and abundance to your family.",
//       price: "2,500",
//       image: "https://images.unsplash.com/photo-1514907283155-ea5f4094c70c?q=80&w=800&auto=format&fit=crop", // Replace with your actual image path
//       buttonText: "Book Now"
//     }
//   ];

//   return (
//     <section className="py-16 bg-[#FFFBF7]">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

//         {/* Section Header */}
//         <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
//           <div className="max-w-2xl">
//             <span className="text-orange-600 font-bold tracking-wider uppercase text-sm mb-2 block">
//               Divine Offerings
//             </span>
//             <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
//               Featured Pujas
//             </h2>
//             <p className="mt-4 text-lg text-gray-600">
//               Discover our most requested spiritual ceremonies, performed by verified and experienced Pandits.
//             </p>
//           </div>

//           {/* Optional: View All Button for desktop */}
//           <div className="hidden md:block mt-4 md:mt-0">
//             <button className="text-orange-600 font-semibold hover:text-orange-700 flex items-center group">
//               View All Pujas
//               <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
//               </svg>
//             </button>
//           </div>
//         </div>

//         {/* Responsive Grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
//           {pujas.map((puja) => (
//             <PujaCard 
//               key={puja.id}
//               title={puja.title}
//               description={puja.description}
//               price={puja.price}
//               image={puja.image}
//               buttonText={puja.buttonText}
//             />
//           ))}
//         </div>

//         {/* Mobile View All Button */}
//         <div className="mt-10 text-center md:hidden">
//           <button className="inline-flex items-center justify-center px-6 py-3 border border-orange-200 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors w-full sm:w-auto">
//             View All Pujas
//           </button>
//         </div>

//       </div>
//     </section>
//   );
// };

// export default FeaturedPujas;





import { useState } from "react";
import PujaCard from "./UI/PujaCard";

// ─── Dummy Data ───────────────────────────────────────────────
const PUJAS = [
    {
        id: 1,
        image: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg",
        title: "Mata Ki Chowki",
        subtitle: "A vibrant devotional celebration of the divine mother with live bhajans.",
        price: 17000,
        badge: "Popular",
        badgeColor: "bg-rose-500",
        duration: "4–5 hrs",
    },
    {
        id: 2,
        image: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg",
        title: "Shri Ashta Lakshmi Pooja",
        subtitle: "Eight Forms of Prosperity — invoke all eight manifestations of Goddess Lakshmi.",
        price: 3100,
        badge: "Trending",
        badgeColor: "bg-amber-500",
        duration: "2–3 hrs",
    },
    {
        id: 3,
        image: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg",
        title: "Satyanarayan Katha",
        subtitle: "Traditional Vishnu puja performed on auspicious occasions and festivals.",
        price: 2100,
        badge: undefined,
        duration: "3 hrs",
    },
    {
        id: 4,
        image: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg",
        title: "Griha Pravesh Puja",
        subtitle: "Purify and bless your new home with Vedic rituals for peace and prosperity.",
        price: 5100,
        badge: "New",
        badgeColor: "bg-emerald-500",
        duration: "2–4 hrs",
    },
    {
        id: 5,
        image: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg",
        title: "Navgraha Shanti Puja",
        subtitle: "Harmonise all nine planetary influences for health, wealth, and peace of mind.",
        price: 4500,
        badge: undefined,
        duration: "3–4 hrs",
    },
    {
        id: 6,
        image: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg",
        title: "Rudrabhishek Puja",
        subtitle: "Sacred abhishek of Lord Shiva to remove obstacles and grant divine blessings.",
        price: 3500,
        badge: "Popular",
        badgeColor: "bg-violet-500",
        duration: "2 hrs",
    },
];

// const FILTERS = ["All", "Popular", "Trending", "New"];

// ─── Featured Pujas Section ───────────────────────────────────
export default function FeaturedPujas() {
    const [activeFilter, _setActiveFilter] = useState("All");

    const filtered =
        activeFilter === "All"
            ? PUJAS
            : PUJAS.filter((p) => p.badge === activeFilter);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        .fp-section { font-family: 'DM Sans', sans-serif; }
        .fp-title   { font-family: 'Cormorant Garamond', serif; }
        .filter-pill { transition: all 0.2s ease; }
        .card-enter { animation: cardIn 0.4s ease both; }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            <section className="fp-section bg-[#FFFAF3] px-4 py-10 sm:px-6 lg:px-10">
                <div className="max-w-5xl mx-auto">

                    {/* ── Section Header ── */}
                    <div className="text-center mb-6">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-widest uppercase text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-3 py-1 mb-3 shadow-sm">
                            🕉 Recomended for you 
                        </span>
                        <h2
                            className="text-[15px] text-stone-800 leading-snug"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            Authentic ceremonies performed by verified pandits
                        </h2>
                    </div>

                    {/* ── Filter Pills ── */}
                    {/* <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`filter-pill shrink-0 text-xs font-medium px-4 py-1.5 rounded-full border ${activeFilter === f
                                    ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200"
                                    : "bg-white text-stone-500 border-stone-200 hover:border-orange-300"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div> */}

                    {/* ── Grid ── */}
                    {filtered.length === 0 ? (
                        <p className="text-center text-stone-400 text-sm py-16">No pujas found in this category.</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {filtered.map((puja, i) => (
                                <div
                                    key={puja.id}
                                    className="card-enter"
                                    style={{ animationDelay: `${i * 60}ms` }}
                                >
                                    <PujaCard
                                        {...puja}
                                        onBook={() => alert(`Booking: ${puja.title}`)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Bottom CTA ── */}
                    <div className="mt-10 text-center">
                        <button className="inline-flex items-center gap-2 border border-orange-300 text-orange-600 text-sm font-medium px-6 py-2.5 rounded-full hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200">
                            Browse All Pujas
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                            </svg>
                        </button>
                    </div>

                </div>
            </section>
        </>
    );
}