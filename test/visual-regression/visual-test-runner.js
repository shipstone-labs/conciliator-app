#!/usr/bin/env node

/**
 * Dynamic Visual Regression Test Runner
 * Discovers and tests all public pages with real-time progress tracking
 */

const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const ProgressTracker = require('./progress-tracker')
const DiscoveryEngine = require('./discovery-engine')

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const SCREENSHOT_DIR = path.join(
  __dirname,
  'screenshots',
  new Date().toISOString().split('T')[0]
)
// Timeout per task is managed by ProgressTracker

// Ensure screenshot directory exists
function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Main test runner
async function runVisualRegressionTests() {
  const tracker = new ProgressTracker()
  const discovery = new DiscoveryEngine()
  let browser

  console.log('🚀 Starting Dynamic Visual Regression Tests')
  console.log(`📍 Base URL: ${BASE_URL}`)
  console.log(`📸 Screenshots: ${SCREENSHOT_DIR}\n`)

  ensureDirectory(SCREENSHOT_DIR)

  try {
    // Launch browser
    tracker.startTask('Browser Launch', 'Starting Playwright browser')
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-animations'],
    })
    tracker.completeTask({ message: 'Browser ready' })

    let pageCount = 0
    let nextPage = '/'

    // Main discovery and test loop
    while (nextPage) {
      pageCount++
      const pageUrl = `${BASE_URL}${nextPage}`

      tracker.startTask(`Page ${pageCount}`, `Testing ${nextPage}`)

      try {
        const context = await browser.newContext({
          viewport: { width: 1920, height: 1080 },
          deviceScaleFactor: 1,
          colorScheme: 'dark',
        })

        const page = await context.newPage()

        // Set page timeout
        page.setDefaultTimeout(30000)

        // Navigate to page
        await page.goto(pageUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        })

        // Wait for page to stabilize
        await page
          .waitForLoadState('networkidle', { timeout: 10000 })
          .catch(() => {
            tracker.log('Network idle timeout - continuing anyway', 'warning')
          })

        // Discover elements on this page
        await discovery.discoverPage(page, nextPage, tracker)

        // Take screenshot
        const screenshotName = `page-${pageCount}-${nextPage.replace(/\//g, '-')}.png`
        const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName)

        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
          animations: 'disabled',
        })

        tracker.completeTask({
          message: `Screenshot saved: ${screenshotName}`,
        })

        // Mark page as complete
        discovery.markPageComplete(nextPage, screenshotPath)

        // Show progress
        const progress = discovery.getProgress()
        console.log(
          `  📊 Progress: ${progress.completed}/${progress.total} pages ` +
            `(${progress.percentage}%) | ${progress.testIds} TestIDs found\n`
        )

        await context.close()
      } catch (error) {
        tracker.failTask(error.message)

        // Continue with next page despite error
        discovery.markPageComplete(nextPage, null)
      }

      // Get next unvisited page
      nextPage = discovery.getNextPage()

      // Small delay between pages
      if (nextPage) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // Generate final report
    tracker.startTask('Report Generation', 'Creating test report')

    const report = discovery.getReport()
    const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    tracker.completeTask({ message: `Report saved to ${reportPath}` })

    // Show summary
    console.log('\n📋 Test Discovery Summary:')
    console.log(`  • Pages discovered: ${report.summary.pagesDiscovered}`)
    console.log(`  • Pages tested: ${report.summary.pagesScreenshot}`)
    console.log(`  • TestIDs found: ${report.summary.testIdsFound}`)
    console.log(`  • Links discovered: ${report.summary.linksFound}`)

    console.log('\n📄 Tested Pages:')
    report.pages.forEach((page) => {
      const status = report.screenshots.find((s) => s[0] === page) ? '✓' : '✗'
      console.log(`  ${status} ${page}`)
    })

    // Show timing summary
    const summary = tracker.summary()

    return {
      success: summary.failed === 0,
      report,
      summary,
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    tracker.failTask(error.message)
    return {
      success: false,
      error: error.message,
    }
  } finally {
    if (browser) {
      await browser.close()
    }

    // Final summary
    tracker.summary()
  }
}

// CLI execution
if (require.main === module) {
  console.log('═'.repeat(60))
  console.log('  Visual Regression Test Runner - Public Pages Only')
  console.log('  Real-time progress | 60s timeout per task | No auth')
  console.log(`${'═'.repeat(60)}\n`)

  runVisualRegressionTests()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ All tests completed successfully!')
        process.exit(0)
      } else {
        console.log('\n❌ Tests completed with failures')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error)
      process.exit(1)
    })
}

module.exports = { runVisualRegressionTests }
