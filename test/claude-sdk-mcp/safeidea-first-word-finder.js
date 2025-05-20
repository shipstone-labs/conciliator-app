const { chromium } = require('playwright')

async function extractFirstWord() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Navigate to the website
  await page.goto('https://safeidea.net')

  // Extract the first visible text and get the first word
  const firstText = await page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) =>
          node.textContent.trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
      }
    )
    const firstNode = walker.nextNode()
    return firstNode ? firstNode.textContent.trim() : ''
  })

  const firstWord = firstText.split(/\s+/)[0]

  // Take a screenshot
  await page.screenshot({ path: 'safeidea-screenshot.png' })

  // Output the first word
  console.log(firstWord)

  await browser.close()
  return firstWord
}

extractFirstWord()
