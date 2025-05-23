# Testing the Subscription Assessment Flow with Claude Code SDK and MCP

This document provides a detailed guide on how to set up and run automated tests for the SafeIdea subscription assessment flow using Claude Code SDK with the Multi-Context Protocol (MCP).

## Overview

The test scripts in this directory use Playwright to automate browser interactions with the subscription assessment form, allowing us to:

1. Navigate through all assessment questions
2. Select specific options for each question
3. Capture screenshots at each step
4. Validate the entire user flow works correctly

## Prerequisites

- Node.js v16+ (v22+ recommended)
- npm or pnpm
- Playwright
- Claude Code SDK (for dynamic test generation)

## Setup Instructions

### 1. Install Dependencies

Navigate to the test directory and install dependencies:

```bash
cd /path/to/conciliator-app/test/mcp
npm install playwright
```

For Claude Code SDK integration:

```bash
npm install @anthropic-ai/claude-code
```

### 2. Understanding the Test Files

The testing setup includes several key files:

- **correct-testid-test.js**: The main test script that uses proper data-testid selectors
- **text-based-assessment-test.js**: Alternative test using text-based selectors
- **inspect-assessment-page.js**: Utility to inspect the page structure 
- **claude-sdk-demo.js**: Demonstrates using Claude Code SDK to generate test scripts

### 3. Test Structure

The main test script (`correct-testid-test.js`) follows this structure:

1. **Configuration**: Defines question and option mappings
2. **Browser Setup**: Launches a browser instance
3. **Navigation**: Loads the assessment page
4. **Question Loop**: For each question:
   - Waits for the question to load
   - Takes a screenshot
   - Selects an option
   - Takes another screenshot
   - Clicks the Next button
5. **Results Page**: Captures the final result
6. **Cleanup**: Closes the browser and reports results

## Running the Tests

### Basic Test Execution

Run the main assessment test:

```bash
node correct-testid-test.js
```

This will:
- Launch a browser window (in non-headless mode)
- Navigate through the assessment form
- Save screenshots to the `./assessment-screenshots` directory

### Using Claude Code SDK for Dynamic Testing

The `claude-sdk-demo.js` file demonstrates how to use Claude Code to dynamically generate and run test scripts:

```bash
node claude-sdk-demo.js
```

This approach allows you to:
1. Describe test scenarios in natural language
2. Have Claude generate the appropriate test code
3. Execute the generated test code

## Test Implementation Details

### Key Components

#### 1. Question and Option Mapping

The test uses a structured mapping of questions and their options:

```javascript
const QUESTION_OPTION_MAP = {
  type: [
    'invention',
    'trade-secret',
    'business-model',
    'creative-work',
    'unsure',
  ],
  sharing: [
    'no-sharing',
    'limited-sharing',
    'investor-sharing',
    'public-licensing',
    'undecided',
  ],
  concern: ['theft', 'proof', 'nda-enforcement', 'monetization', 'visibility'],
  budget: ['minimal', 'moderate', 'premium', 'enterprise', 'undecided'],
  timeline: ['immediate', 'soon', 'planning', 'exploring', 'already-public'],
}

const QUESTION_IDS = ['type', 'sharing', 'concern', 'budget', 'timeline']
```

#### 2. Selector Strategy

The test uses data-testid attributes to locate elements:

```javascript
// Wait for the question to be visible
await page.waitForSelector(`[data-testid="question-${questionId}"]`)

// Select an option
await page.click(`[data-testid="option-${optionId}"]`)

// Click the next button
await page.click('[data-testid="next-question-button"]')
```

#### 3. Error Handling

The script includes robust error handling to manage selection failures:

```javascript
try {
  await page.click(`[data-testid="option-${optionId}"]`)
} catch (error) {
  console.warn(`Could not select option ${optionId}: ${error.message}`)
  // Try alternative options...
}
```

## MCP Integration

### What is MCP?

The Multi-Context Protocol (MCP) allows Claude Code to interact with external systems through specialized agents. For testing purposes, MCP enables Claude to:

1. Generate test scripts dynamically
2. Execute them against the application
3. Analyze the results
4. Suggest improvements

### Claude Code SDK with MCP

The `claude-sdk-demo.js` script demonstrates how to use Claude Code SDK with MCP:

```javascript
const { execSync } = require('child_process')
const fs = require('fs')

// Function to ask Claude to generate a test script
function askClaudeToGenerateTest(prompt) {
  // Use Claude Code SDK to generate code based on the prompt
  const claudeResponse = execSync(`claude -p "${prompt}"`, { encoding: 'utf8' })
  
  // Extract code from Claude's response
  const codeBlock = extractCodeFromResponse(claudeResponse)
  
  // Save the generated code to a file
  fs.writeFileSync('generated-test.js', codeBlock)
  
  return codeBlock
}

// Execute the generated test
function runGeneratedTest() {
  return execSync('node generated-test.js', { encoding: 'utf8' })
}

// Main execution
const prompt = `Write a Playwright script that tests the subscription assessment 
form at https://safeidea.net/subscription/assessment. The script should select
the third option for each question and take screenshots.`

const generatedCode = askClaudeToGenerateTest(prompt)
const testResult = runGeneratedTest()
console.log('Test result:', testResult)
```

## Best Practices

### 1. Selector Reliability

- **Use data-testid attributes**: More stable than CSS or XPath selectors
- **Map options explicitly**: Don't rely on numeric indices (e.g., "option-3")
- **Add fallback strategies**: Try alternative selection methods if primary fails

### 2. Error Handling

- **Wrap critical operations in try/catch**: Prevents test from failing completely
- **Take screenshots on failure**: Helps diagnose what went wrong
- **Log detailed information**: Console outputs help with debugging

### 3. Test Isolation

- **Create clean browser contexts**: Each test starts fresh
- **Handle local storage**: Clear or set up as needed before test
- **Properly clean up resources**: Close browsers and pages

## Troubleshooting

### Common Issues

1. **Selector Not Found**
   - Verify data-testid attributes are correctly implemented in the application
   - Use inspection script to confirm the actual element structure
   - Try text-based selectors as an alternative

2. **Navigation Issues**
   - Increase timeouts for slow-loading pages
   - Add explicit waits for network idle or specific elements
   - Check for redirects that might interfere with expected flow

3. **MCP Connection Problems**
   - Ensure Claude Code SDK is properly installed
   - Check that MCP servers are running and accessible
   - Verify authentication is correctly configured

## Advanced Usage

### Customizing the Tests

To test different selection patterns:

1. Modify the option index in the selection logic:
   ```javascript
   // Select a different option (e.g., 1st option instead of 3rd)
   const firstOptionIndex = 0
   const optionId = optionIds[firstOptionIndex]
   ```

2. To test different paths or scenarios, modify the question flow:
   ```javascript
   // Test only specific questions
   const QUESTION_IDS = ['type', 'concern', 'budget']
   ```

### Integration with CI/CD

To run tests in CI/CD environments:

1. Switch to headless mode:
   ```javascript
   const browser = await chromium.launch({
     headless: true,
   })
   ```

2. Add command-line options to control test behavior:
   ```javascript
   const headless = process.argv.includes('--headless')
   const browser = await chromium.launch({ headless })
   ```

## Conclusion

The Claude Code SDK with MCP provides a powerful way to create, execute, and maintain automated tests for the subscription assessment flow. By combining natural language instructions with programmatic test execution, we can create robust, maintainable test suites that evolve with the application.

For any questions or issues, please contact the SafeIdea development team.