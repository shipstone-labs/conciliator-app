/**
 * Script to inspect the structure of the SafeIdea assessment page
 */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

async function inspectAssessmentPage() {
  // Launch browser
  console.log('Launching browser...')
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  })

  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navigate to the assessment page
    console.log('Navigating to assessment page...')
    await page.goto('https://safeidea.net/subscription/assessment')
    await page.waitForLoadState('networkidle')
    console.log('Loaded assessment page')

    // Take screenshot for reference
    const screenshotDir = './assessment-inspection'
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir)
    }

    await page.screenshot({
      path: path.join(screenshotDir, 'assessment-page.png'),
      fullPage: true,
    })

    // Inspect the structure of the page
    console.log('Inspecting page structure...')

    // Get all elements with data-testid attributes
    const testElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid]')
      return Array.from(elements).map((el) => {
        return {
          testId: el.getAttribute('data-testid'),
          tagName: el.tagName,
          innerText: el.innerText.slice(0, 100), // Truncate long text
          className: el.className,
        }
      })
    })

    console.log('Elements with data-testid:')
    console.log(JSON.stringify(testElements, null, 2))

    // Look specifically for question options
    const optionElements = await page.evaluate(() => {
      // Try different selectors that might be used for options
      const selectors = [
        '[data-testid^="option-"]',
        'input[type="radio"]',
        '.option',
        '.radio-option',
        'button.option',
        '[role="radio"]',
      ]

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector)
        if (elements.length > 0) {
          return {
            selector,
            elements: Array.from(elements).map((el) => {
              return {
                outerHTML: el.outerHTML.slice(0, 200), // Truncate long HTML
                innerText: el.innerText.slice(0, 100),
                className: el.className,
                id: el.id,
                dataTestId: el.getAttribute('data-testid'),
                name: el.name,
                type: el.type,
              }
            }),
          }
        }
      }

      return { selector: 'None found', elements: [] }
    })

    console.log('\nOption elements found:')
    console.log(JSON.stringify(optionElements, null, 2))

    // Check for navigation buttons
    const navigationButtons = await page.evaluate(() => {
      const nextButton = document.querySelector(
        '[data-testid="next-question-button"]'
      )
      const prevButton = document.querySelector(
        '[data-testid="prev-question-button"]'
      )

      return {
        nextButton: nextButton
          ? {
              exists: true,
              text: nextButton.innerText,
              enabled: !nextButton.disabled,
              dataTestId: nextButton.getAttribute('data-testid'),
            }
          : { exists: false },

        prevButton: prevButton
          ? {
              exists: true,
              text: prevButton.innerText,
              enabled: !prevButton.disabled,
              dataTestId: prevButton.getAttribute('data-testid'),
            }
          : { exists: false },
      }
    })

    console.log('\nNavigation buttons:')
    console.log(JSON.stringify(navigationButtons, null, 2))

    // Get page HTML for thorough inspection
    const html = await page.content()
    fs.writeFileSync(path.join(screenshotDir, 'assessment-page.html'), html)
    console.log(
      '\nSaved full page HTML to assessment-inspection/assessment-page.html'
    )

    return {
      testElements,
      optionElements,
      navigationButtons,
      screenshotPath: path.join(screenshotDir, 'assessment-page.png'),
      htmlPath: path.join(screenshotDir, 'assessment-page.html'),
    }
  } catch (error) {
    console.error('Error during inspection:', error)
    return { error: error.message }
  } finally {
    // Wait to allow viewing the page
    console.log('Waiting 5 seconds to allow viewing the page...')
    await page.waitForTimeout(5000)

    // Close the browser
    await browser.close()
    console.log('Closed browser')
  }
}

// Run the inspection
if (require.main === module) {
  inspectAssessmentPage()
    .then((result) => {
      console.log('Inspection completed')
      if (!result.error) {
        console.log(`Screenshot saved to: ${result.screenshotPath}`)
        console.log(`HTML saved to: ${result.htmlPath}`)
      }
    })
    .catch((err) => {
      console.error('Unhandled error:', err)
    })
}

module.exports = { inspectAssessmentPage }
