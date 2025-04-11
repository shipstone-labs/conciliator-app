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

    // Step 2: Bundle with Rollup using the config file
    console.log('📦 Bundling with Rollup...')
    // Run rollup with the config file in production mode
    execSync('pnpm rollup -c rollup.config.mjs', {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    })

    const file = resolve('./dist/index.js')
    const content = readFileSync(file, 'utf-8')
    writeFileSync(
      file,
      content.replace(
        "const buffer = await crypto$1.web.subtle.digest('SHA-512', message.buffer);",
        "const buffer = await crypto$1.web.subtle.digest('SHA-512', message);"
      )
    )

    console.log('✅ web-storage-wrapper built successfully!')
  } catch (error) {
    console.error('❌ Build failed:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

build()
