/**
 * Simplified Agentic Content Scraper - Demo Version
 */
const fs = require('node:fs')
const path = require('node:path')

// We'll simulate the agent's evolution for demonstration purposes
const run1Result = {
  runId: 1,
  timestamp: new Date().toISOString(),
  sites: [
    {
      name: 'example',
      url: 'https://example.com',
      success: true,
      paragraph:
        'This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission. More information...',
    },
    {
      name: 'mozilla',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      success: false,
      error: "Timeout while waiting for selector '.page-content p'",
    },
    {
      name: 'w3schools',
      url: 'https://www.w3schools.com/js/default.asp',
      success: false,
      error: "Error parsing JSON output: unexpected token at '<!DOCTYPE html>'",
    },
  ],
  strategies: {
    example:
      'Used document.querySelector to find the first paragraph on the page and extract its text content, with a simple timeout for page load.',
  },
}

const run2Result = {
  runId: 2,
  timestamp: new Date(Date.now() + 1000 * 60).toISOString(),
  sites: [
    {
      name: 'example',
      url: 'https://example.com',
      success: true,
      paragraph:
        'This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission. More information...',
    },
    {
      name: 'mozilla',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      success: true,
      paragraph:
        'JavaScript (JS) is a lightweight interpreted (or just-in-time compiled) programming language with first-class functions. While it is most well-known as the scripting language for Web pages, many non-browser environments also use it, such as Node.js, Apache CouchDB and Adobe Acrobat.',
    },
    {
      name: 'w3schools',
      url: 'https://www.w3schools.com/js/default.asp',
      success: false,
      error: 'Navigation timeout of 10000 ms exceeded',
    },
  ],
  strategies: {
    example:
      'Used document.querySelector to find the first paragraph on the page and extract its text content, with a simple timeout for page load.',
    mozilla:
      'Improved selector to target specific content sections, added waiting for navigation to complete, and implemented retry logic for content loading.',
  },
}

const run3Result = {
  runId: 3,
  timestamp: new Date(Date.now() + 1000 * 60 * 2).toISOString(),
  sites: [
    {
      name: 'example',
      url: 'https://example.com',
      success: true,
      paragraph:
        'This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission. More information...',
    },
    {
      name: 'mozilla',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      success: true,
      paragraph:
        'JavaScript (JS) is a lightweight interpreted (or just-in-time compiled) programming language with first-class functions. While it is most well-known as the scripting language for Web pages, many non-browser environments also use it, such as Node.js, Apache CouchDB and Adobe Acrobat.',
    },
    {
      name: 'w3schools',
      url: 'https://www.w3schools.com/js/default.asp',
      success: true,
      paragraph:
        "JavaScript is the world's most popular programming language. JavaScript is the programming language of the Web. JavaScript is easy to learn. This tutorial will teach you JavaScript from basic to advanced.",
    },
  ],
  strategies: {
    example:
      'Used document.querySelector to find the first paragraph on the page and extract its text content, with a simple timeout for page load.',
    mozilla:
      'Improved selector to target specific content sections, added waiting for navigation to complete, and implemented retry logic for content loading.',
    w3schools:
      'Used a more resilient approach with multiple selector fallbacks, disabled CSS and image loading for speed, and implemented a navigation bypass technique for the cookie consent dialog.',
  },
  synthesizedArticle: `
# The Wide World of JavaScript

JavaScript has become an integral part of our digital landscape. As the **example.com** documentation states: "This domain is for use in illustrative examples in documents," and JavaScript itself serves as an excellent example of how programming languages can evolve beyond their initial purpose.

According to **Mozilla Developer Network**, "JavaScript (JS) is a lightweight interpreted (or just-in-time compiled) programming language with first-class functions." While it began as a simple scripting language for web pages, it has expanded far beyond the browser into environments like Node.js, Apache CouchDB, and even Adobe Acrobat.

This versatility makes JavaScript highly accessible to newcomers. As **W3Schools** emphasizes, "JavaScript is the world's most popular programming language... JavaScript is easy to learn." Its ubiquity across web platforms has cemented its position as the essential programming language of the modern web.

From simple examples to complex applications, JavaScript continues to demonstrate its flexibility and power in diverse computing environments.
`,
}

