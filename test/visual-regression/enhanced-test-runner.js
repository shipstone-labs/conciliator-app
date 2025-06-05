#!/usr/bin/env node

/**
 * Enhanced Visual Regression Test Runner for SafeIdea
 * Tests all known public routes with progress tracking
 */

const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const ProgressTracker = require('./progress-tracker')
const { SAFEIDEA_PUBLIC_ROUTES } = require('./safeidea-routes')

// Configuration
const BASE_URL = 'https://safeidea.net'
const SCREENSHOT_DIR = path.join(
  __dirname,
  'screenshots',
  new Date().toISOString().split('T')[0]
)

// Ensure screenshot directory exists
function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Main test runner
async function runEnhancedVisualTests() {
  const tracker = new ProgressTracker()
  const results = {
    successful: [],
    failed: [],
    testIds: new Map(),
  }

  console.log('🚀 Enhanced Visual Regression Tests for SafeIdea')
  console.log(`📍 Testing ${SAFEIDEA_PUBLIC_ROUTES.length} known public routes`)
  console.log(`📸 Screenshots: ${SCREENSHOT_DIR}\n`)

  ensureDirectory(SCREENSHOT_DIR)

  let browser

  try {
    // Launch browser
    tracker.startTask('Browser Launch', 'Starting Playwright')
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-animations', '--no-sandbox'],
    })
    tracker.completeTask({ message: 'Browser ready' })

    // Test each known route
    for (let i = 0; i < SAFEIDEA_PUBLIC_ROUTES.length; i++) {
      const route = SAFEIDEA_PUBLIC_ROUTES[i]
      const pageNum = i + 1

      tracker.startTask(
        `Page ${pageNum}/${SAFEIDEA_PUBLIC_ROUTES.length}`,
        `${route.name} (${route.path})`
      )

      try {
        const context = await browser.newContext({
          viewport: { width: 1920, height: 1080 },
          deviceScaleFactor: 1,
          colorScheme: 'dark',
        })

        const page = await context.newPage()
        page.setDefaultTimeout(30000)

        // Navigate to page
        const fullUrl = `${BASE_URL}${route.path}`
        await page.goto(fullUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        })

        // Wait for content to load
        await page
          .waitForLoadState('networkidle', { timeout: 10000 })
          .catch(() => {
            tracker.log('Network idle timeout - continuing', 'warning')
          })

        // Discover TestIDs on this page
        const testIds = await page.evaluate(() => {
          const elements = document.querySelectorAll('[data-testid]')
          return Array.from(elements)
            .map((el) => ({
              testId: el.getAttribute('data-testid'),
              tag: el.tagName.toLowerCase(),
              text: el.textContent?.trim().substring(0, 30),
              visible: el.offsetParent !== null,
            }))
            .filter((item) => item.visible)
        })

        // Store TestIDs for this page
        results.testIds.set(route.path, testIds)

        if (testIds.length > 0) {
          tracker.log(`Found ${testIds.length} TestIDs`, 'success')
        }

        // Take screenshot
        const screenshotName = `${String(pageNum).padStart(2, '0')}-${route.path.replace(/\//g, '-').substring(1) || 'home'}.png`
        const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName)

        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
          animations: 'disabled',
        })

        results.successful.push({
          route: route.path,
          name: route.name,
          screenshot: screenshotName,
          testIds: testIds.length,
        })

        tracker.completeTask({
          message: `✓ Screenshot saved (${testIds.length} TestIDs)`,
        })

        await context.close()
      } catch (error) {
        tracker.failTask(error.message)
        results.failed.push({
          route: route.path,
          name: route.name,
          error: error.message,
        })
      }

      // Brief pause between pages
      if (i < SAFEIDEA_PUBLIC_ROUTES.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Generate comprehensive report
    tracker.startTask('Report', 'Generating test report')

    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      summary: {
        total: SAFEIDEA_PUBLIC_ROUTES.length,
        successful: results.successful.length,
        failed: results.failed.length,
        totalTestIds: Array.from(results.testIds.values()).reduce(
          (sum, ids) => sum + ids.length,
          0
        ),
      },
      pages: {
        successful: results.successful,
        failed: results.failed,
      },
      testIdsByPage: Object.fromEntries(results.testIds),
    }

    const reportPath = path.join(SCREENSHOT_DIR, 'enhanced-test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    tracker.completeTask({ message: 'Report saved' })

    // Display summary
    console.log('\n📊 Test Results Summary:')
    console.log(
      `✅ Successful: ${results.successful.length}/${SAFEIDEA_PUBLIC_ROUTES.length} pages`
    )
    console.log(`❌ Failed: ${results.failed.length} pages`)
    console.log(`🏷️  Total TestIDs found: ${report.summary.totalTestIds}`)

    if (results.failed.length > 0) {
      console.log('\n❌ Failed Pages:')
      results.failed.forEach((page) => {
        console.log(`  - ${page.name} (${page.route}): ${page.error}`)
      })
    }

    console.log('\n✅ Successful Pages:')
    results.successful.forEach((page) => {
      console.log(`  - ${page.name}: ${page.testIds} TestIDs`)
    })

    return {
      success: results.failed.length === 0,
      report,
    }
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message)
    return {
      success: false,
      error: error.message,
    }
  } finally {
    if (browser) {
      await browser.close()
    }
    tracker.summary()
  }
}

// Run the test
if (require.main === module) {
  console.log('═'.repeat(60))
  console.log('  Enhanced Visual Regression Tests - SafeIdea.net')
  console.log('  Testing all known public routes | 60s timeout')
  console.log(`${'═'.repeat(60)}\n`)

  runEnhancedVisualTests()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 All tests completed successfully!')
        process.exit(0)
      } else {
        console.log('\n⚠️  Tests completed with failures')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error)
      process.exit(1)
    })
}

module.exports = { runEnhancedVisualTests }
