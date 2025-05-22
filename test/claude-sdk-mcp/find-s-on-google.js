/**
 * Script that uses Claude SDK to find the first word with "s" on Google.com
 */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
// const path = require('node:path') // Not used in this file

// Directory for output
const OUTPUT_DIR = './claude-output'
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR)
}

// Function to ask Claude to generate code
function askClaudeForCode(prompt) {
  console.log(`Asking Claude to generate code: ${prompt.substring(0, 100)}...`)

  try {
    // Execute Claude CLI command with text output format
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
// Not used in this file but kept for potential future use
// function extractCodeFromResponse(response) {
//   // Look for code between ```javascript and ``` markers
//   const match = response.match(/```(?:javascript|js)\s*([\s\S]*?)\s*```/)
//   if (match?.[1]) {
//     return match[1].trim()
//   }
//
//   // If no javascript markers, try generic code blocks
//   const genericMatch = response.match(/```\s*([\s\S]*?)\s*```/)
//   if (genericMatch?.[1]) {
//     return genericMatch[1].trim()
//   }
//
//   // If no code blocks found, return the entire response
//   return response
// }

async function main() {
  console.log('🔍 Starting Google.com search for first word containing "s"...')

  // Create a simpler prompt for Claude
  const prompt = `Write a short description of how to find the first word containing the letter "s" on the Google.com homepage using Playwright. Don't include code, just explain the approach in 2-3 sentences.`

  // Get response from Claude
  const response = askClaudeForCode(prompt)
  if (!response) {
    console.error('Failed to get a response from Claude')
    return
  }

  console.log("Claude's response:")
  console.log('-----------------')
  console.log(response)
  console.log('-----------------')

  return response
}

// Run the main function
main().catch(console.error)
