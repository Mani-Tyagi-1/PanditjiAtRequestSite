const API_URL =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL)) ||
  (typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_API_URL) ||
  "https://panditjiatrequest.com/api";

export default API_URL;
