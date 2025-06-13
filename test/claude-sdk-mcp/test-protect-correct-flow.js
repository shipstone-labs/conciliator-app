#!/usr/bin/env node

// Test following the correct user flow: Homepage → Login → Navigate to Protect

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

async function waitForLoginCompletion(page) {
  console.log('\n⏳ Waiting for login to complete...')
  console.log('   (Looking for logged-in indicators on the page)\n')

  const maxWaitTime = 180000 // 3 minutes
  const checkInterval = 2000 // Check every 2 seconds
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Check if we're still on a login/auth page
      const onLoginPage =
        (await page.locator('text="Sign In"').count()) > 0 ||
        (await page.locator('input[placeholder*="email" i]').count()) > 0 ||
        page.url().includes('/auth') ||
        page.url().includes('/login')

      if (onLoginPage) {
        process.stdout.write(`\r⏳ Still on login page... waiting...`)
      } else {
        // Check for logged-in indicators
        const loggedInIndicators = [
          'button:has-text("Account")',
          'button:has-text("Log out")',
          '[data-testid="nav-account-menu"]',
          'a[href="/add-ip"]', // "Protect Idea" link might only show when logged in
          'button:has-text("Protect Idea")',
        ]

        for (const selector of loggedInIndicators) {
          try {
            const element = await page.locator(selector).first()
            if (await element.isVisible({ timeout: 500 })) {
              console.log(`\n✅ Login successful! Found: ${selector}`)
              return true
            }
          } catch (e) {
            // Continue checking
          }
        }

        process.stdout.write(`\r⏳ Checking for login completion...`)
      }
    } catch (error) {
      // Continue waiting
    }

    await page.waitForTimeout(checkInterval)
  }

  console.log('\n❌ Timeout waiting for login')
  return false
}

