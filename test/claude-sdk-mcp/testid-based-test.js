/**
 * TestID-based test for SafeIdea subscription flow
 * 
 * This script tests the navigation through the subscription flow using the
 * newly added testid attributes for more reliable testing.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runSubscriptionTest() {
  console.log('Starting subscription flow test...');
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Launch browser with visible UI
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate to homepage
    console.log('Navigating to safeidea.net...');
    await page.goto('https://safeidea.net/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'testid-01-homepage.png') });
    
    // Step 2: Find and click the "Learn How It Works" link using testid
    console.log('Looking for "Learn How It Works" link by testid...');
    const learnButton = page.locator('[data-testid="welcome-how-it-works-link"]');
    await learnButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Found the "Learn How It Works" link!');
    await page.screenshot({ path: path.join(screenshotsDir, 'testid-02-before-learn-click.png') });
    
    // Click the button
    console.log('Clicking "Learn How It Works" link...');
    await learnButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify we're on the How It Works page by finding sections with testids
    console.log('Verifying How It Works page sections...');
    
    // Check for the key features section
    const keyFeatures = page.locator('[data-testid="subscription-key-features"]');
    await keyFeatures.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Found Key Features section');
    
    // Check for the protection process section
    const protectionProcess = page.locator('[data-testid="subscription-protection-process"]');
    await protectionProcess.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Found Protection Process section');
    
    // Check for the FAQ section
    const faqSection = page.locator('[data-testid="subscription-faq"]');
    await faqSection.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Found FAQ section');
    
    await page.screenshot({ path: path.join(screenshotsDir, 'testid-03-how-it-works-page.png') });
    
    // Step 3: Find and click the "Take the Assessment" button using testid
    console.log('Looking for "Take the Assessment" button by testid...');
    const assessmentButton = page.locator('[data-testid="subscription-assessment-button"]');
    await assessmentButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Found the "Take the Assessment" button!');
    await page.screenshot({ path: path.join(screenshotsDir, 'testid-04-before-assessment-click.png') });
    
    // Click the button
    console.log('Clicking "Take the Assessment" button...');
    await assessmentButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify we're on the Assessment page by finding the progress bar with testid
    console.log('Verifying Assessment page...');
    const progressBar = page.locator('[data-testid="assessment-progress-bar"]');
    await progressBar.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Found Assessment progress bar');
    
    // Make sure we can see the first question (type)
    const questionType = page.locator('[data-testid="assessment-question-type"]');
    await questionType.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Found first question (type)');
    
    await page.screenshot({ path: path.join(screenshotsDir, 'testid-05-assessment-page.png') });
    
    console.log('Test completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'testid-error.png') });
    return { success: false, error: error.message };
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

// Run the test
runSubscriptionTest()
  .then((result) => {
    if (result.success) {
      console.log('✅ Subscription test completed successfully');
      console.log('Screenshots saved to screenshots/ directory');
    } else {
      console.log('❌ Subscription test failed:', result.error);
    }
  })
  .catch((error) => {
    console.error('Error running test:', error);
  });