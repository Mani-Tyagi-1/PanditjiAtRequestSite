import { motion } from "framer-motion";

const AboutUsSection: React.FC = () => {
  return (
    <section id="about" className="bg-white py-7">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80 }}
          className="text-7xl text-center  leading-tight"
          style={{ fontFamily: "'Monotype Corsiva', cursive" }}
        >
          About Us
        </motion.h2>
        <div className="grid md:grid-cols-2  items-center">
          {/* Left Column: Image */}
          <div className="relative">
            <div className="w-full h-auto ">
              <img
                src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005158.webp"
                alt="About Us"
                className="object-cover w-[400px] h-full"
              />
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="space-y-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-md md:text-lg text-gray-700 leading-relaxed"
            >
              Welcome to AU Natural Organics. We are an organic store creating
              natural, organic beauty products that nurture and beautify your
              skin in a healthy way. We offer the healthiest, purest, and most
              effective organic skincare products so you can shop confidently
              with the peace of mind that you are revitalizing and nourishing
              your hair, skin, and nails in an eco-friendly and non-toxic way.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-md md:text-lg text-gray-700 leading-relaxed"
            >
              We curate all our products, including our organic essential oils,
              natural butter, carrier oils, and oral care products, from
              handpicked natural, fresh ingredients.
            </motion.p>

            {/* Decorative Element (Arrow with orange background) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="flex justify-start mt-6"
            >
              <div className="">
                <img
                  src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005159.webp"
                  alt="Decorative Arrow"
                  className=""
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;
