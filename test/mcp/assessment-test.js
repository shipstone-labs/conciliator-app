/**
 * MCP Assessment Test Script
 *
 * This script is meant to be executed by Claude Code to test the assessment form
 * in the subscription flow. It leverages the MCP server to automate browser interactions
 * with the assessment form.
 */

/**
 * Main test function that runs the assessment form test
 * @param {Object} config Test configuration
 * @returns {Object} Test results
 */
async function testAssessmentForm(config = {}) {
  // Default configuration
  const options = {
    baseUrl: 'http://localhost:3000',
    headless: true, // Set to false to see the browser during testing
    answers: [1, 3, 2, 2, 1], // Sample answers for the 5 questions
    ...config,
  }

  console.log('Starting assessment form test...')
  console.log(`Base URL: ${options.baseUrl}`)
  console.log(`Headless mode: ${options.headless}`)

  // Test results container
  const testResults = {
    startTime: new Date().toISOString(),
    steps: [],
    success: false,
    errors: [],
    localStorage: null,
    summary: '',
  }

  try {
    // Step 1: Initialize the browser
    console.log('Step 1: Initializing browser...')
    const initResult = await callMCPTool('initBrowser', {
      headless: options.headless,
    })

    testResults.steps.push({
      name: 'initBrowser',
      success: initResult.success,
      details: initResult,
    })

    if (!initResult.success) {
      throw new Error(`Browser initialization failed: ${initResult.error}`)
    }

    // Step 2: Navigate to the assessment page
    console.log('Step 2: Navigating to assessment page...')
    const navResult = await callMCPTool('navigateToAssessment', {
      baseUrl: options.baseUrl,
    })

    testResults.steps.push({
      name: 'navigateToAssessment',
      success: navResult.success,
      url: navResult.url,
      screenshot: navResult.screenshot,
    })

    if (!navResult.success) {
      throw new Error(`Navigation failed: ${navResult.error}`)
    }

    console.log(`Successfully navigated to: ${navResult.title}`)

    // Step 3: Complete the assessment
    console.log('Step 3: Completing the assessment form...')
    const completeResult = await callMCPTool('completeAssessment', {
      answers: options.answers,
      baseUrl: options.baseUrl,
      viewResults: true,
    })

    testResults.steps.push({
      name: 'completeAssessment',
      success: completeResult.success,
      onResultsPage: completeResult.onResultsPage,
      answers: completeResult.answers,
      screenshot: completeResult.screenshot,
    })

    if (!completeResult.success) {
      throw new Error(`Assessment completion failed: ${completeResult.error}`)
    }

    console.log('Assessment completed successfully!')

    // Store localStorage data for analysis
    testResults.localStorage = completeResult.localStorage

    // Step 4: Proceed to plans page (optional)
    console.log('Step 4: Checking navigation to plans...')
    const plansResult = await callMCPTool('proceedToPlans')

    testResults.steps.push({
      name: 'proceedToPlans',
      success: plansResult.success,
      onPlansPage: plansResult.onPlansPage,
      currentUrl: plansResult.currentUrl,
      screenshot: plansResult.screenshot,
    })

    if (!plansResult.success) {
      console.warn(
        `Note: Could not proceed to plans page: ${plansResult.error}`
      )
      // This is not a critical failure, just a note
    } else {
      console.log(
        `Successfully navigated to plans page: ${plansResult.currentUrl}`
      )
    }

    // Overall success
    testResults.success = true
    testResults.summary =
      'Assessment form test completed successfully. User can navigate through all questions, submit answers, view results, and proceed to the plans page.'
  } catch (error) {
    console.error(`Test failed with error: ${error.message}`)
    testResults.success = false
    testResults.errors.push(error.message)
    testResults.summary = `Assessment form test failed: ${error.message}`

    // Try to get the current page state for debugging
    try {
      const pageState = await callMCPTool('getPageState')
      testResults.steps.push({
        name: 'getPageState',
        details: pageState,
      })
    } catch (stateError) {
      console.error(`Failed to get page state: ${stateError.message}`)
    }
  } finally {
    // Clean up
    console.log('Cleaning up resources...')
    try {
      await callMCPTool('closeBrowser')
      testResults.steps.push({
        name: 'closeBrowser',
        success: true,
      })
    } catch (cleanupError) {
      console.error(`Browser cleanup failed: ${cleanupError.message}`)
      testResults.steps.push({
        name: 'closeBrowser',
        success: false,
        error: cleanupError.message,
      })
    }

    testResults.endTime = new Date().toISOString()
    testResults.duration =
      new Date(testResults.endTime) - new Date(testResults.startTime)

    // Final test summary
    console.log('-------------------------------------------')
    console.log(
      `Test Completed: ${testResults.success ? 'SUCCESS' : 'FAILURE'}`
    )
    console.log(`Duration: ${testResults.duration}ms`)
    if (testResults.errors.length > 0) {
      console.log('Errors:')
      testResults.errors.forEach((err) => console.log(`- ${err}`))
    }
    console.log('-------------------------------------------')
  }

  return testResults
}

// Utility functions for analyzing test results

/**
 * Analyzes local storage data from the test to verify proper data storage
 * @param {Object} localStorage The localStorage data from the test
 * @returns {Object} Analysis results
 */
