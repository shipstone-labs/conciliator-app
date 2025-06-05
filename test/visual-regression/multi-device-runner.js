#!/usr/bin/env node

/**
 * Multi-Device Visual Regression Test Runner
 * Tests SafeIdea across multiple devices with parallel execution
 */

const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const ProgressTracker = require('./progress-tracker')
const {
  DEVICE_PROFILES,
  MOBILE_CRITICAL_PATHS,
  DESKTOP_PATHS,
  DEVICE_GROUPS,
} = require('./device-configs')

// Configuration
const BASE_URL = 'https://safeidea.net'
const BASE_SCREENSHOT_DIR = path.join(
  __dirname,
  'screenshots',
  new Date().toISOString().split('T')[0]
)

// Ensure directory exists
function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Test a single device
async function testDevice(deviceId, browser, progressTracker) {
  const device = DEVICE_PROFILES[deviceId]
  const deviceDir = path.join(BASE_SCREENSHOT_DIR, deviceId)
  ensureDirectory(deviceDir)

  const results = {
    device: device.name,
    deviceId,
    successful: [],
    failed: [],
    testIds: new Map(),
    mobileSpecific: [],
  }

  // Determine which paths to test based on device type
  const pathsToTest = device.isMobile ? MOBILE_CRITICAL_PATHS : DESKTOP_PATHS

  progressTracker.log(
    `Starting ${device.name} testing (${pathsToTest.length} pages)`,
    'info'
  )

  for (let i = 0; i < pathsToTest.length; i++) {
    const route = pathsToTest[i]
    const pageNum = i + 1

    const taskName = `${device.name} - Page ${pageNum}/${pathsToTest.length}`
    progressTracker.startTask(taskName, route.name)

    try {
      // Create context with device emulation
      const context = await browser.newContext({
        ...device,
        colorScheme: 'dark',
        locale: 'en-US',
      })

      const page = await context.newPage()
      page.setDefaultTimeout(30000)

      // Navigate to page
      const fullUrl = `${BASE_URL}${route.path}`
      await page.goto(fullUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })

      // Wait for content
      await page
        .waitForLoadState('networkidle', { timeout: 10000 })
        .catch(() => {
          progressTracker.log('Network idle timeout - continuing', 'warning')
        })

      // Discover TestIDs
      const discovery = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-testid]')
        const testIds = []
        const mobileSpecific = []

        elements.forEach((el) => {
          const testId = el.getAttribute('data-testid')
          const visible = el.offsetParent !== null

          if (visible) {
            testIds.push({
              testId,
              tag: el.tagName.toLowerCase(),
              text: el.textContent?.trim().substring(0, 30),
            })

            // Check if this is mobile-specific UI
            if (
              /menu|burger|nav-toggle/i.test(testId) ||
              /mobile|touch|swipe/i.test(testId)
            ) {
              mobileSpecific.push(testId)
            }
          }
        })

        return { testIds, mobileSpecific }
      })

      // Store discoveries
      results.testIds.set(route.path, discovery.testIds)
      if (discovery.mobileSpecific.length > 0) {
        results.mobileSpecific.push({
          page: route.path,
          elements: discovery.mobileSpecific,
        })
      }

      // Take screenshot
      const screenshotName = `${String(pageNum).padStart(2, '0')}-${route.path.replace(/\//g, '-').substring(1) || 'home'}.png`
      const screenshotPath = path.join(deviceDir, screenshotName)

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        animations: 'disabled',
      })

      results.successful.push({
        route: route.path,
        name: route.name,
        screenshot: screenshotName,
        testIds: discovery.testIds.length,
        mobileSpecific: discovery.mobileSpecific.length,
      })

      progressTracker.completeTask({
        message: `${discovery.testIds.length} TestIDs${discovery.mobileSpecific.length > 0 ? ` (${discovery.mobileSpecific.length} mobile-specific)` : ''}`,
      })

      await context.close()
    } catch (error) {
      progressTracker.failTask(`${error.message.substring(0, 50)}...`)
      results.failed.push({
        route: route.path,
        name: route.name,
        error: error.message,
      })
    }

    // Brief pause between pages
    if (i < pathsToTest.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  return results
}

// Test multiple devices in parallel
async function runParallelDeviceTests(deviceIds, progressTracker) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-animations', '--no-sandbox'],
  })

  try {
    // Run tests in parallel
    const testPromises = deviceIds.map((deviceId) =>
      testDevice(deviceId, browser, progressTracker)
    )

    const results = await Promise.all(testPromises)
    return results
  } finally {
    await browser.close()
  }
}

