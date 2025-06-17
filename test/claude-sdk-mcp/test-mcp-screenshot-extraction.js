/**
 * Test script to explore MCP Puppeteer screenshot data extraction
 * This will help us understand how to access the base64 data
 */

// Function to simulate processing MCP screenshot response
function extractBase64FromMCPResponse(response) {
  console.log('MCP Response type:', typeof response)
  console.log('MCP Response keys:', Object.keys(response || {}))

  // Check various possible locations for base64 data
  const possiblePaths = [
    response?.imageData,
    response?.data,
    response?.base64,
    response?.screenshot,
    response?.output_image,
    response?.image,
  ]

  for (const path of possiblePaths) {
    if (path) {
      console.log('Found potential image data at:', possiblePaths.indexOf(path))

      // Check if it's base64
      if (typeof path === 'string' && path.length > 100) {
        // Likely base64 if it's a long string
        const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(path.substring(0, 100))
        const hasDataPrefix = path.startsWith('data:image/')

        console.log('String length:', path.length)
        console.log('Looks like base64:', isBase64)
        console.log('Has data: prefix:', hasDataPrefix)

        return path
      }
    }
  }

  // If response is a string itself
  if (typeof response === 'string') {
    console.log('Response is a string, length:', response.length)
    return response
  }

  console.log('No base64 data found in response')
  return null
}

// Function to handle screenshot capture and extraction
async function captureAndExtractScreenshot() {
  console.log('=== MCP Screenshot Data Extraction Test ===\n')

  // This would be where we receive the MCP response
  // For testing, we'll log what we need to look for
  console.log('When using mcp__puppeteer__puppeteer_screenshot, we receive:')
  console.log('1. <output> tag with text message')
  console.log('2. <output_image> tag with image data')
  console.log('\nThe challenge: Extract the base64 data from <output_image>\n')

  // Possible extraction approaches:
  console.log('Possible extraction approaches:')
  console.log('1. Parse XML response to get content of <output_image>')
  console.log('2. Access response.output_image directly')
  console.log('3. Look for base64 string in the full response')
  console.log('4. Check if MCP provides a different method for raw data access')

  return {
    method: 'To be determined',
    notes: 'Need actual MCP response to test extraction',
  }
}

// Test base64 validation
function isValidBase64Image(str) {
  // Check for data URL prefix
  const dataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/
  if (dataUrlRegex.test(str)) {
    return true
  }

  // Check if it's raw base64
  try {
    // Remove whitespace
    const cleaned = str.replace(/\s/g, '')
    // Check if it's valid base64
    return /^[A-Za-z0-9+/]+=*$/.test(cleaned)
  } catch {
    return false
  }
}

// Export for testing
module.exports = {
  extractBase64FromMCPResponse,
  captureAndExtractScreenshot,
  isValidBase64Image,
}

// Run test
if (require.main === module) {
  captureAndExtractScreenshot().then((result) => {
    console.log('\nTest Result:', result)
  })
}
