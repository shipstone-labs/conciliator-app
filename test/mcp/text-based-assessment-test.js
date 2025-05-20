/**
 * Playwright script to navigate through the SafeIdea subscription assessment,
 * selecting the 3rd option for each question and taking screenshots
 * This version uses text-based selectors for more reliable clicking
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

    // Questions and their options (text-based)
    const questions = [
      {
        type: 'type',
        optionTexts: [
          'Invention or Innovation',
          'Trade Secrets / Confidential Information',
          'Business Model or Strategy',
          'Creative Works',
          "I'm not sure yet",
        ],
      },
      {
        type: 'sharing',
        optionTexts: [
          'No, I just need secure documentation',
          'Yes, with a small team or select partners',
          'Yes, with potential investors or partners',
          'Yes, with controlled licensing or sales',
          "I'm not sure yet",
        ],
      },
      {
        type: 'concern',
        optionTexts: [
          'Theft or unauthorized use of my ideas',
          'Legal standing and proof of ownership',
          'Attribution and recognition',
          'Control over usage rights',
          "I'm not sure yet",
        ],
      },
      {
        type: 'budget',
        optionTexts: [
          'Free or minimal cost',
          'Low-cost options',
          'Willing to invest for comprehensive protection',
          'Enterprise-level solution',
          "I'm not sure yet",
        ],
      },
      {
        type: 'timeline',
        optionTexts: [
          'Immediate protection needed',
          'Protection needed soon',
          'Planning ahead',
          "I'm not sure yet",
        ],
      },
    ]

    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const questionNumber = i + 1
      const question = questions[i]

      console.log(`Processing question ${questionNumber} (${question.type})...`)

      // Wait for the question page to be visible
      try {
        // First try to wait for the question testid if possible
        await page.waitForSelector(
          `[data-testid="question-${question.type}"]`,
          { timeout: 3000 }
        )
        console.log(`Question ${questionNumber} loaded (found by testid)`)
      } catch (error) {
        // If that fails, just wait for stability
        await page.waitForTimeout(1000)
        console.log(
          `Question ${questionNumber} assumed to be loaded (waited for timeout)`
        )
      }

      // Select the 3rd option (index 2, 0-based) if available, using text
      const thirdOptionIndex = Math.min(2, question.optionTexts.length - 1)
      const optionText = question.optionTexts[thirdOptionIndex]

      console.log(
        `Selecting option: "${optionText}" (3rd option or closest available)...`
      )

      try {
        // Click on the text of the option instead of the radio button
        await page.click(`text="${optionText}"`)
        console.log('Selected option')
      } catch (error) {
        console.warn(
          `Could not select option "${optionText}": ${error.message}`
        )
        console.log('Trying to select any available option...')

        // Try each option text until one works
        let optionSelected = false
        for (const text of question.optionTexts) {
          try {
            await page.click(`text="${text}"`, { timeout: 2000 })
            console.log(`Selected alternative option: "${text}"`)
            optionSelected = true
            break
          } catch (err) {
            // Continue trying other options
          }
        }

        if (!optionSelected) {
          console.warn('Could not select any option for this question')
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
        // Wait briefly to ensure selection is registered
        await page.waitForTimeout(500)

        // Check if Next button is enabled
        const isNextEnabled = await page.evaluate(() => {
          const nextButton = document.querySelector(
            '[data-testid="next-question-button"]'
          )
          return nextButton && !nextButton.disabled
        })

        if (isNextEnabled) {
          await page.click('[data-testid="next-question-button"]')
          console.log('Clicked Next button')
        } else {
          console.warn(
            'Next button is disabled - selection may not have registered'
          )
          // Try clicking the text again with force
          await page.click(`text="${optionText}"`, { force: true })
          await page.waitForTimeout(500)
          await page.click('[data-testid="next-question-button"]')
          console.log('Clicked Next button after retry')
        }
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
  console.log('Starting assessment test with text-based selectors...')

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
