/**
 * Simple Playwright Test Using Claude Code SDK
 *
 * This demonstrates how to use the Claude Code SDK to generate and execute
 * Playwright tests for web testing.
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

async function runSimpleTest(url = 'http://localhost:3000') {
  // Step 1: Use Claude Code SDK to generate test logic
  console.log('Using Claude SDK to generate test steps...')
  const promptTemplate = `Write a Playwright test function that will:
  1. Visit the URL: ${url}
  2. Check if the page title contains "SafeIdea"
  3. Verify the navigation menu has at least 3 items
  4. Take a screenshot of the homepage
  
  Return ONLY the JavaScript function (no explanations or markdown).`

  // Call Claude Code via CLI to generate the test function
  const claudeResponse = execSync(
    `claude -p "${promptTemplate}" --output-format text`
  ).toString()

  // Extract the generated function
  const functionMatch = claudeResponse.match(/async function .*?\n}(?:\n|$)/s)
  if (!functionMatch) {
    throw new Error('Failed to get a valid test function from Claude')
  }

  // Create a dynamic test file with the generated function
  const generatedFunction = functionMatch[0]
  const tempTestFile = path.join(__dirname, 'temp-generated-test.js')

  // Write the temporary test file
  fs.writeFileSync(
    tempTestFile,
    `// Generated test file from Claude SDK
    const { chromium } = require('playwright');
    
    ${generatedFunction}
    
    // Export the function
    module.exports = { testHomepage };`
  )

  console.log('Generated test file with the following function:')
  console.log(generatedFunction)

  // Step 2: Execute the generated test
  try {
    // Import the dynamically created test
    const { testHomepage } = require('./temp-generated-test.js')

    // Run the test
    console.log('Running generated test...')
    const results = await testHomepage()
    console.log('Test completed successfully!')

    // Save screenshot if one was generated
    if (results?.screenshot) {
      const screenshotPath = path.join(__dirname, 'homepage-screenshot.png')
      fs.writeFileSync(screenshotPath, results.screenshot, 'base64')
      console.log(`Screenshot saved to: ${screenshotPath}`)
    }

    return {
      success: true,
      results,
    }
  } catch (error) {
    console.error('Test execution failed:', error)
    return {
      success: false,
      error: error.message,
    }
  } finally {
    // Clean up the temporary file
    if (fs.existsSync(tempTestFile)) {
      fs.unlinkSync(tempTestFile)
    }
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  ;(async () => {
    try {
      // Allow URL to be specified via command line
      const url = process.argv[2] || 'http://localhost:3000'
      console.log(`Testing URL: ${url}`)

      const result = await runSimpleTest(url)
      console.log(JSON.stringify(result, null, 2))

      process.exit(result.success ? 0 : 1)
    } catch (error) {
      console.error('Error running test:', error)
      process.exit(1)
    }
  })()
}

module.exports = { runSimpleTest }
