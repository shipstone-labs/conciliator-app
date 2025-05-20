/**
 * Simple Playwright Test Using Claude Code SDK
 *
 * This demonstrates loading a website with Playwright and capturing screenshots.
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

async function testSite(url = 'https://safeidea.net') {
  console.log(`Testing URL: ${url}`)

  // Create screenshots directory if it doesn't exist
  const screenshotDir = path.join(__dirname, 'screenshots')
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
  }

  // Launch the browser
  const browser = await chromium.launch({
    headless: false, // Set to true for headless mode
    slowMo: 100, // Slow down operations by 100ms (helpful for demos)
  })

  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navigate to the website
    console.log(`Navigating to ${url}...`)
    await page.goto(url)

    // Wait for page to load completely
    await page.waitForLoadState('networkidle')

    // Get page title
    const title = await page.title()
    console.log(`Page title: ${title}`)

    // Take a screenshot
    const screenshotPath = path.join(screenshotDir, 'site-homepage.png')
    await page.screenshot({ path: screenshotPath })
    console.log(`Screenshot saved to: ${screenshotPath}`)

    // Get some basic page information
    const pageInfo = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      metaDescription:
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute('content') || 'No description',
      links: Array.from(document.querySelectorAll('a'))
        .map((a) => ({
          text: a.innerText.trim(),
          href: a.href,
        }))
        .slice(0, 10), // Just get first 10 links
    }))

    return {
      success: true,
      title,
      pageInfo,
      screenshotPath,
    }
  } catch (error) {
    console.error('Test failed:', error)
    return {
      success: false,
      error: error.message,
    }
  } finally {
    // Close the browser
    await browser.close()
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  ;(async () => {
    try {
      // Allow URL to be specified via command line
      const url = process.argv[2] || 'https://safeidea.net'

      const result = await testSite(url)
      console.log(JSON.stringify(result, null, 2))

      process.exit(result.success ? 0 : 1)
    } catch (error) {
      console.error('Error running test:', error)
      process.exit(1)
    }
  })()
}

module.exports = { testSite }
