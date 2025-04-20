import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

async function build() {
  console.log('📦 Building lit-wrapper...')

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
    const newContent = content.replace(
      /console.log\('JWT body: ', parsedBody\);\n/g,
      ''
    )
    if (newContent === content) {
      throw new Error('No changes made to the file')
    }
    writeFileSync(file, newContent)

    console.log('✅ web-storage-wrapper built successfully!')
  } catch (error) {
    console.error('❌ Build failed:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

build()
