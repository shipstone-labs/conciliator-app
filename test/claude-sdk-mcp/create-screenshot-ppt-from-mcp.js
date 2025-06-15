const PptxGenJS = require('pptxgenjs')
const fs = require('node:fs')
const path = require('node:path')

/**
 * Creates a PowerPoint presentation from MCP Puppeteer screenshots
 * This script assumes we can extract base64 data from MCP responses
 */

// Screenshot metadata from today's testing session
const screenshots = [
  { name: 'current-page', time: '10:45:23', desc: 'Initial login screen' },
  {
    name: 'logged-in-state',
    time: '10:46:15',
    desc: 'After login - My Ideas page',
  },
  { name: 'add-ip-page', time: '10:47:02', desc: 'Add IP form - empty state' },
  {
    name: 'add-ip-scrolled',
    time: '10:48:30',
    desc: 'Scrolled to show file upload section',
  },
  {
    name: 'add-ip-bottom',
    time: '10:49:45',
    desc: 'Bottom of form with submission buttons',
  },
  {
    name: 'terms-dialog',
    time: '10:50:12',
    desc: 'Sharing terms dialog opened',
  },
  {
    name: 'terms-dialog-scrolled',
    time: '10:50:45',
    desc: 'Terms dialog scrolled content',
  },
  {
    name: 'after-accept-terms',
    time: '10:51:20',
    desc: 'After accepting terms - creating status',
  },
  {
    name: 'idea-1-completed',
    time: '10:52:30',
    desc: 'First idea - minting token status',
  },
  {
    name: 'add-ip-page-2-bottom',
    time: '10:54:00',
    desc: 'Transaction history - first idea success',
  },
  {
    name: 'idea-2-creation-started',
    time: '10:56:15',
    desc: 'Second idea - creation initiated',
  },
  {
    name: 'idea-2-status-check',
    time: '10:57:00',
    desc: 'AI generating token image status',
  },
  {
    name: 'final-my-ideas-check',
    time: '10:58:30',
    desc: 'My Ideas list verification',
  },
  {
    name: 'my-ideas-scrolled',
    time: '10:59:00',
    desc: 'My Ideas scrolled - checking all entries',
  },
  {
    name: 'current-state-after-reconnect',
    time: '11:01:00',
    desc: 'After MCP reconnection',
  },
  {
    name: 'add-ip-page-check',
    time: '11:45:00',
    desc: 'Login modal for new test',
  },
  {
    name: 'direct-method-progress',
    time: '11:55:30',
    desc: 'Direct method - empty form',
  },
  {
    name: 'direct-method-creating',
    time: '11:56:45',
    desc: 'Direct method - form filled with values',
  },
  {
    name: 'direct-method-status',
    time: '11:57:30',
    desc: 'Direct method - creating status active',
  },
]

/**
 * Function to convert base64 to buffer
 * @param {string} base64String - Base64 encoded image data
 * @returns {Buffer} Image buffer
 */