function analyzeLocalStorage(localStorage) {
  const analysis = {
    hasAssessmentAnswers: false,
    hasRecommendedPlan: false,
    hasVisitedPages: false,
    recommendedPlan: null,
    issues: [],
  }

  if (!localStorage) {
    analysis.issues.push('No localStorage data available')
    return analysis
  }

  // Check for assessment answers
  const answersKey = 'subscription_data_assessment_answers'
  if (localStorage[answersKey]) {
    analysis.hasAssessmentAnswers = true
    try {
      const answers = JSON.parse(localStorage[answersKey])
      if (!answers || Object.keys(answers).length === 0) {
        analysis.issues.push('Assessment answers are empty')
      }
    } catch (_e) {
      analysis.issues.push('Failed to parse assessment answers')
    }
  } else {
    analysis.issues.push('No assessment answers found in localStorage')
  }

  // Check for recommended plan
  const planKey = 'subscription_data_recommended_plan'
  if (localStorage[planKey]) {
    analysis.hasRecommendedPlan = true
    analysis.recommendedPlan = localStorage[planKey]

    if (!['basic', 'secure', 'complete'].includes(localStorage[planKey])) {
      analysis.issues.push(`Unusual recommended plan: ${localStorage[planKey]}`)
    }
  } else {
    analysis.issues.push('No recommended plan found in localStorage')
  }

  // Check for visited pages
  const pagesKey = 'subscription_data_visited_pages'
  if (localStorage[pagesKey]) {
    analysis.hasVisitedPages = true
    try {
      const pages = JSON.parse(localStorage[pagesKey])
      if (!pages.includes('assessment')) {
        analysis.issues.push('Assessment not marked as visited in localStorage')
      }
    } catch (_e) {
      analysis.issues.push('Failed to parse visited pages')
    }
  } else {
    analysis.issues.push('No visited pages found in localStorage')
  }

  return analysis
}

/**
 * Creates a simple HTML report from test results
 * @param {Object} testResults The complete test results
 * @returns {string} HTML report
 */
function generateHtmlReport(testResults) {
  const storageAnalysis = analyzeLocalStorage(testResults.localStorage)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #3498db; margin-top: 30px; }
    .success { color: #27ae60; font-weight: bold; }
    .failure { color: #e74c3c; font-weight: bold; }
    .screenshot { max-width: 800px; border: 1px solid #ddd; margin: 10px 0; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    pre { background: #f8f8f8; padding: 10px; border-radius: 4px; overflow-x: auto; }
    .step { margin-bottom: 30px; border: 1px solid #eee; padding: 15px; border-radius: 5px; }
    .step-header { display: flex; justify-content: space-between; }
    .step-name { font-weight: bold; font-size: 1.2em; }
    .step-status { font-weight: bold; }
  </style>
</head>
<body>
  <h1>Assessment Form Test Report</h1>
  <p><strong>Started:</strong> ${testResults.startTime}</p>
  <p><strong>Duration:</strong> ${testResults.duration}ms</p>
  <p><strong>Status:</strong> <span class="${testResults.success ? 'success' : 'failure'}">${testResults.success ? 'SUCCESS' : 'FAILURE'}</span></p>
  
  <h2>Summary</h2>
  <p>${testResults.summary}</p>
  
  ${
    testResults.errors.length > 0
      ? `
    <h2>Errors</h2>
    <ul>
      ${testResults.errors.map((err) => `<li class="failure">${err}</li>`).join('')}
    </ul>
  `
      : ''
  }
  
  <h2>Local Storage Analysis</h2>
  <ul>
    <li><strong>Assessment Answers:</strong> ${storageAnalysis.hasAssessmentAnswers ? 'Saved ✓' : 'Missing ✗'}</li>
    <li><strong>Recommended Plan:</strong> ${storageAnalysis.hasRecommendedPlan ? `${storageAnalysis.recommendedPlan} ✓` : 'Missing ✗'}</li>
    <li><strong>Visited Pages:</strong> ${storageAnalysis.hasVisitedPages ? 'Tracked ✓' : 'Missing ✗'}</li>
  </ul>
  
  ${
    storageAnalysis.issues.length > 0
      ? `
    <p><strong>Issues:</strong></p>
    <ul>
      ${storageAnalysis.issues.map((issue) => `<li>${issue}</li>`).join('')}
    </ul>
  `
      : '<p><strong>No storage issues detected.</strong></p>'
  }
  
  <h2>Test Steps</h2>
  ${testResults.steps
    .map(
      (step) => `
    <div class="step">
      <div class="step-header">
        <div class="step-name">${step.name}</div>
        <div class="step-status ${step.success !== false ? 'success' : 'failure'}">${step.success !== false ? 'SUCCESS' : 'FAILURE'}</div>
      </div>
      ${step.screenshot ? `<img src="data:image/png;base64,${step.screenshot}" alt="Screenshot of ${step.name}" class="screenshot">` : ''}
      ${step.details ? `<pre>${JSON.stringify(step.details, null, 2)}</pre>` : ''}
    </div>
  `
    )
    .join('')}
  
  <h2>Raw Test Data</h2>
  <pre>${JSON.stringify({ ...testResults, steps: testResults.steps.map((s) => ({ ...s, screenshot: s.screenshot ? '[Base64 screenshot data]' : null })) }, null, 2)}</pre>
</body>
</html>`
}

// Export both functions for use by Claude Code
module.exports = {
  testAssessmentForm,
  analyzeLocalStorage,
  generateHtmlReport,
}
