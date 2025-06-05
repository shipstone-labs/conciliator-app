/**
 * Baseline Manager for Visual Regression Tests
 * Handles baseline screenshot creation and management
 */

const fs = require('node:fs')
const path = require('node:path')

class BaselineManager {
  constructor(screenshotDir) {
    this.screenshotDir = screenshotDir
    this.baselineDir = path.join(path.dirname(screenshotDir), 'baseline')
  }

  /**
   * Check if baseline exists
   */
  hasBaseline() {
    return (
      fs.existsSync(this.baselineDir) &&
      fs.readdirSync(this.baselineDir).length > 0
    )
  }

  /**
   * Create baseline from current screenshots
   */
  createBaseline() {
    if (!fs.existsSync(this.screenshotDir)) {
      throw new Error('No screenshots found to create baseline')
    }

    // Create baseline directory
    if (!fs.existsSync(this.baselineDir)) {
      fs.mkdirSync(this.baselineDir, { recursive: true })
    }

    // Copy device directories
    const devices = fs
      .readdirSync(this.screenshotDir)
      .filter((item) =>
        fs.statSync(path.join(this.screenshotDir, item)).isDirectory()
      )

    devices.forEach((device) => {
      const sourceDir = path.join(this.screenshotDir, device)
      const targetDir = path.join(this.baselineDir, device)

      // Create device directory in baseline
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }

      // Copy all PNG files
      const files = fs
        .readdirSync(sourceDir)
        .filter((file) => file.endsWith('.png'))

      files.forEach((file) => {
        const sourcePath = path.join(sourceDir, file)
        const targetPath = path.join(targetDir, file)
        fs.copyFileSync(sourcePath, targetPath)
      })
    })

    // Copy report files
    const reports = fs
      .readdirSync(this.screenshotDir)
      .filter((file) => file.endsWith('.json'))

    reports.forEach((report) => {
      fs.copyFileSync(
        path.join(this.screenshotDir, report),
        path.join(this.baselineDir, report)
      )
    })

    console.log(`✅ Baseline created with ${devices.length} devices`)
    return {
      devices,
      baselineDir: this.baselineDir,
    }
  }

  /**
   * Get baseline and current screenshot paths for comparison
   */
  getComparisonPaths() {
    if (!this.hasBaseline()) {
      return null
    }

    const comparisons = []
    const devices = fs
      .readdirSync(this.screenshotDir)
      .filter((item) =>
        fs.statSync(path.join(this.screenshotDir, item)).isDirectory()
      )

    devices.forEach((device) => {
      const currentDir = path.join(this.screenshotDir, device)
      const baselineDir = path.join(this.baselineDir, device)

      if (!fs.existsSync(baselineDir)) {
        console.warn(`No baseline found for device: ${device}`)
        return
      }

      const currentFiles = fs
        .readdirSync(currentDir)
        .filter((file) => file.endsWith('.png'))

      currentFiles.forEach((file) => {
        const baselinePath = path.join(baselineDir, file)
        const currentPath = path.join(currentDir, file)

        if (fs.existsSync(baselinePath)) {
          comparisons.push({
            device,
            file,
            baseline: baselinePath,
            current: currentPath,
            page: this.extractPageName(file),
          })
        } else {
          console.warn(`No baseline found for: ${device}/${file}`)
        }
      })
    })

    return comparisons
  }

  /**
   * Extract page name from screenshot filename
   */
  extractPageName(filename) {
    // Format: "01-home.png" or "02-subscription-home.png"
    const match = filename.match(/^\d+-(.*)\.png$/)
    if (match) {
      return match[1].replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
    }
    return filename
  }

  /**
   * Get device info from report
   */
  getDeviceInfo() {
    const reportPath = path.join(this.screenshotDir, 'multi-device-report.json')
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      return report.devices || []
    }
    return []
  }
}

module.exports = BaselineManager
