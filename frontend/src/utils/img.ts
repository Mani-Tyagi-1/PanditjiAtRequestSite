// On-the-fly image optimization via images.weserv.nl — resizes to the display
// width and converts to WebP, so large origin PNGs/JPEGs (e.g. a 710 KB hero PNG)
// don't tank LCP. weserv caches each transformed URL at its own global edge, so
// only the first request pays the processing cost.
//
// Safety: only absolute http(s) URLs are transformed; local/relative/data URLs
// pass through untouched. Always pair with an onError fallback to the original
// URL (see optimizedImg usage) so a proxy hiccup never shows a broken image.
//
// NOTE: weserv is a free service — fine as a stopgap. The permanent fix is to
// upload already-optimized WebP images at display size to the CDN.
export function optimizedImg(
  url: string | undefined | null,
  width: number,
  quality = 75
): string {
  if (!url || typeof url !== "string") return "";
  if (!/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  const source = url.replace(/^https:\/\//i, "ssl:").replace(/^http:\/\//i, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(source)}&w=${width}&output=webp&q=${quality}&we`;
}
