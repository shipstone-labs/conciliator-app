#!/usr/bin/env node

/**
 * Simple script to set package references from a specified map file
 * Usage: node set-package-refs.js [original|file]
 *
 * - 'original' uses package-map.original.json (link: and workspace:* references)
 * - 'file' uses package-map.json (file: references)
 * - defaults to 'file' if not specified
 */

const fs = require('node:fs')
const path = require('node:path')

// Get command line argument
const mode = process.argv[2] || 'file'
if (!['original', 'file', 'skip-wrappers', 'empty'].includes(mode)) {
  console.error(`Invalid mode: ${mode}. Use 'original' or 'file'`)
  process.exit(1)
}

// Get the root directory of the project
const ROOT_DIR = process.env.ROOT_DIR || path.resolve(__dirname, '..')
const PACKAGE_MAP_ORIGINAL_PATH = path.join(
  ROOT_DIR,
  'dist-packages',
  'package-map.original.json'
)
const PACKAGE_MAP_FILE_PATH = path.join(
  ROOT_DIR,
  'dist-packages',
  'package-map.file.json'
)
const mapPath =
  mode === 'original' ? PACKAGE_MAP_ORIGINAL_PATH : PACKAGE_MAP_FILE_PATH
console.log(`Using map file: ${mapPath} (${mode} mode)`)

// Read map file
let packageMap
try {
  if (fs.existsSync(mapPath)) {
    originalMap = JSON.parse(
      fs.readFileSync(PACKAGE_MAP_ORIGINAL_PATH, 'utf-8')
    )
    packageMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'))
    if (mode === 'skip-wrappers') {
      packageMap = Object.fromEntries(
        Object.entries(packageMap).filter(
          ([key]) => !originalMap[key]?.startsWith('workspace:')
        )
      )
      console.log('Using skip-wrappers to replace ', packageMap)
    }
    packageMap = Object.assign(originalMap, packageMap)
    console.log(
      `Loaded map file with ${Object.keys(packageMap).length} entries`,
      packageMap
    )
  } else {
    console.error(`Map file ${mapPath} does not exist`)
    process.exit(1)
  }
} catch (err) {
  console.error(`Error reading map file ${mapPath}:`, err.message)
  process.exit(1)
}

function adjustItems(obj) {
  let changed = false
  Object.keys(obj).forEach((key) => {
    const value = packageMap[key]
    if (value) {
      if (obj[key] !== value) {
        obj[key] = value
        changed = true
      }
    }
  })
  return changed
}

function adjustPackageJson(location, includeDeps) {
  // Read package.json
  let changed = false
  console.log(`Reading ${location}...`)
  try {
    const packageJson = JSON.parse(fs.readFileSync(location, 'utf8'))
    if (includeDeps && packageJson.dependencies) {
      if (adjustItems(packageJson.dependencies)) {
        changed = true
      }
    }
    if (includeDeps && packageJson.devDependencies) {
      if (adjustItems(packageJson.devDependencies)) {
        changed = true
      }
    }
    if (includeDeps && packageJson.peerDependencies) {
      if (adjustItems(packageJson.peerDependencies)) {
        changed = true
      }
    }
    if (isEmpty) {
      packageJson.overridesEmpty =
        packageJson.overrides || packageJson.overridesEmpty
      // biome-ignore lint/performance/noDelete: <explanation>
      delete packageJson.overrides
    } else {
      if (packageJson.overrides || packageJson.overridesEmpty) {
        packageJson.overrides =
          packageJson.overrides || packageJson.overridesEmpty
        // biome-ignore lint/performance/noDelete: <explanation>
        delete packageJson.overridesEmpty
        if (adjustItems(packageJson.overrides)) {
          changed = true
        }
      }
    }
    if (isEmpty) {
      if (packageJson.pnpm?.overrides || packageJson.pnpm?.overridesEmpty) {
        packageJson.pnpm.overridesEmpty =
          packageJson.pnpm?.overrides || packageJson.pnpm?.overridesEmpty
        // biome-ignore lint/performance/noDelete: <explanation>
        delete packageJson.pnpm.overrides
      }
    } else {
      if (packageJson.pnpm?.overrides || packageJson.pnpm?.overridesEmpty) {
        packageJson.pnpm.overrides =
          packageJson.pnpm?.overrides || packageJson.pnpm?.overridesEmpty
        // biome-ignore lint/performance/noDelete: <explanation>
        delete packageJson.pnpm.overridesEmpty
        if (adjustItems(packageJson.pnpm.overrides)) {
          changed = true
        }
      }
    }
    if (changed) {
      try {
        fs.writeFileSync(location, JSON.stringify(packageJson, null, 2))
        console.log(`Updated ${location}`)
        console.log('Done! Run "pnpm install" to apply the changes.')
      } catch (err) {
        console.error(`Error writing ${location}:`, err.message)
        process.exit(1)
      }
    } else {
      console.log('No changes needed.')
    }
  } catch (err) {
    console.error(`Error reading ${location}:`, err.message)
    process.exit(1)
  }
}

// Define which packages go in dependencies vs. overrides
// const dependencyPackages = [
//   'lilypad-wrapper',
//   'lit-wrapper',
//   'web-storage-wrapper',
// ]

adjustPackageJson(path.join(ROOT_DIR, 'package.json'), false)
// for (const item of dependencyPackages) {
//   adjustPackageJson(
//     path.join(ROOT_DIR, 'packages', item, 'package.json'),
//     '../../'
//   )
// }
