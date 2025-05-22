/**
 * Test Runner for comparing different scraper approaches
 */
const fs = require('node:fs')
const path = require('node:path')

// Import the scrapers
const BasicScraper = require('./basic-scraper')
const ResilientScraper = require('./resilient-scraper')
const DOMAnalyzerScraper = require('./dom-analyzer-scraper')

// List of test websites
const TEST_SITES = [
  {
    name: 'Memeorandum',
    url: 'https://memeorandum.com',
    expectedContent: 'political web blogs',
    complexity: 'High',
  },
  {
    name: 'Metafilter',
    url: 'https://www.metafilter.com',
    expectedContent: 'community weblog',
    complexity: 'Medium',
  },
  {
    name: 'Fark',
    url: 'https://www.fark.com',
    expectedContent: 'news aggregator',
    complexity: 'High',
  },
]

// Create results directory
const RESULTS_DIR = path.join(__dirname, 'results')
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR)
}

/**
 * Function to score the content match against expected text
 * @param {string} content The extracted content
 * @param {string} expectedContent The expected content snippet
 * @returns {number} Match score between 0-1
 */
function scoreContentMatch(content, expectedContent) {
  if (!content) return 0

  // Convert to lowercase for comparison
  const contentLower = content.toLowerCase()
  const expectedLower = expectedContent.toLowerCase()

  // If the content contains the expected text exactly, perfect score
  if (contentLower.includes(expectedLower)) {
    return 1
  }

  // Split expected text into words for partial matching
  const expectedWords = expectedLower.split(/\s+/)
  const matchedWords = expectedWords.filter((word) =>
    contentLower.includes(word)
  )

  // Calculate percentage of matched words
  return matchedWords.length / expectedWords.length
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting scraper comparison tests...\n')

  const results = {
    timestamp: new Date().toISOString(),
    summary: {},
    details: [],
  }

  // Initialize scrapers
  const scrapers = [
    new BasicScraper(),
    new ResilientScraper(),
    new DOMAnalyzerScraper(),
  ]

  // Track overall performance metrics
  const overallMetrics = {}
  for (const scraper of scrapers) {
    overallMetrics[scraper.constructor.name] = {
      successCount: 0,
      totalDuration: 0,
      totalScore: 0,
      testCount: 0,
    }
  }

  // Run each scraper against each test site
  for (const site of TEST_SITES) {
    console.log(
      `\n========== Testing ${site.name} (${site.complexity} complexity) ==========`
    )
    console.log(`URL: ${site.url}`)

    const siteResults = {
      site: site.name,
      url: site.url,
      complexity: site.complexity,
      scraperResults: [],
    }

    for (const scraper of scrapers) {
      const scraperName = scraper.constructor.name
      console.log(`\n>>> Running ${scraperName}...`)

      try {
        const startTime = Date.now()
        const result = await scraper.scrape(site.url)
        const duration = Date.now() - startTime

        // If successful, score the content match
        let matchScore = 0
        if (result.success) {
          matchScore = scoreContentMatch(result.content, site.expectedContent)
          overallMetrics[scraperName].successCount++
          overallMetrics[scraperName].totalScore += matchScore
        }

        overallMetrics[scraperName].totalDuration += duration
        overallMetrics[scraperName].testCount++

        // Log the results
        console.log(`Success: ${result.success}`)
        console.log(`Duration: ${duration}ms`)
        console.log(`Match Score: ${(matchScore * 100).toFixed(2)}%`)

        if (result.success) {
          console.log(
            `Content Extract (First 100 chars): "${result.content.substring(0, 100)}..."`
          )
        } else {
          console.log(`Error: ${result.error}`)
        }

        // Add to site results
        siteResults.scraperResults.push({
          scraper: scraperName,
          success: result.success,
          duration,
          matchScore,
          content: result.success
            ? `${result.content.substring(0, 200)}...`
            : null,
          error: result.success ? null : result.error,
        })
      } catch (error) {
        console.error(
          `Unexpected error running ${scraperName}: ${error.message}`
        )

        siteResults.scraperResults.push({
          scraper: scraperName,
          success: false,
          duration: 0,
          matchScore: 0,
          content: null,
          error: error.message,
        })
      }
    }

    results.details.push(siteResults)
  }

  // Calculate summary metrics
  for (const [scraperName, metrics] of Object.entries(overallMetrics)) {
    results.summary[scraperName] = {
      successRate:
        metrics.testCount > 0 ? metrics.successCount / metrics.testCount : 0,
      averageDuration:
        metrics.testCount > 0 ? metrics.totalDuration / metrics.testCount : 0,
      averageMatchScore:
        metrics.successCount > 0
          ? metrics.totalScore / metrics.successCount
          : 0,
    }
  }

  // Generate rankings
  const rankings = {
    successRate: Object.keys(results.summary).sort(
      (a, b) => results.summary[b].successRate - results.summary[a].successRate
    ),
    speed: Object.keys(results.summary).sort(
      (a, b) =>
        results.summary[a].averageDuration - results.summary[b].averageDuration
    ),
    accuracy: Object.keys(results.summary).sort(
      (a, b) =>
        results.summary[b].averageMatchScore -
        results.summary[a].averageMatchScore
    ),
  }

  results.rankings = rankings

  // Print the test summary
  console.log('\n\n========== TEST SUMMARY ==========')
  console.log('Success Rate:')
  for (const scraper of rankings.successRate) {
    const rate = results.summary[scraper].successRate * 100
    console.log(`${scraper}: ${rate.toFixed(2)}%`)
  }

  console.log('\nSpeed (Average Duration):')
  for (const scraper of rankings.speed) {
    const duration = results.summary[scraper].averageDuration
    console.log(`${scraper}: ${duration.toFixed(2)}ms`)
  }

  console.log('\nAccuracy (Average Match Score):')
  for (const scraper of rankings.accuracy) {
    const score = results.summary[scraper].averageMatchScore * 100
    console.log(`${scraper}: ${score.toFixed(2)}%`)
  }

  // Save the complete results to a file
  const resultsFile = path.join(RESULTS_DIR, `test-results-${Date.now()}.json`)
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2))
  console.log(`\nDetailed results saved to: ${resultsFile}`)

  // Generate an easy-to-read markdown report
  const markdownReport = generateMarkdownReport(results)
  const reportFile = path.join(RESULTS_DIR, 'scraper-comparison-report.md')
  fs.writeFileSync(reportFile, markdownReport)
  console.log(`Readable report saved to: ${reportFile}`)
}

