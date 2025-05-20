const { chromium } = require('playwright')

async function takeScreenshot() {
  // Launch browser
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navigate to the website
    console.log('Navigating to https://safeidea.net...')
    await page.goto('https://safeidea.net')

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')
    console.log('Page loaded')

    // Take a screenshot
    console.log('Taking screenshot...')
    await page.screenshot({ path: 'safeidea-screenshot.png', fullPage: true })
    console.log('Screenshot saved to safeidea-screenshot.png')

    // Get page title for verification
    const title = await page.title()
    console.log(`Page title: ${title}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    // Close browser
    await browser.close()
  }
}

// Run the function
takeScreenshot()
