import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />

      
    <div className="p-4 flex flex-col">
      <h1 className="text-2xl font-bold">Home Page</h1>
      <Link to="/about" className="text-blue-500 underline">
        Go to About
      </Link>
      <Link to="/privacypolicy" className="text-blue-500 underline">
        Privacy Policy
      </Link>
      <Link to="/delete-my-account" className="text-blue-500 underline">
        Delete My account
      </Link>
    </div>
    </>
  );
}
