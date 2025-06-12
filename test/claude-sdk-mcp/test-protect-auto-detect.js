#!/usr/bin/env node

// Test the Protect page with automatic login detection
// This version polls for login indicators instead of waiting for ENTER

import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const baseURL = 'https://pr-146---conciliator-55rclsk2qa-uc.a.run.app'

async function takeScreenshot(page, name) {
  const screenshotDir = path.join(__dirname, 'screenshots')
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
  }

  const screenshotPath = path.join(screenshotDir, `${name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`📸 Screenshot saved: ${name}.png`)
}

async function waitForLogin(page) {
  console.log('\n2️⃣ MANUAL LOGIN REQUIRED')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Please complete the following in the browser:')
  console.log('  1. Click the Login/Sign Up button')
  console.log('  2. Enter your email')
  console.log('  3. Complete the authentication flow')
  console.log('\n⏳ Waiting for login to complete...\n')

  const maxWaitTime = 120000 // 2 minutes
  const checkInterval = 1000 // Check every second
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Method 1: Try to navigate to protected page and see if we get redirected
      const response = await page.goto(`${baseURL}/add-ip/protect`, {
        waitUntil: 'domcontentloaded',
        timeout: 5000,
      })

      const currentUrl = page.url()

      // If we can access the protect page without being redirected to login, we're logged in
      if (
        currentUrl.includes('/add-ip/protect') &&
        !currentUrl.includes('login') &&
        !currentUrl.includes('auth')
      ) {
        console.log('✅ Login successful! Accessed protected page.')
        return true
      }

      // If we got redirected back to home or login, go back to homepage
      if (!currentUrl.includes('/add-ip/protect')) {
        await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
      }

      // Method 2: Look for logged-in UI elements on homepage
      const loggedInIndicators = [
        'button:has-text("Account")',
        'button:has-text("Log out")',
        'button:has-text("Logout")',
        '[data-testid="nav-account-menu"]',
        '[data-testid="nav-logoff-button"]',
        'a[href="/add-ip"]', // Link to Add IP might only show when logged in
      ]

      for (const selector of loggedInIndicators) {
        try {
          const element = await page.locator(selector).first()
          if (await element.isVisible({ timeout: 100 })) {
            console.log(`✅ Login detected! Found: ${selector}`)
            return true
          }
        } catch (e) {
          // Continue checking
        }
      }
    } catch (error) {
      // Navigation or check failed, continue waiting
    }

    // Show progress
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    process.stdout.write(`\r⏱️  Checking login status... ${elapsed}s elapsed`)

    await page.waitForTimeout(checkInterval)
  }

  console.log('\n❌ Login timeout after 2 minutes')
  return false
}

async function runTest() {
  console.log('🧪 Testing Add IP Protect Page (Auto-detect Login)')
  console.log('================================================\n')

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  })

  const page = await context.newPage()

  try {
    // Step 1: Navigate to homepage
    console.log('1️⃣ Navigating to homepage...')
    await page.goto(baseURL, { waitUntil: 'networkidle' })
    await takeScreenshot(page, '01-homepage')

    // Step 2: Wait for login with auto-detection
    const loggedIn = await waitForLogin(page)

    if (!loggedIn) {
      console.log('\n❌ Could not detect successful login')
      return
    }

    await takeScreenshot(page, '02-after-login')

    // Step 3: Navigate to protect page (if not already there)
    console.log("\n3️⃣ Ensuring we're on /add-ip/protect...")
    if (!page.url().includes('/add-ip/protect')) {
      await page.goto(`${baseURL}/add-ip/protect`, { waitUntil: 'networkidle' })
    }
    await takeScreenshot(page, '03-protect-page')

    // Step 4: Verify page elements
    console.log('\n4️⃣ Verifying page elements...')

    // Wait a bit for page to fully load
    await page.waitForTimeout(2000)

    // Check for progress indicator
    const progressSelectors = [
      'nav',
      '[class*="progress"]',
      '[data-testid*="progress"]',
    ]
    let progressFound = false
    for (const selector of progressSelectors) {
      if ((await page.locator(selector).first().count()) > 0) {
        progressFound = true
        break
      }
    }
    console.log(`  Progress indicator: ${progressFound ? '✅' : '❌'}`)

    // Check for info card
    const infoCard = (await page.getByText('What Happens Next').count()) > 0
    console.log(`  Info card: ${infoCard ? '✅' : '❌'}`)

    // Check for heading
    const heading = (await page.getByText('Protect Your Idea').count()) > 0
    console.log(`  Page heading: ${heading ? '✅' : '❌'}`)

    // Find form inputs - try multiple selectors
    let titleInput, descInput, fileInput

    // Title input selectors
    const titleSelectors = [
      'input[placeholder*="title" i]',
      'textarea[placeholder*="title" i]',
      'input[placeholder*="name" i]',
      'textarea[placeholder*="name" i]',
      'input[data-testid="idea-title-input"]',
      'textarea[data-testid="idea-title-input"]',
    ]

    for (const selector of titleSelectors) {
      const element = page.locator(selector).first()
      if ((await element.count()) > 0) {
        titleInput = element
        console.log(`  Title input found with: ${selector} ✅`)
        break
      }
    }

    // Description input selectors
    const descSelectors = [
      'textarea[placeholder*="description" i]',
      'textarea[placeholder*="describe" i]',
      'textarea[data-testid="idea-description-input"]',
    ]

    for (const selector of descSelectors) {
      const element = page.locator(selector).first()
      if ((await element.count()) > 0) {
        descInput = element
        console.log(`  Description input found with: ${selector} ✅`)
        break
      }
    }

    fileInput = page.locator('input[type="file"]').first()
    console.log(`  File input: ${(await fileInput.count()) > 0 ? '✅' : '❌'}`)

    // Check buttons
    const createButton = page.getByRole('button', { name: /create now/i })
    const continueButton = page.getByRole('button', { name: /continue setup/i })

    console.log(
      `  Create Now button: ${(await createButton.count()) > 0 ? '✅' : '❌'}`
    )
    console.log(
      `  Continue Setup button: ${(await continueButton.count()) > 0 ? '✅' : '❌'}`
    )

    // Step 5: Check initial button states
    console.log('\n5️⃣ Checking initial button states...')
    const createDisabled = await createButton.isDisabled()
    const continueDisabled = await continueButton.isDisabled()
    console.log(
      `  Buttons initially disabled: ${createDisabled && continueDisabled ? '✅' : '❌'}`
    )

    // Step 6: Fill form
    if (titleInput && descInput && fileInput) {
      console.log('\n6️⃣ Filling form...')

      await titleInput.fill('Automated Test Invention')
      console.log('  ✅ Title filled')

      await descInput.fill(
        'This is a test description for the multi-page Add IP flow. Testing the new protect page implementation.'
      )
      console.log('  ✅ Description filled')

      // Create and upload test file
      const testFilePath = path.join(__dirname, 'test-file.txt')
      fs.writeFileSync(
        testFilePath,
        'Test content for protect page automated testing'
      )
      await fileInput.setInputFiles(testFilePath)
      console.log('  ✅ File uploaded')

      await page.waitForTimeout(2000) // Wait for form processing
      await takeScreenshot(page, '04-form-filled')

      // Step 7: Check buttons are enabled
      console.log('\n7️⃣ Checking button states after fill...')
      const createEnabled = await createButton.isEnabled()
      const continueEnabled = await continueButton.isEnabled()
      console.log(
        `  Buttons now enabled: ${createEnabled && continueEnabled ? '✅' : '❌'}`
      )

      // Step 8: Check sessionStorage
      console.log('\n8️⃣ Checking sessionStorage...')
      const sessionData = await page.evaluate(() => {
        const data = sessionStorage.getItem('addIPFormData')
        return data ? JSON.parse(data) : null
      })

      if (sessionData) {
        console.log('  ✅ Session storage data:')
        console.log(`     Title: "${sessionData.title || 'Not set'}"`)
        console.log(
          `     Description: "${sessionData.description?.substring(0, 50) || 'Not set'}..."`
        )
        console.log(`     File: ${sessionData.fileName || 'Not set'}`)
        console.log(`     Duration: ${sessionData.duration} days`)
        console.log(`     View Only: ${sessionData.viewOnly}`)
      } else {
        console.log('  ❌ No session storage data found')
      }

      // Step 9: Test navigation
      if (continueEnabled) {
        console.log('\n9️⃣ Testing navigation to share page...')
        await continueButton.click()
        await page.waitForLoadState('networkidle')

        const currentPath = new URL(page.url()).pathname
        console.log(`  Navigated to: ${currentPath}`)
        console.log(
          `  Reached share page: ${currentPath === '/add-ip/share' ? '✅' : '❌'}`
        )

        if (currentPath === '/add-ip/share') {
          await takeScreenshot(page, '05-share-page')

          // Go back and check persistence
          console.log('\n🔄 Going back to check data persistence...')
          await page.goBack()
          await page.waitForLoadState('networkidle')

          const titleValue = await titleInput.inputValue()
          console.log(`  Data persisted: ${titleValue ? '✅' : '❌'}`)
          console.log(`  Title value: "${titleValue}"`)
          await takeScreenshot(page, '06-back-to-protect')
        }
      }

      // Cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
        console.log('\n🧹 Cleaned up test file')
      }
    } else {
      console.log('\n❌ Could not find all required form inputs')
    }

    console.log('\n✅ Test completed!')
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    await takeScreenshot(page, 'error-state')
  } finally {
    console.log(
      '\n🔍 Browser will remain open for 30 seconds for inspection...'
    )
    await page.waitForTimeout(30000)
    await browser.close()
    console.log('✅ Browser closed')
  }
}

runTest().catch(console.error)
