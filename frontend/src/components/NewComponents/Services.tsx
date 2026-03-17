import { motion } from "framer-motion";
import { Flame, Home, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Category {
  _id: string;
  category_name_en: string;
  isActive: boolean;
}

export function Services() {
  const navigate = useNavigate();
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const cached = sessionStorage.getItem("pooja_categories");
        const list: Category[] = cached
          ? JSON.parse(cached)
          : await (async () => {
              const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";
              const res = await fetch(`${apiUrl}/fetch-all-pooja-category`);
              const data = await res.json();
              const cats: Category[] = data?.poojaCategory ?? (Array.isArray(data) ? data : []);
              const active = cats.filter((c) => c.isActive);
              sessionStorage.setItem("pooja_categories", JSON.stringify(active));
              return active;
            })();

        // Build keyword → category _id map
        const map: Record<string, string> = {};
        list.forEach((cat) => {
          const name = cat.category_name_en.toLowerCase();
          map[name] = cat._id;
        });
        setCategoryMap(map);
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    };
    load();
  }, []);

  const resolveLink = (keywords: string[]): string => {
    for (const kw of keywords) {
      const match = Object.entries(categoryMap).find(([name]) =>
        name.includes(kw.toLowerCase()) || kw.toLowerCase().includes(name)
      );
      if (match) return `/category/${match[1]}`;
    }
    return "/category/685b290c922c7df97c114213"; // fallback
  };

  const services = [
    {
      icon: Flame,
      title: "Havan & Yagya",
      description: "Traditional fire ceremonies for prosperity and peace",
      image: "https://media.istockphoto.com/id/2183290916/photo/a-hindu-family-gathered-around-a-sacred-fire-performing-a-yagya-during-a-festival-celebration.webp?a=1&b=1&s=612x612&w=0&k=20&c=RfRvDqsajF46qGzyYRVLxbIpohK0wltihdjolLEwfpw=",
      color: "from-orange-500 to-red-500",
      keywords: ["havan", "yagya", "hawan", "yagna"],
    },
    {
      icon: Home,
      title: "Griha Pravesh",
      description: "Housewarming puja for new beginnings",
      image: "https://media.istockphoto.com/id/2179080860/photo/close-up-of-oil-lamp-puja-thali-with-flower-and-indian-sweet-on-diwali-festival-in-india.webp?a=1&b=1&s=612x612&w=0&k=20&c=Yybxp1U4Xjoa9p2dOLnaOGYf3UKNVR93H9dybXdavdM=",
      color: "from-green-500 to-teal-500",
      keywords: ["griha", "pravesh", "housewarming"],
    },
    {
      icon: Star,
      title: "Festival Pujas",
      description: "Navratri, Diwali, and all festival rituals",
      image: "https://media.istockphoto.com/id/1346254741/photo/hands-of-girl-holding-ghanti-bell-clay-diya-deep-dia-lamp-illuminated-in-pooja-thali-for.webp?a=1&b=1&s=612x612&w=0&k=20&c=3_z07FxprOjRdCb6TCtW2XFtgLyp8vbFvGf72kI6gsI=",
      color: "from-purple-500 to-pink-500",
      keywords: ["festival", "navratri", "diwali", "tyohar"],
    },
    {
      icon: Flame,
      title: "Rashifal Puja",
      description: "Personalized puja rituals based on your zodiac and horoscope",
      image: "https://www.livehindustan.com/lh-img/smart/img/2025/07/27/1600x900/venus_transit_in_leo_1686291754_1753608023940.jpeg",
      color: "from-orange-500 to-red-500",
      keywords: ["rashifal", "rashi", "zodiac", "horoscope", "kundali"],
    },
    {
      icon: Home,
      title: "Dosh Nivaran Puja",
      description: "Sacred puja rituals to reduce doshas and bring harmony",
      image: "https://productimages.withfloats.com/serviceimages/tile/656028d50c3e10782e399cb1mangal03",
      color: "from-green-500 to-teal-500",
      keywords: ["dosh", "dosha", "nivaran", "mangal"],
    },
    {
      icon: Star,
      title: "Remedies Puja",
      description: "Effective puja rituals for spiritual healing and life remedies",
      image: "https://cdn.shopify.com/s/files/1/0830/0051/files/6080136028875769342_480x480.jpg?v=1734172979",
      color: "from-purple-500 to-pink-500",
      keywords: ["remedies", "remedy", "upay", "healing"],
    },
  ];

  return (
    <section
      id="services"
      className="md:py-10 py-10 relative overflow-hidden bg-gradient-to-b from-white via-orange-50/30 to-white"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-40 border-4 border-orange-400 rounded-full" />
        <div className="absolute bottom-20 right-10 w-60 h-60 border-4 border-red-400 rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <span className="text-orange-600 text-lg font-semibold px-4 py-2 bg-orange-100 rounded-full">
              Our Sacred Services
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Book Pandit Ji For
            </span>
            <br />
            <span className="text-gray-800">Different Occasions</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Experience authentic Vedic rituals performed by certified and
            experienced Pandits
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                onClick={() => navigate(resolveLink(service.keywords))}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Icon */}
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <Icon className="w-6 h-6 text-orange-600" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                </div>

                {/* Decorative Corner */}
                <div
                  className={`absolute top-0 left-0 w-20 h-20 bg-gradient-to-br ${service.color} opacity-10 rounded-br-full`}
                />
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-6"
        >
          <p className="text-gray-600 mb-4">
            Can't find what you're looking for?
          </p>
          <a href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r  from-orange-500 to-red-500 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <img src="/images/playstore.png" alt="Download the App Now" className="w-8 h-8" />
                </div>
                <span>Download the App Now</span>
              </div>

            </motion.button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
