import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" — removed for Vercel (Vercel handles output itself)
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Ensure public files are served
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
