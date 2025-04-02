import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.browser.js',
    format: 'esm',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    // Replace node: protocol imports with regular imports
    replace({
      preventAssignment: true,
      delimiters: ['', ''],
      values: {
        'node:fs': 'false',
        'node:path': 'false',
        'node:crypto': '{ randomBytes: () => crypto.getRandomValues(new Uint8Array(32)) }',
        'node:buffer': 'false',
        'node:stream': 'false',
        'node:events': 'events',
        'process.env.NODE_ENV': JSON.stringify('production')
      }
    }),
    
    // Handle JSON imports
    json(),
    
    // Provide Node.js polyfills for browser
    nodePolyfills(),
    
    // Resolve modules from node_modules
    nodeResolve({ 
      browser: true,
      preferBuiltins: false
    }),
    
    // Convert CommonJS modules to ES6
    commonjs({
      transformMixedEsModules: true
    }),
    
    // Minify the bundle
    terser()
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