import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface Blog {
  _id: string;
  blogID: string;
  blogName: string;
  blogDescription: string;
  blogImages: string[];
  authorName?: string;
  addedDate: string;
  tags?: string[];
  pooja?: { id: string; name: string; link: string };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogDetailPage() {
  const { blogID } = useParams<{ blogID: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    fetch(`${apiUrl}/fetch-all-blogs`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const found = data.data.find((b: Blog) => b.blogID === blogID);
          setBlog(found || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [blogID]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFAF3] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#FFFAF3] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-stone-500 text-sm">Blog not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-orange-600 text-sm font-medium underline underline-offset-2"
        >
          Go back
        </button>
      </div>
    );
  }


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .blog-detail-title { font-family: 'Libre Baskerville', serif; }
        .blog-detail-body  { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="blog-detail-body flex flex-col items-center min-h-screen bg-[#FFFAF3]">
        {/* Sticky header */}
        <div className="sticky w-md top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-orange-100 flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span
            className="blog-detail-title text-stone-700 font-semibold line-clamp-1 text-sm flex-1"
          >
            {blog.blogName}
          </span>
        </div>

        <div className="max-w-md mx-auto px-4 pb-12">
          {/* Image carousel */}
          {blog.blogImages && blog.blogImages.length > 0 && (
            <div className="relative mt-4 rounded-2xl overflow-hidden shadow-md">
              <img
                src={blog.blogImages[imgIndex]}
                alt={blog.blogName}
                className="w-full object-cover"
                style={{ height: 220 }}
              />
              {blog.blogImages.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex((i) => Math.max(0, i - 1))}
                    disabled={imgIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center disabled:opacity-30"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setImgIndex((i) => Math.min(blog.blogImages.length - 1, i + 1))}
                    disabled={imgIndex === blog.blogImages.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center disabled:opacity-30"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {blog.blogImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === imgIndex ? "bg-white w-3" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {blog.authorName && (
              <span className="flex items-center gap-1 text-xs text-stone-500 bg-orange-50 rounded-full px-2.5 py-1">
                ✍ {blog.authorName}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-stone-400 bg-stone-100 rounded-full px-2.5 py-1">
              🗓 {formatDate(blog.addedDate)}
            </span>
            {blog.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs text-orange-600 bg-orange-50 rounded-full px-2.5 py-1"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1
            className="blog-detail-title text-stone-800 font-bold leading-snug mt-4 mb-4"
            style={{ fontSize: 22 }}
          >
            {blog.blogName}
          </h1>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-orange-300 via-orange-100 to-transparent mb-5" />

          {/* Content */}
          <div
            className="text-stone-700 leading-relaxed prose prose-sm max-w-none"
            style={{ fontSize: 15 }}
            dangerouslySetInnerHTML={{ __html: blog.blogDescription }}
          />

          {/* Linked Pooja CTA */}
          {blog.pooja?.name && (
            <div className="mt-8 bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <p className="text-xs text-orange-500 font-medium uppercase tracking-wider mb-1">
                Related Puja
              </p>
              <p className="blog-detail-title text-stone-800 font-semibold text-base mb-3">
                {blog.pooja.name}
              </p>
              <button
                onClick={() => navigate(`/puja/${blog.pooja!.id}`)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-semibold rounded-xl py-2.5 shadow-sm active:scale-95 transition-transform"
              >
                Book this Puja
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
