import type { NextConfig } from "next";
import path from "node:path";
import webpack from "webpack";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Handle browser-compatibility for Node.js built-ins
    if (!isServer) {
      // Provide empty implementations for Node.js built-ins
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        os: false,
        zlib: false,
      };

      // Map Node.js imports to browser-compatible versions
      config.resolve.alias = {
        ...config.resolve.alias,
        "node:fs": false,
        "node:events": false,
        "node:path": false,
        "node:crypto": false,
        "node:stream": false,
        "node:buffer": false,

        // Force our wrapper modules to be used
        "lit-wrapper": path.resolve(__dirname, "./packages/lit-wrapper"),
        "web-storage-wrapper": path.resolve(
          __dirname,
          "./packages/web-storage-wrapper"
        ),
        "lilypad-wrapper": path.resolve(
          __dirname,
          "./packages/lilypad-wrapper"
        ),
      };

      // Add process/Buffer polyfills
      config.plugins.push(
        new webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        })
      );
    }

    // Add support for Handlebars templates
    config.module.rules.push({
      test: /\.hbs$/,
      use: "raw-loader",
    });

    return config;
  },
  // Skip module checking for wrapper packages and their external dependencies
  serverExternalPackages: [
    // Lit Protocol
    "lit-wrapper",
    "@lit-protocol/constants",
    "@lit-protocol/lit-node-client",

    // Web3 Storage
    "web-storage-wrapper",
    "@web3-storage/w3up-client",

    // Lilypad
    "lilypad-wrapper",
  ],
  // Configure React runtime
  reactStrictMode: true,
};

export default nextConfig;