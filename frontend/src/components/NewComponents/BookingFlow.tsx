import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Navigation } from './Navigation';
// import loginImage from 'figma:asset/79bf3b47985fe1ecba70b133e1ec20436efb0eac.png';
// import homeImage from 'figma:asset/fb5f050dbed99a386da4923de2ee7f6dad11aedb.png';
// import pujaListImage from 'figma:asset/82c4cb0060d21612396232c01a5ecbac42147c62.png';
// import pujaDetailsImage from 'figma:asset/ffe1581f5c7bdeee34a605111e55c2ccdcbb1d30.png';
// import userDetailsImage from 'figma:asset/77b474cc8cebd8135c89f24e6bd7462e4273a06e.png';

interface Step {
  id: number;
  title: string;
  description: string;
  image: string;
  color: string;
  shadowColor: string;
  highlight?: boolean;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Login',
    description: 'Enter your phone number to get started',
    image: "/images/step1.png",
    color: 'from-orange-400 to-orange-600',
    shadowColor: 'shadow-orange-500/50',
  },
  {
    id: 2,
    title: 'Home',
    description: 'Browse our comprehensive puja services',
    image: "/images/step2.png",
    color: 'from-amber-400 to-orange-500',
    shadowColor: 'shadow-amber-500/50',
  },
  {
    id: 3,
    title: 'Select Puja',
    description: 'Choose from various pujas - Lakshmi Ji Puja recommended',
    image: "/images/step3.png",
    color: 'from-orange-500 to-yellow-600',
    shadowColor: 'shadow-yellow-500/50',
  },
  {
    id: 4,
    title: 'Puja Details',
    description: 'Review puja details, purpose, and pricing',
    image: "/images/step4.png",
    color: 'from-orange-400 to-red-500',
    shadowColor: 'shadow-orange-500/50',
  },
  {
    id: 5,
    title: 'Fill Details',
    description: 'Complete your booking preferences',
    image: "/images/step5.png",
    color: 'from-orange-500 to-amber-600',
    shadowColor: 'shadow-amber-500/50',
  },
];

export function BookingFlow() {
  return (
    <>
    <Navigation />
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-10 px-4 overflow-hidden mt-20">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-20"
      >
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-full mb-6 shadow-lg shadow-orange-500/30"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium">Simple & Easy Process</span>
        </motion.div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
          How to Book Pandit Ji
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto">
          Book your spiritual ceremony in just 5 simple steps
        </p>
      </motion.div>

      {/* Flow Steps */}
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Connection Lines for Desktop */}
          {/* <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-orange-300 via-amber-400 to-yellow-500 -translate-y-1/2 z-0" /> */}
          
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ 
                duration: 0.6,
                delay: index * 0.15,
                type: 'spring',
                stiffness: 100,
              }}
              className={`mb-20 lg:mb-32 relative ${
                index % 2 === 0 ? 'lg:text-left' : 'lg:text-right'
              }`}
            >
              <div className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                index % 2 === 0 ? '' : 'lg:flex-row-reverse'
              }`}>
                {/* Step Number & Content */}
                <motion.div
                  className="flex-1 z-10"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={`flex items-center gap-4 mb-4 ${
                    index % 2 === 0 ? 'lg:justify-start' : 'lg:justify-end'
                  } justify-center`}>
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} shadow-2xl ${step.shadowColor} flex items-center justify-center`}
                    >
                      <span className="text-2xl font-bold text-white">{step.id}</span>
                    </motion.div>
                    
                    {step.highlight && (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: 'reverse'
                        }}
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
                      >
                        ⭐ Recommended
                      </motion.div>
                    )}
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-bold mb-3 text-gray-800">
                    {step.title}
                  </h3>
                  
                  <p className={`text-lg text-gray-600 max-w-md mx-auto ${
                    index % 2 === 0 ? 'lg:mx-0' : 'lg:ml-auto lg:mr-0'
                  }`}>
                    {step.description}
                  </p>
                  
                  {index < steps.length - 1 && (
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: 'reverse'
                      }}
                      className={`hidden lg:flex items-center gap-2 mt-6 text-orange-600 ${
                        index % 2 === 0 ? '' : 'justify-end'
                      }`}
                    >
                      <span className="font-medium">Next Step</span>
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Phone Mockup */}
                <motion.div
                  className="flex-1 z-10"
                  whileHover={{ 
                    scale: 1.05,
                    rotate: index % 2 === 0 ? 2 : -2,
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={`relative max-w-[16rem] mx-auto ${
                    step.highlight ? 'ring-4 ring-yellow-400 ring-offset-8 ring-offset-transparent' : ''
                  }`}>
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} blur-3xl opacity-30 rounded-3xl`} />
                    
                    {/* Phone Frame */}
                    <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20" />
                      
                      {/* Screen */}
                      <motion.img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-auto"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                      />
                    </div>
                    
                    {/* Floating Particles */}
                    {step.highlight && (
                      <>
                        <motion.div
                          animate={{ 
                            y: [-10, 10, -10],
                            x: [-5, 5, -5],
                            rotate: [0, 180, 360]
                          }}
                          transition={{ 
                            duration: 3,
                            repeat: Infinity,
                            repeatType: 'reverse'
                          }}
                          className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full blur-sm"
                        />
                        <motion.div
                          animate={{ 
                            y: [10, -10, 10],
                            x: [5, -5, 5],
                            rotate: [360, 180, 0]
                          }}
                          transition={{ 
                            duration: 4,
                            repeat: Infinity,
                            repeatType: 'reverse'
                          }}
                          className="absolute -bottom-4 -left-4 w-6 h-6 bg-orange-400 rounded-full blur-sm"
                        />
                      </>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Mobile Arrow */}
              {index < steps.length - 1 && (
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: 'reverse'
                  }}
                  className="lg:hidden flex justify-center mt-0"
                >
                  {/* <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                    <ArrowRight className="w-6 h-6 text-white rotate-90" />
                  </div> */}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mt-20"
      >
        <a href="https://play.google.com/store/apps/details?id=com.panditJiAtReqapp">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white px-12 py-5 rounded-full text-xl font-bold shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 transition-shadow"
        >
          Start Booking Now
        </motion.button>
        </a>
        
        <p className="mt-6 text-gray-600 text-lg">
          Join thousands of devotees who trust Pandit Ji
        </p>
      </motion.div>
    </div>
    </>
  );
}
