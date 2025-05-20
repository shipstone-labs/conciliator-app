/**
 * Script using Claude SDK to find the first word on CNN.com
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔍 Using Claude SDK to find the first word on CNN.com')

// Step 1: Create a prompt for Claude
const prompt = `
Write a Playwright script that:
1. Navigates to CNN.com
2. Finds the first visible text content (excluding menus, navigation, etc.)
3. Extracts and returns the first word from that text
4. Captures a screenshot of the area where the word was found

Return only the JavaScript code with no explanations. The script should:
- Handle errors gracefully
- Log the first word to the console
- Save the screenshot as "cnn-first-word.png"
`

// Step 2: Use Claude to generate the code
console.log('Asking Claude to generate the script...')
try {
  const response = execSync(`claude -p "${prompt}" --output-format text`, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })

  // Extract code from the response
  const codeMatch = response.match(/```(?:javascript|js)?([\s\S]*?)```/)
  const claudeCode = codeMatch ? codeMatch[1].trim() : response

  console.log('Generated code:')
  console.log('----------------')
  console.log(claudeCode.substring(0, 500) + '...') // Show first 500 chars
  console.log('----------------')

  // Save the code to a file
  const scriptFile = path.join(__dirname, 'cnn-first-word-finder.js')
  fs.writeFileSync(scriptFile, claudeCode)
  console.log(`Script saved to: ${scriptFile}`)

  // Run the script
  console.log('\nExecuting the generated script...')
  execSync(`node ${scriptFile}`, { stdio: 'inherit' })

  // Check for screenshot
  const screenshotPath = path.join(__dirname, 'cnn-first-word.png')
  if (fs.existsSync(screenshotPath)) {
    console.log(`\n✅ Screenshot saved to: ${screenshotPath}`)

    // Get the file size
    const stats = fs.statSync(screenshotPath)
    console.log(`Screenshot size: ${(stats.size / 1024).toFixed(2)} KB`)
  } else {
    console.log('\n❌ Screenshot was not created')
  }
} catch (error) {
  console.error('Error:', error.message)

  if (error.stdout) {
    console.log('Output from command:')
    console.log(error.stdout.toString())
  }
}
