# Claude SDK MCP Testing

This directory contains test scripts for interacting with SafeIdea using Claude Code SDK with MCP Puppeteer integration.

## 🚀 Quick Start - Add IP Automation

See [ADD-IP-AUTOMATION-GUIDE.md](./ADD-IP-AUTOMATION-GUIDE.md) for the complete guide to running the Add IP automation.

```bash
# 1. Start Chrome with debugging
open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"

# 2. Have Claude run the automation
# Claude will use MCP Puppeteer tools, not Node.js
```

## Important Files

### Add IP Automation
- `add-ip-automated.js` - Reference implementation for Add IP automation (for Claude to execute via MCP)
- `ADD-IP-AUTOMATION-GUIDE.md` - Complete guide with troubleshooting
- `generated/` - Directory where generated IP files are saved

### Assessment Flow Testing
- `claude-sdk-demo.js` - Demonstrates how to use the Claude Code SDK to generate Playwright test scripts dynamically
- `correct-testid-test.js` - Complete test for the assessment flow using the correct testid selectors
- `text-based-assessment-test.js` - Alternative test using text-based selectors for the assessment flow

## Running Tests

To run these tests:

```bash
# Navigate to the directory
cd test/claude-sdk-mcp

# Run a specific test
node correct-testid-test.js
```

## Key Findings

1. **Testid Approaches**: We found that using precise `data-testid` attributes targeted at specific UI elements provides the most reliable automation. The current implementation uses option IDs like `data-testid="option-business-model"`.

2. **Alternative Approaches**:
   - Text-based selectors - Using `text="Business Model or Strategy"` works but is more fragile to text changes
   - Aria-label selectors - Adding meaningful `aria-label` attributes serves both accessibility and testing needs

3. **Test Reliability**: When using testids, it's important to map question identifiers to option identifiers, as demonstrated in the `correct-testid-test.js` code.

## Next Steps

1. Consider improving testability by:
   - Adding aria-labels for better accessibility and alternative test selectors
   - Adding data-option-index attributes for selecting by position (1st, 2nd, 3rd option)
   - Creating a standardized approach for consistent test selectors across the application