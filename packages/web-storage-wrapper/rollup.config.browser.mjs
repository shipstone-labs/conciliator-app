import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import virtual from '@rollup/plugin-virtual'
import alias from '@rollup/plugin-alias'
import path from 'node:path'

// Create a global window shim
const globals = `
const window = globalThis;
`

// Crypto polyfill that works in all environments
const cryptoPolyfill = `
// Get crypto implementation based on environment
// Check in order of most to least likely in browser environments
let webCrypto;

if (typeof window !== 'undefined' && window.crypto) {
  webCrypto = window.crypto;
} else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
  webCrypto = globalThis.crypto;
} else if (typeof self !== 'undefined' && self.crypto) {
  webCrypto = self.crypto;
} else if (typeof global !== 'undefined' && global.crypto) {
  webCrypto = global.crypto;
}

// In browser environments, crypto should always be available
// If not, it might be SSR or a very old browser
if (!webCrypto && typeof window !== 'undefined') {
  // We're in a browser but crypto is missing
  console.error('Web Crypto API not found. This browser may not support crypto operations.');
}

// For SSR, we can't throw immediately as the code might not use crypto
// Let consuming code handle the missing crypto gracefully
if (!webCrypto) {
  console.warn('Crypto not available during initialization. This is expected during SSR.');
  // Create a stub that will throw when actually used
  webCrypto = new Proxy({}, {
    get() {
      throw new Error('Crypto operations are not available in this environment. This typically happens during SSR.');
    }
  });
}

// Export only Web Crypto implementation
export default webCrypto;
export { webCrypto as webcrypto };
`

