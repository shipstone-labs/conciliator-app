/**
 * Generate PowerPoint presentation from test screenshots
 * Uses pptxgenjs library to create slides with screenshots
 */

const PptxGenJS = require('pptxgenjs')

function createScreenshotPresentation() {
  const pptx = new PptxGenJS()

  // Set presentation properties
  pptx.author = 'SafeIdea Testing Team'
  pptx.subject = 'Add-IP Testing Session'
  pptx.title = 'SafeIdea Add-IP Test Screenshots - June 15, 2025'

  // Define slide layout
  pptx.defineSlideMaster({
    title: 'SCREENSHOT_MASTER',
    background: { color: 'FFFFFF' },
    margin: [0.5, 0.5, 0.5, 0.5],
  })

  // Title slide
  const titleSlide = pptx.addSlide()
  titleSlide.background = { color: '1a1a1a' }

  titleSlide.addText('SafeIdea Add-IP Testing Session', {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1,
    align: 'center',
    fontSize: 36,
    color: 'FFFFFF',
    bold: true,
  })

  titleSlide.addText('Test Date: June 15, 2025', {
    x: 0.5,
    y: 3,
    w: 9,
    h: 0.5,
    align: 'center',
    fontSize: 20,
    color: 'FFFFFF',
  })

  titleSlide.addText(
    'Test Type: MCP Puppeteer Automation\nApproach: Direct TestID Element Manipulation\nTotal Screenshots: 19',
    {
      x: 0.5,
      y: 4,
      w: 9,
      h: 1.5,
      align: 'center',
      fontSize: 16,
      color: 'CCCCCC',
      lineSpacing: 24,
    }
  )

  // Screenshot data with timestamps and descriptions
  const screenshots = [
    { name: 'current-page', time: '10:45:23', desc: 'Initial login screen' },
    {
      name: 'logged-in-state',
      time: '10:46:15',
      desc: 'After login - My Ideas page',
    },
    {
      name: 'add-ip-page',
      time: '10:47:02',
      desc: 'Add IP form - empty state',
    },
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

  // Add screenshot slides
  screenshots.forEach((screenshot, index) => {
    const slide = pptx.addSlide({ masterName: 'SCREENSHOT_MASTER' })

    // Add slide number
    slide.addText(`${index + 1} / ${screenshots.length}`, {
      x: 8.5,
      y: 0.2,
      w: 1,
      h: 0.3,
      align: 'right',
      fontSize: 10,
      color: '666666',
    })

    // Placeholder for screenshot (centered)
    // In real implementation, would load actual image files
    slide.addShape(pptx.ShapeType.rect, {
      x: 1,
      y: 0.8,
      w: 8,
      h: 4.5,
      fill: { color: 'F0F0F0' },
      line: { color: 'CCCCCC', width: 1 },
    })

    slide.addText(`[Screenshot: ${screenshot.name}]`, {
      x: 1,
      y: 2.5,
      w: 8,
      h: 1,
      align: 'center',
      fontSize: 14,
      color: '999999',
      italic: true,
    })

    // Add timestamp
    slide.addText(screenshot.time, {
      x: 0.5,
      y: 5.7,
      w: 2,
      h: 0.4,
      align: 'left',
      fontSize: 12,
      color: '666666',
      bold: true,
    })

    // Add description
    slide.addText(screenshot.desc, {
      x: 2.5,
      y: 5.7,
      w: 7,
      h: 0.4,
      align: 'left',
      fontSize: 12,
      color: '333333',
    })

    // Add footer line
    slide.addShape(pptx.ShapeType.line, {
      x: 0.5,
      y: 5.5,
      w: 9,
      h: 0,
      line: { color: 'DDDDDD', width: 1 },
    })
  })

  // Summary slide
  const summarySlide = pptx.addSlide()
  summarySlide.background = { color: 'F8F8F8' }

  summarySlide.addText('Test Summary', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 1,
    align: 'center',
    fontSize: 28,
    bold: true,
    color: '333333',
  })

  summarySlide.addText(
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
      lineSpacing: 20,
    }
  )

  // Save presentation
  const filename = `add-ip-test-screenshots-${new Date().toISOString().split('T')[0]}.pptx`
  pptx
    .writeFile({ fileName: filename })
    .then(() => console.log(`Presentation saved: ${filename}`))
    .catch((err) => console.error('Error saving presentation:', err))
}

// Note: This is a template. In actual implementation, you would:
// 1. Install pptxgenjs: npm install pptxgenjs
// 2. Load actual screenshot files using fs.readFileSync
// 3. Add images using slide.addImage() with base64 data
// 4. Run with: node screenshot-presentation-generator.js

module.exports = { createScreenshotPresentation }
