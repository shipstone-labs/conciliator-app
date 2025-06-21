/**
 * Authentication helper for SafeIdea tests
 * Handles login flow with improved hamburger menu interaction
 */

const {
  clickHamburgerMenu,
  verifyDropdownOpen,
} = require('./hamburger-menu-test')

async function waitForLogin(page, options = {}) {
  const { timeout = 120000, checkInterval = 1000 } = options

  console.log('🔐 Checking authentication status...')

  // First check if already logged in
  try {
    await page.waitForSelector('[data-testid="nav-add-idea"]', {
      timeout: 3000,
    })
    console.log('✅ Already authenticated')
    return true
  } catch {
    console.log('❌ Not authenticated, initiating login flow...')
  }

  // Try to open hamburger menu
  console.log('\n📱 Opening hamburger menu...')
  const menuClicked = await clickHamburgerMenu(page)

  if (!menuClicked) {
    console.log('❌ Failed to open hamburger menu')
    console.log('💡 Please manually click the hamburger menu in the browser')

    // Wait for manual intervention
    console.log('\n⏳ Waiting for manual login...')
    console.log('   1. Click the hamburger menu (☰) in top right')
    console.log('   2. Click "Sign In"')
    console.log('   3. Complete the login process')
    console.log(`   4. Waiting up to ${timeout / 1000} seconds...\n`)
  } else {
    // Verify dropdown opened
    const dropdownOpen = await verifyDropdownOpen(page)

    if (dropdownOpen) {
      // Try to click Sign In
      try {
        await page.click('[data-testid="nav-account-login"]')
        console.log('✅ Clicked Sign In button')
      } catch {
        console.log('❌ Could not click Sign In button')
        console.log('💡 Please manually click "Sign In" in the dropdown')
      }
    }
  }

  // Wait for login to complete
  const startTime = Date.now()
  let lastCheck = 0

  while (Date.now() - startTime < timeout) {
    try {
      // Check for Add Idea button (indicates logged in)
      await page.waitForSelector('[data-testid="nav-add-idea"]', {
        timeout: checkInterval,
      })
      console.log('\n✅ Login successful!')
      return true
    } catch {
      // Show progress every 10 seconds
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      if (elapsed - lastCheck >= 10) {
        lastCheck = elapsed
        console.log(`⏳ Still waiting for login... ${elapsed}s elapsed`)
      }
    }

    // Small delay before next check
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log(`\n❌ Login timeout after ${timeout / 1000} seconds`)
  return false
}

// Alternative approach using Claude SDK if available
async function waitForLoginWithSDK(sdk, options = {}) {
  const page = await sdk.getPage()
  return waitForLogin(page, options)
}

// Check if user is logged in without waiting
async function isLoggedIn(page) {
  try {
    await page.waitForSelector('[data-testid="nav-add-idea"]', {
      timeout: 1000,
    })
    return true
  } catch {
    return false
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    waitForLogin,
    waitForLoginWithSDK,
    isLoggedIn,
  }
}
