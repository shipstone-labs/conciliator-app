const puppeteer = require('puppeteer')
;(async () => {
  try {
    // Connect to the existing Chrome instance
    console.log('Connecting to Chrome on port 9222...')
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null,
    })

    // Get the first page
    const pages = await browser.pages()
    const page = pages[0] || (await browser.newPage())

    // Navigate to archive.org
    console.log('Navigating to archive.org...')
    await page.goto('https://archive.org', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    console.log('✅ Successfully navigated to archive.org')
    console.log('Current URL:', page.url())

    // Keep the connection alive
    console.log('Browser is connected. The script will remain running.')
    console.log('Press Ctrl+C to disconnect.')
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
})()
