/**
 * Playwright script to navigate through the SafeIdea subscription assessment,
 * selecting the 3rd option for each question and taking screenshots
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

async function runAssessmentTest() {
  // Create screenshots directory
  const screenshotDir = './assessment-screenshots'
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir)
  }

  // Launch browser with shorter timeout
  console.log('Launching browser...')
  const browser = await chromium.launch({
    headless: false, // Set to false to see the browser window
    slowMo: 500, // Slow down operations by 500ms for better visibility
  })

  const context = await browser.newContext()
  const page = await context.newPage()

  // Set timeout to 5 seconds for all operations
  page.setDefaultTimeout(5000) // 5 seconds timeout

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

    // Options for each question (based on our inspection)
    // For each question, we'll select the 3rd option (index 2, 0-based)
    const questionTypes = [
      {
        type: 'type', // Question 1: IP type
        options: [
          'invention',
          'trade-secret',
          'business-model',
          'creative-work',
          'unsure',
        ],
      },
      {
        type: 'sharing', // Question 2: Sharing needs
        options: [
          'not-sharing',
          'select-people',
          'widely-sharing',
          'unsure-sharing',
        ],
      },
      {
        type: 'concern', // Question 3: Main concern
        options: [
          'theft',
          'legal-standing',
          'attribution',
          'usage-rights',
          'unsure-concern',
        ],
      },
      {
        type: 'budget', // Question 4: Budget range
        options: [
          'free',
          'low-cost',
          'investment',
          'enterprise',
          'unsure-budget',
        ],
      },
      {
        type: 'timeline', // Question 5: Urgency/timeline
        options: ['immediate', 'soon', 'planning-ahead', 'unsure-timeline'],
      },
    ]

    // Process each question
    for (let i = 0; i < questionTypes.length; i++) {
      const questionNumber = i + 1
      const question = questionTypes[i]

      console.log(`Processing question ${questionNumber} (${question.type})...`)

      // Wait for the question to be visible
      await page.waitForSelector(`[data-testid="question-${question.type}"]`)
      console.log(`Question ${questionNumber} loaded`)

      // Select the 3rd option (index 2, 0-based) if available
      const thirdOptionIndex = Math.min(2, question.options.length - 1)
      const optionValue = question.options[thirdOptionIndex]

      console.log(
        `Selecting option: ${optionValue} (3rd option or closest available)...`
      )

      try {
        await page.click(`[data-testid="option-${optionValue}"]`)
        console.log('Selected option')
      } catch (error) {
        console.warn(`Could not select option ${optionValue}: ${error.message}`)
        console.log('Trying to select first available option instead...')

        // Try to select any option
        for (const opt of question.options) {
          try {
            await page.click(`[data-testid="option-${opt}"]`)
            console.log(`Selected alternative option: ${opt}`)
            break
          } catch (err) {
            // Continue trying other options
          }
        }
      }

      // Take screenshot after selection
      await page.screenshot({
        path: path.join(
          screenshotDir,
          `${String(questionNumber).padStart(2, '0')}-question-${question.type}.png`
        ),
        fullPage: true,
      })
      console.log(`Took screenshot of question ${questionNumber}`)

      // Click Next button to proceed
      console.log('Clicking Next button...')
      try {
        await page.click('[data-testid="next-question-button"]')
        console.log('Clicked Next button')
      } catch (error) {
        console.warn(`Could not click Next button: ${error.message}`)
        break
      }

      // Wait a moment for transition
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
        path: path.join(screenshotDir, '06-assessment-results.png'),
        fullPage: true,
      })
      console.log('Took screenshot of assessment results')

      // Get recommended plan from results page
      const recommendedPlan = await page.evaluate(() => {
        // Try to find the recommended plan display
        const planElement = document.querySelector(
          '[data-testid="recommended-plan"]'
        )
        return planElement ? planElement.textContent.trim() : 'Plan not found'
      })

      console.log(`Recommended Plan: ${recommendedPlan}`)

      // Check if "View Plans" button exists and take screenshot if clicked
      const viewPlansButton = await page.$('[data-testid="view-plans-button"]')
      if (viewPlansButton) {
        console.log('Clicking "View Plans" button...')
        await viewPlansButton.click()
        await page.waitForNavigation({ timeout: 5000 })
        console.log('Navigated to plans page')

        // Take screenshot of plans page
        await page.screenshot({
          path: path.join(screenshotDir, '07-plans-page.png'),
          fullPage: true,
        })
        console.log('Took screenshot of plans page')
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
  console.log('Starting assessment test...')

  runAssessmentTest()
    .then((result) => {
      console.log(
        'Test completed with result:',
        JSON.stringify(result, null, 2)
      )

      if (result.success) {
        console.log('✅ Assessment test completed successfully')
        console.log(`Screenshots saved to assessment-screenshots/ directory`)
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
