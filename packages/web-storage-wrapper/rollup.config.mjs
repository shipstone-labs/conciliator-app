import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

export default {
  input: './dist/index.js',
  output: {
    file: './dist/index.js',
    format: 'esm',
    sourcemap: false,
    preserveModules: false,
    inlineDynamicImports: true,
    generatedCode: {
      constBindings: true,
      arrowFunctions: true,
      objectShorthand: true,
    },
    hoistTransitiveImports: false,
  },
  plugins: [
    resolve({
      preferBuiltins: true, // Prefer Node.js built-ins
      exportConditions: ['node', 'import', 'module', 'default'],
      moduleDirectories: ['node_modules'],
      extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
      dedupe: [],
      preserveSymlinks: false,
    }),
    commonjs({
      include: /node_modules/,
      transformMixedEsModules: true,
      ignoreDynamicRequires: false,
      defaultIsModuleExports: true,
    }),
    json(),
  ],
  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return
    if (warning.code === 'THIS_IS_UNDEFINED') return
    warn(warning)
  },
  // Mark Node.js built-ins as external so they're not bundled
  external: [
    'crypto',
    'fs',
    'path',
    'stream',
    'util',
    'os',
    'events',
    'assert',
    'buffer',
    'process',
    'node:crypto',
    'node:fs',
    'node:path',
    'node:stream',
    'node:util',
    'node:os',
    'node:events',
    'node:assert',
    'node:buffer',
    'node:process'
  ],
}