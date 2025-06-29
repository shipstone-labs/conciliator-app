import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

async function build() {
  console.log('📦 Building web-storage-wrapper...')

  try {
    // Step 1: Compile TypeScript
    console.log('🔧 Compiling TypeScript...')
    execSync('pnpm tsc', { stdio: 'inherit' })
    console.log('✅ TypeScript compilation successful')

    // Step 2: Bundle for Node.js
    console.log('📦 Bundling for Node.js...')
    execSync('pnpm rollup -c rollup.config.mjs', {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    })

    // Step 3: Bundle for Browser
    console.log('📦 Bundling for Browser...')
    execSync('pnpm rollup -c rollup.config.browser.mjs', {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    })

    // Apply fixes to both bundles
    const files = [resolve('./dist/index.js'), resolve('./dist/browser.js')]
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      writeFileSync(
        file,
        content
          .replace(
            "const buffer = await crypto$1.web.subtle.digest('SHA-512', message.buffer);",
            "const buffer = await crypto$1.web.subtle.digest('SHA-512', message);"
          )
          .replace(
            /https:\/\/up\.storacha\.network/g,
            'https://up.web3.storage'
          )
          .replace(/did:web:up\.storacha\.network/g, 'did:web:web3.storage')
      )
    }

    console.log('✅ web-storage-wrapper built successfully!')
  } catch (error) {
    console.error('❌ Build failed:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

build()
