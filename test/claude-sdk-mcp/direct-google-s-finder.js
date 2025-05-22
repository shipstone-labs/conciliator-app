/**
 * Script that directly uses Playwright to find the first word with "s" on Google.com
 * Without relying on Claude to generate the code
 */
const { chromium } = require('playwright')

async function findFirstWordWithS() {
  console.log(
    'Starting browser to search Google.com for first word with "s"...'
  )

  // Launch browser
  const browser = await chromium.launch({
    headless: true, // Run in headless mode
  })

  try {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Navigate to Google
    console.log('Navigating to Google.com...')
    await page.goto('https://www.google.com')
    console.log('Page loaded')

    // Extract all visible text on the page
    const textContent = await page.evaluate(() => {
      // Function to get all visible text nodes
      function getVisibleTextNodes(node) {
        let textNodes = []

        // Skip hidden elements
        const style = window.getComputedStyle(node)
        if (style.display === 'none' || style.visibility === 'hidden') {
          return textNodes
        }

        // Check if it's a text node
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          textNodes.push({
            text: node.textContent.trim(),
            element: node.parentElement
              ? node.parentElement.tagName
              : 'unknown',
          })
        }

        // Check child nodes
        for (const child of node.childNodes) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            textNodes = textNodes.concat(getVisibleTextNodes(child))
          } else if (
            child.nodeType === Node.TEXT_NODE &&
            child.textContent.trim()
          ) {
            textNodes.push({
              text: child.textContent.trim(),
              element: node.tagName,
            })
          }
        }

        return textNodes
      }

      // Get all text nodes starting from the body
      return getVisibleTextNodes(document.body)
    })

    console.log(`Found ${textContent.length} text elements on the page`)

    // Find the first word containing 's'
    let firstWordWithS = null
    let wordContext = null

    for (const { text, element } of textContent) {
      // Split the text into words and check each word
      const words = text.split(/\s+/)

      for (const word of words) {
        // Clean the word (remove punctuation)
        const cleanWord = word.replace(/[^\w]/g, '')

        if (cleanWord?.toLowerCase().includes('s')) {
          firstWordWithS = cleanWord
          wordContext = `Found in a <${element}> element with text: "${text}"`
          break
        }
      }

      if (firstWordWithS) break
    }

    if (firstWordWithS) {
      console.log(`✅ First word containing 's': "${firstWordWithS}"`)
      console.log(wordContext)
      return { word: firstWordWithS, context: wordContext }
    }
    console.log('❌ No words containing "s" were found')
    return { word: null, context: null }
  } catch (error) {
    console.error('Error during search:', error)
    return { error: error.message }
  } finally {
    // Close the browser
    await browser.close()
    console.log('Browser closed')
  }
}

// Run the function if this is the main module
if (require.main === module) {
  findFirstWordWithS()
    .then((result) => {
      console.log('\nSearch completed')
      console.log('Result:', JSON.stringify(result, null, 2))
    })
    .catch((error) => {
      console.error('Unhandled error:', error)
    })
}

module.exports = { findFirstWordWithS }
