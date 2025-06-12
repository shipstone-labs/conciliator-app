#!/usr/bin/env node

// Test that checks for "Add Idea" button to confirm login completion

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

async function clickLoginButton(page) {
  // Look in the navigation area specifically
  const navSelectors = [
    'nav button:has-text("Log in")',
    'nav button:has-text("Sign up")',
    'nav a:has-text("Log in")',
    'nav a:has-text("Sign up")',
    'header button:has-text("Log in")',
    'header button:has-text("Sign up")',
    '[data-testid="nav-auth-button"]',
    // Also try without nav restriction
    'button:has-text("Log in")',
    'button:has-text("Sign up")',
    'a:has-text("Log in")',
    'a:has-text("Sign up")',
  ]

  for (const selector of navSelectors) {
    try {
      const element = await page.locator(selector).first()
      if (await element.isVisible({ timeout: 500 })) {
        console.log(`   Found login element: ${selector}`)
        await element.click()
        return true
      }
    } catch (e) {
      // Continue trying
    }
  }

  return false
}

async function waitForAddIdeaButton(page) {
  console.log('\n⏳ Waiting for login completion...')
  console.log('   (Looking for "Add Idea" button in navigation)\n')

  const maxWaitTime = 180000 // 3 minutes
  const checkInterval = 2000 // Check every 2 seconds
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Check for "Add Idea" button - this indicates successful login
      const addIdeaSelectors = [
        'button:has-text("Add Idea")',
        'a:has-text("Add Idea")',
        'nav button:has-text("Add Idea")',
        'nav a:has-text("Add Idea")',
        '[data-testid="nav-add-idea"]',
        // Also try "Protect Idea" as it might be labeled differently
        'button:has-text("Protect Idea")',
        'a:has-text("Protect Idea")',
        'nav button:has-text("Protect Idea")',
        'nav a:has-text("Protect Idea")',
      ]

      for (const selector of addIdeaSelectors) {
        try {
          const element = await page.locator(selector).first()
          if (await element.isVisible({ timeout: 500 })) {
            console.log(`\n✅ Login complete! Found: ${selector}`)
            return element // Return the element so we can click it
          }
        } catch (e) {
          // Continue checking
        }
      }

      // Show different status based on what we see
      const onLoginPage =
        (await page.locator('text="Sign In"').count()) > 0 ||
        (await page.locator('input[placeholder*="email" i]').count()) > 0

      if (onLoginPage) {
        process.stdout.write(
          `\r⏳ On login page - please complete authentication...`
        )
      } else {
        process.stdout.write(
          `\r⏳ Checking for "Add Idea" button... ${Math.floor((Date.now() - startTime) / 1000)}s`
        )
      }
    } catch (error) {
      // Continue waiting
    }

    await page.waitForTimeout(checkInterval)
  }

  console.log('\n❌ Timeout - "Add Idea" button not found')
  return null
}

