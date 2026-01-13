import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  images: {
    unoptimized: true,
  },

  // 🔴 CHANGE THIS to your repo name
  basePath: "/MaatramKK360_frontend",
  assetPrefix: "/MaatramKK360_frontend/",
};

export default nextConfig;

