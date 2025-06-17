# CC-SDK-PLAYWRIGHT Testing Instructions

## Overview

This document describes the approach for testing web applications using Claude Code SDK principles with Playwright automation, as demonstrated in testing the SafeIdea Add IP/Protect page.

## Testing Philosophy

Instead of manually writing Playwright tests, we follow the Claude Code SDK approach where:
1. Tests are described in natural language
2. Test code is generated based on the requirements
3. Tests adapt to the actual application behavior
4. Login and authentication are handled through user interaction

## Key Components

### 1. Authentication Flow Testing

The biggest challenge in testing authenticated pages is handling login. Our approach:

```javascript
// Don't try to automate login - let the user do it
console.log('MANUAL LOGIN REQUIRED');
console.log('Please complete the login process.');
console.log('Test continues when "Add Idea" appears.');

// Wait for a specific element that only appears when logged in
while (Date.now() - startTime < maxWaitTime) {
  const addIdeaVisible = await page.locator('[data-testid="nav-add-idea"]').isVisible();
  
  if (addIdeaVisible) {
    console.log('✅ Login successful!');
    break;
  }
  
  await page.waitForTimeout(checkInterval);
}
```

**Key Insight**: Look for elements that only appear post-login (like "Add Idea" in navigation) rather than trying to detect abstract "logged in" states.

### 2. Navigation Pattern

For the SafeIdea application:
1. Start at homepage
2. Click hamburger menu (not a traditional "Login" button)
3. Click "Sign In" in dropdown
4. Wait for user to complete authentication
5. Navigate to protected pages

```javascript
// Click hamburger menu
const hamburgerMenu = page.locator('[data-testid="nav-account-menu"]');
await hamburgerMenu.click();

// Click Sign In in dropdown
const signInButton = page.locator('[data-testid="nav-account-login"]');
await signInButton.click();
```

### 3. Element Detection Strategy

Use multiple selector strategies to find elements:

```javascript
// Try multiple selectors for robustness
const titleSelectors = [
  'textarea[placeholder*="title" i]',
  'input[placeholder*="title" i]', 
  '[data-testid="idea-title-input"]',
  'textarea:near(:text("Title"))'
];

let titleInput = null;
for (const selector of titleSelectors) {
  const element = page.locator(selector).first();
  if (await element.count() > 0) {
    titleInput = element;
    break;
  }
}
```

### 4. Screenshot Documentation

Take screenshots at every major step for debugging and documentation:

```javascript
async function takeScreenshot(page, name) {
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  await page.screenshot({ 
    path: path.join(screenshotDir, `${name}.png`),
    fullPage: true 
  });
  console.log(`📸 Screenshot saved: ${name}.png`);
}
```

### 5. Form Testing Pattern

For testing forms like the Add IP protect page:

```javascript
// 1. Check initial button states (should be disabled)
const initiallyDisabled = await createButton.isDisabled();

// 2. Fill form fields
await titleInput.fill('Test Invention Title');
await descInput.fill('Test description text');

// 3. Upload file
const testFilePath = path.join(__dirname, 'test.txt');
fs.writeFileSync(testFilePath, 'Test content');
await fileInput.setInputFiles(testFilePath);

// 4. Verify buttons are now enabled
const nowEnabled = await createButton.isEnabled();

// 5. Check session storage
const sessionData = await page.evaluate(() => {
  const data = sessionStorage.getItem('addIPFormData');
  return data ? JSON.parse(data) : null;
});

// 6. Test navigation
await continueButton.click();
const onSharePage = page.url().includes('/add-ip/share');
```

## Complete Test Structure

```javascript
async function runTest() {
  const browser = await chromium.launch({ 
    headless: false,  // Show browser for manual login
    slowMo: 50       // Slow down for visibility
  });
  
  try {
    // 1. Navigate to homepage
    // 2. Handle login flow
    // 3. Wait for authentication
    // 4. Navigate to target page
    // 5. Verify page elements
    // 6. Test interactions
    // 7. Verify state changes
    // 8. Test navigation
    // 9. Verify data persistence
  } finally {
    // Keep browser open for inspection
    await page.waitForTimeout(30000);
    await browser.close();
  }
}
```

## Best Practices

### 1. Don't Over-Automate Authentication
- Let users handle their own credentials
- Wait for concrete evidence of login success
- Don't try to fill login forms programmatically

### 2. Use Flexible Selectors
- Try multiple selector strategies
- Prefer data-testid when available
- Fall back to text content or placeholders
- Use semantic selectors (button, input types)

### 3. Provide Clear Feedback
```javascript
console.log('✅ Login successful!');
console.log('❌ Element not found');
console.log('⏳ Waiting for element...');
console.log('📸 Screenshot saved');
```

### 4. Handle Timeouts Gracefully
```javascript
await page.goto(url, { 
  waitUntil: 'networkidle',
  timeout: 60000  // Increase for slow-loading pages
});
```

### 5. Test State Persistence
Always verify that:
- Form data persists in session storage
- Navigation preserves state
- Back button maintains form values

## Example: Testing Multi-Page Forms

For multi-page forms like SafeIdea's Add IP flow:

1. **Test Each Page Independently**
   - Protect page: Form validation and data entry
   - Share page: Settings configuration
   - Guard page: Optional features

2. **Verify Navigation Flow**
   - Forward navigation updates URL
   - Back navigation preserves data
   - Progress indicator reflects current step

3. **Check Data Persistence**
   - Session storage contains form data
   - Refreshing page maintains state
   - Navigation between steps preserves entries

## Debugging Tips

1. **Use Non-Headless Mode**: Always run with `headless: false` during development
2. **Add Delays**: Use `slowMo` and `waitForTimeout` to see what's happening
3. **Take Screenshots**: Capture state at each step, especially errors
4. **Log Everything**: Use descriptive console output with emojis for clarity
5. **Check Browser Console**: Look for JavaScript errors that might affect tests

## Common Issues and Solutions

### Issue: Login Detection Fails
**Solution**: Find an element unique to logged-in state, not just absence of login form

### Issue: Element Not Found
**Solution**: Try multiple selectors, check if element is in shadow DOM or iframe

### Issue: Navigation Timeout
**Solution**: Increase timeout, use 'domcontentloaded' instead of 'networkidle'

### Issue: Form Validation Not Triggering
**Solution**: Use proper events - `fill()` instead of `type()`, trigger change events

## Conclusion

The Claude Code SDK approach to Playwright testing emphasizes:
- Natural language test descriptions
- Adaptive test generation
- User-driven authentication
- Comprehensive state verification
- Clear visual documentation through screenshots

This methodology creates more maintainable and reliable tests that adapt to application changes while providing clear feedback about test execution.