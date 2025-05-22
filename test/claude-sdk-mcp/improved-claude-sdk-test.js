/**
 * Claude Code SDK with Playwright - SafeIdea Navigation Test
 *
 * This script takes a user prompt and uses Claude Code SDK to generate and execute
 * a Playwright test based on the prompt, with improvements based on actual website structure.
 */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { exec } = require('node:child_process')

// Create screenshots directory if it doesn't exist
const screenshotDir = path.join(__dirname, 'screenshots')
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true })
}

// The user prompt is directly passed to Claude SDK
const userPrompt =
  'Go to the website and navigate to the "learn how it works" button. on that page click on "take the assessment" button. take screenshots before and after each action.'

// Add context to make Claude generate better code based on what we learned
const fullPrompt = `Generate a Playwright script for this test: "${userPrompt}"

The script should:
- Work with the safeidea.net website
- Save screenshots to a 'screenshots' directory
- Add error handling
- Use headless: false to see the browser actions
- Add console logs to track progress
- Close the browser at the end

Important details about the site structure:
- The "Learn How It Works" button is a link with exact text "Learn How It Works"
- On the second page, the "Take the Assessment" button is a BUTTON element (not a link)
- Use page.getByRole('button', { name: 'Take the Assessment' }) to find the assessment button
- Add proper waiting for page navigation (waitForLoadState('networkidle'))
- Add timeouts to ensure the page is fully loaded (page.waitForTimeout(2000))

Return only the JavaScript code without explanation.`

console.log('Sending prompt to Claude Code SDK:', userPrompt)

// Execute Claude Code SDK command to generate the test script
try {
  // Execute the Claude CLI command and get the response
  const claudeResponse = execSync(
    `claude -p "${fullPrompt.replace(/"/g, '\\"')}" --output-format text`,
    { encoding: 'utf8', maxBuffer: 1024 * 1024 }
  )

  // Extract code from the Claude response
  const codeMatch = claudeResponse.match(/```(?:javascript|js)?([\s\S]*?)```/)
  const generatedCode = codeMatch ? codeMatch[1].trim() : claudeResponse.trim()

  // Save the code to a file
  const tempScriptPath = path.join(
    __dirname,
    'claude-generated-safeidea-test.js'
  )
  fs.writeFileSync(tempScriptPath, generatedCode)
  console.log(`Generated script saved to: ${tempScriptPath}`)

  // Execute the generated Playwright script
  console.log('\nRunning the generated test script...')
  exec(`node ${tempScriptPath}`, (error, stdout, stderr) => {
    console.log('-------- Test Execution Output --------')
    if (stdout) console.log(stdout)
    if (stderr) console.error('Stderr:', stderr)

    if (error) {
      console.error('Error executing script:', error.message)
    } else {
      console.log('Script executed successfully')

      // List the generated screenshots
      console.log('\nGenerated screenshots:')
      const screenshots = fs
        .readdirSync(screenshotDir)
        .filter((file) => file.includes('safeidea') && file.endsWith('.png'))

      screenshots.forEach((screenshot) => {
        console.log(`- ${path.join(screenshotDir, screenshot)}`)
      })
    }
  })
} catch (error) {
  console.error('Error in script generation or execution:', error.message)
}
