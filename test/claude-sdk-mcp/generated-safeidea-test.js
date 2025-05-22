// @ts-check
const { chromium } = require('playwright')
const path = require('node:path')
const fs = require('node:fs')
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
    await page.screenshot({
      path: path.join(screenshotsDir, '01-homepage.png'),
    })

    // Find and click the "Learn how it works" button
    console.log('Looking for "Learn how it works" button...')
    const learnButton = page.getByRole('link', { name: /learn how it works/i })
    await learnButton.waitFor({ state: 'visible' })
    await page.screenshot({
      path: path.join(screenshotsDir, '02-before-learn-click.png'),
    })

    // Click the button
    console.log('Clicking "Learn how it works" button...')
    await learnButton.click()

    // Wait for navigation and take screenshot
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: path.join(screenshotsDir, '03-after-learn-click.png'),
    })

    // Find and click the "Take the assessment" button
    console.log('Looking for "Take the assessment" button...')
    const assessmentButton = page.getByRole('link', {
      name: /take the assessment/i,
    })
    await assessmentButton.waitFor({ state: 'visible' })
    await page.screenshot({
      path: path.join(screenshotsDir, '04-before-assessment-click.png'),
    })

    // Click the button
    console.log('Clicking "Take the assessment" button...')
    await assessmentButton.click()

    // Wait for navigation and take screenshot
    await page.waitForLoadState('networkidle')
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
