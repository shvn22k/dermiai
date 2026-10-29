import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared contracts package ships TypeScript source.
  transpilePackages: ["@dermiai/schemas"],
};

export default nextConfig;
