import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  async rewrites() {
    return [
      {
        source: "/",
        destination: "/home",
      },
    ];
  },
};

export default nextConfig;
