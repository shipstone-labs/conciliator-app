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
      // Stub out punycode to prevent deprecation warnings
      punycode: `
        export function decode(string) { return string; }
        export function encode(string) { return string; }
        export function toASCII(domain) { return domain; }
        export function toUnicode(domain) { return domain; }
        export default { decode, encode, toASCII, toUnicode };
      `,
      depd: `
        // Complete replacement for depd
        export default () => {
          // Return a function that creates deprecation warnings
          const deprecate = () => {
            return () => {
              // No-op function
              return
            }
          }

          // Add properties to match the real depd API
          deprecate.function = (fn) => {
            return fn
          }

          deprecate.property = (obj) => {
            return obj
          }

          deprecate.class = (fn) => {
            return fn
          }

          // Support for calling directly
          const callable = () => {
            return deprecate()
          }

          // Copy all properties to the callable
          Object.assign(callable, deprecate)

          return callable
        }
      `,
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
      // include: /node_modules/,
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
    // Suppress deprecation warnings
    if (
      warning.message &&
      (warning.message.includes('deprecated') ||
        warning.message.includes('punycode'))
    )
      return
    warn(warning)
  },
  // We don't want ANY externals - everything should be bundled
  external: [
    // '@lit-protocol/contracts-sdk',
    // '@lit-protocol/accs-schemas',
    // '@lit-protocol/auth-helpers',
    // '@lit-protocol/constants',
    // '@lit-protocol/contracts',
    // '@lit-protocol/crypto',
    // '@lit-protocol/lit-auth-client',
    // '@lit-protocol/pkp-ethers',
    // '@lit-protocol/lit-node-client',
    // '@lit-protocol/types',
    // '@simplewebauthn/browser',
    'blakejs',
    'browser-headers',
    'cross-fetch',
    'js-sha256',
    // 'multiformats',
    // 'uint8arrays',
    'utf-8-validate',
  ],
}
