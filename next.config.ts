import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.hbs$/,
      use: 'raw-loader'
    });
    return config;
  }
};

export default nextConfig;
