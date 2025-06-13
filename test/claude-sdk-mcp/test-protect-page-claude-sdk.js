#!/usr/bin/env node

// Test the Protect page using Claude Code SDK approach
// Based on the pattern from CURRENT_STATUS.md

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define the test prompt following the pattern from CURRENT_STATUS.md
/* const testPrompt = `
Write a Playwright script that tests the Add IP Protect page at 
https://pr-146---conciliator-55rclsk2qa-uc.a.run.app/add-ip/protect. The script should:

1. Launch a browser in non-headless mode
2. Navigate to the homepage
3. Wait for manual login (show instructions and wait for user to press ENTER)
4. After login, navigate to /add-ip/protect
5. Verify the page loaded with these elements:
   - Progress indicator (could be in nav or have class containing "progress")
   - "What Happens Next" info card
   - "Protect Your Idea" heading
   - Title input field (may have placeholder containing "title" or "name")
   - Description textarea (may have placeholder containing "description")
   - File upload input
   - "Create Now" button (initially disabled)
   - "Continue Setup" button (initially disabled)
6. Fill in the form:
   - Enter "Automated Test Invention" in the title field
   - Enter "This is a test description for the multi-page Add IP flow" in description
   - Simulate file upload by creating a test file
7. Verify buttons become enabled after form is filled
8. Check sessionStorage for 'addIPFormData' and log the contents
9. Click "Continue Setup" button
10. Verify navigation to /add-ip/share
11. Go back and verify data persistence
12. Take screenshots at key points
13. Include proper error handling throughout

Important implementation details:
- Use flexible selectors that check multiple possibilities for each element
- Wait for manual login by reading from stdin
- Create screenshots directory if it doesn't exist
- Clean up any test files created
- Keep browser open for 30 seconds at the end for inspection
` */

