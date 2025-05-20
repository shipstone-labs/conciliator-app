const { chromium } = require('playwright')
;(async () => {
  // Start a browser
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Navigate to Google.com
  await page.goto('https://www.google.com')

  // Take a screenshot
  await page.screenshot({ path: 'google-screenshot.png' })

  // Close the browser
  await browser.close()
})()
