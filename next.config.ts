import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/': ['./landing.html'],
  },
};

export default nextConfig;
