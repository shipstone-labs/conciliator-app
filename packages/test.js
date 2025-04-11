async function test() {
  try {
    console.log('Importing Lit wrapper...')
    const litFns = await import('./lit-wrapper/dist/index.js')
    console.log(
      'Lit wrapper imported successfully, functions:',
      Object.keys(litFns)
    )

    console.log('Importing Web3 Storage wrapper...')
    const w3Fns = await import('./web-storage-wrapper/dist/index.js')
    console.log(
      'Web3 Storage wrapper imported successfully, functions:',
      Object.keys(w3Fns)
    )

    console.log('Both modules imported successfully!')
  } catch (err) {
    console.error('Error importing modules:', err)
  }
}

test()
