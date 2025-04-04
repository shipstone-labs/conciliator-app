import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  minify: true,
  noExternal: [
    '@lit-protocol/constants',
    '@lit-protocol/lit-node-client'
  ],
  platform: 'neutral',
  env: {
    NODE_ENV: 'production'
  },
  esbuildOptions(options) {
    options.define = {
      ...options.define,
      'process.env.NODE_ENV': JSON.stringify('production'),
      'global': 'globalThis',
    };
  }
});