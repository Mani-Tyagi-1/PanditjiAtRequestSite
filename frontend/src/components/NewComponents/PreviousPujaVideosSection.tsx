import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, MapPin, User, Clock, Film } from "lucide-react";

interface PujaVideo {
  id: string;
  title: string;
  category: "home" | "temple" | "virtual";
  type: string;
  city: string;
  panditName: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
}

const VIDEOS: PujaVideo[] = [
  {
    id: "v1",
    title: "Griha Pravesh Vastu Puja Vidhi",
    category: "home",
    type: "Griha Pravesh",
    city: "Noida Sector 62",
    panditName: "Pandit Rajesh Shastri",
    duration: "2:45",
    thumbnail: "https://images.unsplash.com/photo-1609137922983-b570c0aaeaa6?w=400&h=260&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: "v2",
    title: "Vedic Maha Rudrabhishek Puja",
    category: "temple",
    type: "Rudrabhishek",
    city: "Kashi Temple, Varanasi",
    panditName: "Pandit Dinesh Dwivedi",
    duration: "3:10",
    thumbnail: "https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&h=260&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: "v3",
    title: "Live Virtual Satyanarayan Puja for NRI",
    category: "virtual",
    type: "Satyanarayan",
    city: "Chicago (Virtual)",
    panditName: "Pandit Ramakant Tiwari",
    duration: "1:55",
    thumbnail: "https://images.unsplash.com/photo-1561489413-985b06da5bee?w=400&h=260&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: "v4",
    title: "Sacred Havan & Ganesh Puja",
    category: "home",
    type: "Satyanarayan",
    city: "Gurgaon DLF Phase 3",
    panditName: "Pandit Rajesh Shastri",
    duration: "2:15",
    thumbnail: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=260&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
];

const FILTERS = [
  { id: "all", label: "All Videos" },
  { id: "home", label: "Home Puja" },
  { id: "temple", label: "Temple Puja" },
  { id: "virtual", label: "Virtual" },
];

export function PreviousPujaVideosSection() {
  const [category, setCategory] = useState<"all" | "home" | "temple" | "virtual">("all");
  const [playingVideo, setPlayingVideo] = useState<PujaVideo | null>(null);

  const filteredVideos = VIDEOS.filter((vid) => {
    return category === "all" || vid.category === category;
  });

  return (
    <section className="py-8 px-4 bg-gradient-to-b from-white to-orange-50/20 max-w-sm mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-5 text-center"
      >
        <div className="flex items-center gap-2 justify-center mb-1">
          <div className="h-px w-8 bg-orange-300" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 flex items-center gap-1">
            <Film className="w-3 h-3" /> Real Rituals
          </span>
          <div className="h-px w-8 bg-orange-300" />
        </div>
        <h2 className="text-xl font-bold text-stone-800">
          Watch Previous{" "}
          <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            Puja Videos
          </span>
        </h2>
        <p className="text-xs text-stone-500 mt-2 px-2">
          See real puja videos, traditional rituals, and holy chants performed by our expert Pandits before you book.
        </p>
      </motion.div>

      {/* Category Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setCategory(f.id as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border ${
              category === f.id
                ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-100"
                : "bg-white text-stone-600 border-stone-200 hover:border-orange-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredVideos.map((vid) => (
            <motion.div
              layout
              key={vid.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25 }}
              onClick={() => setPlayingVideo(vid)}
              className="bg-white rounded-2xl overflow-hidden border border-orange-100 shadow-sm cursor-pointer hover:border-orange-300 active:scale-[0.98] transition-transform"
            >
              {/* Thumbnail wrap */}
              <div className="relative h-24 bg-orange-100/50">
                <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 text-orange-600 fill-orange-600 ml-0.5" />
                  </div>
                </div>
                {/* Duration */}
                <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {vid.duration}
                </div>
              </div>

              {/* Description Info */}
              <div className="p-2.5 space-y-1.5">
                <p className="font-bold text-stone-855 text-[10px] leading-tight line-clamp-1">
                  {vid.title}
                </p>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[8.5px] text-stone-500">
                    <MapPin className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                    <span className="truncate">{vid.city}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[8.5px] text-stone-500">
                    <User className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                    <span className="truncate">{vid.panditName}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Video Player Modal overlay */}
      <AnimatePresence>
        {playingVideo && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPlayingVideo(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Content modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-black rounded-3xl overflow-hidden shadow-2xl z-10 aspect-video flex flex-col border border-stone-800"
            >
              {/* Close pill */}
              <button
                onClick={() => setPlayingVideo(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shadow transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <iframe
                src={playingVideo.videoUrl}
                title={playingVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}