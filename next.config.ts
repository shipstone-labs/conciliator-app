import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.hbs$/,
      use: 'raw-loader'
    });
    
    return config;
  },
  // Skip module checking for wrapper packages and their dependencies
  serverExternalPackages: [
    // Lit Protocol
    'lit-wrapper', 
    '@lit-protocol/contracts',
    '@lit-protocol/accs-schemas',
    'browser-headers',
    '@lit-protocol/crypto',
    'js-sha256',
    'blakejs',
    
    // Web3 Storage
    'web-storage-wrapper',
    'crypto'
  ]
};

export default nextConfig;
