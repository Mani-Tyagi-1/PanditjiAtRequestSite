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
              Pandit Ji at Request is a trusted platform that makes Vedic and
              Hindu puja services simple, reliable, and accessible. We connect
              you with experienced, qualified Pandit Ji who perform every
              ritual with devotion and proper Vedic vidhi—right at your
              doorstep.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-md md:text-lg text-gray-700 leading-relaxed"
            >
              Whether it’s Griha Pravesh, Car Pooja, Satyanarayan Katha, Havan,
              Naming Ceremony (Naamkaran), Vastu Puja/Yagya, Festival Pooja,
              Marriage Rituals, or any other sacred occasion, our Pandit Jis
              ensure the ceremony is conducted smoothly and spiritually.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-md md:text-lg text-gray-700 leading-relaxed"
            >
              We also help with puja samagri and arrangements, so you don’t have
              to worry about anything. With Pandit Ji at Request, book a
              qualified Pandit Ji anytime, anywhere—and bring divine blessings into
              your home and life.
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
