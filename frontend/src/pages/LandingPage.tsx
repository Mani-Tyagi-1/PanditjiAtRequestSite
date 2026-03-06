import FeaturedPujas from "../components/BookingComponents/FeaturedPujas";
import HeroBanner from "../components/BookingComponents/HeroBanner";
import HowItWorks from "../components/BookingComponents/HowItWorksSection";
import RecomendedForYou from "../components/BookingComponents/RecomendedForYou";
import ServicesSection from "../components/BookingComponents/ServicesSection";
import WhyChooseUs from "../components/BookingComponents/WhyChoseUs";
import Footer from "../components/Footer";
// import {Navigation} from "../components/NewComponents/Navigation";


export default function LandingPage() {
  return (
    <>
      {/* <Navigation />*/}
      <div className="w-full max-w-[600px] mx-auto">
      <HeroBanner />
      <ServicesSection />
      <FeaturedPujas />
      <HowItWorks />
      <RecomendedForYou />
      <WhyChooseUs />
      <Footer />
      </div>

    </>
  );
}
