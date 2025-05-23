/**
 * DOMAnalyzerScraper - An advanced scraper that analyzes page structure
 *
 * This scraper uses DOM analysis techniques to:
 * 1. Build a semantic map of the page
 * 2. Identify content vs. navigation areas
 * 3. Score text blocks by relevance and semantic meaning
 * 4. Extract the most likely "main content" paragraph
 */
const { chromium } = require('playwright')

class DOMAnalyzerScraper {
  /**
   * Extract the main content paragraph and title from a web page using DOM analysis
   * @param {string} url The URL to scrape
   * @returns {Promise<Object>} The extracted data
   */
  async scrape(url) {
    console.log(`DOMAnalyzerScraper starting to scrape: ${url}`)
    const startTime = Date.now()

    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      // Navigate to the page
      await page.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' })

      // Extract title
      const title = await page.title()

      // Perform DOM analysis to find main content
      const mainContent = await page.evaluate(() => {
        // Helper function to calculate text density for an element
        function calculateTextDensity(element) {
          if (!element) return 0

          const text = element.innerText || ''
          const textLength = text.length
          const htmlLength = element.innerHTML.length

          // Avoid division by zero
          if (htmlLength === 0) return 0

          return textLength / htmlLength
        }

        // Helper function to get semantic score based on element type and attributes
        function getSemanticScore(element) {
          if (!element) return 0

          let score = 0

          // Score based on tag name
          const tag = element.tagName.toLowerCase()

          // Semantic elements that likely contain main content
          if (['article', 'main', 'section'].includes(tag)) {
            score += 30
          }

          // Common content containers
          if (['div', 'span'].includes(tag)) {
            score += 5
          }

          // Text elements
          if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
            score += 20
          }

          // Increase score for paragraphs as they're often content
          if (tag === 'p') {
            score += 15
          }

          // Check IDs and classes for content-related terms
          const idClass = `${element.id} ${element.className}`.toLowerCase()
          const contentTerms = [
            'content',
            'article',
            'main',
            'text',
            'body',
            'story',
            'entry',
          ]
          const navigationTerms = [
            'nav',
            'header',
            'footer',
            'menu',
            'sidebar',
            'widget',
            'ad',
            'promo',
          ]

          // Boost score for content-related classes/ids
          for (const term of contentTerms) {
            if (idClass.includes(term)) {
              score += 15
              break
            }
          }

          // Reduce score for navigation-related classes/ids
          for (const term of navigationTerms) {
            if (idClass.includes(term)) {
              score -= 30
              break
            }
          }

          // Score based on role attribute
          const role = element.getAttribute('role')?.toLowerCase() || ''
          if (role === 'main' || role === 'article') {
            score += 30
          }
          if (
            role === 'navigation' ||
            role === 'banner' ||
            role === 'complementary'
          ) {
            score -= 30
          }

          // Boost score for elements with substantial text
          const textLength = (element.innerText || '').length
          if (textLength > 200) {
            score += 20
          } else if (textLength > 100) {
            score += 10
          } else if (textLength > 50) {
            score += 5
          }

          // Calculate text density and adjust score
          const density = calculateTextDensity(element)
          score += density * 50 // High text density often indicates content

          return score
        }

        // Function to find highest scoring paragraph element
        function findBestParagraph() {
          // First look for the main content container
          const containers = []

          // Collect potential containers and score them
          const elements = document.querySelectorAll('*')
          for (const element of elements) {
            // Skip tiny elements or invisible elements
            if (
              !element.offsetParent ||
              element.offsetWidth === 0 ||
              element.offsetHeight === 0
            ) {
              continue
            }

            const score = getSemanticScore(element)
            if (score > 30) {
              // Only consider elements with decent score
              containers.push({ element, score })
            }
          }

          // Sort containers by score (highest first)
          containers.sort((a, b) => b.score - a.score)

          // From the top scoring containers, find paragraphs or text blocks
          const paragraphs = []

          // Look in top 5 containers
          const topContainers = containers.slice(0, 5)
          for (const { element } of topContainers) {
            // Look for paragraph elements
            const pElements = element.querySelectorAll('p')
            for (const p of pElements) {
              const text = p.innerText.trim()
              if (text.length > 50) {
                const score = getSemanticScore(p)
                paragraphs.push({ element: p, text, score })
              }
            }

            // If no paragraphs found, look for text nodes
            if (paragraphs.length === 0) {
              const textNodes = []
              const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                  acceptNode: (node) =>
                    node.textContent.trim().length > 50
                      ? NodeFilter.FILTER_ACCEPT
                      : NodeFilter.FILTER_REJECT,
                }
              )

              let node = walker.nextNode()
              while (node !== null) {
                const parent = node.parentElement
                // Skip if parent is script or style
                if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
                  node = walker.nextNode()
                  continue
                }

                const text = node.textContent.trim()
                // If text is substantial, add it
                if (text.length > 50) {
                  const score = getSemanticScore(parent)
                  textNodes.push({ node, text, score })
                }
                node = walker.nextNode()
              }

              // Sort text nodes by score
              textNodes.sort((a, b) => b.score - a.score)

              // Add top text nodes to paragraphs
              for (const { text, score } of textNodes.slice(0, 3)) {
                paragraphs.push({ text, score })
              }
            }
          }

          // Sort paragraphs by score
          paragraphs.sort((a, b) => b.score - a.score)

          // Return the text of the highest scoring paragraph
          return paragraphs.length > 0 ? paragraphs[0].text : null
        }

        // Execute the analysis and return the best paragraph
        return findBestParagraph()
      })

      if (!mainContent) {
        throw new Error(
          'DOM analysis could not identify main content paragraph'
        )
      }

      const duration = Date.now() - startTime

      return {
        success: true,
        title,
        content: mainContent,
        metadata: {
          toolName: 'DOMAnalyzerScraper',
          duration,
          url,
        },
      }
    } catch (error) {
      console.error(`DOMAnalyzerScraper failed: ${error.message}`)
      return {
        success: false,
        error: error.message,
        metadata: {
          toolName: 'DOMAnalyzerScraper',
          duration: Date.now() - startTime,
          url,
        },
      }
    } finally {
      await browser.close()
    }
  }
}

module.exports = DOMAnalyzerScraper

// If run directly, test the scraper
if (require.main === module) {
  const targetUrl = 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
  const scraper = new DOMAnalyzerScraper()

  scraper
    .scrape(targetUrl)
    .then((result) => {
      console.log('DOMAnalyzerScraper result:')
      console.log(JSON.stringify(result, null, 2))
    })
    .catch((error) => {
      console.error('Error running scraper:', error)
    })
}
