/**
 * ResilientScraper - A robust scraper with multiple fallback mechanisms
 *
 * This scraper implements multiple strategies and fallbacks:
 * 1. Tries different selector methods (CSS, XPath, text)
 * 2. Handles common obstacles like cookie notices
 * 3. Implements automatic retries with progressive waits
 */
const { chromium } = require('playwright')

class ResilientScraper {
  /**
   * Extract the main content paragraph and title from a web page with robust error handling
   * @param {string} url The URL to scrape
   * @returns {Promise<Object>} The extracted data
   */
  async scrape(url) {
    console.log(`ResilientScraper starting to scrape: ${url}`)
    const startTime = Date.now()

    const browser = await chromium.launch({
      headless: true,
    })

    // Create context with desktop viewport and common user agent
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    })

    const page = await context.newPage()

    try {
      // Block unnecessary resources to speed up loading
      await page.route(
        '**/*.{png,jpg,jpeg,gif,webp,svg,css,woff,woff2,ttf,otf}',
        (route) => route.abort()
      )

      // Navigate to the page with retry logic
      let navigationSuccess = false
      for (let attempt = 1; attempt <= 3 && !navigationSuccess; attempt++) {
        try {
          await page.goto(url, {
            timeout: 15000,
            waitUntil: 'domcontentloaded', // Faster than 'networkidle'
          })
          navigationSuccess = true
        } catch (navError) {
          console.log(
            `Navigation attempt ${attempt} failed: ${navError.message}`
          )
          if (attempt === 3) throw navError
          // Wait progressively longer between retries
          await page.waitForTimeout(attempt * 1000)
        }
      }

      // Handle common obstacles
      await this.handleCommonObstacles(page)

      // Extract title with fallbacks
      let title
      try {
        title = await page.title()
      } catch (_titleError) {
        title = await page.evaluate(() => {
          return (
            document.querySelector('h1')?.textContent.trim() ||
            document.querySelector('title')?.textContent.trim() ||
            'Unknown Title'
          )
        })
      }

      // Try multiple strategies to extract the main paragraph
      const mainContent = await this.extractContentWithFallbacks(page)

      // Validate the content quality
      if (!this.validateContent(mainContent)) {
        throw new Error('Extracted content failed quality validation')
      }

      const duration = Date.now() - startTime

      return {
        success: true,
        title,
        content: mainContent,
        metadata: {
          toolName: 'ResilientScraper',
          duration,
          url,
          attempts: 3 - (navigationSuccess ? 2 : 0),
        },
      }
    } catch (error) {
      console.error(`ResilientScraper failed: ${error.message}`)

      // Try to capture a screenshot of the failure state
      try {
        await page.screenshot({ path: 'error-screenshot.png' })
        console.log('Error state screenshot saved as error-screenshot.png')
      } catch (screenshotError) {
        console.error(
          'Failed to capture error screenshot',
          screenshotError.message
        )
      }

      return {
        success: false,
        error: error.message,
        metadata: {
          toolName: 'ResilientScraper',
          duration: Date.now() - startTime,
          url,
        },
      }
    } finally {
      await browser.close()
    }
  }

  /**
   * Handle common obstacles like cookie notices and popups
   * @param {Page} page The Playwright page
   */
  async handleCommonObstacles(page) {
    // Common cookie acceptance buttons/notices
    const cookieSelectors = [
      'button[id*="cookie"][id*="accept"]',
      'button[id*="cookie"][id*="agree"]',
      'button[id*="accept"][id*="cookie"]',
      'button[id*="agree"][id*="cookie"]',
      'button[id*="consent"][id*="accept"]',
      'button[id*="consent"][id*="agree"]',
      '[id*="cookie-banner"] button',
      '[class*="cookie-banner"] button',
      '[id*="gdpr"] button',
      '[class*="gdpr"] button',
      'button:has-text("Accept")',
      'button:has-text("Accept All")',
      'button:has-text("I Agree")',
      'button:has-text("OK")',
      'button:has-text("Got it")',
    ]

    // Try to click each potential cookie button (stopping after first success)
    for (const selector of cookieSelectors) {
      try {
        const buttonCount = await page.locator(selector).count()
        if (buttonCount > 0) {
          console.log(
            `Found potential cookie notice with selector: ${selector}`
          )
          await page.locator(selector).first().click()
          console.log('Clicked cookie notice button')
          break
        }
      } catch (_error) {
        // Continue to next selector
      }
    }

    // Close other potential popups/modals
    try {
      const closeButtons = [
        '[aria-label="Close"]',
        '[aria-label="close"]',
        '[class*="close"]',
        '[id*="close"]',
        'button:has-text("×")',
      ]

      for (const closeSelector of closeButtons) {
        const closeCount = await page.locator(closeSelector).count()
        if (closeCount > 0) {
          await page.locator(closeSelector).first().click()
          console.log('Closed a popup/modal')
          break
        }
      }
    } catch (_error) {
      // Ignore errors from popup closing attempts
    }
  }

  /**
   * Extract content using multiple fallback strategies
   * @param {Page} page The Playwright page
   * @returns {Promise<string>} The extracted content
   */
  async extractContentWithFallbacks(page) {
    // Try CSS selectors first (most common patterns for main content)
    try {
      const cssContent = await page.evaluate(() => {
        // Array of selectors to try, in order of preference
        const selectors = [
          'main p:first-of-type',
          'article p:first-of-type',
          '.content p:first-of-type',
          '#content p:first-of-type',
          '.main-content p:first-of-type',
          '.article-content p:first-of-type',
          'p.lead',
          'p.summary',
          'p.introduction',
          'p',
        ]

        for (const selector of selectors) {
          const element = document.querySelector(selector)
          if (element && element.textContent.trim().length > 20) {
            return element.textContent.trim()
          }
        }

        return null
      })

      if (cssContent) {
        console.log('Content extracted using CSS selectors')
        return cssContent
      }
    } catch (cssError) {
      console.log('CSS selector extraction failed:', cssError.message)
    }

    // Try XPath selectors as fallback
    try {
      const xpathContent = await page.evaluate(() => {
        const xpaths = [
          '//main//p[1]',
          '//article//p[1]',
          '//div[@class="content"]//p[1]',
          '//div[@id="content"]//p[1]',
          '//p[string-length(text()) > 50][1]',
          '//p[1]',
        ]

        for (const xpath of xpaths) {
          const element = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue
          if (element && element.textContent.trim().length > 20) {
            return element.textContent.trim()
          }
        }

        return null
      })

      if (xpathContent) {
        console.log('Content extracted using XPath selectors')
        return xpathContent
      }
    } catch (xpathError) {
      console.log('XPath extraction failed:', xpathError.message)
    }

    // Try text-based content extraction as last resort
    try {
      const textContent = await page.evaluate(() => {
        // Get all text nodes in the document
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const text = node.textContent.trim()
              // Accept only nodes with substantial text
              if (
                text.length > 50 &&
                node.parentElement.tagName !== 'SCRIPT' &&
                node.parentElement.tagName !== 'STYLE'
              ) {
                return NodeFilter.FILTER_ACCEPT
              }
              return NodeFilter.FILTER_REJECT
            },
          }
        )

        // Find the first substantial text node
        const node = walker.nextNode()
        return node ? node.textContent.trim() : null
      })

      if (textContent) {
        console.log('Content extracted using text node walker')
        return textContent
      }
    } catch (textError) {
      console.log('Text walker extraction failed:', textError.message)
    }

    // If all strategies failed, try to get any text content from the page
    const fallbackContent = await page.evaluate(() => {
      return (
        document.body.innerText
          .split('\n')
          .find((line) => line.trim().length > 50) || 'No content extracted'
      )
    })

    return fallbackContent
  }

  /**
   * Validate content quality
   * @param {string} content The content to validate
   * @returns {boolean} Whether the content meets quality standards
   */
  validateContent(content) {
    if (!content || typeof content !== 'string') return false

    // Basic length check
    if (content.length < 20) return false

    // Check for sentence structure (at least one period)
    if (!content.includes('.')) return false

    // Check it's not just navigation text
    const navigationTerms = [
      'menu',
      'navigation',
      'search',
      'click here',
      'read more',
      'log in',
      'sign in',
    ]
    const lowerContent = content.toLowerCase()

    if (
      navigationTerms.some((term) => lowerContent.includes(term)) &&
      content.length < 100
    ) {
      return false
    }

    // Check for common error messages
    const errorPatterns = [
      'error',
      'not found',
      '404',
      'forbidden',
      '403',
      'access denied',
      'unavailable',
      'sorry',
      'went wrong',
    ]

    if (
      errorPatterns.some((pattern) => lowerContent.includes(pattern)) &&
      content.length < 150
    ) {
      return false
    }

    return true
  }
}

module.exports = ResilientScraper

// If run directly, test the scraper
if (require.main === module) {
  const targetUrl = 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
  const scraper = new ResilientScraper()

  scraper
    .scrape(targetUrl)
    .then((result) => {
      console.log('ResilientScraper result:')
      console.log(JSON.stringify(result, null, 2))
    })
    .catch((error) => {
      console.error('Error running scraper:', error)
    })
}
