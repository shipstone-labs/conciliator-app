// @ts-nocheck - Next.js type definitions might be outdated
import webpack from 'webpack'

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  redirects: async () => {
    return [
      // Redirect root plan path
      {
        source: '/plan',
        destination: '/subscription',
        permanent: true,
      },
      // Redirect all plan subpaths
      {
        source: '/plan/:path*',
        destination: '/subscription/:path*',
        permanent: true,
      },
    ]
  },
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
  // Add detailed build analysis
  experimental: {
    webpackBuildWorker: true,
  },
  webpack: (config, { isServer, dev }) => {
    // Add build analyzer plugin
    if (!dev && !process.env.DISABLE_ANALYZER) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : '../.next/analyze/client.html',
          openAnalyzer: false,
        })
      )
    }
    // Handle js-sdk files properly - they are CommonJS with some ESM features
    config.module.rules.push({
      test: /\.js$/,
      include: /submods\/js-sdk/,
      type: 'javascript/auto', // Let webpack auto-detect the module type
      resolve: {
        fullySpecified: false,
      },
    })
    // Handle browser-compatibility for Node.js built-ins
    // Provide empty implementations for Node.js built-ins
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: require.resolve('./lib/shims/punycode.js'),
        depd: require.resolve('./lib/shims/depd.js'),
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
        'node:punycode': require.resolve('./lib/shims/punycode.js'),
        punycode: require.resolve('./lib/shims/punycode.js'),
        depd: require.resolve('./lib/shims/depd.js'),
        '@walletconnect/types': false,
        '@walletconnect/web3-provider': false,
        '@walletconnect/core': false,
        '@walletconnect/sign-client': false,
      }
    }

    if (isServer) {
      // For server builds, map Node.js built-ins directly
      config.resolve.alias = {
        ...config.resolve.alias,
        stream: 'node:stream',
        http: 'node:http',
        https: 'node:https',
        zlib: 'node:zlib',
        crypto: 'node:crypto',
        events: 'node:events',
        fs: 'node:fs',
        path: 'node:path',
        os: 'node:os',
        util: 'node:util',
        net: 'node:net',
        tls: 'node:tls',
        'node:punycode': require.resolve('./lib/shims/punycode.js'),
        punycode: require.resolve('./lib/shims/punycode.js'),
        depd: require.resolve('./lib/shims/depd.js'),
        // Prevent server from loading browser-specific wrappers
        'lit-wrapper': false,
        'web-storage-wrapper': false,
        'lilypad-wrapper': false,
      }

      // Tell webpack not to bundle these modules for server builds
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        '@opentelemetry/sdk-node',
        '@opentelemetry/exporter-trace-otlp-proto',
        '@opentelemetry/exporter-trace-otlp-http',
        '@opentelemetry/sdk-trace-node',
        '@opentelemetry/instrumentation-http',
        '@opentelemetry/instrumentation-express',
        '@opentelemetry/resources',
        '@opentelemetry/instrumentation',
        // Prevent browser wrappers from being bundled on server
        'lit-wrapper',
        'web-storage-wrapper',
        'lilypad-wrapper',
      ]
    }

    // Add process/Buffer polyfills and expose environment variables
    // Create a mapping for explicit variable replacement
    const env: Record<string, string> = {
      // Explicitly replace each environment variable
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }

    // Handle import.meta differently for dev vs production and server vs client
    if (!isServer) {
      // Add browser globals
      env['globalThis.self'] = 'globalThis'
      env.window = 'globalThis'
    }

    // CRITICAL: Do NOT map "process.env" as a whole object - this can break variable replacement
    config.plugins.push(new webpack.DefinePlugin(env))

    // Fix webpack chunk loading for server-side bundles
    if (isServer) {
      // Ensure webpack uses 'global' instead of 'self' for server bundles
      config.output = {
        ...config.output,
        globalObject: 'global',
      }

      // Add global definition for self to prevent ReferenceError
      env.self = 'global'
    }

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

    // Ensure proper ES module support for import.meta
    config.module.rules.push({
      test: /\.(js|mjs|ts|tsx)$/,
      resolve: {
        fullySpecified: false,
      },
    })

    // Handle .mjs files specifically to prevent import.meta errors
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    })

    // Enable ES module support
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      layers: true,
    }

    // Minimal import.meta support - only add what's necessary
    if (dev && !isServer) {
      // Add import.meta polyfill for client-side dev builds
      env['import.meta.webpackHot'] = 'undefined'
    }

    return config
  },
  // Skip module checking for wrapper packages and their external dependencies
  serverExternalPackages: [
    // Lit Protocol
    'lit-wrapper',
    // '@lit-protocol/constants',
    // '@lit-protocol/lit-node-client',
    // Web3 Storage
    'web-storage-wrapper',
    // '@storacha/client',
    // '@noble/ed25519',
    // 'multiformats',
    // Lilypad
    'lilypad-wrapper',
    // Firebase
    'firebase-functions',

    // OpenTelemetry server-side packages
    '@grpc/grpc-js',
    '@opentelemetry/sdk-node',
    '@opentelemetry/exporter-trace-otlp-proto',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/sdk-trace-node',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/instrumentation-http',
    '@opentelemetry/instrumentation-grpc',
    '@opentelemetry/instrumentation-express',
    '@opentelemetry/resources',
    '@opentelemetry/core',
    '@opentelemetry/instrumentation',
    '@opentelemetry/api',
    '@opentelemetry/semantic-conventions',

    // Node.js built-ins that cause dependency issues
    'stream',
    'node:stream',
    'http',
    'node:http',
    'https',
    'node:https',
    'zlib',
    'node:zlib',
    'net',
    'node:net',
    'tls',
    'node:tls',
    'crypto',
    'node:crypto',
    'os',
    'node:os',
    'fs',
    'node:fs',
    'util',
    'node:util',
    'path',
    'node:path',
    'events',
    'node:events',
    'buffer',
    'node:buffer',
    'querystring',
    'node:querystring',
    'url',
    'node:url',
    'dns',
    'node:dns',
    'assert',
    'node:assert',
  ],
  // Configure React runtime
  reactStrictMode: true,
}

export default nextConfig