export default {
  input: './dist/tsc/index.js',
  output: {
    file: './dist/browser.js',
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
    // Ensure imports are resolved
    hoistTransitiveImports: false,
  },
  plugins: [
    // Add window global shim at the beginning of the bundle
    {
      name: 'globals',
      banner() {
        return globals
      },
    },
    // Transform crypto requires BEFORE commonjs processes them
    {
      name: 'pre-transform-crypto',
      transform(code, id) {
        // Skip virtual modules
        if (id.startsWith('\0') || id.includes('virtual:')) return null

        // Replace require('crypto') with a reference that won't be processed by commonjs
        if (
          code.includes("require('crypto')") ||
          code.includes('require("crypto")')
        ) {
          code = code.replace(
            /require\(['"]crypto['"]\)/g,
            '__CRYPTO_POLYFILL__'
          )
        }
        return { code, map: null }
      },
    },
    // Alias crypto imports to our polyfill - this needs to come BEFORE resolve
    alias({
      entries: [
        // Force multiformats to use browser versions
        {
          find: /^multiformats\/hashes\/sha2$/,
          replacement: path.resolve(
            './node_modules/multiformats/dist/src/hashes/sha2-browser.js'
          ),
        },
        {
          find: /^multiformats\/hashes\/sha1$/,
          replacement: path.resolve(
            './node_modules/multiformats/dist/src/hashes/sha1-browser.js'
          ),
        },
        // Also handle direct file imports
        {
          find: /.*\/multiformats\/dist\/src\/hashes\/sha2\.js$/,
          replacement: path.resolve(
            './node_modules/multiformats/dist/src/hashes/sha2-browser.js'
          ),
        },
        {
          find: /.*\/multiformats\/dist\/src\/hashes\/sha1\.js$/,
          replacement: path.resolve(
            './node_modules/multiformats/dist/src/hashes/sha1-browser.js'
          ),
        },
        // Core crypto handling
        { find: 'crypto', replacement: 'virtual:crypto-polyfill' },
        { find: 'node:crypto', replacement: 'virtual:crypto-polyfill' },
        // File system
        { find: 'fs', replacement: 'virtual:fs-stub' },
        { find: 'node:fs', replacement: 'virtual:fs-stub' },
        // Streams
        { find: 'stream', replacement: 'virtual:stream-stub' },
        { find: 'node:stream', replacement: 'virtual:stream-stub' },
        // Path utilities
        { find: 'path', replacement: 'virtual:path-stub' },
        { find: 'node:path', replacement: 'virtual:path-stub' },
        // Process
        { find: 'process', replacement: 'virtual:process-stub' },
        { find: 'node:process', replacement: 'virtual:process-stub' },
        // Assertions
        { find: 'assert', replacement: 'virtual:assert-stub' },
        { find: 'node:assert', replacement: 'virtual:assert-stub' },
        // Utilities
        { find: 'util', replacement: 'virtual:util-stub' },
        { find: 'node:util', replacement: 'virtual:util-stub' },
        // Buffer
        { find: 'buffer', replacement: 'virtual:buffer-stub' },
        { find: 'node:buffer', replacement: 'virtual:buffer-stub' },
        // Events
        { find: 'events', replacement: 'virtual:events-stub' },
        { find: 'node:events', replacement: 'virtual:events-stub' },
        // OS
        { find: 'os', replacement: 'virtual:os-stub' },
        { find: 'node:os', replacement: 'virtual:os-stub' },
      ],
    }),
    // Stub out modules that shouldn't be included in the worker bundle
    virtual({
      '@walletconnect/modal': 'export default {}',
      'virtual:crypto-polyfill': cryptoPolyfill,
      'virtual:fs-stub': `
        export default {};
        export const promises = {};
        export const readFile = () => Promise.reject(new Error('fs not available'));
        export const writeFile = () => Promise.reject(new Error('fs not available'));
        export const readFileSync = () => { throw new Error('fs not available'); };
        export const writeFileSync = () => { throw new Error('fs not available'); };
      `,
      'virtual:stream-stub': `
        export class Readable {}
        export class Writable {}
        export class Transform {}
        export class PassThrough {}
        export class Stream {}
        export default { Readable, Writable, Transform, PassThrough, Stream };
      `,
      'virtual:path-stub': `
        export const sep = '/';
        export const delimiter = ':';
        export const join = (...parts) => parts.join('/').replace(/\\/+/g, '/');
        export const resolve = (...parts) => '/' + join(...parts);
        export const dirname = (path) => path.split('/').slice(0, -1).join('/') || '/';
        export const basename = (path) => path.split('/').pop() || '';
        export const extname = (path) => {
          const base = basename(path);
          const dot = base.lastIndexOf('.');
          return dot > 0 ? base.slice(dot) : '';
        };
        export default { sep, delimiter, join, resolve, dirname, basename, extname };
      `,
      'virtual:process-stub': `
        const events = new Map();
        
        export const env = {};
        export const platform = 'browser';
        export const versions = { node: undefined };
        export const cwd = () => '/';
        export const nextTick = (fn) => Promise.resolve().then(fn);
        
        // Event emitter methods for process
        export const on = (event, listener) => {
          if (!events.has(event)) events.set(event, []);
          events.get(event).push(listener);
          return process;
        };
        
        export const once = (event, listener) => {
          const onceWrapper = (...args) => {
            off(event, onceWrapper);
            listener(...args);
          };
          return on(event, onceWrapper);
        };
        
        export const off = (event, listener) => {
          if (!events.has(event)) return process;
          const listeners = events.get(event);
          const index = listeners.indexOf(listener);
          if (index > -1) listeners.splice(index, 1);
          return process;
        };
        
        export const emit = (event, ...args) => {
          if (!events.has(event)) return false;
          events.get(event).forEach(listener => listener(...args));
          return true;
        };
        
        const process = { env, platform, versions, cwd, nextTick, on, once, off, emit };
        export default process;
      `,
      'virtual:assert-stub': `
        export default function assert(condition, message) {
          if (!condition) throw new Error(message || 'Assertion failed');
        }
        export const ok = assert;
        export const equal = (a, b, msg) => assert(a === b, msg);
        export const notEqual = (a, b, msg) => assert(a !== b, msg);
        export const strictEqual = (a, b, msg) => assert(a === b, msg);
        export const notStrictEqual = (a, b, msg) => assert(a !== b, msg);
      `,
      'virtual:util-stub': `
        export const promisify = (fn) => (...args) => new Promise((resolve, reject) => {
          fn(...args, (err, result) => err ? reject(err) : resolve(result));
        });
        export const inherits = (ctor, superCtor) => {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: { value: ctor, enumerable: false, writable: true, configurable: true }
          });
        };
        export const deprecate = (fn, msg) => fn;
        export const isArray = Array.isArray;
        export const isBuffer = () => false;
        
        // Deep equality check
        export const isDeepStrictEqual = (a, b) => {
          if (a === b) return true;
          if (a == null || b == null) return false;
          if (typeof a !== typeof b) return false;
          
          if (typeof a === 'object') {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            
            for (const key of keysA) {
              if (!keysB.includes(key)) return false;
              if (!isDeepStrictEqual(a[key], b[key])) return false;
            }
            return true;
          }
          return false;
        };
        
        export default { promisify, inherits, deprecate, isArray, isBuffer, isDeepStrictEqual };
      `,
      'virtual:buffer-stub': `
        export class Buffer extends Uint8Array {
          static from(data, encoding) {
            if (typeof data === 'string') {
              return new TextEncoder().encode(data);
            }
            return new Uint8Array(data);
          }
          static alloc(size) {
            return new Uint8Array(size);
          }
          static isBuffer(obj) {
            return obj instanceof Uint8Array;
          }
          toString(encoding) {
            return new TextDecoder().decode(this);
          }
        }
        export default { Buffer };
      `,
      'virtual:events-stub': `
        export class EventEmitter {
          constructor() {
            this._events = {};
          }
          on(event, listener) {
            if (!this._events[event]) this._events[event] = [];
            this._events[event].push(listener);
            return this;
          }
          emit(event, ...args) {
            if (!this._events[event]) return false;
            this._events[event].forEach(listener => listener(...args));
            return true;
          }
          off(event, listener) {
            if (!this._events[event]) return this;
            this._events[event] = this._events[event].filter(l => l !== listener);
            return this;
          }
          once(event, listener) {
            const onceWrapper = (...args) => {
              this.off(event, onceWrapper);
              listener(...args);
            };
            return this.on(event, onceWrapper);
          }
        }
        export default EventEmitter;
      `,
      'virtual:os-stub': `
        export const EOL = '\\n';
        export const tmpdir = () => '/tmp';
        export const homedir = () => '/home/user';
        export const hostname = () => 'localhost';
        export const platform = () => 'browser';
        export const arch = () => 'browser';
        export const cpus = () => [];
        export const userInfo = () => ({
          uid: -1,
          gid: -1,
          username: 'user',
          homedir: '/home/user',
          shell: null
        });
        export default { EOL, tmpdir, homedir, hostname, platform, arch, cpus, userInfo };
      `,
      // Add any other modules to stub here as needed
    }),
    // Explicitly resolve from this package's node_modules
    resolve({
      // Prefer browser exports for browser-compatible builds
      browser: true,
      preferBuiltins: false,
      // Export conditions - prioritize browser, then other conditions
      exportConditions: ['browser', 'import', 'module', 'default'],
      // Resolve from the package's node_modules
      moduleDirectories: ['node_modules'],
      // Include all file extensions
      extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
      // Force module resolution
      dedupe: [],
      // Follow symlinks (important for pnpm)
      preserveSymlinks: false,
    }),
    commonjs({
      // Include all node_modules
      include: /node_modules/,
      // Transform CommonJS modules to ES6
      transformMixedEsModules: true,
      // Handle dynamic requires
      ignoreDynamicRequires: false,
      // Make sure CommonJS detection works
      defaultIsModuleExports: true,
    }),
    json(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'global.window': 'globalThis',
      __CRYPTO_POLYFILL__: '_virtual_virtual_cryptoPolyfill',
      // Don't replace typeof window checks - we need those for environment detection
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
