import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Section2 from "../components/Section2";
import Section3 from "../components/Section3";
import AboutUs from "../components/AboutUs";
import Stats from "../components/Stats";
import Contact from "../components/Contact";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <Section2 />
      <Section3 />
      <AboutUs />
      <Stats />
      <Contact />
      <Footer />
    {/* <div className="p-4 flex flex-col">
      <Link to="/privacypolicy" className="text-blue-500 underline">
        Privacy Policy
      </Link>
      <Link to="/delete-my-account" className="text-blue-500 underline">
        Delete My account
      </Link>
    </div> */}
    </>
  );
}
