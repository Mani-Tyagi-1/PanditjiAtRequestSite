import { motion } from "framer-motion";
import { Shield, Users, Award } from "lucide-react";

export function AboutUs() {
  const features = [
    {
      icon: Shield,
      title: "Verified Pandits",
      description: "All our pandits are certified and background verified",
    },
    {
      icon: Award,
      title: "Experienced",
      description: "Over 10+ years of experience in Vedic rituals",
    },
    {
      icon: Users,
      title: "Trusted",
      description: "Real people, real services, and complete transparency",
    },
  ];

  return (
    <section id="about" className="md:py-20 py-10 relative overflow-hidden bg-gradient-to-b from-white to-orange-50/30">
      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-20 left-10 w-60 h-60 bg-red-200 rounded-full blur-3xl opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005158.webp"
                alt="About Us"
                className="w-full h-auto object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-orange-900/40 via-transparent to-transparent" />
              
              {/* Decorative border */}
              {/* <div className="absolute inset-0 border-4 border-orange-200/50 rounded-3xl" /> */}
            </div>

            {/* Decorative circles */}
            {/* <div className="absolute -top-6 -left-6 w-24 h-24 border-4 border-orange-400 rounded-full opacity-50" /> */}
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-20 blur-2xl" />
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block mb-4"
            >
              <span className="text-orange-600 text-lg font-semibold px-4 py-2 bg-orange-100 rounded-full">
                About Us
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Bringing Divinity
              </span>
              <br />
              <span className="text-gray-800">To Your Doorstep</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 text-lg mb-6 leading-relaxed"
            >
              Welcome to Pandit Ji At Request. We are committed to preserving and promoting
              authentic Vedic traditions by connecting experienced, verified pandits with
              families seeking to perform sacred rituals with devotion and authenticity.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 text-lg mb-8 leading-relaxed"
            >
              Our mission is to make spiritual services accessible, convenient, and meaningful
              for everyone, ensuring every ritual is performed with proper vidhi and devotion.
            </motion.p>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                      <Icon className="w-7 h-7 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>

           
          </motion.div>
        </div>
      </div>
    </section>
  );
}
