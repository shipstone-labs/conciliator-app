/**
 * Claude MCP Demo - Demonstrates how to use Claude Code SDK with MCP for testing
 *
 * This script shows how to:
 * 1. Generate test scripts using Claude Code
 * 2. Execute the generated scripts
 * 3. Analyze and report the results
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const outputDir = path.join(__dirname, 'claude-generated-tests')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

/**
 * Asks Claude to generate a test script based on a natural language prompt
 * @param {string} prompt - The natural language prompt describing the test
 * @returns {string} - The generated code
 */
function generateTestWithClaude(prompt) {
  console.log('🧠 Asking Claude to generate a test script...')
  console.log(`Prompt: ${prompt}`)

  try {
    // Execute Claude CLI command
    // Note: Assumes 'claude' CLI tool is installed and configured
    const response = execSync(`claude -p "${prompt}"`, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large responses
    })

    // Extract code block from Claude's response
    const codeBlock = extractCodeFromResponse(response)

    if (!codeBlock) {
      console.error("❌ Could not extract code from Claude's response")
      return null
    }

    // Save the generated code to a file
    const filename = `generated-test-${Date.now()}.js`
    const filePath = path.join(outputDir, filename)
    fs.writeFileSync(filePath, codeBlock)

    console.log(`✅ Generated test script saved to: ${filePath}`)
    return { code: codeBlock, filePath }
  } catch (error) {
    console.error('❌ Error generating test with Claude:', error.message)
    return null
  }
}

/**
 * Extracts code blocks from Claude's response text
 * @param {string} response - The full response from Claude
 * @returns {string} - The extracted code
 */
function extractCodeFromResponse(response) {
  // Try to extract code blocks with ```javascript or ```js markers
  const jsCodeBlockRegex = /```(?:javascript|js)([\s\S]*?)```/g
  const matches = [...response.matchAll(jsCodeBlockRegex)]

  if (matches.length > 0) {
    // Return the first code block found
    return matches[0][1].trim()
  }

  // Try to extract generic code blocks if no JS blocks found
  const genericCodeBlockRegex = /```([\s\S]*?)```/g
  const genericMatches = [...response.matchAll(genericCodeBlockRegex)]

  if (genericMatches.length > 0) {
    return genericMatches[0][1].trim()
  }

  console.warn("⚠️ No code blocks found in Claude's response")
  return null
}

/**
 * Executes a generated test script
 * @param {string} testFilePath - Path to the test script
 * @returns {object} - Test results
 */
function executeTest(testFilePath) {
  console.log(`🚀 Executing test script: ${testFilePath}`)

  try {
    const result = execSync(`node "${testFilePath}"`, {
      encoding: 'utf8',
      stdio: 'pipe',
    })

    console.log('✅ Test execution completed successfully')
    return {
      success: true,
      output: result,
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error.message)
    return {
      success: false,
      error: error.message,
      output: error.stdout,
    }
  }
}

/**
 * Asks Claude to analyze test results
 * @param {object} testResult - Results from test execution
 * @param {string} originalCode - The generated test code
 * @returns {string} - Claude's analysis
 */
function analyzeTestResults(testResult, originalCode) {
  console.log('🔍 Asking Claude to analyze test results...')

  const analysisPrompt = `
I executed the following test script:

\`\`\`javascript
${originalCode}
\`\`\`

The test ${testResult.success ? 'succeeded' : 'failed'} with the following output:

\`\`\`
${testResult.output || testResult.error || 'No output'}
\`\`\`

Please analyze these results and provide:
1. A summary of what the test did
2. Whether it successfully tested all aspects of the assessment form
3. Any issues or improvements needed in the test script
4. Recommendations for making the tests more robust
`

  try {
    const analysis = execSync(`claude -p "${analysisPrompt}"`, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10,
    })

    console.log('✅ Analysis completed')
    return analysis
  } catch (error) {
    console.error('❌ Error analyzing test results:', error.message)
    return 'Could not analyze test results due to an error.'
  }
}

/**
 * Main function to demonstrate the Claude MCP testing workflow
 */
async function main() {
  console.log('🔧 Starting Claude MCP Testing Demo')

  // Step 1: Generate a test script using Claude
  const testPrompt = `
Write a Playwright script that tests the subscription assessment form at 
https://safeidea.net/subscription/assessment. The script should:

1. Navigate to the assessment page
2. For each question, select the third option (or the middle option if less than 5 options)
3. Take screenshots before and after each selection
4. Click the Next button after each selection
5. Verify we reach the results page
6. Take a screenshot of the results page
7. Log the recommended plan if possible
8. Include proper error handling throughout

Use the following information about the page structure:
- Each question has a data-testid attribute like: data-testid="question-type", data-testid="question-sharing", etc.
- Options have data-testid attributes like: data-testid="option-business-model", data-testid="option-investor-sharing"
- The Next button has: data-testid="next-question-button"
- The results container has: data-testid="assessment-results"

Make the script robust enough to handle any potential issues.
`

  const generatedTest = generateTestWithClaude(testPrompt)

  if (!generatedTest) {
    console.error('❌ Failed to generate test script')
    return
  }

  // Step 2: Execute the generated test
  const testResult = executeTest(generatedTest.filePath)

  // Step 3: Analyze the results
  const analysis = analyzeTestResults(testResult, generatedTest.code)

  // Step 4: Save the analysis
  const analysisPath = path.join(outputDir, 'test-analysis.md')
  fs.writeFileSync(analysisPath, analysis)

  console.log(`
📋 Claude MCP Testing Demo Complete
==================================
Test script: ${generatedTest.filePath}
Test result: ${testResult.success ? 'SUCCESS ✅' : 'FAILURE ❌'}
Analysis: ${analysisPath}
==================================
  `)
}

// Run the demo if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error in Claude MCP Testing Demo:', error)
    process.exit(1)
  })
}

module.exports = {
  generateTestWithClaude,
  executeTest,
  analyzeTestResults,
}
