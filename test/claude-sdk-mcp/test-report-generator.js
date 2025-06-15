/**
 * Test Report Generator for Add-IP Testing
 * Generates structured reports with performance metrics and visual documentation
 */

const fs = require('node:fs').promises
const path = require('node:path')

class TestReportGenerator {
  constructor() {
    this.testRun = {
      startTime: new Date(),
      endTime: null,
      ideas: [],
      screenshots: [],
      errors: [],
      performanceMetrics: {
        operations: [],
      },
    }
  }

  // Start tracking a new idea creation
  startIdeaCreation(title, description) {
    const idea = {
      id: this.testRun.ideas.length + 1,
      title,
      description: `${description.substring(0, 100)}...`,
      startTime: new Date(),
      endTime: null,
      status: 'in_progress',
      stages: [],
      tokenInfo: {},
      screenshots: [],
    }
    this.testRun.ideas.push(idea)
    return idea.id
  }

  // Track stage progress
  trackStage(ideaId, stageName, progress, extras = {}) {
    const idea = this.testRun.ideas.find((i) => i.id === ideaId)
    if (!idea) return

    const stage = {
      name: stageName,
      progress,
      timestamp: new Date(),
      duration: null,
      extras,
    }

    // Calculate duration from previous stage
    if (idea.stages.length > 0) {
      const prevStage = idea.stages[idea.stages.length - 1]
      prevStage.duration = (stage.timestamp - prevStage.timestamp) / 1000
    }

    idea.stages.push(stage)

    // Extract token info if available
    if (extras.contract) idea.tokenInfo.contract = extras.contract
    if (extras.tokenId) idea.tokenInfo.tokenId = extras.tokenId
    if (extras.contract_name) idea.tokenInfo.contractName = extras.contract_name
  }

  // Complete idea creation
  completeIdeaCreation(ideaId, finalUrl) {
    const idea = this.testRun.ideas.find((i) => i.id === ideaId)
    if (!idea) return

    idea.endTime = new Date()
    idea.status = 'completed'
    idea.finalUrl = finalUrl
    idea.totalDuration = (idea.endTime - idea.startTime) / 1000

    // Complete last stage duration
    if (idea.stages.length > 0) {
      const lastStage = idea.stages[idea.stages.length - 1]
      lastStage.duration = (idea.endTime - lastStage.timestamp) / 1000
    }
  }

  // Track error
  trackError(ideaId, error) {
    const errorEntry = {
      ideaId,
      timestamp: new Date(),
      message: error.message || error,
      stack: error.stack,
    }
    this.testRun.errors.push(errorEntry)

    const idea = this.testRun.ideas.find((i) => i.id === ideaId)
    if (idea) {
      idea.status = 'failed'
      idea.error = error.message || error
    }
  }

  // Add screenshot reference
  addScreenshot(ideaId, screenshotName, stage) {
    const screenshot = {
      ideaId,
      name: screenshotName,
      stage,
      timestamp: new Date(),
    }
    this.testRun.screenshots.push(screenshot)

    const idea = this.testRun.ideas.find((i) => i.id === ideaId)
    if (idea) {
      idea.screenshots.push(screenshot)
    }
  }

