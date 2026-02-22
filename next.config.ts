import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/personal-website",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
