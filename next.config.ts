import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.optimization.minimize = false; // ✅ Disable minification
    config.resolve.fallback = {
      fs: false, // Cloudflare doesn't support `fs`
      net: false, // No network support in Cloudflare runtime
      tls: false, // No TLS in Cloudflare
      depd: false, // ✅ Prevents `depd` from being included
      path: require.resolve("path-browserify"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer"),
      util: require.resolve("util"),
      process: require.resolve("process"),
      "node:process": require.resolve("process"), // ✅ Fixes "node:process" imports
      vm: require.resolve("vm-browserify"), // ✅ Fix missing `vm` module
      tty: false, // ✅ Fix for isTTY error
    };

    config.plugins.push(
      new webpack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      })
    );

    return config;
  },
};

export default nextConfig;