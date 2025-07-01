const { build, context } = require('esbuild')
const path = require('node:path')
const fs = require('node:fs')

// Check if watch mode is enabled
const isWatchMode =
  process.argv.includes('--watch') || process.argv.includes('-w')

// Ensure output directories exist
const publicWorkersDir = path.resolve(__dirname, '../public/workers')
if (!fs.existsSync(publicWorkersDir)) {
  fs.mkdirSync(publicWorkersDir, { recursive: true })
}

// Common esbuild configuration
const commonConfig = {
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  loader: {
    '.ts': 'ts',
    '.js': 'js',
  },
  // alias: {
  //   'web-storage-wrapper': path.resolve(
  //     __dirname,
  //     '../node_modules/web-storage-wrapper/dist/browser.js'
  //   ),
  //   'lit-wrapper': path.resolve(
  //     __dirname,
  //     '../node_modules/lit-wrapper/dist/browser.js'
  //   ),
  // },
  external: [
    // Mark Node.js built-ins as external to avoid bundling them
    'fs',
    'path',
    'stream',
    'buffer',
    'util',
    'os',
    'zlib',
    'crypto',
    'http',
    'https',
    'net',
    'tls',
    'url',
    'querystring',
    'events',
  ],
}

// Build both workers
console.log(`Building workers${isWatchMode ? ' in watch mode' : ''}...`)

const buildWorkers = async () => {
  try {
    if (isWatchMode) {
      // Watch mode using contexts
      const uploadWorkerCtx = await context({
        ...commonConfig,
        entryPoints: ['./app/workers/upload-worker.ts'],
        outfile: './public/workers/upload-worker.js',
      })

      const downloadWorkerCtx = await context({
        ...commonConfig,
        entryPoints: ['./app/workers/download-service-worker.ts'],
        outfile: './public/download-service-worker.js',
      })

      // Start watching
      await uploadWorkerCtx.watch()
      await downloadWorkerCtx.watch()

      console.log('✓ Workers built successfully')
      console.log('👀 Watching for changes...\n')

      // Keep process alive
      process.on('SIGINT', async () => {
        console.log('\nStopping watch mode...')
        await uploadWorkerCtx.dispose()
        await downloadWorkerCtx.dispose()
        process.exit(0)
      })
    } else {
      // One-time build
      // Build upload worker
      console.log('Building upload worker...')
      await build({
        ...commonConfig,
        entryPoints: ['./app/workers/upload-worker.ts'],
        outfile: './public/workers/upload-worker.js',
      })
      console.log('✓ Upload worker built successfully')

      // Build download service worker
      console.log('\nBuilding download service worker...')
      await build({
        ...commonConfig,
        entryPoints: ['./app/workers/download-service-worker.ts'],
        outfile: './public/download-service-worker.js',
      })
      console.log('✓ Download service worker built successfully')

      console.log('\n✅ All workers compiled successfully!')
    }
  } catch (error) {
    console.error('\n❌ Worker build failed:', error)
    process.exit(1)
  }
}

buildWorkers()
