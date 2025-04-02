import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: '[name].js',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    // Replace node: protocol imports with regular imports
    replace({
      preventAssignment: true,
      'node:fs': 'fs',
      'node:path': 'path',
      'node:crypto': 'crypto',
      'node:buffer': 'buffer',
      'node:stream': 'stream',
      'node:events': 'events',
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    
    // Handle JSON imports
    json(),
    
    // Provide Node.js polyfills
    nodePolyfills(),
    
    // Resolve modules from node_modules
    nodeResolve({ 
      browser: true,
      preferBuiltins: false
    }),
    
    // Convert CommonJS modules to ES6
    commonjs()
  ],
  
  // External dependencies (won't be bundled)
  external: [
    '@lit-protocol/contracts',
    '@lit-protocol/accs-schemas',
    'browser-headers',
    '@lit-protocol/crypto',
    'js-sha256',
    'blakejs'
  ]
};