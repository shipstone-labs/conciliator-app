// Test script for the Protect page in the multi-page Add IP flow
// Run from /test/claude-sdk-mcp/ directory with: node ../protect-page-test.js

import { test, expect } from '@playwright/test'

test.describe('Add IP Protect Page Tests', () => {
  const baseURL = 'https://pr-146---conciliator-55rclsk2qa-uc.a.run.app'

  test.beforeEach(async ({ page }) => {
    // Navigate to the protect page
    await page.goto(`${baseURL}/add-ip/protect`)

    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('page renders with all expected elements', async ({ page }) => {
    // Check progress indicator
    await expect(page.locator('.progress-indicator')).toBeVisible()

    // Check "What Happens Next" card
    await expect(page.getByText('What Happens Next')).toBeVisible()
    await expect(page.getByText('Your idea is encrypted')).toBeVisible()

    // Check form header
    await expect(page.getByText('Protect Your Idea')).toBeVisible()

    // Check for input fields using test IDs
    const titleInput = page.getByTestId('idea-title-input')
    const descriptionInput = page.getByTestId('idea-description-input')
    const fileInput = page.getByTestId('file-upload-input')

    await expect(titleInput).toBeVisible()
    await expect(descriptionInput).toBeVisible()
    await expect(fileInput).toBeVisible()

    // Check buttons are disabled initially
    const createButton = page.getByTestId('protect-create-now-button')
    const continueButton = page.getByTestId('protect-continue-button')

    await expect(createButton).toBeDisabled()
    await expect(continueButton).toBeDisabled()
  })

  test('buttons enable when form is filled', async ({ page }) => {
    // Fill in the form
    await page.getByTestId('idea-title-input').fill('Test Invention')
    await page
      .getByTestId('idea-description-input')
      .fill('This is a test description for my invention')

    // Upload a test file
    // const fileInput = page.getByTestId('file-upload-input')
    // const testFilePath = path.join(process.cwd(), 'test-file.txt')

    // Create a test file first
    await page.evaluate(() => {
      const content = 'This is test content for the file upload'
      const blob = new Blob([content], { type: 'text/plain' })
      const file = new File([blob], 'test-file.txt', { type: 'text/plain' })

      // Manually trigger file input change
      const input = document.querySelector('[data-testid="file-upload-input"]')
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      input.files = dataTransfer.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    // Wait for file processing
    await page.waitForTimeout(1000)

    // Check buttons are now enabled
    const createButton = page.getByTestId('protect-create-now-button')
    const continueButton = page.getByTestId('protect-continue-button')

    await expect(createButton).toBeEnabled()
    await expect(continueButton).toBeEnabled()
  })

  test('Continue Setup navigates to share page', async ({ page }) => {
    // Fill form
    await page.getByTestId('idea-title-input').fill('Test Invention')
    await page.getByTestId('idea-description-input').fill('Test description')

    // Upload file
    await page.evaluate(() => {
      const content = 'Test content'
      const blob = new Blob([content], { type: 'text/plain' })
      const file = new File([blob], 'test.txt', { type: 'text/plain' })

      const input = document.querySelector('[data-testid="file-upload-input"]')
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      input.files = dataTransfer.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    await page.waitForTimeout(1000)

    // Click Continue Setup
    await page.getByTestId('protect-continue-button').click()

    // Should navigate to share page
    await expect(page).toHaveURL(`${baseURL}/add-ip/share`)
  })

  test('session storage persists data across navigation', async ({ page }) => {
    // Fill form
    await page.getByTestId('idea-title-input').fill('Persistent Invention')
    await page.getByTestId('idea-description-input').fill('This should persist')

    // Check sessionStorage
    const storedData = await page.evaluate(() => {
      return sessionStorage.getItem('addIPFormData')
    })

    const parsedData = JSON.parse(storedData)
    expect(parsedData.title).toBe('Persistent Invention')
    expect(parsedData.description).toBe('This should persist')

    // Navigate to test-context page to verify
    await page.goto(`${baseURL}/add-ip/test-context`)
    await page.waitForLoadState('networkidle')

    // Check if values are displayed
    await expect(
      page.getByText('"title": "Persistent Invention"')
    ).toBeVisible()
    await expect(
      page.getByText('"description": "This should persist"')
    ).toBeVisible()
  })
})

console.log('Test configuration:')
console.log('- Target URL:', baseURL)
console.log('- Testing: Protect page functionality')
console.log('- Key tests: Form validation, navigation, session persistence')
