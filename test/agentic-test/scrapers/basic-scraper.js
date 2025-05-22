/**
 * BasicScraper - A simple scraper using direct CSS selectors
 *
 * This scraper uses a straightforward approach with hardcoded selectors.
 * It's fast but fragile to site changes.
 */
const { chromium } = require('playwright')

class BasicScraper {
  /**
   * Extract the main content paragraph and title from a web page
   * @param {string} url The URL to scrape
   * @returns {Promise<Object>} The extracted data
   */
  async scrape(url) {
    console.log(`BasicScraper starting to scrape: ${url}`)
    const startTime = Date.now()

    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      // Navigate to the page
      await page.goto(url, { timeout: 10000 })

      // Extract title
      const title = await page.title()

      // Extract main paragraph using a simple CSS selector
      const mainContent = await page.evaluate(() => {
        // Target the first paragraph in the main content
        const paragraphElement =
          document.querySelector('main p') ||
          document.querySelector('article p') ||
          document.querySelector('.content p') ||
          document.querySelector('p')

        return paragraphElement ? paragraphElement.textContent.trim() : null
      })

      // Check if content was found
      if (!mainContent) {
        throw new Error(
          'Failed to extract main paragraph using basic selectors'
        )
      }

      const duration = Date.now() - startTime

      return {
        success: true,
        title,
        content: mainContent,
        metadata: {
          toolName: 'BasicScraper',
          duration,
          url,
        },
      }
    } catch (error) {
      console.error(`BasicScraper failed: ${error.message}`)
      return {
        success: false,
        error: error.message,
        metadata: {
          toolName: 'BasicScraper',
          duration: Date.now() - startTime,
          url,
        },
      }
    } finally {
      await browser.close()
    }
  }
}

module.exports = BasicScraper

// If run directly, test the scraper
if (require.main === module) {
  const targetUrl = 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
  const scraper = new BasicScraper()

  scraper
    .scrape(targetUrl)
    .then((result) => {
      console.log('BasicScraper result:')
      console.log(JSON.stringify(result, null, 2))
    })
    .catch((error) => {
      console.error('Error running scraper:', error)
    })
}
