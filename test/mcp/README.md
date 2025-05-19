# MCP Testing for Subscription Assessment Form

This directory contains Model Context Protocol (MCP) based tests for the SafeIdea subscription assessment form. These tests use Playwright for browser automation and are designed to be run by Claude Code against deployment preview URLs.

## Overview

The testing system consists of two main components:

1. **MCP Server Script (`mcp-assessment-test-server.js`)**: A Node.js server that implements the MCP protocol and provides tools for Playwright automation.

2. **Test Script (`assessment-test.js`)**: A script designed to be executed by Claude Code, which orchestrates the test and analyzes results.

## Prerequisites

Before running the tests, ensure you have the following:

- Node.js v18 or newer
- The following NPM packages installed:
  - `@anthropic-ai/mcp-sdk`
  - `playwright`

## Installation

Install the required dependencies:

```bash
# From the project root
npm install --save-dev @anthropic-ai/mcp-sdk playwright
# Or if using pnpm
pnpm add -D @anthropic-ai/mcp-sdk playwright
```

Then install Playwright browsers:

```bash
npx playwright install chromium
```

## Running the Tests

### Step 1: Deploy Your Code Changes

First, commit and push your changes to GitHub to generate a deployment preview URL:

```bash
git add .
git commit -m "Add assessment form tests"
git push origin feature/assessment-mcp-testing
```

After the build completes, you'll have a deployment preview URL (e.g., `https://pr-123--conciliator-55rclsk2qa-uc.a.run.app`).

### Step 2: Start the MCP Server

Start the MCP server on your local machine:

```bash
# From the project root
node test/mcp/mcp-assessment-test-server.js
```

You should see output indicating the server is running on port 3333:
```
MCP Assessment Test Server running on port 3333
Ready to accept requests from Claude Code
```

### Step 3: Run the Test with Claude Code

1. Connect Claude Code to your local MCP server:
   - Launch Claude Code
   - Configure it to connect to `http://localhost:3333` for MCP services

2. Execute the test script by asking Claude to run it:
   - Provide Claude with the path to the test script: `test/mcp/assessment-test.js`
   - Ask Claude to run the `testAssessmentForm()` function with your deployment URL

Example command for Claude:
```
Please run the testAssessmentForm() function from the test/mcp/assessment-test.js file with the following configuration:
{
  baseUrl: 'https://pr-123--conciliator-55rclsk2qa-uc.a.run.app',
  headless: false,
  answers: [2, 3, 1, 2, 1]
}
```

### Step 4: Analyze the Results

The test will:
1. Open a browser and navigate to the assessment page on the deployment URL
2. Complete the form by answering all 5 questions
3. Verify storage of answers in localStorage
4. Attempt to navigate to the plans page
5. Generate a detailed report of the test results

## Test Customization

You can customize the test by providing different options to the `testAssessmentForm()` function:

```javascript
{
  baseUrl: 'https://pr-123--conciliator-55rclsk2qa-uc.a.run.app', // Deployment preview URL
  headless: true, // Whether to run the browser in headless mode (set to false to see the browser)
  answers: [1, 3, 2, 2, 1] // Answers for each of the 5 questions (indexes start at 1)
}
```

## Understanding the Assessment Questions

The assessment consists of 5 questions with multiple-choice answers:

1. **Type** (What type of intellectual property do you have?)
2. **Sharing** (How do you want to share your intellectual property?)
3. **Concern** (What is your main concern with your intellectual property?)
4. **Budget** (What is your budget for protecting your intellectual property?)
5. **Timeline** (When do you need to protect your intellectual property?)

Each question has multiple options (typically 5), and you can specify which option to select by its index (1-based) in the `answers` array.

## Generating HTML Reports

The test script includes a function to generate HTML reports from test results. To generate a report, ask Claude to:

```
Please generate an HTML report from the test results using the generateHtmlReport() function and save it to a file.
```

## Testing on Different Environments

You can test against different deployment environments by changing the `baseUrl` parameter:

- PR Preview: `https://pr-{number}--conciliator-55rclsk2qa-uc.a.run.app`
- Staging: `https://staging--conciliator-55rclsk2qa-uc.a.run.app` (if available)
- Production: `https://safeidea.net`

## Troubleshooting

### Common Issues

1. **Connection Refused Error**:
   - Make sure the MCP server is running on port 3333
   - Check for any firewall or network restrictions

2. **Element Not Found Errors**:
   - The test may be failing because element selectors have changed
   - Inspect the application and update the data-testid attributes in the MCP server script

3. **Timeout Errors**:
   - Increase the timeout values in the MCP server script
   - Check if the deployment is accessible

### Debugging Tips

1. Set `headless: false` to see the browser during test execution
2. Check the screenshots captured at each step in the test results
3. Examine the detailed error messages in the test results
4. Use the `getPageState()` function to get the current state of the page

## Future Enhancements

Potential improvements for this testing system:

1. Add support for testing different subscription flow paths
2. Implement more detailed validation of form behavior
3. Extend tests to cover edge cases (empty selections, going back, etc.)
4. Add CI/CD integration for automated testing in pull requests