/**
 * Demonstration of using Claude Code SDK to control website testing
 */
const { execSync } = require('node:child_process')
const fs = require('node:fs')

// Directory for screenshots
const SCREENSHOT_DIR = './claude-screenshots'
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR)
}

// Function to execute Claude CLI command and return the result
function askClaude(prompt) {
  console.log(`Asking Claude: ${prompt.substring(0, 100)}...`)
  try {
    const result = execSync(
      `claude -p "${prompt.replace(/"/g, '\\"')}" --output-format text`
    ).toString()
    return result.trim()
  } catch (error) {
    console.error('Error asking Claude:', error.message)
    return null
  }
}

// Function to extract code from Claude's response
function extractCodeFromResponse(response) {
  // Look for code between ```javascript and ``` markers
  const match = response.match(/```javascript\s*([\s\S]*?)\s*```/)
  if (match?.[1]) {
    return match[1].trim()
  }

  // If no javascript markers, try generic code blocks
  const genericMatch = response.match(/```\s*([\s\S]*?)\s*```/)
  if (genericMatch?.[1]) {
    return genericMatch[1].trim()
  }

  // If no code blocks found, return the entire response
  return response
}

// Main function
async function main() {
  // Step 1: Ask Claude to write a script to test safeidea.net
  const scriptPrompt =
    'Write a Playwright script that does the following:\n' +
    '1. Navigates to https://safeidea.net\n' +
    '2. Takes a screenshot and saves it to "./claude-screenshots/homepage.png"\n' +
    '3. Gets the page title\n' +
    '4. Returns an object with the title and any text found in the main heading\n' +
    'Return ONLY executable JavaScript code, no explanation.'

  const response = askClaude(scriptPrompt)
  if (!response) {
    console.error('Failed to get a response from Claude')
    return
  }

  // Extract code from Claude's response
  const code = extractCodeFromResponse(response)

  // Save the code to a temporary file
  const tempScriptPath = './temp-website-test.js'
  fs.writeFileSync(tempScriptPath, code)
  console.log(`Generated script saved to: ${tempScriptPath}`)

  // Execute the script
  console.log('Executing the generated script...')
  try {
    require(tempScriptPath)
    console.log('Script execution completed')

    // Step 2: Ask Claude to analyze the screenshot
    if (fs.existsSync(`${SCREENSHOT_DIR}/homepage.png`)) {
      console.log(
        'Screenshot was successfully captured. Asking Claude to analyze it...'
      )

      // This would typically use something like uploading the image for Claude to see,
      // but we'll just ask Claude to analyze the results
      const analysisPrompt = `I've captured a screenshot of the SafeIdea website. 
        Based on what you know about SafeIdea, what kind of website is it?
        What is the primary purpose of the site? Describe it briefly.`

      const analysis = askClaude(analysisPrompt)
      console.log("\nClaude's Analysis of SafeIdea:\n")
      console.log(analysis)
    }
  } catch (error) {
    console.error('Error executing the script:', error)
  } finally {
    // Clean up the temporary file
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath)
      console.log(`Removed temporary script: ${tempScriptPath}`)
    }
  }
}

// Run the main function
main().catch(console.error)