// Generate report for a run
function generateReport(run) {
  let report = `\n====== AGENT RUN ${run.runId} REPORT ======\n\n`

  report += `Run timestamp: ${run.timestamp}\n\n`

  // Summarize each site's status
  report += 'Site Status Summary:\n'
  for (const site of run.sites) {
    if (site.success) {
      report += `✅ ${site.name}: Successfully scraped\n`
      report += `   Paragraph length: ${site.paragraph.length} characters\n`
      report += `   First 100 chars: "${site.paragraph.substring(0, 100)}..."\n\n`
    } else {
      report += `❌ ${site.name}: Failed\n`
      report += `   Error: ${site.error}\n\n`
    }
  }

  // Add strategy analysis
  report += 'Strategy Analysis:\n'
  for (const [site, strategy] of Object.entries(run.strategies)) {
    report += `- ${site}: ${strategy}\n`
  }

  // Add synthesized article if available
  if (run.synthesizedArticle) {
    report += '\nSynthesized Article:\n'
    report += run.synthesizedArticle
  }

  report += '\n======================================\n'
  return report
}

// Simulate runs with improvement analysis between each
async function simulateAgentEvolution() {
  // Ensure directory exists
  const reportsDir = './reports'
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir)
  }

  // Run 1
  console.log('=== STARTING AGENT RUN 1 ===')
  const report1 = generateReport(run1Result)
  console.log(report1)
  fs.writeFileSync(path.join(reportsDir, 'run-1-report.md'), report1)

  console.log('\n=== ANALYZING RUN 1 RESULTS AND IMPROVING STRATEGIES ===')
  console.log('ISSUES IDENTIFIED:')
  console.log(
    '1. Mozilla: Timeout while waiting for selector - need more resilient selector strategy'
  )
  console.log(
    "2. W3Schools: Output parsing error - script likely didn't return valid JSON"
  )
  console.log('\nSTRATEGY IMPROVEMENTS:')
  console.log(
    '1. Mozilla: Add wait for navigation complete, use multiple selector fallbacks'
  )
  console.log(
    '2. W3Schools: Ensure proper output formatting, implement error handling for parsing'
  )

  // Pause to simulate improvement time
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Run 2
  console.log('\n=== STARTING AGENT RUN 2 WITH IMPROVED STRATEGIES ===')
  const report2 = generateReport(run2Result)
  console.log(report2)
  fs.writeFileSync(path.join(reportsDir, 'run-2-report.md'), report2)

  console.log('\n=== ANALYZING RUN 2 RESULTS AND IMPROVING STRATEGIES ===')
  console.log('ISSUES IDENTIFIED:')
  console.log(
    '1. W3Schools: Navigation timeout - possible cookie consent dialog blocking'
  )
  console.log('\nSTRATEGY IMPROVEMENTS:')
  console.log(
    '1. W3Schools: Implement cookie consent bypass, disable CSS and images for faster loading'
  )
  console.log(
    "2. All sites: Add content validation to ensure we're getting meaningful paragraphs"
  )

  // Pause to simulate improvement time
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Run 3
  console.log('\n=== STARTING AGENT RUN 3 WITH IMPROVED STRATEGIES ===')
  const report3 = generateReport(run3Result)
  console.log(report3)
  fs.writeFileSync(path.join(reportsDir, 'run-3-report.md'), report3)

  // Final synthesis
  console.log('\n=== FINAL RESULTS AFTER 3 AGENT EVOLUTION CYCLES ===')
  console.log(
    `Sites successfully scraped: ${run3Result.sites.filter((s) => s.success).length}/${run3Result.sites.length}`
  )
  console.log(
    'Strategy evolution demonstrated incremental improvements with feedback-based learning'
  )
  console.log(
    'Final synthesized article successfully combined content from all three sources'
  )

  // Save synthesized article
  fs.writeFileSync(
    path.join(reportsDir, 'synthesized-article.md'),
    run3Result.synthesizedArticle
  )
  console.log('\nSynthesized article saved to reports/synthesized-article.md')
}

// Run the simulation
console.log('Starting agentic content scraper simulation...')
simulateAgentEvolution().catch(console.error)
