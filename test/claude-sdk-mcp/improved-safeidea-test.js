// @ts-check
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')
;(async () => {
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, 'screenshots')
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true })
  }

  // Launch browser with visible UI
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('Starting test...')

    // Go to the website
    console.log('Navigating to safeidea.net...')
    await page.goto('https://safeidea.net')
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: path.join(screenshotsDir, '01-homepage.png'),
    })

    // Wait for the page to fully load
    await page.waitForTimeout(2000)

    // Find and click the "Learn How It Works" button - using exact text and multiple selector strategies
    console.log('Looking for "Learn How It Works" button...')

    // Try multiple selector strategies to find the button
    const learnButton =
      (await page.locator('text="Learn How It Works"').first()) ||
      (await page.getByText('Learn How It Works').first()) ||
      (await page.locator('a:has-text("Learn How It Works")').first())

    // Check if the button was found
    if ((await learnButton.count()) === 0) {
      throw new Error('Could not find the "Learn How It Works" button')
    }

    console.log('Found the "Learn How It Works" button!')
    await page.screenshot({
      path: path.join(screenshotsDir, '02-before-learn-click.png'),
    })

    // Click the button
    console.log('Clicking "Learn How It Works" button...')
    await learnButton.click()

    // Wait for navigation and take screenshot
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait an additional 2 seconds to ensure the page is fully loaded
    await page.screenshot({
      path: path.join(screenshotsDir, '03-after-learn-click.png'),
    })

    // Find and click the "Take the assessment" button - using multiple selector strategies
    console.log('Looking for "Take the assessment" button...')

    // Try multiple selector strategies to find the assessment button
    const assessmentButton =
      (await page.locator('text="Take the assessment"').first()) ||
      (await page.getByText('Take the assessment', { exact: false }).first()) ||
      (await page.locator('a:has-text("assessment")').first()) ||
      (await page.locator('button:has-text("assessment")').first())

    // Check if the button was found
    if ((await assessmentButton.count()) === 0) {
      throw new Error('Could not find the "Take the assessment" button')
    }

    console.log('Found the "Take the assessment" button!')
    await page.screenshot({
      path: path.join(screenshotsDir, '04-before-assessment-click.png'),
    })

    // Click the button
    console.log('Clicking "Take the assessment" button...')
    await assessmentButton.click()

    // Wait for navigation and take screenshot
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait an additional 2 seconds
    await page.screenshot({
      path: path.join(screenshotsDir, '05-after-assessment-click.png'),
    })

    console.log('Test completed successfully!')
  } catch (error) {
    // Take screenshot on error
    console.error('Test failed:', error)
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png') })
  } finally {
    // Close browser
    console.log('Closing browser...')
    await browser.close()
  }
})()
