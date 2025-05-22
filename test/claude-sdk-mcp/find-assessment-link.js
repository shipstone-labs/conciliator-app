// @ts-check
const { chromium } = require('playwright')
const path = require('node:path')
// const fs = require('node:fs') // Not used in this file
;(async () => {
  // Launch browser with visible UI
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('Starting link finder...')

    // Go to the website
    console.log('Navigating to safeidea.net "how it works" page...')
    await page.goto('https://safeidea.net')
    await page.waitForLoadState('networkidle')

    // Find and click the "Learn How It Works" button
    const learnButton = await page
      .getByText('Learn How It Works', { exact: true })
      .first()
    if ((await learnButton.count()) === 0) {
      throw new Error('Could not find the "Learn How It Works" button')
    }

    console.log('Found the "Learn How It Works" button! Clicking...')
    await learnButton.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Find all buttons, links, and clickable elements on the page
    console.log('\nScanning for all clickable elements on the page:')

    // Extract all links
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map((a) => {
        return {
          text: a.innerText.trim(),
          href: a.href,
          id: a.id,
          classes: a.className,
        }
      })
    })

    // Extract all buttons
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map((button) => {
        return {
          text: button.innerText.trim(),
          id: button.id,
          classes: button.className,
        }
      })
    })

    // Find elements that look like they might be related to assessment
    const assessmentLinkKeywords = [
      'assess',
      'test',
      'question',
      'quiz',
      'survey',
      'subscription',
      'start',
      'begin',
    ]

    console.log('\n--- LINKS ---')
    console.log(JSON.stringify(links, null, 2))

    console.log('\n--- BUTTONS ---')
    console.log(JSON.stringify(buttons, null, 2))

    console.log('\n--- POTENTIAL ASSESSMENT LINKS/BUTTONS ---')

    // Check links for assessment keywords
    const potentialAssessmentLinks = links.filter((link) =>
      assessmentLinkKeywords.some(
        (keyword) =>
          link.text.toLowerCase().includes(keyword.toLowerCase()) ||
          link.href.toLowerCase().includes(keyword.toLowerCase())
      )
    )

    // Check buttons for assessment keywords
    const potentialAssessmentButtons = buttons.filter((button) =>
      assessmentLinkKeywords.some(
        (keyword) =>
          button.text.toLowerCase().includes(keyword.toLowerCase()) ||
          button.id?.toLowerCase().includes(keyword.toLowerCase()) ||
          button.classes?.toLowerCase().includes(keyword.toLowerCase())
      )
    )

    // Print potential assessment links
    console.log('Potential assessment links:')
    if (potentialAssessmentLinks.length > 0) {
      potentialAssessmentLinks.forEach((link, index) => {
        console.log(`${index + 1}. Text: "${link.text}", Href: ${link.href}`)
      })
    } else {
      console.log('No potential assessment links found.')
    }

    // Print potential assessment buttons
    console.log('\nPotential assessment buttons:')
    if (potentialAssessmentButtons.length > 0) {
      potentialAssessmentButtons.forEach((button, index) => {
        console.log(`${index + 1}. Text: "${button.text}"`)
      })
    } else {
      console.log('No potential assessment buttons found.')
    }

    // Check elements with "Subscription" text since we see it in the breadcrumb
    console.log('\nLooking for "Subscription" related elements:')
    const subscriptionLinks = await page
      .locator('a:has-text("Subscription")')
      .all()
    for (const link of subscriptionLinks) {
      console.log(
        `Subscription link: "${await link.innerText()}", href: ${await link.getAttribute('href')}`
      )
    }

    // Take a screenshot for reference
    await page.screenshot({
      path: path.join(
        __dirname,
        'screenshots',
        'how-it-works-page-analysis.png'
      ),
    })
  } catch (error) {
    console.error('Script failed:', error)
  } finally {
    console.log('\nClosing browser...')
    await browser.close()
  }
})()
