import API_URL from "../utils/apiConfig";
import type { LiveMandirReview } from "../components/booking/LiveMandirPujas/liveMandirData";

export interface TestimonialItem {
  _id: string;
  user_name: string;
  user_testimonial: string;
  rating?: number;
  address?: string;
  image?: string;
  isActive?: boolean;
  added_on?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Calculates a dynamic relative date from a timestamp (e.g., "5 months ago", "3 weeks ago", "2 days ago")
 * instead of hardcoded static dates.
 */
export function formatRelativeDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "Recently";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "Recently";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  // If timestamp is slightly in future or today
  if (diffMs <= 0) return "Today";

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffDays === 0) {
    if (diffHours === 0) {
      if (diffMins <= 1) return "Just now";
      return `${diffMins} mins ago`;
    }
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
}

/**
 * Maps a MongoDB testimonial document to a frontend LiveMandirReview
 */
export function mapTestimonialToReview(item: TestimonialItem): LiveMandirReview {
  return {
    name: item.user_name?.trim() || "Devotee",
    rating: Number(item.rating) || 5,
    date: formatRelativeDate(item.added_on || item.createdAt),
    text: item.user_testimonial || "",
    verified: true,
    address: item.address?.trim() || undefined,
    image: item.image?.trim() || undefined,
  };
}

/**
 * Fetches active testimonials from the database and maps them to LiveMandirReview objects.
 */
export async function fetchLiveTestimonials(): Promise<LiveMandirReview[]> {
  try {
    const res = await fetch(`${API_URL}/fetch-all-testimonials`);
    if (!res.ok) {
      // Fallback try /testimonials
      const resAlt = await fetch(`${API_URL}/testimonials`);
      if (!resAlt.ok) throw new Error(`HTTP error ${resAlt.status}`);
      const json = await resAlt.json();
      const list: TestimonialItem[] = Array.isArray(json?.data) ? json.data : [];
      return list.filter((t) => t.isActive !== false).map(mapTestimonialToReview);
    }
    const json = await res.json();
    const list: TestimonialItem[] = Array.isArray(json?.data) ? json.data : [];
    return list.filter((t) => t.isActive !== false).map(mapTestimonialToReview);
  } catch (err) {
    console.warn("Failed to fetch testimonials from API:", err);
    return [];
  }
}
