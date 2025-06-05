#!/usr/bin/env node

/**
 * PowerPoint Generator for Visual Regression Tests
 * Creates comparison slides for baseline vs current screenshots
 */

const PptxGenJS = require('pptxgenjs')
const fs = require('node:fs')
const path = require('node:path')
const BaselineManager = require('./baseline-manager')

class VisualRegressionPPTGenerator {
  constructor(screenshotDir) {
    this.screenshotDir = screenshotDir
    this.baselineManager = new BaselineManager(screenshotDir)
    this.pptx = new PptxGenJS()

    // Configure presentation
    this.pptx.author = 'Visual Regression Test'
    this.pptx.company = 'SafeIdea'
    this.pptx.title = 'Visual Regression Test Report'

    // Define layout constants
    this.SLIDE_WIDTH = 10
    this.SLIDE_HEIGHT = 5.625
    this.MARGIN = 0.25
    this.MAX_IMAGE_WIDTH = 4.7 // Max width for each image
    this.MAX_IMAGE_HEIGHT = 4.2 // Max height for each image

    // Device aspect ratios (width/height)
    this.DEVICE_ASPECTS = {
      desktop: 1920 / 1080, // 1.78 (landscape)
      'iphone-14-pro': 393 / 852, // 0.46 (portrait)
      'pixel-7': 412 / 915, // 0.45 (portrait)
      'ipad-pro': 834 / 1194, // 0.70 (portrait)
      'galaxy-tab': 800 / 1280, // 0.63 (portrait)
    }
  }

  /**
   * Generate the PowerPoint presentation
   */
  async generate() {
    console.log('🎯 Starting PowerPoint generation...')

    // Check if we have baseline
    if (!this.baselineManager.hasBaseline()) {
      console.log(
        '📸 No baseline found. Creating baseline from current screenshots...'
      )
      this.baselineManager.createBaseline()
      console.log(
        '✅ Baseline created. Run tests again to generate comparison PPT.'
      )
      return
    }

    // Get comparison data
    const comparisons = this.baselineManager.getComparisonPaths()
    if (!comparisons || comparisons.length === 0) {
      console.error('❌ No screenshots found for comparison')
      return
    }

    // Get device info
    const deviceInfo = this.baselineManager.getDeviceInfo()

    // Create title slide
    this.createTitleSlide(comparisons, deviceInfo)

    // Group comparisons by device
    const deviceGroups = this.groupByDevice(comparisons)

    // Create slides for each device
    Object.entries(deviceGroups).forEach(([device, screenshots]) => {
      this.createDeviceSection(device, screenshots, deviceInfo)
    })

    // Save the presentation
    const outputPath = path.join(
      path.dirname(this.screenshotDir),
      `visual-regression-${path.basename(this.screenshotDir)}.pptx`
    )

    await this.pptx.writeFile({ fileName: outputPath })
    console.log(`✅ PowerPoint saved: ${outputPath}`)

    return outputPath
  }

  /**
   * Create title slide
   */
  createTitleSlide(comparisons) {
    const slide = this.pptx.addSlide()

    // Title
    slide.addText('Visual Regression Test Report', {
      x: 0.5,
      y: 1.0,
      w: 9,
      h: 1,
      fontSize: 36,
      bold: true,
      align: 'center',
      color: '363636',
    })

    // Date
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    slide.addText(date, {
      x: 0.5,
      y: 2.0,
      w: 9,
      h: 0.5,
      fontSize: 24,
      align: 'center',
      color: '666666',
    })

    // Summary stats
    const devices = [...new Set(comparisons.map((c) => c.device))]
    const stats = [
      `Devices Tested: ${devices.length}`,
      `Total Comparisons: ${comparisons.length}`,
      `Pages per Device: ${comparisons.length / devices.length}`,
    ]

    slide.addText(stats.join('\n'), {
      x: 0.5,
      y: 3.0,
      w: 9,
      h: 1.5,
      fontSize: 18,
      align: 'center',
      color: '666666',
      lineSpacing: 24,
    })
  }

  /**
   * Create device section divider
   */
  createDeviceSection(device, screenshots, deviceInfo) {
    // Find device details
    const info = deviceInfo.find((d) => d.deviceId === device) || {}

    // Create device divider slide
    const dividerSlide = this.pptx.addSlide()

    // Device name
    dividerSlide.addText(info.device || device, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 1,
      fontSize: 36,
      bold: true,
      align: 'center',
      color: '363636',
    })

    // Device details
    const details = []
    if (device === 'desktop') {
      details.push('1920 x 1080')
    } else if (device.includes('iphone')) {
      details.push('393 x 852')
    } else if (device.includes('pixel')) {
      details.push('412 x 915')
    } else if (device.includes('ipad')) {
      details.push('834 x 1194')
    }

    details.push(`${screenshots.length} Pages Tested`)

    dividerSlide.addText(details.join('\n'), {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1.5,
      fontSize: 24,
      align: 'center',
      color: '666666',
      lineSpacing: 32,
    })

