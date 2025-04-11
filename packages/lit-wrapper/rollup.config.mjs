import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import virtual from '@rollup/plugin-virtual'

// Create a global window shim
const globals = `
const window = globalThis;
if (typeof self === "undefined") {
  globalThis.self = globalThis;
}
const process = {}
`

export default {
  input: './dist/index.js',
  output: {
    file: './dist/index.js',
    format: 'esm',
    sourcemap: false, // Explicitly disable source maps to avoid conflicts with webpack
    // Don't preserve modules - bundle everything
    preserveModules: false,
    // Make sure the output has no external imports
    inlineDynamicImports: true,
    // Generate clean code that's less likely to confuse webpack
    generatedCode: {
      constBindings: true,
      arrowFunctions: true,
      objectShorthand: true,
    },
  },
  plugins: [
    // Add window global shim at the beginning of the bundle
    {
      name: 'globals',
      banner() {
        return globals
      },
    },
    // Stub out modules that shouldn't be included in the worker bundle
    virtual({
      '@walletconnect/modal': 'export default {}',
      process: 'export default {}',
      // Add any other modules to stub here as needed
    }),
    // Explicitly resolve from this package's node_modules
    resolve({
      browser: true,
      preferBuiltins: false,
      // Includes node built-ins
      ignoreSideEffectsForRoot: true,
    }),
    commonjs({
      // Include all node_modules
      include: /node_modules/,
      // Transform CommonJS modules to ES6
      transformMixedEsModules: true,
    }),
    json(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'global.window': 'globalThis',
      'typeof window': 'typeof globalThis',
      'globalThis.process.versions.node': 'undefined',
      'global.process.versions.node': 'undefined',
      'process.versions.node': 'undefined',
      preventAssignment: true,
    }),
    // Uncomment to enable minification
    // terser()
  ],
  onwarn(warning, warn) {
    // Suppress circular dependency warnings
    if (warning.code === 'CIRCULAR_DEPENDENCY') return
    // Suppress this is undefined warnings (common in browser code)
    if (warning.code === 'THIS_IS_UNDEFINED') return
    warn(warning)
  },
  // We don't want ANY externals - everything should be bundled
  external: [],
}
