const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'screenshots')
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}
;(async () => {
  console.log('Starting SafeIdea navigation test...')

  // Launch browser
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Step 1: Go to homepage
    console.log('Navigating to SafeIdea homepage...')
    await page.goto('https://safeidea.net/', { timeout: 30000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot before clicking "Learn How It Works"
    console.log('Taking screenshot of homepage...')
    await page.screenshot({
      path: path.join(screenshotsDir, 'safeidea-01-homepage.png'),
    })

    // Step 2: Find and verify "Learn How It Works" button - using text selector instead of role
    console.log('Looking for "Learn How It Works" button...')
    // Try multiple selector strategies
    const learnButton = page.getByText('Learn How It Works', { exact: true })
    await learnButton.waitFor({ state: 'visible', timeout: 10000 })

    // Take screenshot before clicking
    console.log(
      'Taking screenshot before clicking Learn How It Works button...'
    )
    await page.screenshot({
      path: path.join(screenshotsDir, 'safeidea-02-before-learn-click.png'),
    })

    // Click the button
    console.log('Clicking Learn How It Works button...')
    await learnButton.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot after navigation
    console.log('Taking screenshot after clicking Learn How It Works button...')
    await page.screenshot({
      path: path.join(screenshotsDir, 'safeidea-03-after-learn-click.png'),
    })

    // Step 3: Find "Take the Assessment" button
    console.log('Looking for Take the Assessment button...')
    const assessmentButton = page.getByRole('button', {
      name: 'Take the Assessment',
    })
    await assessmentButton.waitFor({ state: 'visible', timeout: 10000 })

    // Take screenshot before clicking
    console.log(
      'Taking screenshot before clicking Take the Assessment button...'
    )
    await page.screenshot({
      path: path.join(
        screenshotsDir,
        'safeidea-04-before-assessment-click.png'
      ),
    })

    // Click the button
    console.log('Clicking Take the Assessment button...')
    await assessmentButton.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot after navigation
    console.log(
      'Taking screenshot after clicking Take the Assessment button...'
    )
    await page.screenshot({
      path: path.join(screenshotsDir, 'safeidea-05-after-assessment-click.png'),
    })

    console.log('Navigation test completed successfully!')
  } catch (error) {
    console.error('Test failed:', error)

    // Take screenshot on error
    await page.screenshot({
      path: path.join(screenshotsDir, 'safeidea-error.png'),
    })
  } finally {
    // Close browser
    console.log('Closing browser...')
    await browser.close()
  }
})()
