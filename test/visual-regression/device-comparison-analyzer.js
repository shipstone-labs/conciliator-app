/**
 * Device Comparison Analyzer
 * Analyzes differences between device screenshots and TestIDs
 */

const fs = require('node:fs')

class DeviceComparisonAnalyzer {
  constructor(reportPath) {
    this.report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
    this.analysis = {
      mobileOnlyElements: [],
      desktopOnlyElements: [],
      responsiveDifferences: [],
      criticalPathStatus: [],
      recommendations: [],
    }
  }

  analyze() {
    this.findDeviceSpecificElements()
    this.analyzeCriticalPaths()
    this.generateRecommendations()
    return this.analysis
  }

  findDeviceSpecificElements() {
    const deviceTestIds = new Map()

    // Collect all TestIDs by device
    this.report.devices.forEach((device) => {
      const allTestIds = new Set()
      device.testIds.forEach((testIds) => {
        testIds.forEach((item) => allTestIds.add(item.testId))
      })
      deviceTestIds.set(device.deviceId, allTestIds)
    })

    // Find desktop-only elements
    const desktopIds = deviceTestIds.get('desktop') || new Set()
    const mobileIds = new Set()

    // Combine all mobile device TestIDs
    this.report.devices.forEach((device) => {
      if (device.deviceId !== 'desktop') {
        const ids = deviceTestIds.get(device.deviceId) || new Set()
        ids.forEach((id) => mobileIds.add(id))
      }
    })

    // Desktop-only elements
    desktopIds.forEach((id) => {
      if (!mobileIds.has(id)) {
        this.analysis.desktopOnlyElements.push(id)
      }
    })

    // Mobile-only elements
    mobileIds.forEach((id) => {
      if (!desktopIds.has(id)) {
        this.analysis.mobileOnlyElements.push(id)
      }
    })

    // Responsive differences (different counts per page)
    if (this.report.comparison) {
      Object.entries(this.report.comparison).forEach(([path, devices]) => {
        const counts = Object.values(devices).map((d) => d.testIdCount)
        const uniqueCounts = [...new Set(counts)]

        if (uniqueCounts.length > 1) {
          this.analysis.responsiveDifferences.push({
            path,
            devices: devices,
            variation: Math.max(...counts) - Math.min(...counts),
          })
        }
      })
    }
  }

  analyzeCriticalPaths() {
    const criticalPaths = [
      '/',
      '/subscription/assessment',
      '/subscription/plans',
      '/subscription/signup',
    ]

    criticalPaths.forEach((path) => {
      const pathStatus = {
        path,
        devices: {},
      }

      this.report.devices.forEach((device) => {
        const success = device.successful.find((s) => s.route === path)
        const failed = device.failed.find((f) => f.route === path)

        pathStatus.devices[device.deviceId] = {
          status: success ? 'success' : failed ? 'failed' : 'not_tested',
          testIds: success ? success.testIds : 0,
          mobileSpecific: success ? success.mobileSpecific : 0,
        }
      })

      this.analysis.criticalPathStatus.push(pathStatus)
    })
  }

  generateRecommendations() {
    // Check for mobile-specific issues
    if (this.analysis.mobileOnlyElements.length > 10) {
      this.analysis.recommendations.push({
        type: 'mobile_ui',
        priority: 'high',
        message: `Found ${this.analysis.mobileOnlyElements.length} mobile-only elements. Consider adding these TestIDs to desktop for consistency.`,
        elements: this.analysis.mobileOnlyElements.slice(0, 5),
      })
    }

    // Check for responsive variations
    const highVariations = this.analysis.responsiveDifferences.filter(
      (d) => d.variation > 5
    )
    if (highVariations.length > 0) {
      this.analysis.recommendations.push({
        type: 'responsive',
        priority: 'medium',
        message: `${highVariations.length} pages show significant TestID variations between devices.`,
        pages: highVariations.map((v) => v.path),
      })
    }

    // Check critical path coverage
    const failedCriticalPaths = this.analysis.criticalPathStatus.filter(
      (path) => {
        return Object.values(path.devices).some((d) => d.status === 'failed')
      }
    )

    if (failedCriticalPaths.length > 0) {
      this.analysis.recommendations.push({
        type: 'critical_path',
        priority: 'high',
        message: `${failedCriticalPaths.length} critical paths failed on some devices.`,
        paths: failedCriticalPaths.map((p) => p.path),
      })
    }

    // Mobile performance recommendation
    const mobileTestCount = this.report.devices
      .filter((d) => d.deviceId !== 'desktop')
      .reduce((sum, d) => sum + d.successful.length, 0)

    if (mobileTestCount > 0) {
      this.analysis.recommendations.push({
        type: 'performance',
        priority: 'info',
        message: `Mobile tests covered ${mobileTestCount} page loads. Consider using critical paths only for faster execution.`,
      })
    }
  }

  generateReport() {
    console.log('\n📊 Device Comparison Analysis')
    console.log('═'.repeat(60))

    console.log(
      `\n📱 Mobile-Only Elements: ${this.analysis.mobileOnlyElements.length}`
    )
    if (this.analysis.mobileOnlyElements.length > 0) {
      console.log(
        '  Examples:',
        this.analysis.mobileOnlyElements.slice(0, 3).join(', ')
      )
    }

    console.log(
      `\n💻 Desktop-Only Elements: ${this.analysis.desktopOnlyElements.length}`
    )
    if (this.analysis.desktopOnlyElements.length > 0) {
      console.log(
        '  Examples:',
        this.analysis.desktopOnlyElements.slice(0, 3).join(', ')
      )
    }

    console.log(
      `\n📐 Responsive Differences: ${this.analysis.responsiveDifferences.length} pages`
    )
    this.analysis.responsiveDifferences.slice(0, 3).forEach((diff) => {
      console.log(`  ${diff.path}: varies by ${diff.variation} TestIDs`)
    })

    console.log('\n🎯 Critical Path Status:')
    this.analysis.criticalPathStatus.forEach((path) => {
      const statuses = Object.entries(path.devices)
        .map(([device, data]) => `${device}: ${data.status}`)
        .join(', ')
      console.log(`  ${path.path}: ${statuses}`)
    })

    console.log('\n💡 Recommendations:')
    this.analysis.recommendations.forEach((rec) => {
      const icon =
        rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : 'ℹ️'
      console.log(`  ${icon} ${rec.message}`)
    })

    return this.analysis
  }
}

// CLI usage
if (require.main === module) {
  const reportPath = process.argv[2]

  if (!reportPath) {
    console.error('Usage: node device-comparison-analyzer.js <report-path>')
    process.exit(1)
  }

  try {
    const analyzer = new DeviceComparisonAnalyzer(reportPath)
    analyzer.analyze()
    analyzer.generateReport()
  } catch (error) {
    console.error('Error analyzing report:', error.message)
    process.exit(1)
  }
}

module.exports = DeviceComparisonAnalyzer