function base64ToBuffer(base64String) {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

/**
 * Function to save base64 image as PNG file
 * @param {string} base64String - Base64 encoded image
 * @param {string} filename - Output filename
 * @returns {string} Path to saved file
 */
function saveBase64AsPng(base64String, filename) {
  const buffer = base64ToBuffer(base64String)
  const filepath = path.join(__dirname, 'screenshot-images', filename)

  // Ensure directory exists
  const dir = path.dirname(filepath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(filepath, buffer)
  return filepath
}

/**
 * Create PowerPoint presentation with screenshots
 * @param {Array} screenshotData - Array of screenshot data with base64 images
 */
async function createPresentation(screenshotData) {
  const pptx = new PptxGenJS()

  // Set presentation properties
  pptx.author = 'SafeIdea Testing'
  pptx.company = 'SafeIdea'
  pptx.title = 'Add-IP Test Screenshots - June 15, 2025'

  // Title slide
  let slide = pptx.addSlide()
  slide.background = { color: '1E1E1E' }

  slide.addText('SafeIdea Add-IP Testing Session', {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1,
    fontSize: 32,
    color: 'FFFFFF',
    align: 'center',
    bold: true,
  })

  slide.addText('MCP Puppeteer Automation Test\nJune 15, 2025', {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 1,
    fontSize: 18,
    color: 'CCCCCC',
    align: 'center',
  })

  slide.addText(
    'Total Screenshots: 19\nTest Approach: Direct TestID Element Manipulation',
    {
      x: 0.5,
      y: 4.8,
      w: 9,
      h: 1,
      fontSize: 14,
      color: '999999',
      align: 'center',
    }
  )

  // Process each screenshot
  for (let i = 0; i < screenshotData.length; i++) {
    const shot = screenshotData[i]
    slide = pptx.addSlide()
    slide.background = { color: 'FFFFFF' }

    // Add slide number
    slide.addText(`${i + 1} / ${screenshotData.length}`, {
      x: 8.5,
      y: 0.3,
      w: 1,
      h: 0.3,
      fontSize: 10,
      color: '666666',
      align: 'right',
    })

    // If we have base64 data, save it and add to slide
    if (shot.base64Data) {
      try {
        // Save base64 as PNG file
        const imagePath = saveBase64AsPng(shot.base64Data, `${shot.name}.png`)

        // Add image to slide (centered)
        slide.addImage({
          path: imagePath,
          x: 1,
          y: 0.7,
          w: 8,
          h: 4.5,
          sizing: { type: 'contain' },
        })
      } catch (error) {
        console.error(`Error processing screenshot ${shot.name}:`, error)

        // Add placeholder if image fails
        slide.addShape(pptx.ShapeType.rect, {
          x: 1,
          y: 0.7,
          w: 8,
          h: 4.5,
          fill: { color: 'F5F5F5' },
          line: { color: 'DDDDDD', width: 1 },
        })

        slide.addText(`Failed to load: ${shot.name}`, {
          x: 1,
          y: 2.5,
          w: 8,
          h: 0.5,
          fontSize: 14,
          color: '999999',
          align: 'center',
          italic: true,
        })
      }
    } else {
      // No base64 data available - add placeholder
      slide.addShape(pptx.ShapeType.rect, {
        x: 1,
        y: 0.7,
        w: 8,
        h: 4.5,
        fill: { color: 'F5F5F5' },
        line: { color: 'DDDDDD', width: 1 },
      })

      slide.addText(`Screenshot: ${shot.name}`, {
        x: 1,
        y: 2.5,
        w: 8,
        h: 0.5,
        fontSize: 16,
        color: '999999',
        align: 'center',
        italic: true,
      })
    }

    // Add timestamp
    slide.addText(shot.time, {
      x: 1,
      y: 5.5,
      w: 2,
      h: 0.4,
      fontSize: 12,
      color: '666666',
      bold: true,
    })

    // Add description
    slide.addText(shot.desc, {
      x: 3,
      y: 5.5,
      w: 6,
      h: 0.4,
      fontSize: 12,
      color: '333333',
    })
  }

  // Summary slide
  slide = pptx.addSlide()
  slide.background = { color: 'F8F8F8' }

  slide.addText('Test Summary', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 1,
    fontSize: 28,
    bold: true,
    color: '333333',
    align: 'center',
  })

  slide.addText(
    [
      { text: 'Test Results:\n', options: { bold: true, fontSize: 16 } },
      { text: '• Ideas Attempted: 3\n', options: { fontSize: 14 } },
      { text: '• Successfully Created: 2\n', options: { fontSize: 14 } },
      {
        text: '• Failed: 1 (possible silent failure)\n\n',
        options: { fontSize: 14 },
      },
      { text: 'Key Findings:\n', options: { bold: true, fontSize: 16 } },
      {
        text: '• Direct TestID approach successful\n',
        options: { fontSize: 14 },
      },
      {
        text: '• React-friendly value setting required\n',
        options: { fontSize: 14 },
      },
      {
        text: '• Unexpected "Set Sharing Terms" dialog\n',
        options: { fontSize: 14 },
      },
      {
        text: '• Creation times vary (60-200 seconds)\n',
        options: { fontSize: 14 },
      },
    ],
    {
      x: 1,
      y: 2,
      w: 8,
      h: 4,
      align: 'left',
      color: '333333',
    }
  )

  // Save presentation
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `add-ip-test-screenshots-${timestamp}.pptx`

  await pptx.writeFile({ fileName: filename })
  console.log(`✅ PowerPoint presentation created: ${filename}`)
  return filename
}

/**
 * Main function to orchestrate the process
 * This would be called with the MCP screenshot responses
 */
async function processScreenshotsToPresentation(mcpResponses) {
  console.log('Processing MCP screenshots into PowerPoint...')

  // Map the screenshot metadata with the base64 data from MCP responses
  const screenshotData = screenshots.map((shot, index) => {
    const mcpResponse = mcpResponses[index]

    // Extract base64 data from MCP response
    // The actual extraction method depends on MCP response format
    let base64Data = null

    if (mcpResponse?.imageData) {
      base64Data = mcpResponse.imageData
    } else if (mcpResponse && typeof mcpResponse === 'string') {
      // If response is a string, it might be base64 directly
      base64Data = mcpResponse
    }

    return {
      ...shot,
      base64Data,
    }
  })

  // Create the presentation
  const filename = await createPresentation(screenshotData)
  return filename
}

// Export functions for use
module.exports = {
  createPresentation,
  processScreenshotsToPresentation,
  saveBase64AsPng,
}

// Example usage (when called with actual MCP data):
// const mcpResponses = [...]; // Array of MCP screenshot responses
// processScreenshotsToPresentation(mcpResponses);

console.log('Screenshot to PowerPoint converter ready.')
console.log('Call processScreenshotsToPresentation() with MCP response data.')