  // Generate markdown report
  async generateMarkdownReport() {
    this.testRun.endTime = new Date()
    const duration = (this.testRun.endTime - this.testRun.startTime) / 1000

    const successCount = this.testRun.ideas.filter(
      (i) => i.status === 'completed'
    ).length
    const failedCount = this.testRun.ideas.filter(
      (i) => i.status === 'failed'
    ).length
    const avgCreationTime =
      this.testRun.ideas
        .filter((i) => i.totalDuration)
        .reduce((sum, i) => sum + i.totalDuration, 0) / (successCount || 1)

    let report = `# Add-IP Test Report

**Test Run:** ${this.testRun.startTime.toLocaleString()}  
**Duration:** ${duration.toFixed(1)}s  
**Environment:** ${process.env.NODE_ENV || 'development'}

## Summary

- **Ideas Created:** ${successCount}/${this.testRun.ideas.length} ✓
- **Failed:** ${failedCount}
- **Average Creation Time:** ${avgCreationTime.toFixed(1)}s
- **Total Errors:** ${this.testRun.errors.length}

## Ideas Created

`

    // Add details for each idea
    for (const idea of this.testRun.ideas) {
      report += `### ${idea.id}. ${idea.title}

**Status:** ${idea.status === 'completed' ? '✅ Completed' : idea.status === 'failed' ? '❌ Failed' : '⏳ In Progress'}  
**Duration:** ${idea.totalDuration ? `${idea.totalDuration.toFixed(1)}s` : 'N/A'}  
${idea.finalUrl ? `**URL:** ${idea.finalUrl}  ` : ''}
${idea.tokenInfo.tokenId ? `**Token ID:** ${idea.tokenInfo.tokenId}  ` : ''}
${idea.tokenInfo.contract ? `**Contract:** ${idea.tokenInfo.contract}  ` : ''}

<details>
<summary>Stage Breakdown</summary>

| Stage | Progress | Duration |
|-------|----------|----------|
`

      for (const stage of idea.stages) {
        report += `| ${stage.name} | ${stage.progress}% | ${stage.duration ? `${stage.duration.toFixed(1)}s` : '-'} |\n`
      }

      report += `
</details>

`

      if (idea.screenshots.length > 0) {
        report += `**Screenshots:** ${idea.screenshots.map((s) => `[${s.name}]`).join(', ')}\n\n`
      }

      if (idea.error) {
        report += `**Error:** ${idea.error}\n\n`
      }
    }

    // Add performance metrics
    report += `## Performance Metrics

### Stage Duration Analysis

`

    // Calculate average duration for each stage type
    const stageDurations = {}
    for (const idea of this.testRun.ideas) {
      for (const stage of idea.stages) {
        if (!stageDurations[stage.name]) {
          stageDurations[stage.name] = []
        }
        if (stage.duration) {
          stageDurations[stage.name].push(stage.duration)
        }
      }
    }

    report += `| Stage | Avg Duration | Min | Max |
|-------|--------------|-----|-----|
`

    for (const [stageName, durations] of Object.entries(stageDurations)) {
      if (durations.length > 0) {
        const avg = durations.reduce((a, b) => a + b) / durations.length
        const min = Math.min(...durations)
        const max = Math.max(...durations)
        report += `| ${stageName} | ${avg.toFixed(1)}s | ${min.toFixed(1)}s | ${max.toFixed(1)}s |\n`
      }
    }

    // Add errors section if any
    if (this.testRun.errors.length > 0) {
      report += `\n## Errors

`
      for (const error of this.testRun.errors) {
        report += `### Error at ${error.timestamp.toLocaleTimeString()}
**Idea ID:** ${error.ideaId}  
**Message:** ${error.message}

\`\`\`
${error.stack || 'No stack trace available'}
\`\`\`

`
      }
    }

    // Add test configuration
    report += `## Test Configuration

- **Browser:** Chrome (Remote Debugging)
- **MCP Puppeteer:** Connected
- **Test Script:** add-ip-automated-with-progress.js

`

    // Add timestamp
    report += `---
*Report generated at ${new Date().toLocaleString()}*`

    return report
  }

  // Generate JSON report for programmatic use
  generateJSONReport() {
    return {
      ...this.testRun,
      summary: {
        totalDuration: (this.testRun.endTime - this.testRun.startTime) / 1000,
        successCount: this.testRun.ideas.filter((i) => i.status === 'completed')
          .length,
        failedCount: this.testRun.ideas.filter((i) => i.status === 'failed')
          .length,
        avgCreationTime:
          this.testRun.ideas
            .filter((i) => i.totalDuration)
            .reduce((sum, i) => sum + i.totalDuration, 0) /
          (this.testRun.ideas.filter((i) => i.status === 'completed').length ||
            1),
      },
    }
  }

  // Save reports to files
  async saveReports(outputDir = './test-reports') {
    await fs.mkdir(outputDir, { recursive: true })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    // Save markdown report
    const mdPath = path.join(outputDir, `add-ip-test-${timestamp}.md`)
    await fs.writeFile(mdPath, await this.generateMarkdownReport())

    // Save JSON report
    const jsonPath = path.join(outputDir, `add-ip-test-${timestamp}.json`)
    await fs.writeFile(
      jsonPath,
      JSON.stringify(this.generateJSONReport(), null, 2)
    )

    console.log('📄 Reports saved:')
    console.log(`   - Markdown: ${mdPath}`)
    console.log(`   - JSON: ${jsonPath}`)

    return { markdown: mdPath, json: jsonPath }
  }
}

module.exports = { TestReportGenerator }
