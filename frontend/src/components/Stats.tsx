import { motion } from "framer-motion";

const StatsSection: React.FC = () => {
  const stats = [
    {
      label: "Puja Performed",
      value: "100+",
      image:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/stats1.webp",
    },
    {
      label: "Pandit Ji Listed",
      value: "100+",
      image:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/stats2.webp",
    },
    {
      label: "Type of Puja",
      value: "100+",
      image:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/stats3.webp",
    },
    {
      label: "Satisfied Customers",
      value: "100+",
      image:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/stats4.webp",
    },
  ];

  return (
    <section
      className="py-10"
      style={{
        backgroundImage:
          "url('https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/statsBg.webp')",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 80 }}
          className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-6 md:gap-12 text-center"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-white flex flex-col items-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 80 }}
                className="w-15 h-15  md:w-32 md:h-32 rounded-full overflow-hidden mx-auto mb-4"
              >
                <img
                  src={stat.image}
                  alt={stat.label}
                  className="object-cover w-full h-full"
                />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 80 }}
                className="text-lg sm:text-xl md:text-2xl font-semibold"
              >
                {stat.value}
              </motion.p>
              <p className="text-sm sm:text-base md:text-lg">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
