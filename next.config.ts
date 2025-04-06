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

      // Add process/Buffer polyfills and expose environment variables
      // Create a mapping for explicit variable replacement
      const env: Record<string, string> = {
        // Explicitly replace each environment variable
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        "process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN": JSON.stringify(
          process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN || ""
        ),
        // Add any other NEXT_PUBLIC_ variables here explicitly
      };

      // Also create a mapping for any other NEXT_PUBLIC_ variables
      // that might be present but not explicitly listed above
      Object.keys(process.env).forEach((key) => {
        if (key.startsWith("NEXT_PUBLIC_") && !env[`process.env.${key}`]) {
          env[`process.env.${key}`] = JSON.stringify(process.env[key]);
        }
      });

      // CRITICAL: Do NOT map "process.env" as a whole object - this can break variable replacement
      config.plugins.push(new webpack.DefinePlugin(env));
    }

    // Add support for Handlebars templates
    config.module.rules.push({
      test: /\.hbs$/,
      resourceQuery: { not: [/raw/] },
      use: "raw-loader",
    });

    // Add support for Handlebars templates with ?raw query
    config.module.rules.push({
      test: /\.hbs$/,
      resourceQuery: /raw/,
      type: "asset/source",
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
