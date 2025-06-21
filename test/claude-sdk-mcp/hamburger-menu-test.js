/**
 * Test helper for clicking the hamburger menu in SafeIdea
 * Tries multiple approaches to handle Radix UI dropdown menu
 */

async function clickHamburgerMenu(page) {
  console.log('🍔 Attempting to click hamburger menu...')

  // Approach 1: Try standard click with testid
  try {
    await page.click('[data-testid="nav-account-menu"]')
    console.log('✅ Clicked using testid')
    return true
  } catch (_e) {
    console.log('❌ Standard testid click failed')
  }

  // Approach 2: Try clicking with force
  try {
    await page.click('[data-testid="nav-account-menu"]', { force: true })
    console.log('✅ Clicked using force option')
    return true
  } catch (_e) {
    console.log('❌ Force click failed')
  }

  // Approach 3: Try using aria-label
  try {
    await page.click('[aria-label="Menu"]')
    console.log('✅ Clicked using aria-label')
    return true
  } catch (_e) {
    console.log('❌ Aria-label click failed')
  }

  // Approach 4: Try using JavaScript click
  try {
    await page.evaluate(() => {
      const menuButton = document.querySelector(
        '[data-testid="nav-account-menu"]'
      )
      if (menuButton) {
        menuButton.click()
        return true
      }
      return false
    })
    console.log('✅ Clicked using JavaScript')
    return true
  } catch (_e) {
    console.log('❌ JavaScript click failed')
  }

  // Approach 5: Try dispatching click event directly
  try {
    await page.evaluate(() => {
      const menuButton = document.querySelector(
        '[data-testid="nav-account-menu"]'
      )
      if (menuButton) {
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
        })
        menuButton.dispatchEvent(clickEvent)
        return true
      }
      return false
    })
    console.log('✅ Clicked using dispatched event')
    return true
  } catch (_e) {
    console.log('❌ Dispatched event failed')
  }

  // Approach 6: Try focusing then Enter key
  try {
    await page.focus('[data-testid="nav-account-menu"]')
    await page.keyboard.press('Enter')
    console.log('✅ Clicked using focus + Enter')
    return true
  } catch (_e) {
    console.log('❌ Focus + Enter failed')
  }

  // Approach 7: Try with Puppeteer's waitForSelector then click
  try {
    const button = await page.waitForSelector(
      '[data-testid="nav-account-menu"]',
      {
        visible: true,
        timeout: 5000,
      }
    )
    await button.click()
    console.log('✅ Clicked after waitForSelector')
    return true
  } catch (_e) {
    console.log('❌ WaitForSelector + click failed')
  }

  console.log('❌ All hamburger menu click attempts failed')
  return false
}

// Function to verify dropdown is open
async function verifyDropdownOpen(page) {
  try {
    // Check if dropdown content is visible
    await page.waitForSelector('[data-testid="nav-account-dropdown"]', {
      visible: true,
      timeout: 2000,
    })
    console.log('✅ Dropdown menu is open')
    return true
  } catch {
    // Alternative check using role
    try {
      await page.waitForSelector('[role="menu"]', {
        visible: true,
        timeout: 2000,
      })
      console.log('✅ Dropdown menu is open (found by role)')
      return true
    } catch {
      console.log('❌ Dropdown menu did not open')
      return false
    }
  }
}

// Main test function
async function testHamburgerMenu(page) {
  console.log('🧪 Starting hamburger menu test...\n')

  // Try clicking
  const clicked = await clickHamburgerMenu(page)

  if (clicked) {
    // Verify it opened
    const isOpen = await verifyDropdownOpen(page)

    if (isOpen) {
      console.log('\n✅ Hamburger menu test PASSED')

      // Try clicking Sign In
      try {
        await page.click('[data-testid="nav-account-login"]')
        console.log('✅ Successfully clicked Sign In')
      } catch {
        console.log('ℹ️  Could not click Sign In (might already be logged in)')
      }
    } else {
      console.log('\n❌ Hamburger menu test FAILED - menu did not open')
    }
  } else {
    console.log('\n❌ Hamburger menu test FAILED - could not click menu')
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    clickHamburgerMenu,
    verifyDropdownOpen,
    testHamburgerMenu,
  }
}

// Run test if called directly
if (typeof window !== 'undefined') {
  testHamburgerMenu(window)
}
