import { motion } from "framer-motion";

const BookPanditSection: React.FC = () => {
  return (
    <section className="bg-[#f9e1d5] py-7">
      <div className="mx-auto max-w-7xl px-6 lg:px-16">
        <div className="flex flex-col md:flex-row  gap-4 md:gap-20 items-center">
          {/* Left Column: Heading and Description */}
          <div className="space-y-4 w-full md:w-1/2">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-4xl md:text-7xl text-center md:text-start leading-tight"
              style={{ fontFamily: "'Monotype Corsiva', cursive" }}
            >
              Book Pandit Ji For Different Occasions
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="text-md text-[#333] leading-relaxed text-center md:text-start "
            >
              Panditji at Request is the most trusted platform for availing
              Vedic and Hindu Puja services like performing Vedic rituals,
              religious ceremonies, Vastu Yagya, and many more. We provide the
              best experienced and well-known purohits and pandits at your place
              to do puja. We are leading Pandit booking website. Now, you can
              perform your pooja with our professional purohits & pandits.
            </motion.p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              <a
                href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/image%201520.png"
                  alt="Available on google play store"
                  className="h-18 sm:h-12"
                />
              </a>
            </div>
          </div>

          {/* Right Column: Image Grid with Diamond Shape Central Image */}
          <div className="relative">
            <div>
              <img
                src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/image%201519.webp"
                alt="Pandit registering on laptop"
                className="w-[300px] md:w-[400px] h-auto "
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookPanditSection;