// Main test orchestrator
async function runMultiDeviceTests() {
  const tracker = new ProgressTracker()

  console.log('🚀 Multi-Device Visual Regression Tests for SafeIdea')
  console.log(`📱 Testing on ${Object.keys(DEVICE_PROFILES).length} devices`)
  console.log(
    `🔍 Mobile devices test ${MOBILE_CRITICAL_PATHS.length} critical paths`
  )
  console.log(`💻 Desktop tests all ${DESKTOP_PATHS.length} pages`)
  console.log(`📸 Screenshots: ${BASE_SCREENSHOT_DIR}\n`)

  ensureDirectory(BASE_SCREENSHOT_DIR)

  const allResults = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    devices: [],
    summary: {
      totalDevices: 0,
      totalPages: 0,
      totalSuccess: 0,
      totalFailed: 0,
      totalTestIds: 0,
      mobileSpecificElements: 0,
    },
  }

  try {
    // Launch browser
    tracker.startTask('Browser Launch', 'Starting Playwright')
    const browser = await chromium.launch({
      headless: true,
      args: ['--disable-animations', '--no-sandbox'],
    })
    tracker.completeTask({ message: 'Browser ready' })

    // Test each device group in parallel
    for (const [groupName, deviceIds] of Object.entries(DEVICE_GROUPS)) {
      tracker.startTask(`Testing ${groupName}`, `${deviceIds.length} device(s)`)

      const groupResults = await runParallelDeviceTests(deviceIds, tracker)

      // Process results
      groupResults.forEach((result) => {
        allResults.devices.push(result)
        allResults.summary.totalDevices++
        allResults.summary.totalPages +=
          result.successful.length + result.failed.length
        allResults.summary.totalSuccess += result.successful.length
        allResults.summary.totalFailed += result.failed.length

        // Count TestIDs
        for (const testIds of result.testIds.values()) {
          allResults.summary.totalTestIds += testIds.length
        }

        // Count mobile-specific elements
        allResults.summary.mobileSpecificElements +=
          result.mobileSpecific.reduce(
            (sum, item) => sum + item.elements.length,
            0
          )
      })

      tracker.completeTask({
        message: `Completed ${groupResults.reduce((sum, r) => sum + r.successful.length, 0)} pages`,
      })
    }

    await browser.close()

    // Generate comprehensive report
    tracker.startTask('Report Generation', 'Creating device comparison report')

    // Device comparison matrix
    const comparisonMatrix = generateComparisonMatrix(allResults.devices)
    allResults.comparison = comparisonMatrix

    // Save report
    const reportPath = path.join(
      BASE_SCREENSHOT_DIR,
      'multi-device-report.json'
    )
    fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2))

    tracker.completeTask({ message: 'Report saved' })

    // Display results
    displayResults(allResults)

    return {
      success: allResults.summary.totalFailed === 0,
      report: allResults,
    }
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message)
    return {
      success: false,
      error: error.message,
    }
  } finally {
    tracker.summary()
  }
}

// Generate comparison matrix
function generateComparisonMatrix(deviceResults) {
  const matrix = {}
  const allPaths = new Set()

  // Collect all unique paths
  deviceResults.forEach((result) => {
    result.testIds.forEach((_, path) => allPaths.add(path))
  })

  // Build comparison matrix
  allPaths.forEach((path) => {
    matrix[path] = {}
    deviceResults.forEach((result) => {
      const testIds = result.testIds.get(path)
      matrix[path][result.deviceId] = {
        testIdCount: testIds ? testIds.length : 0,
        hasScreenshot: result.successful.some((s) => s.route === path),
      }
    })
  })

  return matrix
}

// Display results
function displayResults(results) {
  console.log('\n📊 Multi-Device Test Results:')
  console.log('═'.repeat(60))

  console.log(`\n📱 Devices Tested: ${results.summary.totalDevices}`)
  console.log(`📄 Total Pages: ${results.summary.totalPages}`)
  console.log(`✅ Successful: ${results.summary.totalSuccess}`)
  console.log(`❌ Failed: ${results.summary.totalFailed}`)
  console.log(`🏷️  Total TestIDs: ${results.summary.totalTestIds}`)
  console.log(
    `📲 Mobile-Specific Elements: ${results.summary.mobileSpecificElements}`
  )

  console.log('\n📱 Device Results:')
  results.devices.forEach((device) => {
    console.log(`\n${device.device} (${device.deviceId}):`)
    console.log(`  ✅ Success: ${device.successful.length} pages`)
    console.log(`  ❌ Failed: ${device.failed.length} pages`)

    if (device.mobileSpecific.length > 0) {
      console.log(
        `  📲 Mobile-specific UI found on ${device.mobileSpecific.length} pages`
      )
    }
  })

  // Show TestID differences
  console.log('\n🔍 TestID Variations by Device:')
  const matrix = results.comparison
  Object.entries(matrix).forEach(([path, devices]) => {
    const counts = Object.entries(devices).map(
      ([device, data]) => `${device}: ${data.testIdCount}`
    )
    const uniqueCounts = new Set(
      Object.values(devices).map((d) => d.testIdCount)
    )

    if (uniqueCounts.size > 1) {
      console.log(`  ${path}: ${counts.join(', ')} ⚠️`)
    }
  })
}

// CLI execution
if (require.main === module) {
  console.log('═'.repeat(60))
  console.log('  Multi-Device Visual Regression Tests')
  console.log('  Desktop + Mobile + Tablet | Parallel Execution')
  console.log(`${'═'.repeat(60)}\n`)

  runMultiDeviceTests()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 All device tests completed successfully!')
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

module.exports = { runMultiDeviceTests }
