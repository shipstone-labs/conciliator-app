/**
 * MCP Assessment Test Server
 *
 * A Model Context Protocol server for testing the subscription assessment flow
 * using Playwright.
 */

const { createServer } = require('@anthropic-ai/mcp-sdk')
const { chromium } = require('playwright')

// Global variables to track browser and page state
let browser
let page

// Utility function to take screenshots with simple delay
async function takeScreenshot(delayMs = 500) {
  if (delayMs > 0) {
    await page.waitForTimeout(delayMs)
  }
  return await page.screenshot({ encoding: 'base64' })
}

// Assessment questions data (used for validation)
const ASSESSMENT_QUESTIONS = [
  'type', // Question 1: IP type
  'sharing', // Question 2: Sharing needs
  'concern', // Question 3: Main concern
  'budget', // Question 4: Budget range
  'timeline', // Question 5: Urgency
]

// Create and configure the MCP server
const server = createServer({
  tools: {
    /**
     * Initialize browser and page for testing
     */
    async initBrowser({ headless = true } = {}) {
      try {
        browser = await chromium.launch({
          headless,
          slowMo: 100, // Slow down operations by 100ms (useful for debugging)
        })
        page = await browser.newPage()
        return {
          success: true,
          message: 'Browser initialized successfully',
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        }
      }
    },

    /**
     * Navigate to the assessment page
     */
    async navigateToAssessment({ baseUrl = 'http://localhost:3000' } = {}) {
      try {
        await page.goto(`${baseUrl}/subscription/assessment`)
        const title = await page.title()
        const url = page.url()
        return {
          success: true,
          title,
          url,
          screenshot: await takeScreenshot(),
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
          screenshot: await takeScreenshot(),
        }
      }
    },

    /**
     * Answer a specific question by index with selected option
     */
    async answerQuestion({
      questionIndex,
      optionIndex,
      waitForNavigation = true,
    }) {
      try {
        const questionKey = ASSESSMENT_QUESTIONS[questionIndex - 1]

        // Wait for question to be visible
        await page.waitForSelector(`[data-testid="question-${questionKey}"]`)

        // Select the appropriate option
        await page.click(`[data-testid="option-${optionIndex}"]`)

        // If it's not the last question, click Next
        const isLastQuestion = questionIndex === ASSESSMENT_QUESTIONS.length

        if (!isLastQuestion && waitForNavigation) {
          await page.click('[data-testid="next-question-button"]')
        }

        return {
          success: true,
          message: `Answered question ${questionIndex} (${questionKey}) with option ${optionIndex}`,
          nextQuestion: isLastQuestion ? null : questionIndex + 1,
          screenshot: await takeScreenshot(),
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
          screenshot: await takeScreenshot(),
        }
      }
    },

    /**
     * Complete the entire assessment with specified answers
     */
    async completeAssessment({
      answers = [1, 1, 1, 1, 1], // Default to first option for each question
      baseUrl = 'http://localhost:3000',
      viewResults = true,
    } = {}) {
      try {
        // Navigate to assessment page
        await page.goto(`${baseUrl}/subscription/assessment`)

        // Answer each question in sequence
        for (let i = 0; i < ASSESSMENT_QUESTIONS.length; i++) {
          const questionIndex = i + 1
          const questionKey = ASSESSMENT_QUESTIONS[i]
          const optionIndex = answers[i]

          // Wait for question to be visible
          await page.waitForSelector(`[data-testid="question-${questionKey}"]`)

          // Select the appropriate option
          await page.click(`[data-testid="option-${optionIndex}"]`)

          // If it's not the last question, click Next
          const isLastQuestion = questionIndex === ASSESSMENT_QUESTIONS.length
          if (!isLastQuestion) {
            await page.click('[data-testid="next-question-button"]')
          }
        }

        // On the last question, click next to see results
        if (viewResults) {
          await page.click('[data-testid="next-question-button"]')

          // Wait for results to show
          await page.waitForSelector('[data-testid="assessment-results"]', {
            timeout: 5000,
          })
        }

        // Check if we reached the results page
        const onResultsPage = await page.isVisible(
          '[data-testid="assessment-results"]'
        )

        // Get local storage data to verify answers were saved
        const localStorage = await page.evaluate(() => {
          const items = {}
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key.startsWith('subscription_data_')) {
              items[key] = localStorage.getItem(key)
            }
          }
          return items
        })

        return {
          success: true,
          onResultsPage,
          currentUrl: page.url(),
          localStorage,
          answers: ASSESSMENT_QUESTIONS.map((q, i) => ({
            question: q,
            answerIndex: answers[i],
          })),
          screenshot: await takeScreenshot(),
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
          screenshot: await takeScreenshot(),
        }
      }
    },

    /**
     * Check if proceeding to plans is possible after assessment
     */
    async proceedToPlans() {
      try {
        // Click "View Plans" button if available
        const viewPlansButton = await page.$(
          '[data-testid="view-plans-button"]'
        )
        if (viewPlansButton) {
          await viewPlansButton.click()
          await page.waitForNavigation()

          // Check if we reached the plans page
          const onPlansPage = page.url().includes('/subscription/plans')

          return {
            success: true,
            onPlansPage,
            currentUrl: page.url(),
            screenshot: await takeScreenshot(),
          }
        }

        return {
          success: false,
          error: 'View Plans button not found',
          screenshot: await takeScreenshot(),
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
          screenshot: await takeScreenshot(),
        }
      }
    },

    /**
     * Get current page state (useful for debugging)
     */
    async getPageState() {
      try {
        return {
          success: true,
          url: page.url(),
          title: await page.title(),
          html: await page.content(),
          screenshot: await takeScreenshot(),
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        }
      }
    },

    /**
     * Close browser and clean up
     */
    async closeBrowser() {
      try {
        if (browser) {
          await browser.close()
          browser = null
          page = null
        }
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        }
      }
    },
  },
})

// Start the server
const PORT = process.env.PORT || 3333
server.listen(PORT, () => {
  console.log(`MCP Assessment Test Server running on port ${PORT}`)
  console.log('Ready to accept requests from Claude Code')
})

// Handle clean shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down MCP Test Server...')
  if (browser) {
    await browser.close()
  }
  process.exit(0)
})
