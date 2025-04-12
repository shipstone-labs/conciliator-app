import fs from 'node:fs'
import path, { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

async function resolveSolidityImports(entryFilePath) {
  const sourceFiles = {}

  async function resolveFile(
    filePath,
    basePath = '.',
    originalImportPath = null
  ) {
    let fullPath

    // Check if the file is in node_modules or a relative path
    try {
      if (filePath.startsWith('.')) {
        // Relative path
        fullPath = path.resolve(basePath, filePath)
      } else {
        // Use require.resolve for node_modules imports
        const resolvedURL = import.meta.resolve(filePath, basePath)
        // Convert the resolved URL to a file path
        fullPath = fileURLToPath(resolvedURL)
      }
    } catch (err) {
      console.error(err)
      throw new Error(`Failed to resolve import: ${filePath} from ${basePath}`)
    }

    // Use the original import path for node_modules files, or the resolved path for relative imports
    const key = originalImportPath || filePath

    if (sourceFiles[key]) {
      // Skip if already resolved
      return
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`)
    }

    const content = fs.readFileSync(fullPath, 'utf8')
    sourceFiles[key] = {
      content,
    }

    // Extract import statements
    const importRegex = /import.*?["'](.+?)["'];/g
    while (true) {
      const match = importRegex.exec(content)
      if (match === null) {
        break
      }
      let importedPath = match[1]
      if (importedPath.startsWith('.') && fullPath.includes('node_modules')) {
        importedPath = resolve(dirname(fullPath), importedPath).replace(
          /.*node_modules\//,
          ''
        )
      }
      // If it's a node_modules import, preserve the original import path
      const isNodeModule = !importedPath.startsWith('.')
      const preservedImportPath = isNodeModule ? importedPath : null

      // Recursively resolve the imported file
      await resolveFile(
        importedPath,
        path.dirname(fullPath),
        preservedImportPath
      )
    }
  }

  // Start resolving from the entry file
  await resolveFile(entryFilePath)

  return { sourceFiles }
}

// Example Usage
;(async () => {
  try {
    const entryFilePath = './contracts/IPDocV7.sol' // Replace with your entry Solidity file
    // const result = await resolveSolidityImports(entryFilePath);

    const data = JSON.parse(
      fs.readFileSync(
        'artifacts/build-info/96d77622737cf1f6b542c4574793ce44.json',
        'utf8'
      )
    )
    // Rename the entry file key to "MyContract.sol"
    const entryFileName = path.basename(entryFilePath);
    data.input.sources[entryFileName] = data.input.sources[entryFilePath];
    delete data.input.sources[entryFilePath];

    const body = JSON.stringify(
      {
        address: '0xB6Bf914f3E25c49A26C19A51e316b8aB1560F2fB',
        language: 'Solidity',
        compiler: 'v0.8.20+commit.a1b79de6',
        optimize: false,
        optimizeRuns: 200,
        optimizerDetails: '',
        license: 'MIT',
        evmVersion: 'paris',
        viaIR: false,
        libraries: '',
        metadata: '',
        sourceFiles: data.input.sources,
      },
      null,
      2
    )
    const results = await fetch(
      'https://calibration.filfox.info/api/v1/tools/verifyContract',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      }
    ).then((res) => res.json())
    console.log(results)
  } catch (err) {
    console.error(err.message)
  }
})()
