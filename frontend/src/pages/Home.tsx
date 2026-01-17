// import {Navbar} from "../components/Navbar";
import HeroSection from "../components/HeroSection";
// import {JoinPandit} from "../components/JoinPanditJi";
// import {Services} from "../components/Services";
// import {AboutUs} from "../components/AboutUs";
// import Stats from "../components/Stats";
import Contact from "../components/Contact";
import Footer from "../components/Footer";

import {Navigation} from "../components/NewComponents/Navigation";
// import { Hero } from "../components/NewComponents/Hero";
import { Services } from "../components/NewComponents/Services";
import { JoinPandit } from "../components/NewComponents/JoinPandit";
import { AboutUs } from "../components/NewComponents/About";
// import { BookingFlow } from "../components/NewComponents/BookingFlow";

export default function Home() {
  return (
    <>
      <Navigation />
      <HeroSection />
      <Services />
      {/* <BookingFlow /> */}
      <JoinPandit />
      <AboutUs />
      {/* <Stats /> */}
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