    // Create comparison slides for this device
    screenshots.forEach((screenshot, index) => {
      this.createComparisonSlide(screenshot, index + 1, screenshots.length)
    })
  }

  /**
   * Calculate image dimensions preserving aspect ratio
   */
  calculateImageDimensions(device) {
    const aspectRatio = this.DEVICE_ASPECTS[device] || 1
    let width
    let height

    if (aspectRatio > 1) {
      // Landscape (desktop)
      width = this.MAX_IMAGE_WIDTH
      height = width / aspectRatio
      if (height > this.MAX_IMAGE_HEIGHT) {
        height = this.MAX_IMAGE_HEIGHT
        width = height * aspectRatio
      }
    } else {
      // Portrait (mobile/tablet)
      height = this.MAX_IMAGE_HEIGHT
      width = height * aspectRatio
      if (width > this.MAX_IMAGE_WIDTH) {
        width = this.MAX_IMAGE_WIDTH
        height = width / aspectRatio
      }
    }

    return { width, height }
  }

  /**
   * Create comparison slide
   */
  createComparisonSlide(comparison, pageNum, totalPages) {
    const slide = this.pptx.addSlide()

    // Title
    const title = `${comparison.page} - ${comparison.device}`
    slide.addText(title, {
      x: 0.5,
      y: 0.2,
      w: 9,
      h: 0.5,
      fontSize: 20,
      bold: true,
      align: 'center',
      color: '363636',
    })

    // Calculate image dimensions for this device
    const { width: imageWidth, height: imageHeight } =
      this.calculateImageDimensions(comparison.device)

    // Calculate X positions to center images in their halves
    const leftImageX = (this.SLIDE_WIDTH / 2 - imageWidth) / 2
    const rightImageX =
      this.SLIDE_WIDTH / 2 + (this.SLIDE_WIDTH / 2 - imageWidth) / 2

    // Calculate Y position to center vertically in available space
    const imageY = 0.8 + (this.MAX_IMAGE_HEIGHT - imageHeight) / 2

    // Baseline image (left)
    slide.addImage({
      path: comparison.baseline,
      x: leftImageX,
      y: imageY,
      w: imageWidth,
      h: imageHeight,
    })

    // Baseline label
    slide.addText('Baseline', {
      x: 0,
      y: 5.0,
      w: this.SLIDE_WIDTH / 2,
      h: 0.3,
      fontSize: 14,
      align: 'center',
      color: '666666',
    })

    // Current image (right)
    slide.addImage({
      path: comparison.current,
      x: rightImageX,
      y: imageY,
      w: imageWidth,
      h: imageHeight,
    })

    // Current label
    slide.addText('Current', {
      x: this.SLIDE_WIDTH / 2,
      y: 5.0,
      w: this.SLIDE_WIDTH / 2,
      h: 0.3,
      fontSize: 14,
      align: 'center',
      color: '666666',
    })

    // Footer with page number
    slide.addText(`Page ${pageNum} of ${totalPages}`, {
      x: 0.5,
      y: 5.2,
      w: 9,
      h: 0.3,
      fontSize: 12,
      align: 'center',
      color: '999999',
    })

    // Add metadata if available
    this.addMetadata(slide, comparison)
  }

  /**
   * Add metadata to slide if available
   */
  addMetadata(slide, comparison) {
    // Try to get test results from report
    const reportPath = path.join(this.screenshotDir, 'multi-device-report.json')
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      const deviceData = report.devices?.find(
        (d) => d.deviceId === comparison.device
      )

      if (deviceData) {
        const pageData = deviceData.successful?.find(
          (p) => p.screenshot === comparison.file
        )

        if (pageData?.testIds) {
          slide.addText(`TestIDs: ${pageData.testIds}`, {
            x: 0.5,
            y: 4.8,
            w: 9,
            h: 0.3,
            fontSize: 12,
            align: 'center',
            color: '666666',
          })
        }
      }
    }
  }

  /**
   * Group comparisons by device
   */
  groupByDevice(comparisons) {
    const groups = {}

    // Define device order
    const deviceOrder = ['iphone-14-pro', 'pixel-7', 'ipad-pro', 'desktop']

    // Group by device
    comparisons.forEach((comp) => {
      if (!groups[comp.device]) {
        groups[comp.device] = []
      }
      groups[comp.device].push(comp)
    })

    // Sort each device's screenshots by filename
    Object.keys(groups).forEach((device) => {
      groups[device].sort((a, b) => a.file.localeCompare(b.file))
    })

    // Return in preferred order
    const orderedGroups = {}
    deviceOrder.forEach((device) => {
      if (groups[device]) {
        orderedGroups[device] = groups[device]
      }
    })

    // Add any remaining devices
    Object.keys(groups).forEach((device) => {
      if (!orderedGroups[device]) {
        orderedGroups[device] = groups[device]
      }
    })

    return orderedGroups
  }
}

// CLI execution
if (require.main === module) {
  const screenshotDir = process.argv[2]

  if (!screenshotDir) {
    console.error('Usage: node ppt-generator.js <screenshot-directory>')
    console.error('Example: node ppt-generator.js ./screenshots/2025-06-05')
    process.exit(1)
  }

  if (!fs.existsSync(screenshotDir)) {
    console.error(`Screenshot directory not found: ${screenshotDir}`)
    process.exit(1)
  }

  const generator = new VisualRegressionPPTGenerator(screenshotDir)
  generator
    .generate()
    .then((outputPath) => {
      console.log('\n✨ PowerPoint generation complete!')
      if (outputPath) {
        console.log(
          `📊 Open ${path.basename(outputPath)} to review comparisons`
        )
      }
    })
    .catch((error) => {
      console.error('Error generating PowerPoint:', error)
      process.exit(1)
    })
}

module.exports = VisualRegressionPPTGenerator