async function runTest() {
  console.log('🧪 Testing Add IP Protect Page')
  console.log('==============================\n')

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

    // Step 2: Find and click login button
    console.log('\n2️⃣ Looking for login button...')

    const loginClicked = await clickLoginButton(page)

    if (!loginClicked) {
      console.log('❌ Could not find login button')
      console.log('   Looking for elements in navigation...')

      // Debug: print what we can see in nav
      const navText = await page
        .locator('nav')
        .innerText()
        .catch(() => 'No nav found')
      console.log('   Nav content:', navText)

      const headerText = await page
        .locator('header')
        .innerText()
        .catch(() => 'No header found')
      console.log('   Header content:', headerText)

      return
    }

    await page.waitForTimeout(2000)
    await takeScreenshot(page, '02-after-login-click')

    // Step 3: Wait for "Add Idea" button to appear
    console.log('\n3️⃣ MANUAL LOGIN REQUIRED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Please complete the login process.')
    console.log('The test will continue automatically when it sees')
    console.log('the "Add Idea" button in the navigation.')

    const addIdeaButton = await waitForAddIdeaButton(page)

    if (!addIdeaButton) {
      console.log('❌ Could not find "Add Idea" button after login')
      return
    }

    await takeScreenshot(page, '03-logged-in')

    // Step 4: Click Add Idea to go to protect page
    console.log('\n4️⃣ Clicking "Add Idea" button...')
    await addIdeaButton.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Verify we're on the protect page
    const currentUrl = page.url()
    console.log(`   Current URL: ${currentUrl}`)

    const onProtectPage =
      currentUrl.includes('/add-ip') ||
      (await page.getByText('Protect Your Idea').count()) > 0

    if (!onProtectPage) {
      console.log('❌ Not on Add IP page')
      return
    }

    console.log('   ✅ On Add IP/Protect page!')
    await takeScreenshot(page, '04-protect-page')

    // Step 5: Test the page elements
    console.log('\n5️⃣ Verifying page elements...')

    const elements = {
      'Progress indicator/Navigation': await page
        .locator('nav')
        .first()
        .isVisible(),
      'Info card (What Happens Next)':
        (await page.getByText('What Happens Next').count()) > 0,
      'Page heading (Protect Your Idea)':
        (await page.getByText('Protect Your Idea').count()) > 0,
      'Create Now button':
        (await page.getByRole('button', { name: /create now/i }).count()) > 0,
      'Continue Setup button':
        (await page.getByRole('button', { name: /continue setup/i }).count()) >
        0,
    }

    for (const [name, found] of Object.entries(elements)) {
      console.log(`  ${name}: ${found ? '✅' : '❌'}`)
    }

    // Step 6: Find and fill form inputs
    console.log('\n6️⃣ Testing form functionality...')

    // Find form inputs - try various selectors
    const titleInput = await page.locator('textarea').first()
    const descInput = await page.locator('textarea').nth(1)
    const fileInput = await page.locator('input[type="file"]').first()

    if ((await titleInput.count()) > 0 && (await descInput.count()) > 0) {
      console.log('  ✅ Found form inputs')

      // Check initial button states
      const createButton = page.getByRole('button', { name: /create now/i })
      const continueButton = page.getByRole('button', {
        name: /continue setup/i,
      })

      const initiallyDisabled =
        (await createButton.isDisabled()) && (await continueButton.isDisabled())
      console.log(
        `  Buttons initially disabled: ${initiallyDisabled ? '✅' : '❌'}`
      )

      // Fill the form
      console.log('\n  Filling form...')
      await titleInput.fill('Automated Test - Add Idea Detection')
      console.log('  ✅ Title entered')

      await descInput.fill(
        'This test verifies the protect page works correctly when accessed via the Add Idea button after proper login.'
      )
      console.log('  ✅ Description entered')

      // Upload file
      if ((await fileInput.count()) > 0) {
        const testFilePath = path.join(__dirname, 'test-invention.txt')
        fs.writeFileSync(
          testFilePath,
          'Test invention content for automated testing'
        )
        await fileInput.setInputFiles(testFilePath)
        console.log('  ✅ File uploaded')

        // Cleanup
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath)
        }
      }

      await page.waitForTimeout(2000)
      await takeScreenshot(page, '05-form-filled')

      // Check if buttons are now enabled
      const nowEnabled =
        (await createButton.isEnabled()) && (await continueButton.isEnabled())
      console.log(
        `\n  Buttons enabled after filling: ${nowEnabled ? '✅' : '❌'}`
      )

      // Check session storage
      console.log('\n7️⃣ Checking session storage...')
      const sessionData = await page.evaluate(() => {
        const data = sessionStorage.getItem('addIPFormData')
        return data ? JSON.parse(data) : null
      })

      if (sessionData) {
        console.log('  ✅ Session storage is working')
        console.log(`     Title: "${sessionData.title}"`)
        console.log(`     Has description: ${!!sessionData.description}`)
        console.log(`     Has file: ${!!sessionData.fileName}`)
      }

      // Test navigation
      if (await continueButton.isEnabled()) {
        console.log('\n8️⃣ Testing navigation to Share page...')
        await continueButton.click()
        await page.waitForLoadState('networkidle')

        const newUrl = page.url()
        const onSharePage = newUrl.includes('/add-ip/share')
        console.log(`  Navigated to: ${new URL(newUrl).pathname}`)
        console.log(`  On share page: ${onSharePage ? '✅' : '❌'}`)

        if (onSharePage) {
          await takeScreenshot(page, '06-share-page')

          // Test going back
          console.log('\n  Testing back navigation...')
          await page.goBack()
          await page.waitForLoadState('networkidle')

          const titlePersisted = await titleInput.inputValue()
          console.log(`  Data persisted: ${titlePersisted ? '✅' : '❌'}`)
        }
      }
    }

    console.log('\n✅ All tests completed!')
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
