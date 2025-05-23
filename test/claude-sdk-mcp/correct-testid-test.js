/**
 * Playwright script to navigate through the SafeIdea subscription assessment,
 * selecting the 3rd option for each question and taking screenshots
 * Using the exact testids as implemented in the codebase
 */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

// Map of question IDs to their option IDs in the correct order
const QUESTION_OPTION_MAP = {
  type: [
    'invention',
    'trade-secret',
    'business-model',
    'creative-work',
    'unsure',
  ],
  sharing: [
    'no-sharing',
    'limited-sharing',
    'investor-sharing',
    'public-licensing',
    'undecided',
  ],
  concern: ['theft', 'proof', 'nda-enforcement', 'monetization', 'visibility'],
  budget: ['minimal', 'moderate', 'premium', 'enterprise', 'undecided'],
  timeline: ['immediate', 'soon', 'planning', 'exploring', 'already-public'],
}

// Questions in order
const QUESTION_IDS = ['type', 'sharing', 'concern', 'budget', 'timeline']

async function runAssessmentTest() {
  // Create screenshots directory
  const screenshotDir = './assessment-screenshots'
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir)
  }

  // Launch browser
  console.log('Launching browser...')
  const browser = await chromium.launch({
    headless: false, // Set to false to see the browser window
    slowMo: 500, // Slow down operations by 500ms for better visibility
  })

  const context = await browser.newContext()
  const page = await context.newPage()

  // Set timeout to 30 seconds for all operations
  page.setDefaultTimeout(30000) // 30 seconds timeout

  try {
    // Step 1: Navigate to the assessment page
    console.log('Navigating to assessment page...')
    await page.goto('https://safeidea.net/subscription/assessment')
    await page.waitForLoadState('networkidle')
    console.log('Loaded assessment page')

    // Take screenshot of initial page
    await page.screenshot({
      path: path.join(screenshotDir, '01-assessment-start.png'),
      fullPage: true,
    })
    console.log('Took screenshot of assessment start page')

    // Process each question
    for (let i = 0; i < QUESTION_IDS.length; i++) {
      const questionNumber = i + 1
      const questionId = QUESTION_IDS[i]

      console.log(`Processing question ${questionNumber} (${questionId})...`)

      // Wait for the question to be visible
      await page.waitForSelector(`[data-testid="question-${questionId}"]`)
      console.log(`Question ${questionNumber} loaded`)

      // Take a screenshot of the question
      await page.screenshot({
        path: path.join(
          screenshotDir,
          `${String(questionNumber).padStart(2, '0')}-question-${questionId}-before.png`
        ),
        fullPage: true,
      })

      // Get option IDs for this question
      const optionIds = QUESTION_OPTION_MAP[questionId]

      // Select the 3rd option (index 2, 0-based) if available
      const thirdOptionIndex = Math.min(2, optionIds.length - 1)
      const optionId = optionIds[thirdOptionIndex]

      console.log(
        `Selecting option: ${optionId} (3rd option or closest available)...`
      )

      try {
        // Use the exact data-testid pattern from the code
        await page.click(`[data-testid="option-${optionId}"]`)
        console.log(`Selected option: ${optionId}`)
      } catch (error) {
        console.warn(`Could not select option ${optionId}: ${error.message}`)
        console.log('Trying to select first available option...')

        // Try each option in the list
        let optionSelected = false
        for (const optId of optionIds) {
          try {
            await page.click(`[data-testid="option-${optId}"]`)
            console.log(`Selected alternative option: ${optId}`)
            optionSelected = true
            break
          } catch (_err) {
            // Continue trying other options
          }
        }

        if (!optionSelected) {
          console.warn(`Could not select any option for question ${questionId}`)
        }
      }

      // Take screenshot after selection
      await page.screenshot({
        path: path.join(
          screenshotDir,
          `${String(questionNumber).padStart(2, '0')}-question-${questionId}-after.png`
        ),
        fullPage: true,
      })

      // Click Next button to proceed
      console.log('Clicking Next button...')
      try {
        // Wait briefly to ensure selection is registered
        await page.waitForTimeout(500)

        // Click the next button
        await page.click('[data-testid="next-question-button"]')
        console.log('Clicked Next button')
      } catch (error) {
        console.warn(`Could not click Next button: ${error.message}`)

        // Check if the button is disabled
        const isDisabled = await page.evaluate(() => {
          const button = document.querySelector(
            '[data-testid="next-question-button"]'
          )
          return button?.disabled
        })

        if (isDisabled) {
          console.warn(
            'Next button is disabled - selection may not have registered correctly'
          )
        }

        break
      }

      // Wait for transition
      await page.waitForTimeout(1000)
    }

    // After the last question, we should be on the results page
    console.log('Checking for results page...')
    try {
      await page.waitForSelector('[data-testid="assessment-results"]', {
        timeout: 5000,
      })
      console.log('Results page loaded')

      // Take screenshot of results page
      await page.screenshot({
        path: path.join(screenshotDir, '06-results-page.png'),
        fullPage: true,
      })
      console.log('Took screenshot of assessment results')

      // Find the recommendation
      const recommendedPlan = await page.evaluate(() => {
        // Look for text content in the results that indicates the plan
        const planElements = [
          document.querySelector('.text-primary:has-text("Basic Plan")'),
          document.querySelector('.text-secondary:has-text("Secure Plan")'),
          document.querySelector('.text-accent:has-text("Complete Plan")'),
        ].filter(Boolean)

        return planElements.length > 0
          ? planElements[0].textContent.trim()
          : 'Plan not found'
      })

      console.log(`Recommended Plan: ${recommendedPlan}`)

      // Check if "View Plans" button exists and take screenshot if clicked
      try {
        await page.click('[data-testid="view-plans-button"]')
        await page.waitForNavigation({ timeout: 5000 })
        console.log('Navigated to plans page')

        // Take screenshot of plans page
        await page.screenshot({
          path: path.join(screenshotDir, '07-plans-page.png'),
          fullPage: true,
        })
        console.log('Took screenshot of plans page')
      } catch (error) {
        console.warn(`Could not navigate to plans page: ${error.message}`)
      }
    } catch (error) {
      console.warn(`Could not find results page: ${error.message}`)
    }

    // List all screenshots
    const screenshots = fs
      .readdirSync(screenshotDir)
      .filter((file) => file.endsWith('.png'))
      .map((file) => path.join(screenshotDir, file))

    return {
      success: true,
      screenshots,
    }
  } catch (error) {
    console.error('Error during assessment test:', error)

    // Take screenshot of error state if possible
    try {
      await page.screenshot({
        path: path.join(screenshotDir, 'error-state.png'),
        fullPage: true,
      })
      console.log('Took screenshot of error state')
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError)
    }

    return {
      success: false,
      error: error.message,
    }
  } finally {
    // Wait a moment to see the final state
    await page.waitForTimeout(2000)

    // Close the browser
    await browser.close()
    console.log('Closed browser')
  }
}

// Run the test if this is the main module
if (require.main === module) {
  console.log('Starting assessment test with correct testids...')

  runAssessmentTest()
    .then((result) => {
      console.log(
        'Test completed with result:',
        JSON.stringify(result, null, 2)
      )

      if (result.success) {
        console.log('✅ Assessment test completed successfully')
        console.log('Screenshots saved to assessment-screenshots/ directory')
      } else {
        console.log('❌ Assessment test failed')
        console.log(`Error: ${result.error}`)
      }
    })
    .catch((err) => {
      console.error('Unhandled error in test execution:', err)
    })
}

module.exports = { runAssessmentTest }
