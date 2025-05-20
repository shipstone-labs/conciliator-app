# SafeIdea Subscription Assessment Testing with Claude MCP

This directory contains test scripts for automating the testing of the SafeIdea subscription assessment flow using Playwright and Claude Code SDK with Multi-Context Protocol (MCP).

## Quick Start

Run the pre-built assessment test script:

```bash
node correct-testid-test.js
```

To use Claude to generate and run tests dynamically:

```bash
node claude-mcp-demo.js
```

## Contents

- **claude-mcp-sdk-testing.md** - Detailed documentation on the testing approach
- **claude-mcp-demo.js** - Demonstrates using Claude Code SDK to generate and run tests
- **correct-testid-test.js** - Main assessment test script using data-testid selectors
- **text-based-assessment-test.js** - Alternative test using text-based selectors
- **assessment-screenshots/** - Directory where test screenshots are saved

## Testing Approach

These tests automate the user journey through the subscription assessment flow:

1. Navigate to the assessment page
2. For each of the 5 questions (type, sharing, concern, budget, timeline):
   - Select a specific option (typically the 3rd option)
   - Capture screenshots before and after selection
   - Click the Next button
3. Verify the results page loads correctly
4. Capture a screenshot of the final recommendation

## Claude MCP Integration

The Claude integration allows:

1. **Dynamic Test Generation** - Create test scripts using natural language prompts
2. **Test Execution** - Run the generated tests against the application
3. **Result Analysis** - Have Claude analyze the test results and suggest improvements

See `claude-mcp-demo.js` for an example of this workflow in action.

## Requirements

- Node.js v16+ (v22+ recommended)
- Playwright (`npm install playwright`)
- Claude Code SDK (for dynamic test generation)

## Additional Documentation

For more detailed information on the testing approach, implementation details, and best practices, see [claude-mcp-sdk-testing.md](./claude-mcp-sdk-testing.md) in this directory.