import { motion } from "framer-motion";
import { MapPin, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CITIES = [
  "Delhi",
  "Chandigarh",
  "Mohali",
  "Panchkula",
  "Noida",
  "Gurgaon",
  "Mumbai",
  "Pune",
  "Bangalore",
  "Hyderabad",
  "Ahmedabad",
];

export function ServiceCitiesSection() {
  const navigate = useNavigate();

  return (
    <section className="py-2 px-4 bg-gradient-to-b from-white to-orange-50/40">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
            <MapPin className="w-3 h-3 inline mr-1" />We Serve
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-200" />
        </div>
        <h2 className="text-xl font-bold text-stone-800 text-center">
          Available In{" "}
          <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            Your City
          </span>
        </h2>
        <p className="text-[12px] text-stone-700 text-center mt-1">
          Home puja available in major cities. Virtual pujas for NRIs in 5000+ cities worldwide.
        </p>
      </motion.div>

      {/* City pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {CITIES.map((city, i) => (
          <motion.button
            key={city}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            onClick={() => navigate("/category/685b290c922c7df97c114213")}
            className="flex items-center gap-1.5 px-3.5 py-1.8 rounded-full bg-white border border-orange-200 text-[13px] font-bold text-stone-800 shadow-sm hover:bg-orange-50 hover:border-orange-400 transition-all active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            {city}
          </motion.button>
        ))}
      </div>

      {/* NRI note */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white rounded-2xl border border-orange-100 p-3 flex items-start gap-3 mb-4 shadow-sm"
      >
        <Globe className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-bold text-stone-800 mb-0.5">NRI & Virtual Puja Available</p>
          <p className="text-[10px] text-stone-700 leading-relaxed">
            Virtual pujas with live video connection available across <strong>5000+ cities</strong> worldwide for families living outside India.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
