import { notFound } from "next/navigation";
import CatchAllClient from "./CatchAllClient";

const REDIRECTS = new Set([
  "vivah",
  "kaal-bhairav-puja",
  "banke-bihari-puja",
  "janmashtami-puja",
  "hanuman-puja",
]);

const SINGLE_SEGMENT = new Set([
  "video-call",
  "audio-call",
  "track-pandit",
  "delete-pandit-account",
  "delete-my-account",
  "privacypolicy-pandit",
  "termsandconditions-pandit",
  "mahakaal-savan-somwar-puja",
  "savan-puja",
  "kashi-mahadev-savan-puja",
]);

// Mirrors the routes CatchAllClient renders, so unmatched URLs get a real 404
// status instead of a 200 "not found" screen.
function isKnownRoute(slug: string[]): boolean {
  const [first, second, third] = slug;
  if (!first) return false;
  if (REDIRECTS.has(first) || SINGLE_SEGMENT.has(first)) return true;
  if (first === "chadhava" || first === "live-mandir-puja") return Boolean(second);
  if (first === "holy-pandit" || first === "shop-product") return Boolean(second);
  if (first === "shop") return Boolean(second && third);
  if (first === "puja") return third === "enquiry";
  return false;
}

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  if (!isKnownRoute(slug)) notFound();
  return <CatchAllClient params={params} />;
}
