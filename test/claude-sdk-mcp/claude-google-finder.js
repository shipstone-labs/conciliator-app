/**
 * Script that uses Claude SDK to generate and run a Playwright script
 * to find the first word with "s" on Google.com
 */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

console.log('🤖 Using Claude SDK to find first word with "s" on Google.com')

// Step 1: Create a prompt for Claude to generate a Playwright script
const prompt = `Write a complete, runnable Playwright script that:
1. Navigates to Google.com
2. Finds the first word containing the letter "s" in the visible text
3. Prints that word and the element it was found in
4. Returns an object with the word and its context

IMPORTANT: Only write code, no explanations. The script should be complete
and self-contained so I can run it directly with Node.js.`

// Step 2: Ask Claude to generate the code
console.log('Asking Claude to generate the Playwright script...')
let claudeResponse
try {
  claudeResponse = execSync(`claude -p "${prompt.replace(/"/g, '\\"')}"`, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 5, // 5MB buffer
  })
  console.log('✅ Received response from Claude')
} catch (error) {
  console.error('❌ Error getting response from Claude:', error.message)
  process.exit(1)
}

// Step 3: Extract the code from Claude's response
const extractCode = (response) => {
  const codeBlockRegex = /```(?:javascript|js)?([\s\S]*?)```/g
  const matches = [...response.matchAll(codeBlockRegex)]
  if (matches.length > 0) {
    return matches[0][1].trim()
  }
  // If no code blocks found, return everything as a fallback
  return response
}

const generatedCode = extractCode(claudeResponse)
console.log("📝 Extracted code from Claude's response")

// Step 4: Save the code to a temporary file
const tempFilePath = path.join(__dirname, 'temp-google-finder.js')
fs.writeFileSync(tempFilePath, generatedCode)
console.log(`💾 Saved generated script to ${tempFilePath}`)

// Step 5: Run the generated code
console.log('🚀 Running the generated script...')
try {
  execSync(`node ${tempFilePath}`, {
    encoding: 'utf8',
    stdio: 'inherit', // Show output in real-time
  })
  console.log('✅ Script executed successfully')
} catch (error) {
  console.error('❌ Error executing the script:', error.message)
} finally {
  // Clean up temp file
  // fs.unlinkSync(tempFilePath) // Uncomment to delete the temp file
  console.log(`Note: Generated script saved at ${tempFilePath}`)
}
