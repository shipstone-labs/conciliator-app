import type { NextConfig } from 'next'
import webpack from 'webpack'

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable minification for debugging
  swcMinify: false,
  // Disable file compression for debugging
  compress: false,
  // Add source maps for debugging
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'w3s.link',
        port: '',
        pathname: '/ipfs/**',
      },
      // Allow our own domain for the cached image API route
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/api/cached-image/**',
      },
      {
        protocol: 'https',
        hostname: process.env.VERCEL_URL || 'conciliate-app.vercel.app',
        port: '',
        pathname: '/api/cached-image/**',
      },
    ],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/webp'],
    dangerouslyAllowSVG: true,
    // We don't need loader configuration here since we'll
    // explicitly use our custom loader where needed
  },
  webpack: (config, { isServer }) => {
    // Handle browser-compatibility for Node.js built-ins
    // Provide empty implementations for Node.js built-ins
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false, // resolve(__dirname, "node_modules/crypto-browserify"),
        stream: false,
        buffer: false,
        util: false,
        os: false,
        zlib: false,
      }

      // Map Node.js imports to browser-compatible versions
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:fs': false,
        'node:events': false,
        'node:path': false,
        'node:crypto': false,
        crypto: false,
        'node:stream': false,
        'node:buffer': false,
        '@walletconnect/types': false,
        '@walletconnect/web3-provider': false,
        '@walletconnect/core': false,
        '@walletconnect/sign-client': false,
      }
    }

    if (isServer) {
      // Replace node-fetch with empty module or a custom implementation
      // config.resolve.alias["node-fetch"] = false;
      // config.resolve.mainFields = ["main", "module"]; // Prefer 'main' (CJS) over 'module' (ESM)
    }

    // Add process/Buffer polyfills and expose environment variables
    // Create a mapping for explicit variable replacement
    const env: Record<string, string> = {
      // Explicitly replace each environment variable
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }

    // CRITICAL: Do NOT map "process.env" as a whole object - this can break variable replacement
    config.plugins.push(new webpack.DefinePlugin(env))

    // Add support for Handlebars templates
    config.module.rules.push({
      test: /\.hbs$/,
      resourceQuery: { not: [/raw/] },
      use: 'raw-loader',
    })

    // Add support for Handlebars templates with ?raw query
    config.module.rules.push({
      test: /\.hbs$/,
      resourceQuery: /raw/,
      type: 'asset/source',
    })

    return config
  },
  // Skip module checking for wrapper packages and their external dependencies
  serverExternalPackages: [
    // Lit Protocol
    'lit-wrapper',
    '@lit-protocol/constants',
    '@lit-protocol/lit-node-client',
    // Web3 Storage
    'web-storage-wrapper',
    '@web3-storage/w3up-client',
    '@noble/ed25519',
    'multiformats',
    // Lilypad
    'lilypad-wrapper',
    // Firebase
    'firebase-functions',
  ],
  // Configure React runtime
  reactStrictMode: true,
}

export default nextConfig
