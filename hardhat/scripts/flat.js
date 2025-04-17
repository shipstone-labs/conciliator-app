import fs from 'node:fs'

function resolveSolidityImports() {
  const sourceFiles = {}

  const output = fs.readdirSync('./flattened')
  console.log(output)
  for (const file of output) {
    if (file === '.' || file === '..') continue
    sourceFiles[file] = {
      content: fs.readFileSync(`./flattened/${file}`, 'utf8'),
    }
  }
  return { sourceFiles }
}

// Example Usage
;(async () => {
  try {
    const result = resolveSolidityImports()

    const body = JSON.stringify(
      {
        address: '0x262B5cb19B39a813C3E4366BC9d92573128139ba',
        language: 'Solidity',
        compiler: 'v0.8.20+commit.a1b79de6',
        optimize: true,
        optimizeRuns: 1000,
        optimizerDetails: '',
        license: 'MIT',
        evmVersion: 'default',
        viaIR: false,
        libraries: '',
        metadata: '',
        ...result,
      },
      null,
      2
    )
    console.log(body)
    const results = await fetch(
      'https://calibration.filfox.info//api/v1/tools/verifyContract',
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