async function runTest() {
  console.log('🧪 Testing Add IP Protect Page - Correct Flow')
  console.log('============================================\n')

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

    // Step 2: Click login button
    console.log('\n2️⃣ Looking for login button...')

    const loginSelectors = [
      'button:has-text("Log in")',
      'button:has-text("Sign up")',
      'button:has-text("Login")',
      '[data-testid="nav-auth-button"]',
      'a:has-text("Log in")',
    ]

    let loginClicked = false
    for (const selector of loginSelectors) {
      try {
        const element = await page.locator(selector).first()
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`   Found login button: ${selector}`)
          await element.click()
          loginClicked = true
          break
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!loginClicked) {
      console.log('❌ Could not find login button')
      return
    }

    await page.waitForTimeout(2000)
    await takeScreenshot(page, '02-login-modal')

    // Step 3: Wait for user to complete login
    console.log('\n3️⃣ MANUAL LOGIN REQUIRED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Please complete the login process:')
    console.log('  1. Enter your email')
    console.log('  2. Complete the authentication flow')
    console.log("  3. Wait until you're back on the site")

    const loggedIn = await waitForLoginCompletion(page)

    if (!loggedIn) {
      console.log('❌ Login was not completed')
      return
    }

    await takeScreenshot(page, '03-after-login')

    // Step 4: Navigate to Add IP / Protect page
    console.log('\n4️⃣ Navigating to Add IP page...')

    // Try to find and click the "Protect Idea" or "Add IP" button/link
    const addIpSelectors = [
      'a[href="/add-ip"]',
      'button:has-text("Protect Idea")',
      'a:has-text("Protect Idea")',
      'button:has-text("Add IP")',
      '[data-testid="nav-add-ip"]',
    ]

    let navigatedToAddIp = false
    for (const selector of addIpSelectors) {
      try {
        const element = await page.locator(selector).first()
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`   Found Add IP link: ${selector}`)
          await element.click()
          navigatedToAddIp = true
          break
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!navigatedToAddIp) {
      // Try direct navigation as fallback
      console.log('   Trying direct navigation to /add-ip/protect')
      await page.goto(`${baseURL}/add-ip/protect`)
    }

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Verify we're on the protect page
    const onProtectPage =
      page.url().includes('/add-ip/protect') ||
      (await page.getByText('Protect Your Idea').count()) > 0

    if (!onProtectPage) {
      console.log('❌ Not on protect page. Current URL:', page.url())
      await takeScreenshot(page, '04-wrong-page')
      return
    }

    console.log('   ✅ On protect page!')
    await takeScreenshot(page, '04-protect-page')

    // Step 5: Verify page elements
    console.log('\n5️⃣ Verifying page elements...')

    // Check key elements
    const elements = {
      Navigation: await page.locator('nav').first().isVisible(),
      'Info card (What Happens Next)': await page
        .getByText('What Happens Next')
        .isVisible(),
      'Page heading': await page.getByText('Protect Your Idea').isVisible(),
      'Create Now button': await page
        .getByRole('button', { name: /create now/i })
        .isVisible(),
      'Continue Setup button': await page
        .getByRole('button', { name: /continue setup/i })
        .isVisible(),
    }

    for (const [name, visible] of Object.entries(elements)) {
      console.log(`  ${name}: ${visible ? '✅' : '❌'}`)
    }

    // Step 6: Find and test form inputs
    console.log('\n6️⃣ Testing form inputs...')

    // Find inputs with flexible selectors
    const titleInput = page.locator('textarea').first() // Usually title is first textarea
    const descInput = page.locator('textarea').nth(1) // Description is usually second
    const fileInput = page.locator('input[type="file"]').first()

    const hasInputs =
      (await titleInput.count()) > 0 &&
      (await descInput.count()) > 0 &&
      (await fileInput.count()) > 0

    if (hasInputs) {
      console.log('  ✅ Found all form inputs')

      // Fill form
      await titleInput.fill('Test Invention via Correct Flow')
      console.log('  ✅ Title filled')

      await descInput.fill(
        'Testing the protect page after proper authentication flow. This ensures the page works correctly when accessed the right way.'
      )
      console.log('  ✅ Description filled')

      // Create and upload file
      const testFilePath = path.join(__dirname, 'test-doc.txt')
      fs.writeFileSync(testFilePath, 'Test invention document content')
      await fileInput.setInputFiles(testFilePath)
      console.log('  ✅ File uploaded')

      await page.waitForTimeout(2000)
      await takeScreenshot(page, '05-form-completed')

      // Check button states
      const createButton = page.getByRole('button', { name: /create now/i })
      const continueButton = page.getByRole('button', {
        name: /continue setup/i,
      })

      const buttonsEnabled =
        (await createButton.isEnabled()) && (await continueButton.isEnabled())
      console.log(`\n  Buttons enabled: ${buttonsEnabled ? '✅' : '❌'}`)

      // Check session storage
      const sessionData = await page.evaluate(() => {
        const data = sessionStorage.getItem('addIPFormData')
        return data ? JSON.parse(data) : null
      })

      if (sessionData) {
        console.log('\n  ✅ Session storage active')
        console.log(`     Title saved: "${sessionData.title}"`)
      }

      // Test navigation to share page
      if (await continueButton.isEnabled()) {
        console.log('\n7️⃣ Testing navigation to share page...')
        await continueButton.click()
        await page.waitForLoadState('networkidle')

        const onSharePage = page.url().includes('/add-ip/share')
        console.log(`  Navigated to share page: ${onSharePage ? '✅' : '❌'}`)

        if (onSharePage) {
          await takeScreenshot(page, '06-share-page')
        }
      }

      // Cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    } else {
      console.log('  ❌ Could not find form inputs')
    }

    console.log('\n✅ Test completed!')
  } catch (error) {
    console.error('\n❌ Test error:', error.message)
    await takeScreenshot(page, 'error-state')
  } finally {
    console.log('\n🔍 Browser stays open for 30 seconds...')
    await page.waitForTimeout(30000)
    await browser.close()
  }
}

runTest().catch(console.error)
