/**
 * Test script to verify hamburger menu interaction works
 * Run this with MCP Puppeteer connected to test the fix
 */

// This script is designed to be run via Claude's MCP Puppeteer
// It tests different approaches to clicking the hamburger menu

async function testHamburgerMenuApproaches() {
  console.log('🧪 Testing hamburger menu interaction approaches\n')

  // Get current URL
  const currentUrl = window.location.href
  console.log('📍 Current URL:', currentUrl)

  // Approach 1: Standard querySelector + click
  console.log('\n1️⃣ Testing standard click...')
  try {
    const menu1 = document.querySelector('[data-testid="nav-account-menu"]')
    if (menu1) {
      menu1.click()
      console.log('✅ Standard click executed')
    } else {
      console.log('❌ Menu button not found')
    }
  } catch (e) {
    console.log('❌ Error:', e.message)
  }

  // Wait a bit and check if dropdown opened
  await new Promise((resolve) => setTimeout(resolve, 500))
  const dropdown1 = document.querySelector(
    '[data-testid="nav-account-dropdown"]'
  )
  console.log('   Dropdown visible:', !!dropdown1)

  // Close if opened
  if (dropdown1) {
    document.body.click()
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Approach 2: Focus + keyboard
  console.log('\n2️⃣ Testing focus + Enter key...')
  try {
    const menu2 = document.querySelector('[data-testid="nav-account-menu"]')
    if (menu2) {
      menu2.focus()
      menu2.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      )
      menu2.dispatchEvent(
        new KeyboardEvent('keyup', { key: 'Enter', bubbles: true })
      )
      console.log('✅ Focus + Enter executed')
    }
  } catch (e) {
    console.log('❌ Error:', e.message)
  }

  await new Promise((resolve) => setTimeout(resolve, 500))
  const dropdown2 = document.querySelector(
    '[data-testid="nav-account-dropdown"]'
  )
  console.log('   Dropdown visible:', !!dropdown2)

  // Close if opened
  if (dropdown2) {
    document.body.click()
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Approach 3: MouseEvent with all properties
  console.log('\n3️⃣ Testing full MouseEvent...')
  try {
    const menu3 = document.querySelector('[data-testid="nav-account-menu"]')
    if (menu3) {
      const rect = menu3.getBoundingClientRect()
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        button: 0,
        buttons: 1,
      })
      menu3.dispatchEvent(clickEvent)
      console.log('✅ Full MouseEvent dispatched')
    }
  } catch (e) {
    console.log('❌ Error:', e.message)
  }

  await new Promise((resolve) => setTimeout(resolve, 500))
  const dropdown3 = document.querySelector(
    '[data-testid="nav-account-dropdown"]'
  )
  console.log('   Dropdown visible:', !!dropdown3)

  // Close if opened
  if (dropdown3) {
    document.body.click()
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Approach 4: Trigger Radix UI programmatically
  console.log('\n4️⃣ Testing Radix UI trigger...')
  try {
    const menu4 = document.querySelector('[data-testid="nav-account-menu"]')
    if (menu4) {
      // Try to find the Radix trigger in React fiber
      const reactKey = Object.keys(menu4).find((key) =>
        key.startsWith('__react')
      )
      if (reactKey) {
        console.log('   Found React fiber')
        // Dispatch both mousedown and click
        menu4.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
        menu4.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
        menu4.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        console.log('✅ Radix UI events dispatched')
      }
    }
  } catch (e) {
    console.log('❌ Error:', e.message)
  }

  await new Promise((resolve) => setTimeout(resolve, 500))
  const dropdown4 = document.querySelector(
    '[data-testid="nav-account-dropdown"]'
  )
  console.log('   Dropdown visible:', !!dropdown4)

  // Summary
  console.log('\n📊 Test Summary:')
  console.log(
    '   If any approach showed "Dropdown visible: true", that approach works!'
  )
  console.log('   Use that approach in your automation scripts.')

  // Return which approach worked
  return {
    standard: !!dropdown1,
    keyboard: !!dropdown2,
    fullMouse: !!dropdown3,
    radixUI: !!dropdown4,
  }
}

// Function to use in MCP automation
// biome-ignore lint/correctness/noUnusedVariables: This function is exported for use in other scripts
async function clickHamburgerMenuMCP() {
  // Try the most reliable approach first (based on test results)
  const menu = document.querySelector('[data-testid="nav-account-menu"]')
  if (!menu) return false

  // Approach that typically works best with Radix UI
  const rect = menu.getBoundingClientRect()
  const clickEvent = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    button: 0,
    buttons: 1,
  })

  menu.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  menu.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  menu.dispatchEvent(clickEvent)

  // Wait for dropdown
  await new Promise((resolve) => setTimeout(resolve, 300))

  return !!document.querySelector('[data-testid="nav-account-dropdown"]')
}

// Run the test
testHamburgerMenuApproaches()
