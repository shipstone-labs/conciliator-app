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

  // Launch browser
  console.log('Launching browser...')
  const browser = await chromium.launch({
    headless: false, // Set to false to see the browser window
    slowMo: 500, // Slow down operations by 500ms for better visibility
  })

  const context = await browser.newContext()
  const page = await context.newPage()

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

    // The assessment has 5 questions, for each:
    // 1. Select the 3rd option (index 2)
    // 2. Take a screenshot
    // 3. Click Next button

    const questionTypes = [
      'type', // Question 1: IP type
      'sharing', // Question 2: Sharing needs
      'concern', // Question 3: Main concern
      'budget', // Question 4: Budget range
      'timeline', // Question 5: Urgency/timeline
    ]

    // Process each question
    for (let i = 0; i < questionTypes.length; i++) {
      const questionNumber = i + 1
      const questionType = questionTypes[i]

      console.log(`Processing question ${questionNumber} (${questionType})...`)

      // Wait for the question to be visible
      await page.waitForSelector(`[data-testid="question-${questionType}"]`)
      console.log(`Question ${questionNumber} loaded`)

      // Select the 3rd option (index 2) - note that option indices are 0-based
      console.log('Selecting third option...')
      await page.click(`[data-testid="option-3"]`)
      console.log('Selected third option')

      // Take screenshot after selection
      await page.screenshot({
        path: path.join(
          screenshotDir,
          `${String(questionNumber).padStart(2, '0')}-question-${questionType}.png`
        ),
        fullPage: true,
      })
      console.log(`Took screenshot of question ${questionNumber}`)

      // Click Next button to proceed
      await page.click('[data-testid="next-question-button"]')
      console.log('Clicked Next button')

      // Wait a moment for transition
      await page.waitForTimeout(1000)
    }

    // After the last question, we should be on the results page
    console.log('Waiting for results page...')
    await page.waitForSelector('[data-testid="assessment-results"]', {
      timeout: 10000,
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
      await page.waitForNavigation()
      console.log('Navigated to plans page')

      // Take screenshot of plans page
      await page.screenshot({
        path: path.join(screenshotDir, '07-plans-page.png'),
        fullPage: true,
      })
      console.log('Took screenshot of plans page')
    }

    return {
      success: true,
      recommendedPlan,
      screenshots: fs
        .readdirSync(screenshotDir)
        .map((file) => path.join(screenshotDir, file)),
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
        console.log(`Recommended Plan: ${result.recommendedPlan}`)
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