/**
 * Generate a markdown report from the test results
 * @param {Object} results The test results
 * @returns {string} Markdown formatted report
 */
function generateMarkdownReport(results) {
  let report = '# Web Scraper Comparison Report\n\n'
  report += `Generated on: ${new Date().toISOString()}\n\n`

  // Add summary section
  report += '## Summary\n\n'
  report += '| Scraper | Success Rate | Avg. Duration | Accuracy |\n'
  report += '|---------|--------------|---------------|----------|\n'

  for (const [scraperName, metrics] of Object.entries(results.summary)) {
    report += `| ${scraperName} | ${(metrics.successRate * 100).toFixed(2)}% | ${metrics.averageDuration.toFixed(2)}ms | ${(metrics.averageMatchScore * 100).toFixed(2)}% |\n`
  }

  // Add rankings section
  report += '\n## Rankings\n\n'

  report += '### By Success Rate\n\n'
  for (let i = 0; i < results.rankings.successRate.length; i++) {
    const scraper = results.rankings.successRate[i]
    report += `${i + 1}. **${scraper}**: ${(results.summary[scraper].successRate * 100).toFixed(2)}%\n`
  }

  report += '\n### By Speed\n\n'
  for (let i = 0; i < results.rankings.speed.length; i++) {
    const scraper = results.rankings.speed[i]
    report += `${i + 1}. **${scraper}**: ${results.summary[scraper].averageDuration.toFixed(2)}ms\n`
  }

  report += '\n### By Accuracy\n\n'
  for (let i = 0; i < results.rankings.accuracy.length; i++) {
    const scraper = results.rankings.accuracy[i]
    report += `${i + 1}. **${scraper}**: ${(results.summary[scraper].averageMatchScore * 100).toFixed(2)}%\n`
  }

  // Add detailed results per site
  report += '\n## Detailed Results\n\n'

  for (const siteResult of results.details) {
    report += `### ${siteResult.site} (${siteResult.complexity} complexity)\n\n`
    report += `URL: ${siteResult.url}\n\n`

    report +=
      '| Scraper | Success | Duration | Match Score | Content Extract |\n'
    report +=
      '|---------|---------|----------|-------------|----------------|\n'

    for (const result of siteResult.scraperResults) {
      const contentOrError = result.success
        ? `"${result.content}"`
        : `Error: ${result.error}`

      report += `| ${result.scraper} | ${result.success ? '✅' : '❌'} | ${result.duration}ms | ${(result.matchScore * 100).toFixed(2)}% | ${contentOrError} |\n`
    }

    report += '\n'
  }

  // Add conclusions section
  report += '## Conclusions\n\n'

  // Find the best overall scraper
  const overallScores = {}
  for (const scraper of Object.keys(results.summary)) {
    // Calculate a combined score (weight: 40% success, 20% speed, 40% accuracy)
    overallScores[scraper] =
      results.summary[scraper].successRate * 0.4 +
      (1 -
        results.summary[scraper].averageDuration /
          Math.max(
            ...Object.values(results.summary).map((m) => m.averageDuration)
          )) *
        0.2 +
      results.summary[scraper].averageMatchScore * 0.4
  }

  const bestScraper = Object.entries(overallScores).sort(
    (a, b) => b[1] - a[1]
  )[0][0]

  report += `Based on our testing, **${bestScraper}** performs best overall, balancing success rate, speed, and accuracy.\n\n`

  // Add strengths of each scraper
  report += '### Strengths and Weaknesses\n\n'

  for (const [scraper, metrics] of Object.entries(results.summary)) {
    report += `#### ${scraper}\n\n`

    // Determine strengths
    const strengths = []
    const weaknesses = []

    if (metrics.successRate === 1) strengths.push('Perfect success rate')
    else if (metrics.successRate > 0.7) strengths.push('Good success rate')
    else weaknesses.push('Low success rate')

    if (results.rankings.speed[0] === scraper)
      strengths.push('Fastest execution time')
    else if (results.rankings.speed[1] === scraper)
      strengths.push('Good execution speed')
    else weaknesses.push('Slower execution')

    if (metrics.averageMatchScore > 0.9)
      strengths.push('Excellent content accuracy')
    else if (metrics.averageMatchScore > 0.7)
      strengths.push('Good content accuracy')
    else weaknesses.push('Lower content accuracy')

    report += '**Strengths:**\n\n'
    for (const strength of strengths) {
      report += `- ${strength}\n`
    }
    if (strengths.length === 0) report += '- None identified\n'

    report += '\n**Weaknesses:**\n\n'
    for (const weakness of weaknesses) {
      report += `- ${weakness}\n`
    }
    if (weaknesses.length === 0) report += '- None identified\n'

    report += '\n'
  }

  return report
}

// Run the tests
runTests().catch((error) => {
  console.error('Test runner error:', error)
})
