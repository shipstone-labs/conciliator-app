# Add IP Automation Guide for Claude Code

## Quick Start for Claude

1. Start Chrome with debugging: `open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"`
2. Connect MCP Puppeteer to Chrome
3. Navigate to https://safeidea.net
4. Wait for login prompt from Claude
5. Run the automation - it's now fully automated including file upload! 🚀

## Understanding the Script Context

### ⚠️ IMPORTANT: Script Execution Context
- The `add-ip-automated.js` script is **NOT** meant to be run as `node script.js`
- It's a reference implementation for Claude to execute using MCP Puppeteer tools
- The `sdk.getPage()` calls should be mentally translated to MCP tool usage:
  - `sdk.getPage()` → Use current MCP Puppeteer connection
  - `page.click()` → `mcp__puppeteer__puppeteer_click`
  - `page.fill()` → `mcp__puppeteer__puppeteer_fill`
  - `page.screenshot()` → `mcp__puppeteer__puppeteer_screenshot`
- No npm packages need to be installed

## Before Running Add-IP Automation

### Prerequisites Checklist
1. ✅ Ensure Chrome is running with remote debugging:
   ```bash
   open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
   ```
2. ✅ Verify MCP Puppeteer is connected in Claude's interface
3. ✅ Have Claude navigate to https://safeidea.net
4. ✅ Be ready to manually log in when prompted (hamburger menu → Sign In)
5. ✅ Confirm login by checking for "Add Idea" button in navigation

### What's Automated Now
- ✅ Form filling (title, description)
- ✅ File creation and upload (no manual selection needed!)
- ✅ Clicking "Create Your Idea Page"
- ✅ Full end-to-end flow

## Navigation Flow

### Correct Navigation Pattern
- Click "Add Idea" button in navigation → Let the app navigate naturally
- **Don't** force navigation to specific URLs like `/add-ip/protect`
- The app may use different routes based on user state
- If you land on `/add-ip`, click the "Add Idea" tab to see the form

### Visual Verification Points
1. **After login**: Look for "Add Idea" button in navigation
2. **On Add Idea page**: Verify form has:
   - "Public Title" input field
   - "Public Description" textarea
   - "Upload File" button
3. **After upload**: Check for file upload success (modal closes)
4. **During creation**: Monitor status messages:
   - "Creating Your Idea Page..."
   - "Storing AI generated token image"
   - "Minting token for you"

## Common Issues and Solutions

### MCP Connection Errors
- **Symptom**: `Error calling tool puppeteer_*: undefined`
- **Solution**: Restart Chrome with debugging flag, reconnect MCP

### Empty/404 Pages
- **Symptom**: Blank page after navigation
- **Solution**: Don't navigate manually, use UI elements (tabs, buttons)

### Form Not Found
- **Symptom**: No input fields visible
- **Solution**: Check you're on the right tab (Add Idea, not My Ideas or Explore Ideas)

### Form Elements Not Standard
- **Symptom**: Can't find inputs with basic selectors
- **Solution**: Use placeholder text selectors:
  ```javascript
  input[placeholder="Enter public title for your Idea here"]
  textarea[placeholder="Enter public description of your Idea here"]
  ```

## File Upload Process

### How File Upload Works (Fully Automated!)
1. Claude creates file content directly in JavaScript
2. Uses the hidden file input: `[data-testid="file-upload-input"]`
3. Creates a File object with the content
4. Sets the file on the input and triggers change event
5. **No manual intervention needed!** 🎉

### Automated Upload Code
```javascript
// Create file content
const content = `# Your generated markdown content here...`;
const blob = new Blob([content], { type: 'text/markdown' });
const file = new File([blob], 'generated-file.md', { 
  type: 'text/markdown',
  lastModified: Date.now()
});

// Set on hidden input
const fileInput = document.querySelector('[data-testid="file-upload-input"]');
const dataTransfer = new DataTransfer();
dataTransfer.items.add(file);
fileInput.files = dataTransfer.files;

// Trigger upload
fileInput.dispatchEvent(new Event('change', { bubbles: true }));
```

### Generated File Structure
```markdown
# [Generated Title]
[3-sentence description]

## Technical Architecture
[Paragraph about system architecture]

## Core Innovation
[Paragraph about the key innovation]

## Implementation Details
[Paragraph about implementation]

## Performance Metrics
[Paragraph about performance]

## User Interface and Experience
[Paragraph about UI/UX]

## Security and Privacy
[Paragraph about security]

## Market Applications
[Paragraph about market opportunities]

## Future Development Roadmap
[Paragraph about future plans]
```

## Understanding App State

### Key State Behaviors
- The app remembers login state across page refreshes
- Form data persists during navigation between tabs
- Create button becomes active only after all required fields are filled
- File upload status is shown inline (no persistent success message)

## Troubleshooting Decision Tree

```
If page is blank:
  → Check if logged in
    → If not: Login first (hamburger → Sign In)
    → If yes: Click "Add Idea" tab

If form not visible:
  → Check current tab
    → If on "My Ideas": Click "Add Idea" tab
    → If on "Explore Ideas": Click "Add Idea" tab

If create button disabled:
  → Verify all fields filled:
    → Public Title ✓
    → Public Description ✓
    → File uploaded ✓

If creation seems stuck:
  → Wait - blockchain operations take time
  → Check "My Ideas" tab after 30-60 seconds
  → Look for status messages during creation
```

## Script Automation Flow

1. **Check Login Status**
   - Look for `[data-testid="nav-add-idea"]`
   - If not found, prompt for manual login

2. **Navigate to Add Idea**
   - Click the "Add Idea" navigation button
   - Wait for form to load

3. **Fill Form Fields**
   - Generate creative title with proper formatting
   - Create contextual description
   - Use selectors with placeholder text

4. **Handle File Upload (Automated!)**
   - Generate detailed markdown content in memory
   - Create File object with JavaScript
   - Use hidden input `[data-testid="file-upload-input"]`
   - Trigger change event - no manual selection needed!

5. **Create Idea**
   - Click "Create Your Idea Page" button
   - Monitor status messages
   - Wait for completion or timeout

## Best Practices

1. **Always verify element presence** before interacting
2. **Use explicit waits** after navigation
3. **Take screenshots** at key points for debugging
4. **Handle both success and failure** paths
5. **Provide clear user feedback** about manual steps needed

## Example Successful Run Output

```
🚀 Starting Add-IP automation...
📋 Checking login status...
✅ Already logged in
📝 Step 1: Navigating to Add Idea page...
🎯 Step 2: Generating and filling title...
   Title: A Chef's Blockchain System Using Neuroscience for Culinary Innovation
📄 Step 3: Generating and filling description...
📁 Step 4: Creating and uploading secret file...
   ✅ File uploaded automatically - no manual selection needed!
🎨 Step 5: Creating idea page...
⏳ Waiting for idea generation (this may take a few minutes)...
🎉 Success! Your idea has been created!
```