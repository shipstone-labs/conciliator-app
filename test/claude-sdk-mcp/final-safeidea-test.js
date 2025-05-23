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
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  })
  const page = await context.newPage()

  try {
    console.log('Starting test...')

    // Go to the website
    console.log('Navigating to safeidea.net...')
    await page.goto('https://safeidea.net')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000) // Short wait to ensure page is stable
    await page.screenshot({
      path: path.join(screenshotsDir, '01-homepage.png'),
    })

    // Find and click the "Learn How It Works" button
    console.log('Looking for "Learn How It Works" button...')
    const learnButton = page.getByText('Learn How It Works', { exact: true })

    // Wait for the button to be visible
    await learnButton.waitFor({ state: 'visible', timeout: 10000 })
    console.log('Found the "Learn How It Works" button!')
    await page.screenshot({
      path: path.join(screenshotsDir, '02-before-learn-click.png'),
    })

    // Click the button
    console.log('Clicking "Learn How It Works" button...')
    await learnButton.click()

    // Wait for navigation and take screenshot
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait to ensure the page is fully loaded
    await page.screenshot({
      path: path.join(screenshotsDir, '03-after-learn-click.png'),
    })

    // Find and click the "Take the Assessment" button - now we know it's a button, not a link
    console.log('Looking for "Take the Assessment" button...')
    // Use button role with exact text
    const assessmentButton = page.getByRole('button', {
      name: 'Take the Assessment',
      exact: true,
    })

    // Wait for the button to be visible
    await assessmentButton.waitFor({ state: 'visible', timeout: 10000 })
    console.log('Found the "Take the Assessment" button!')
    await page.screenshot({
      path: path.join(screenshotsDir, '04-before-assessment-click.png'),
    })

    // Click the button
    console.log('Clicking "Take the Assessment" button...')
    await assessmentButton.click()

    // Wait for navigation and take screenshot
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait to ensure the page is fully loaded
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
