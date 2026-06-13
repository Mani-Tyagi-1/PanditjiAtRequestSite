import { motion } from "framer-motion";
import { Globe, Video, UserCheck, Flame, Compass, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PERKS = [
  {
    icon: <Video className="w-5 h-5 text-orange-600" />,
    title: "Dedicated HD Live Streaming",
    desc: "Perform rituals via Zoom or Google Meet with professional studio audio, ensuring perfect mantra hearing and live family participation.",
  },
  {
    icon: <UserCheck className="w-5 h-5 text-orange-600" />,
    title: "Personalized Live Sankalp",
    desc: "The Pandit Ji chants the Sankalp directly reciting your family names, gotra, and geographical location (lat/long) for pristine shastrik alignment.",
  },
  {
    icon: <Compass className="w-5 h-5 text-orange-600" />,
    title: "Siddhi & Prasadam Shipped Worldwide",
    desc: "Blessed flowers, threads, sweet prasad, and energized yantras are carefully packed and securely dispatched directly to your global address.",
  },
];

export function NRIVirtualPujaSection() {
  const navigate = useNavigate();

  return (
    <section className="py-8 px-4 bg-gradient-to-b from-orange-50/10 via-amber-50/5 to-white border-y border-orange-100/50 max-w-sm mx-auto my-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-6 text-center"
      >
        <div className="flex items-center gap-2 justify-center mb-1">
          <div className="h-px w-8 bg-orange-300" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 animate-pulse" /> NRI Services Available
          </span>
          <div className="h-px w-8 bg-orange-300" />
        </div>
        <h2 className="text-2xl font-bold text-stone-800">
          Virtual Pujas for{" "}
          <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            Global Devotees
          </span>
        </h2>
        <p className="text-xs text-stone-500 mt-2 px-2 leading-relaxed">
          Stay connected to your spiritual roots from anywhere in the world. Get real-time Vedic pujas performed at holy ghats or temples with complete shastrik vidhi.
        </p>
      </motion.div>

      {/* Visual Live Frame Mockup */}
      <div className="relative rounded-2xl overflow-hidden shadow-md border border-orange-100 bg-black aspect-video mb-6 group">
        <img
          src="https://images.unsplash.com/photo-1609137922983-b570c0aaeaa6?w=600&h=400&fit=crop"
          alt="Virtual Live Stream Mockup"
          className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider animate-pulse">
          <span className="w-1.5 h-1.5 bg-white rounded-full" /> Live from Varanasi
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-bold leading-none mb-0.5">Vedic Mahahavan Ceremony</p>
            <p className="text-[9px] text-orange-200">Streaming HD • Audio Optimized</p>
          </div>
          <span className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all">
            <Flame className="w-4 h-4 fill-white" />
          </span>
        </div>
      </div>

      {/* Perks List */}
      <div className="space-y-4 mb-6">
        {PERKS.map((p, i) => (
          <div key={i} className="flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
              {p.icon}
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-stone-850">{p.title}</h3>
              <p className="text-[10px] text-stone-500 leading-relaxed font-light">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button
        onClick={() => {
          navigate("/category/685b290c922c7df97c114213");
          window.scrollTo(0, 0);
        }}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-1.5 active:scale-98"
      >
        <span className="text-xs uppercase tracking-wider">Book NRI Virtual Puja</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </section>
  );
}