/**
 * Experimental Add-IP Script using Direct TestID Element Manipulation
 * This approach directly sets values and triggers events rather than simulating user interactions
 */

// Direct element manipulation functions
function setValueDirectly(testId, value) {
  const element = document.querySelector(`[data-testid="${testId}"]`)
  if (!element) {
    console.error(`Element with testid ${testId} not found`)
    return false
  }

  // Set value property directly
  element.value = value

  // Trigger minimal events for framework reactivity
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))

  console.log(`Set ${testId} to: ${value.substring(0, 30)}...`)
  return element.value === value
}

function setFileDirectly(testId, content, filename) {
  const input = document.querySelector(`[data-testid="${testId}"]`)
  if (!input) {
    console.error(`File input with testid ${testId} not found`)
    return false
  }

  // Create file
  const blob = new Blob([content], { type: 'text/plain' })
  const file = new File([blob], filename, { type: 'text/plain' })

  // Create FileList with our file
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)

  // Directly set files property
  input.files = dataTransfer.files

  // Dispatch change event
  input.dispatchEvent(new Event('change', { bubbles: true }))

  console.log(`File ${filename} set on ${testId}`)
  return input.files.length > 0
}

function clickElementDirectly(testId) {
  const element = document.querySelector(`[data-testid="${testId}"]`)
  if (!element) {
    console.error(`Element with testid ${testId} not found`)
    return false
  }

  // Try multiple click methods
  // Method 1: Direct click
  element.click()

  // Method 2: Dispatch click event
  element.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true })
  )

  console.log(`Clicked ${testId}`)
  return true
}

// Main function to add IP using direct approach
async function addIPDirect() {
  console.log('Starting direct Add-IP process...')

  try {
    // Generate test data
    const timestamp = new Date().toISOString()
    const title = `Direct Test IP - ${timestamp}`
    const description = `Created using direct testid manipulation. This tests whether directly setting element values and triggering events is more reliable than simulating user interactions. Timestamp: ${timestamp}`

    const fileContent = `# ${title}
    
## Technical Approach
This IP was created using direct DOM manipulation via testids.

## Benefits
- Faster execution
- More reliable than UI simulation
- Bypasses timing issues

## Timestamp
${timestamp}`

    // Step 1: Set title directly
    const titleSet = setValueDirectly('idea-title-input', title)
    if (!titleSet) throw new Error('Failed to set title')

    // Step 2: Set description directly
    const descSet = setValueDirectly('idea-description-input', description)
    if (!descSet) throw new Error('Failed to set description')

    // Step 3: Set file directly
    const fileSet = setFileDirectly(
      'file-upload-input',
      fileContent,
      'direct-test.txt'
    )
    if (!fileSet) throw new Error('Failed to set file')

    // Small delay to ensure all events processed
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Step 4: Click create button directly (NOT the terms button!)
    const clicked = clickElementDirectly('create-idea-button')
    if (!clicked) throw new Error('Failed to click create button')

    console.log('Direct manipulation complete. Monitoring for results...')

    // Monitor for completion
    return await monitorCompletion()
  } catch (error) {
    console.error('Direct Add-IP failed:', error)
    return false
  }
}

// Monitor function to check if creation succeeded
async function monitorCompletion(maxWaitTime = 60000) {
  const startTime = Date.now()

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // Check for redirect
      if (window.location.pathname !== '/add-ip') {
        clearInterval(checkInterval)
        console.log('Success! Redirected to:', window.location.pathname)
        resolve(true)
        return
      }

      // Check for status messages
      const statusElements = document.querySelectorAll('div')
      const statusMessages = Array.from(statusElements)
        .map((el) => el.textContent)
        .filter(
          (text) =>
            text.includes('Uploading') ||
            text.includes('Minting') ||
            text.includes('Creating') ||
            text.includes('Transaction')
        )

      if (statusMessages.length > 0) {
        console.log('Status:', statusMessages[0])
      }

      // Check timeout
      if (Date.now() - startTime > maxWaitTime) {
        clearInterval(checkInterval)
        console.error('Timeout waiting for completion')
        resolve(false)
      }
    }, 2000)
  })
}

// Execute the script
console.log('Direct TestID Add-IP Script Ready')
console.log('Run addIPDirect() to start')

// Auto-execute if on the add-ip page
if (window.location.pathname === '/add-ip') {
  console.log('On Add-IP page, starting in 2 seconds...')
  setTimeout(() => {
    addIPDirect().then((success) => {
      console.log(success ? 'IP Created Successfully!' : 'IP Creation Failed')
    })
  }, 2000)
}