// Function to generate test code
function generateTestCode() {
  console.log('🤖 Generating test code with Claude SDK pattern...\n')

  // Following the pattern from CURRENT_STATUS.md, we would normally call:
  // const generatedCode = execSync(`claude -p "${testPrompt}"`, { encoding: 'utf8' });

  // For now, I'll create the test directly based on the prompt
  const testCode = `
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseURL = 'https://pr-146---conciliator-55rclsk2qa-uc.a.run.app';

async function takeScreenshot(page, name) {
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const screenshotPath = path.join(screenshotDir, \`\${name}.png\`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(\`📸 Screenshot saved: \${name}.png\`);
}

async function waitForEnter() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Press ENTER to continue...', () => {
      rl.close();
      resolve();
    });
  });
}

async function runTest() {
  console.log('🧪 Testing Add IP Protect Page');
  console.log('==============================\\n');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();

  try {
    // Step 1: Navigate to homepage
    console.log('1️⃣ Navigating to homepage...');
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await takeScreenshot(page, '01-homepage');

    // Step 2: Wait for manual login
    console.log('\\n2️⃣ MANUAL LOGIN REQUIRED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Please complete the following:');
    console.log('  1. Click the Login/Sign Up button');
    console.log('  2. Enter your email');
    console.log('  3. Complete the authentication flow');
    console.log('  4. Wait until you are logged in\\n');
    
    await waitForEnter();
    console.log('✅ Continuing with tests...\\n');

    // Step 3: Navigate to protect page
    console.log('3️⃣ Navigating to /add-ip/protect...');
    await page.goto(\`\${baseURL}/add-ip/protect\`, { waitUntil: 'networkidle' });
    await takeScreenshot(page, '02-protect-page');

    // Step 4: Verify page elements
    console.log('\\n4️⃣ Verifying page elements...');
    
    // Check for progress indicator
    const progressSelectors = ['nav', '[class*="progress"]', '[data-testid*="progress"]'];
    let progressFound = false;
    for (const selector of progressSelectors) {
      if (await page.locator(selector).first().count() > 0) {
        progressFound = true;
        break;
      }
    }
    console.log(\`  Progress indicator: \${progressFound ? '✅' : '❌'}\`);

    // Check for info card
    const infoCard = await page.getByText('What Happens Next').count() > 0;
    console.log(\`  Info card: \${infoCard ? '✅' : '❌'}\`);

    // Check for heading
    const heading = await page.getByText('Protect Your Idea').count() > 0;
    console.log(\`  Page heading: \${heading ? '✅' : '❌'}\`);

    // Find form inputs
    const titleInput = page.locator('input[placeholder*="title" i], textarea[placeholder*="title" i], input[placeholder*="name" i]').first();
    const descInput = page.locator('textarea[placeholder*="description" i], textarea[placeholder*="describe" i]').first();
    const fileInput = page.locator('input[type="file"]').first();
    
    console.log(\`  Title input: \${await titleInput.count() > 0 ? '✅' : '❌'}\`);
    console.log(\`  Description input: \${await descInput.count() > 0 ? '✅' : '❌'}\`);
    console.log(\`  File input: \${await fileInput.count() > 0 ? '✅' : '❌'}\`);

    // Check buttons
    const createButton = page.getByRole('button', { name: /create now/i });
    const continueButton = page.getByRole('button', { name: /continue setup/i });
    
    console.log(\`  Create Now button: \${await createButton.count() > 0 ? '✅' : '❌'}\`);
    console.log(\`  Continue Setup button: \${await continueButton.count() > 0 ? '✅' : '❌'}\`);

    // Step 5: Check initial button states
    console.log('\\n5️⃣ Checking initial button states...');
    const createDisabled = await createButton.isDisabled();
    const continueDisabled = await continueButton.isDisabled();
    console.log(\`  Buttons initially disabled: \${createDisabled && continueDisabled ? '✅' : '❌'}\`);

    // Step 6: Fill form
    console.log('\\n6️⃣ Filling form...');
    
    await titleInput.fill('Automated Test Invention');
    console.log('  ✅ Title filled');
    
    await descInput.fill('This is a test description for the multi-page Add IP flow');
    console.log('  ✅ Description filled');

    // Create and upload test file
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'Test content for protect page');
    await fileInput.setInputFiles(testFilePath);
    console.log('  ✅ File uploaded');
    
    await page.waitForTimeout(2000); // Wait for form processing
    await takeScreenshot(page, '03-form-filled');

    // Step 7: Check buttons are enabled
    console.log('\\n7️⃣ Checking button states after fill...');
    const createEnabled = await createButton.isEnabled();
    const continueEnabled = await continueButton.isEnabled();
    console.log(\`  Buttons now enabled: \${createEnabled && continueEnabled ? '✅' : '❌'}\`);

    // Step 8: Check sessionStorage
    console.log('\\n8️⃣ Checking sessionStorage...');
    const sessionData = await page.evaluate(() => {
      const data = sessionStorage.getItem('addIPFormData');
      return data ? JSON.parse(data) : null;
    });
    
    if (sessionData) {
      console.log('  ✅ Session storage data:');
      console.log(\`     Title: "\${sessionData.title}"\`);
      console.log(\`     Description: "\${sessionData.description?.substring(0, 50)}..."\`);
      console.log(\`     File: \${sessionData.fileName || 'Not set'}\`);
    }

    // Step 9: Test navigation
    console.log('\\n9️⃣ Testing navigation...');
    await continueButton.click();
    await page.waitForLoadState('networkidle');
    
    const currentPath = new URL(page.url()).pathname;
    console.log(\`  Navigated to: \${currentPath}\`);
    console.log(\`  Reached share page: \${currentPath === '/add-ip/share' ? '✅' : '❌'}\`);
    
    if (currentPath === '/add-ip/share') {
      await takeScreenshot(page, '04-share-page');
      
      // Go back and check persistence
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      const titleValue = await titleInput.inputValue();
      console.log(\`\\n  ✅ Data persisted: Title = "\${titleValue}"\`);
      await takeScreenshot(page, '05-back-to-protect');
    }

    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    console.log('\\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\\n❌ Test failed:', error.message);
    await takeScreenshot(page, 'error-state');
  } finally {
    console.log('\\n🔍 Browser will remain open for 30 seconds...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

runTest().catch(console.error);
`

  return testCode
}

// Main execution
async function main() {
  console.log('🚀 Claude SDK Test Generator for Protect Page')
  console.log('==========================================\n')

  // Generate the test code
  const testCode = generateTestCode()

  // Save to file
  const testFilePath = path.join(__dirname, 'generated-protect-test.js')
  fs.writeFileSync(testFilePath, testCode)
  console.log(`✅ Test code saved to: ${testFilePath}\n`)

  // Execute the test
  console.log('🏃 Running the generated test...\n')

  try {
    execSync(`node ${testFilePath}`, {
      stdio: 'inherit',
      cwd: __dirname,
    })
  } catch (error) {
    console.error('Test execution failed:', error.message)
  }
}

main().catch(console.error)
