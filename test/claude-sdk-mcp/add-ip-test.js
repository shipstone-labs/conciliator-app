/**
 * Test script for adding an IP/idea to SafeIdea
 * This script will pause for manual login before proceeding
 */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const { saveIdea } = require('./generate-test-idea')

async function runAddIPTest() {
  // Generate a proper synthetic idea
  console.log('🧬 Generating synthetic idea for testing...')
  const { jsonPath, mdPath, ideaJson } = saveIdea()
  
  // Use the generated idea data
  const TEST_DATA = {
    title: ideaJson.title,
    description: ideaJson.description,
    testFilePath: mdPath, // The ENTIRE markdown file will be uploaded as the protected IP document
    businessModel: ideaJson.businessModel.toLowerCase().replace(/[^a-z]/g, ''), // Clean up for form
    useAIAgent: true, // Enable AI agent for better testing
    ndaRequired: ideaJson.ndaRequired
  }
  
  console.log('\n📄 Test Data Prepared:')
  console.log(`   Title: ${TEST_DATA.title}`)
  console.log(`   Description: ${TEST_DATA.description.substring(0, 100)}...`)
  console.log(`   IP Document: ${TEST_DATA.testFilePath}`)
  console.log(`   Business Model: ${TEST_DATA.businessModel}`)
  console.log(`   File contains: Full trade secret document with restricted information`)

  const browser = await chromium.launch({ 
    headless: false, // Run in headed mode so you can login
    slowMo: 100 // Slow down actions for visibility
  })
  
  const context = await browser.newContext()
  const page = await context.newPage()
  
  // Set a reasonable timeout
  page.setDefaultTimeout(30000)
  
  const testUrl = process.env.TEST_URL || 'https://pr-137---conciliator-55rclsk2qa-uc.a.run.app'
  
  try {
    // Step 1: Navigate to the site
    console.log('🌐 Navigating to:', testUrl)
    await page.goto(testUrl)
    await page.waitForLoadState('networkidle')
    
    // Step 2: Wait for manual login
    console.log('\n⏸️  MANUAL ACTION REQUIRED:')
    console.log('   1. Click on the account button')
    console.log('   2. Complete the login process')
    console.log('   3. Press Enter in this terminal when logged in...\n')
    
    await new Promise(resolve => {
      process.stdin.once('data', resolve)
    })
    
    console.log('✅ Continuing with test...')
    
    // Step 3: Navigate to Add Idea page
    console.log('📝 Navigating to Add Idea page...')
    await page.click('[data-testid="nav-add-idea"]')
    await page.waitForLoadState('networkidle')
    
    // Step 4: Fill in title and description FIRST
    console.log('✏️  Step 1: Entering idea title and description...')
    await page.waitForSelector('[data-testid="idea-title-input"]')
    await page.fill('[data-testid="idea-title-input"]', TEST_DATA.title)
    await page.fill('[data-testid="idea-description-input"]', TEST_DATA.description)
    console.log('   ✓ Title entered:', TEST_DATA.title)
    console.log('   ✓ Description entered')
    
    // Step 5: Upload the IP file (the ENTIRE markdown document with all confidential content)
    console.log('📎 Step 2: Uploading IP document file...')
    console.log('   📄 This uploads the ENTIRE markdown file including:')
    console.log('      - Confidential trade secret headers')
    console.log('      - Full technical innovation details')
    console.log('      - Restricted information sections')
    console.log('      - All intellectual property metadata')
    const fileInput = await page.locator('[data-testid="file-upload-input"]')
    await fileInput.setInputFiles(TEST_DATA.testFilePath)
    console.log('   ✓ Full document uploaded:', path.basename(TEST_DATA.testFilePath))
    
    // Wait for the file to be processed/encrypted
    console.log('🔐 Waiting for file processing...')
    // The "Add + Encrypt" button might appear after file upload
    const encryptButton = await page.locator('[data-testid="add-encrypt-button"]')
    if (await encryptButton.isVisible()) {
      console.log('   📤 Clicking encrypt button...')
      await page.click('[data-testid="add-encrypt-button"]')
      // Wait for encryption to complete
      await page.waitForSelector('[data-testid="add-encrypt-button"][disabled]', { timeout: 60000 })
      console.log('   ✓ File encrypted')
    }
    
    // Step 6: Set terms (optional)
    console.log('📋 Setting terms...')
    const setTermsButton = await page.locator('[data-testid="set-terms-button"]')
    if (await setTermsButton.isVisible()) {
      await setTermsButton.click()
      
      // Wait for terms dialog
      await page.waitForSelector('[data-testid="terms-dialog"]')
      
      // Select business model
      await page.click('[data-testid="business-model-select"]')
      await page.click(`[data-testid="ip-business-model-option-${TEST_DATA.businessModel}"]`)
      
      // Accept terms
      await page.click('[data-testid="terms-accept-button"]')
    }
    
    // Step 7: AI Agent selection (optional)
    console.log('🤖 Step 3: Configuring AI agent option...')
    const aiCheckbox = await page.locator('[data-testid="ai-agent-checkbox"]')
    if (await aiCheckbox.isVisible()) {
      const isChecked = await aiCheckbox.isChecked()
      console.log(`   Current AI agent setting: ${isChecked ? 'Enabled' : 'Disabled'}`)
      if (!isChecked) {
        await aiCheckbox.click()
        console.log('   ✓ AI agent enabled')
      }
    }
    
    // Step 8: NOW we can create the idea
    console.log('\n🚀 Final Step: Creating the idea...')
    console.log('   All required fields completed:')
    console.log('   ✓ Title and description entered')
    console.log('   ✓ IP file uploaded and processed')
    console.log('   ✓ Optional settings configured')
    
    // Check if create button is enabled
    const createButton = await page.locator('[data-testid="create-idea-button"]')
    const isDisabled = await createButton.isDisabled()
    
    if (isDisabled) {
      console.log('⚠️  Create button is disabled. Checking requirements...')
      
      // Check what's missing
      const hasTitle = await page.locator('[data-testid="idea-title-input"]').inputValue()
      const hasDescription = await page.locator('[data-testid="idea-description-input"]').inputValue()
      console.log('   - Has title:', !!hasTitle)
      console.log('   - Has description:', !!hasDescription)
      console.log('   - File was uploaded in step 4')
      
      throw new Error('Create button is disabled - missing required fields')
    }
    
    // Click create and monitor the process
    console.log('📤 Clicking create button...')
    await page.click('[data-testid="create-idea-button"]')
    
    // The creation process has multiple stages, let's monitor them
    console.log('⏳ Monitoring creation process...')
    
    // Watch for status messages during creation
    const statusSelector = '.text-xs.text-muted-foreground'
    
    // Poll for status updates
    let lastStatus = ''
    const checkStatus = async () => {
      try {
        const statusElement = await page.locator(statusSelector).first()
        if (await statusElement.isVisible()) {
          const currentStatus = await statusElement.textContent()
          if (currentStatus && currentStatus !== lastStatus) {
            console.log(`   📊 Status: ${currentStatus}`)
            lastStatus = currentStatus
          }
        }
      } catch (e) {
        // Status element might not exist, that's ok
      }
    }
    
    // Start status monitoring
    const statusInterval = setInterval(checkStatus, 500)
    
    try {
      // Wait for redirect to details page (success indicator)
      await page.waitForURL(/\/details\//, { timeout: 120000 })
      clearInterval(statusInterval)
      
      const url = page.url()
      const ideaId = url.match(/\/details\/(\w+)/)?.[1]
      
      console.log('\n✅ SUCCESS! Idea created with ID:', ideaId)
      console.log('📍 View at:', url)
      
    } catch (timeoutError) {
      clearInterval(statusInterval)
      
      // Check for error messages
      console.log('⚠️  Checking for errors...')
      
      const errorElement = await page.locator('.text-destructive, [role="alert"], .error-message').first()
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent()
        throw new Error(`Creation failed with error: ${errorText}`)
      }
      
      // If still loading, give it more time
      const loadingElement = await page.locator('.animate-spin, svg.lucide-loader-2').first()
      if (await loadingElement.isVisible()) {
        console.log('⏳ Still processing... waiting longer...')
        await page.waitForURL(/\/details\//, { timeout: 60000 })
      } else {
        throw new Error('Creation timed out without redirect or clear error')
      }
    }
    
    // Take a screenshot of the created idea
    await page.screenshot({ 
      path: path.join(__dirname, 'add-ip-success.png'),
      fullPage: true 
    })
    console.log('📸 Screenshot saved as add-ip-success.png')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    
    // Take error screenshot
    await page.screenshot({ 
      path: path.join(__dirname, 'add-ip-error.png'),
      fullPage: true 
    })
    console.log('📸 Error screenshot saved as add-ip-error.png')
    
    throw error
  } finally {
    console.log('\n🧹 Cleaning up...')
    await browser.close()
  }
}

// Run the test
console.log('🧪 SafeIdea Add IP Test')
console.log('=' .repeat(50))

runAddIPTest()
  .then(() => {
    console.log('\n✅ Test completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })