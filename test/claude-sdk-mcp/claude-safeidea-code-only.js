/**
 * Script that uses Claude SDK to generate code for finding the first word
 * on safeidea.net, but only displays the code without running it
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log(
  '🔍 Using Claude SDK to generate code for finding the first word on safeidea.net'
)

// Create a prompt for Claude
const prompt = `
Write a Playwright script that:
1. Navigates to https://safeidea.net
2. Finds the first visible text content on the page
3. Extracts and returns just the first word from that text
4. Takes a screenshot of the page

Return only the JavaScript code with no explanations. The script should be complete 
and runnable with Node.js. Make it short and simple.
`

// Use Claude to generate the code
console.log('Asking Claude to generate the script...')
try {
  console.log('Sending prompt to Claude...')
  const response = execSync(`claude -p "${prompt}" --output-format text`, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })

  // Extract code from the response
  const codeMatch = response.match(/```(?:javascript|js)?([\s\S]*?)```/)
  const claudeCode = codeMatch ? codeMatch[1].trim() : response

  console.log('\n===== GENERATED CODE =====')
  console.log(claudeCode)
  console.log('===== END OF CODE =====\n')

  // Save the code to a file
  const scriptFile = path.join(__dirname, 'safeidea-first-word-finder.js')
  fs.writeFileSync(scriptFile, claudeCode)
  console.log(`Script saved to: ${scriptFile}`)

  console.log('\nTo run this script, use:')
  console.log(`node ${scriptFile}`)
} catch (error) {
  console.error('Error:', error.message)
}
