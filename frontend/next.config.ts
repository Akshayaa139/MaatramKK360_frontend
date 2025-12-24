import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: "http://localhost:5000",
    NEXTAUTH_URL: "http://localhost:3000",
  },
};

export default nextConfig;
