import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    // Drop debug logging from production bundles; keep errors and warnings.
    removeConsole: { exclude: ["error", "warn"] },
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "react-icons", "@phosphor-icons/react", "framer-motion"],
  },
  turbopack: {
    resolveAlias: {
      "react-router-dom": "./src/compat/react-router-dom.tsx",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vedic-vaibhav.blr1.cdn.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "vedic-vaibhav.blr1.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    // Files in /public are otherwise served with max-age=0. Everything here is
    // content-addressed by name (new artwork ships under a new filename), so it is
    // safe to cache for a long time.
    const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [
      { source: "/images/:path*", headers: immutable },
      { source: "/hero/:path*", headers: immutable },
      { source: "/icon.png", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
    ];
  },
  async redirects() {
    return [{ source: "/home", destination: "/", permanent: true }];
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
      process.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
      "http://localhost:8001";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  webpack: (config, { webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-router-dom": path.resolve(__dirname, "src/compat/react-router-dom.tsx"),
    };

    config.plugins.push(
      new webpack.DefinePlugin({
        "import.meta.env.VITE_API_URL": JSON.stringify(
          process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || "https://panditjiatrequest.com/api"
        ),
        "import.meta.env.VITE_ENCRYPTION_KEY": JSON.stringify(
          process.env.NEXT_PUBLIC_ENCRYPTION_KEY || process.env.VITE_ENCRYPTION_KEY || "6b9dec45624b76a35233223264781baf4becc3010bdf5b9655f7edea4aeb102a"
        ),
        "import.meta.env.VITE_META_PIXEL_ID": JSON.stringify(
          process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.VITE_META_PIXEL_ID || "1991550221408755"
        ),
        "import.meta.env.VITE_GA4_MEASUREMENT_ID": JSON.stringify(
          process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "G-GLFX9MEX7V"
        ),
        "import.meta.env.VITE_DEVSHAYANI_COMBO_PRICE": JSON.stringify(
          process.env.NEXT_PUBLIC_DEVSHAYANI_COMBO_PRICE || "2100"
        ),
        "import.meta.env.VITE_DEVSHAYANI_COMBO_ORIGINAL": JSON.stringify(
          process.env.NEXT_PUBLIC_DEVSHAYANI_COMBO_ORIGINAL || "4100"
        ),
        "import.meta.env.VITE_DEVSHAYANI_PRASAD_PRICE": JSON.stringify(
          process.env.NEXT_PUBLIC_DEVSHAYANI_PRASAD_PRICE || "298"
        ),
        "import.meta.env.VITE_DEVSHAYANI_DATE": JSON.stringify(
          process.env.NEXT_PUBLIC_DEVSHAYANI_DATE || "2026-07-25T06:00:00+05:30"
        ),
        "import.meta.env.DEV": JSON.stringify(process.env.NODE_ENV !== "production"),
        "import.meta.env.PROD": JSON.stringify(process.env.NODE_ENV === "production"),
        "import.meta.env.MODE": JSON.stringify(process.env.NODE_ENV || "development"),
      })
    );

    return config;
  },
};

export default nextConfig;
