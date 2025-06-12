#!/usr/bin/env node

// Test with correct understanding of the navigation structure

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

    // Step 2: Click hamburger menu to access login
    console.log('\n2️⃣ Opening account menu...')

    // Click the hamburger menu (Menu icon)
    const hamburgerMenu = page.locator('[data-testid="nav-account-menu"]')
    if ((await hamburgerMenu.count()) === 0) {
      console.log('❌ Could not find hamburger menu')
      return
    }

    await hamburgerMenu.click()
    await page.waitForTimeout(500)
    console.log('   ✅ Account menu opened')

    // Click Sign In in the dropdown
    const signInButton = page.locator('[data-testid="nav-account-login"]')
    if ((await signInButton.count()) > 0) {
      console.log('   ✅ Found Sign In button')
      await signInButton.click()
      await page.waitForTimeout(2000)
      await takeScreenshot(page, '02-login-modal')
    } else {
      console.log('   ℹ️  No Sign In button - might already be logged in')
    }

    // Step 3: Wait for login completion by checking for "Add Idea" in nav
    console.log('\n3️⃣ MANUAL LOGIN REQUIRED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Please complete the login process in the browser.')
    console.log(
      'The test will continue when "Add Idea" appears in navigation.\n'
    )

    const maxWaitTime = 180000 // 3 minutes
    const checkInterval = 2000
    const startTime = Date.now()

    let addIdeaLink = null

    while (Date.now() - startTime < maxWaitTime) {
      // Check for Add Idea link in navigation
      const addIdea = page.locator('[data-testid="nav-add-idea"]')
      if ((await addIdea.count()) > 0 && (await addIdea.isVisible())) {
        console.log('\n✅ Login successful! Found Add Idea link')
        addIdeaLink = addIdea
        break
      }

      // Also check for the text "Add Idea" in nav
      const addIdeaText = page.locator('nav >> text="Add Idea"')
      if ((await addIdeaText.count()) > 0 && (await addIdeaText.isVisible())) {
        console.log('\n✅ Login successful! Found Add Idea link')
        addIdeaLink = addIdeaText
        break
      }

      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      process.stdout.write(`\r⏳ Waiting for Add Idea link... ${elapsed}s`)

      await page.waitForTimeout(checkInterval)
    }

    if (!addIdeaLink) {
      console.log('\n❌ Timeout - Add Idea link not found')
      return
    }

    await takeScreenshot(page, '03-logged-in')

    // Step 4: Click Add Idea to navigate to protect page
    console.log('\n4️⃣ Clicking Add Idea...')
    await addIdeaLink.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const currentUrl = page.url()
    console.log(`   Current URL: ${currentUrl}`)

    // Verify we're on the protect page
    const onProtectPage =
      currentUrl.includes('/add-ip/protect') ||
      (await page.getByText('Protect Your Idea').count()) > 0

    if (!onProtectPage) {
      console.log(
        '   ℹ️  Not on /add-ip/protect - might be on old single-page flow'
      )
    }

    await takeScreenshot(page, '04-add-ip-page')

    // Step 5: Verify page elements
    console.log('\n5️⃣ Checking page elements...')

    const elements = {
      'Page heading':
        (await page.getByText('Protect Your Idea').count()) > 0 ||
        (await page.getByText('Add Your Idea').count()) > 0,
      'Info section': (await page.getByText('What Happens Next').count()) > 0,
      'Title input': (await page.locator('textarea').first().count()) > 0,
      'Description input': (await page.locator('textarea').nth(1).count()) > 0,
      'File upload': (await page.locator('input[type="file"]').count()) > 0,
      Buttons: (await page.getByRole('button').count()) > 0,
    }

    for (const [name, found] of Object.entries(elements)) {
      console.log(`  ${name}: ${found ? '✅' : '❌'}`)
    }

    // Step 6: Test form functionality
    console.log('\n6️⃣ Testing form...')

    const titleInput = page.locator('textarea').first()
    const descInput = page.locator('textarea').nth(1)
    const fileInput = page.locator('input[type="file"]').first()

    if ((await titleInput.count()) > 0 && (await descInput.count()) > 0) {
      // Fill the form
      await titleInput.fill('Test Invention - Navigation Flow')
      console.log('  ✅ Title entered')

      await descInput.fill(
        'Testing the protect page accessed through proper navigation after authentication.'
      )
      console.log('  ✅ Description entered')

      // Upload file
      const testFilePath = path.join(__dirname, 'test.txt')
      fs.writeFileSync(testFilePath, 'Test content')
      await fileInput.setInputFiles(testFilePath)
      console.log('  ✅ File uploaded')

      await page.waitForTimeout(2000)
      await takeScreenshot(page, '05-form-filled')

      // Check for enabled buttons
      const buttons = await page.getByRole('button').all()
      let continueButton = null

      for (const button of buttons) {
        const text = await button.innerText()
        if (text.toLowerCase().includes('continue')) {
          continueButton = button
          const enabled = await button.isEnabled()
          console.log(
            `\n  ${text} button: ${enabled ? 'Enabled ✅' : 'Disabled ❌'}`
          )
        }
      }

      // Check session storage
      const sessionData = await page.evaluate(() => {
        const data = sessionStorage.getItem('addIPFormData')
        return data ? JSON.parse(data) : null
      })

      if (sessionData) {
        console.log('\n  ✅ Session storage working')
        console.log(`     Title: "${sessionData.title}"`)
      }

      // Test navigation if button found
      if (continueButton && (await continueButton.isEnabled())) {
        console.log('\n7️⃣ Testing navigation...')
        await continueButton.click()
        await page.waitForLoadState('networkidle')

        const newUrl = page.url()
        if (newUrl.includes('/share')) {
          console.log('  ✅ Navigated to share page')
          await takeScreenshot(page, '06-share-page')
        }
      }

      // Cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }

    console.log('\n✅ Test completed successfully!')
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
