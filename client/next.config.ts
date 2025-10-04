import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Limit heavy packages to the pieces we actually import to trim dev bundling cost.
    optimizePackageImports: ["recharts", "lucide-react"],
    // Skip eagerly preloading every route to keep dev startup memory in check.
    preloadEntriesOnStart: false,
  },
  // Keep only a small set of compiled routes in memory during dev to reduce idle usage.
  onDemandEntries: {
    maxInactiveAge: 30 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
