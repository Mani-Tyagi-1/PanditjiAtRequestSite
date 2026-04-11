import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";

interface Blog {
  _id: string;
  blogID: string;
  blogName: string;
  blogDescription: string;
  blogImages: string[];
  authorName?: string;
  addedDate: string;
}


function SkeletonCard() {
  return (
    <div
      className="w-full bg-white animate-pulse overflow-hidden flex flex-col"
      style={{ borderRadius: 20 }}
    >
      <div className="bg-gray-200" style={{ height: 130 }} />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-4/5 mb-3" />
        <div className="h-3 bg-gray-200 rounded w-full mb-2" />
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-4" />
      </div>
    </div>
  );
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function BlogsPage() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await apiClient.get("/fetch-all-blogs");
        // apiClient unwraps the data property
        if (Array.isArray(res.data)) {
          setBlogs(res.data);
        } else if (res.data?.blogs) {
          setBlogs(res.data.blogs);
        }
      } catch (err) {
        console.error("Error fetching blogs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (!loading && blogs.length === 0) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        .blog-title-font { font-family: 'Libre Baskerville', serif; }
        .blog-body-font  { font-family: 'DM Sans', sans-serif; }
        .blog-scroll::-webkit-scrollbar { display: none; }
        .blog-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .blog-card-hover {
          transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s ease;
        }
        .blog-card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.12); }
      `}</style>

      <section className="blog-body-font bg-[#FFFAF3] py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-widest uppercase text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-full px-3 py-1 mb-2 shadow-sm">
            Latest Blogs
          </span>
          <h2
            className="blog-title-font text-stone-800 font-bold leading-tight"
            style={{ fontSize: 26 }}
          >
            Insights & Stories
          </h2>
        </div>

        {/* Cards Auto-Scroll Area */}
        <div className="blog-scroll overflow-x-auto overflow-y-hidden pl-5 pr-4 pb-12">
          <div
            className="grid gap-4 py-2"
            style={{
              gridTemplateRows: "auto",
              gridAutoFlow: "column",
              gridAutoColumns: "250px",
            }}
          >
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              : blogs.map((b) => (
                  <div
                    key={b._id}
                    className="blog-card-hover bg-white flex flex-col overflow-hidden cursor-pointer h-full"
                    style={{
                      borderRadius: 20,
                      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                    onClick={() => navigate(`/blog/${b.blogID}`)}
                  >
                    {/* Blog image */}
                    {b.blogImages?.[0] ? (
                      <img
                        src={b.blogImages[0]}
                        alt={b.blogName}
                        style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center bg-orange-50 w-full"
                        style={{ height: 130 }}
                      >
                        <svg viewBox="0 0 24 24" fill="#F97316" className="w-10 h-10 opacity-40">
                          <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                        </svg>
                      </div>
                    )}

                    {/* Card body */}
                    <div className="p-4 flex flex-col flex-grow">
                      {/* Title */}
                      <h3
                        className="blog-title-font text-stone-800 font-semibold leading-snug mb-2 line-clamp-2"
                        style={{ fontSize: 15 }}
                      >
                        {b.blogName}
                      </h3>

                      {/* Description */}
                      <p
                        className="text-stone-500 leading-relaxed line-clamp-2 mb-4 flex-grow"
                        style={{ fontSize: 13 }}
                      >
                        {stripHtml(b.blogDescription)}
                      </p>

                      {/* Footer: author + date */}
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
                        {b.authorName && (
                          <span className="text-stone-400 truncate" style={{ fontSize: 11 }}>
                            ✍ {b.authorName}
                          </span>
                        )}
                        <span className="text-stone-400 ml-auto whitespace-nowrap" style={{ fontSize: 11 }}>
                          {formatDate(b.addedDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>
    </>
  );
}
