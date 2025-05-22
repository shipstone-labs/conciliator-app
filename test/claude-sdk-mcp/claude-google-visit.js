/**
 * Simple script using Claude SDK to generate a script that visits Google.com
 */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

// Step 1: Create a very simple prompt for Claude
const prompt = `Write a short Playwright script that only does the following:
1. Starts a browser
2. Navigates to Google.com
3. Takes a screenshot
4. Closes the browser

No explanation needed, just the JavaScript code.`

// Step 2: Use Claude to generate the code
console.log('Asking Claude to generate a simple script to visit Google.com...')
let claudeCode
try {
  const response = execSync(`claude -p "${prompt}" --output-format text`, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })

  // Extract code from the response
  const codeMatch = response.match(/```(?:javascript|js)?([\s\S]*?)```/)
  claudeCode = codeMatch ? codeMatch[1].trim() : response

  console.log('Claude generated the following code:')
  console.log('-----------------------------------')
  console.log(claudeCode)
  console.log('-----------------------------------')

  // Save the code to a file
  const tempFile = path.join(__dirname, 'google-visit.js')
  fs.writeFileSync(tempFile, claudeCode)
  console.log(`Script saved to: ${tempFile}`)

  // Run the script
  console.log('\nRunning the generated script...')
  execSync(`node ${tempFile}`, { stdio: 'inherit' })
} catch (error) {
  console.error('Error:', error.message)
}
