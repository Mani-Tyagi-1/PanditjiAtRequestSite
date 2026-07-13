import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import DesktopHeader from "../components/layout/DesktopHeader";
import SiteFooter from "../components/layout/SiteFooter";

// Blog articles data — replace with API call when backend is ready
const blogPosts = [
  {
    id: "how-to-book-pandit-online",
    title: "How to Book a Pandit Online for Puja at Home in 2026",
    excerpt: "Complete step-by-step guide to booking a verified pandit online for all Hindu ceremonies. Learn about cost, process, and what to expect.",
    date: "2026-06-25",
    readTime: "5 min read",
    category: "Puja Guide",
    image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/poojaMainImage_1779258749947.webp"
  },
  {
    id: "griha-pravesh-puja-complete-guide",
    title: "Griha Pravesh Puja: Complete Guide for Your New Home",
    excerpt: "Everything you need to know about Griha Pravesh puja — muhurat dates, items required, cost, and how to book a pandit.",
    date: "2026-06-20",
    readTime: "8 min read",
    category: "Ceremony Guide",
    image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/poojaMainImage_1779258749947.webp"
  },
  {
    id: "satyanarayan-katha-cost-procedure",
    title: "Satyanarayan Katha: Cost, Procedure & Significance",
    excerpt: "Detailed guide to Satyanarayan Katha ceremony including vidhi, items needed, approximate cost, and how to book online.",
    date: "2026-06-15",
    readTime: "6 min read",
    category: "Rituals",
    image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/poojaMainImage_1779258749947.webp"
  },
  {
    id: "online-puja-booking-cost-india",
    title: "Online Puja Booking Cost in India: Complete Price Guide 2026",
    excerpt: "Transparent pricing for all Hindu pujas — from basic ₹799 ceremonies to elaborate weddings. Compare pandit costs across cities.",
    date: "2026-06-10",
    readTime: "7 min read",
    category: "Pricing",
    image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/poojaMainImage_1779258749947.webp"
  },
  {
    id: "what-is-satyanarayan-katha",
    title: "What is Satyanarayan Katha? Significance, Story & Benefits",
    excerpt: "Learn about the Satyanarayan Katha ceremony — its spiritual significance, the story of Lord Satyanarayan, and why it's performed.",
    date: "2026-06-05",
    readTime: "4 min read",
    category: "Explainer",
    image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/poojaMainImage_1779258749947.webp"
  },
  {
    id: "how-to-find-pandit-near-me",
    title: "How to Find a Pandit Near Me: Best Online Platforms Compared",
    excerpt: "Compare the best ways to find and book a verified pandit near you. Same-day booking, verified credentials, and live ceremony proof.",
    date: "2026-05-28",
    readTime: "6 min read",
    category: "Guide",
    image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/poojaMainImage_1779258749947.webp"
  },
  {
    id: "chadhava-temple-offerings-online-guide",
    title: "Online Chadhava: How to Send Temple Offerings from Anywhere",
    excerpt: "Complete guide to sending online chadhava to temples across India. How it works, which temples accept digital offerings, and proof delivery.",
    date: "2026-05-20",
    readTime: "5 min read",
    category: "Services",
    image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/poojaMainImage_1779258749947.webp"
  },
  {
    id: "nri-puja-booking-guide",
    title: "NRI Puja Booking: How to Book Pandit for Parents in India from Abroad",
    excerpt: "Complete guide for NRIs to book verified pandits for parents' ceremonies in India. Live video, photo proof, and trusted service.",
    date: "2026-05-15",
    readTime: "7 min read",
    category: "NRI Services",
    image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/poojaMainImage_1779258749947.webp"
  }
];

export default function BlogListPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Helmet>
        <title>Blog - Puja Guides & Ceremony Information | PanditJiAtRequest</title>
        <meta name="description" content="Complete guides to Hindu pujas, ceremonies, rituals, and online pandit booking. Learn about Griha Pravesh, Satyanarayan Katha, Havan, and more." />
        <link rel="canonical" href="https://panditjiatrequest.com/blog" />
      </Helmet>

      <DesktopHeader />

      {/* Header */}
      <div className="bg-gradient-to-b from-orange-600 to-orange-500 text-white px-4 pt-8 pb-12 md:px-8 lg:px-10 md:pt-14 md:pb-24 lg:pt-16">
        <div>
          <h1 className="text-2xl font-bold md:text-4xl lg:text-5xl md:tracking-tight">Puja Guides & Resources</h1>
          <p className="mt-2 text-orange-100 text-sm md:mt-3 md:text-base md:max-w-2xl">
            Learn about Hindu ceremonies, rituals, and how to book verified pandits online.
          </p>
        </div>
      </div>

      {/* Blog List */}
      <div className="px-4 -mt-6 pb-12 md:px-8 lg:px-10 md:-mt-12 md:pb-16 lg:pb-20 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:items-stretch">
        {blogPosts.map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.id}`}
            className="block bg-white rounded-xl shadow-sm mb-4 overflow-hidden hover:shadow-md transition-shadow md:mb-0 md:rounded-2xl md:flex md:flex-col md:h-full md:border md:border-orange-100/60 md:transition-all md:duration-300 md:hover:shadow-xl md:hover:-translate-y-1"
          >
            <img
              src={post.image}
              alt={post.title}
              loading="lazy"
              className="hidden md:block w-full h-44 object-cover"
            />
            <div className="flex md:flex-1">
              <div className="flex-1 p-4 md:p-5 md:flex md:flex-col">
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full md:self-start">
                  {post.category}
                </span>
                <h2 className="mt-2 text-base font-semibold text-stone-800 line-clamp-2 md:mt-3 md:text-lg">
                  {post.title}
                </h2>
                <p className="mt-1 text-sm text-stone-500 line-clamp-2 md:mt-2">
                  {post.excerpt}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-stone-400 md:mt-auto md:pt-4">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <SiteFooter />
    </div>
  );
}
