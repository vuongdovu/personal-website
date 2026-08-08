import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'vuongdovu-public-d6t89ji8jqbz8t6esr4iuzwbtrgnsuse2a-s3alias.s3.us-east-2.amazonaws.com',
  //       port: '',
  //       pathname: '/**',
  //     },
  //     {
  //       protocol: 'https',
  //       hostname: 'vuongdovu-376129857525-us-east-2-an.s3.us-east-2.amazonaws.com',
  //       port: '',
  //       pathname: '/**',
  //     },
  //   ],
  // },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "vuongdovu-376129857525-us-east-2-an.s3.us-east-2.amazonaws.com",
        pathname: "/media/photos/**",
      },
    ],
  },

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
