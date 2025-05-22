/**
 * Agentic Content Scraper and Synthesizer
 *
 * This system will:
 * 1. Attempt to scrape the first paragraph from three websites
 * 2. Use feedback loops to improve scraping strategies until successful
 * 3. Synthesize the content into a new article
 */
const fs = require('node:fs')
const { execSync } = require('node:child_process')
const path = require('node:path')

// Configuration for our agent
const config = {
  // Use simpler websites that are more likely to have consistent structure
  sites: [
    { name: 'example', url: 'https://example.com' },
    {
      name: 'mozilla',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    },
    { name: 'w3schools', url: 'https://www.w3schools.com/js/default.asp' },
  ],
  maxAttempts: 1, // Just try once per site for this demo
  codeDir: './generated',
  historyFile: './agent-history.json',
  runId: 1, // Track which run we're on
  timeoutSeconds: 30, // Shorter timeout for demo purposes
}

// Create directories if they don't exist
if (!fs.existsSync(config.codeDir)) {
  fs.mkdirSync(config.codeDir, { recursive: true })
}

// Initialize or load history
let history = { attempts: {}, successes: {}, failures: {} }
if (fs.existsSync(config.historyFile)) {
  history = JSON.parse(fs.readFileSync(config.historyFile, 'utf8'))
}

// Main agent function
async function runAgentSystem() {
  const results = {}
  let allSuccessful = false
  let attemptCount = 0

  // Create a timestamp for this run
  const runTimestamp = new Date().toISOString()

  // Log the start of the run
  console.log(
    `\n====== STARTING RUN ${config.runId} (${runTimestamp}) ======\n`
  )
  console.log(`Target sites: ${config.sites.map((s) => s.name).join(', ')}`)
  console.log(`Maximum attempts: ${config.maxAttempts}`)

  while (!allSuccessful && attemptCount < config.maxAttempts) {
    attemptCount++
    console.log(`\n====== ATTEMPT ${attemptCount} ======\n`)

    // For each site that hasn't been successfully scraped yet
    for (const site of config.sites) {
      if (results[site.name] && results[site.name].success) continue

      // Generate scraping code based on history of attempts
      const code = await generateScrapingCode(site, history)

      // Save and execute the code
      const scriptPath = path.join(
        config.codeDir,
        `${site.name}-scraper-v${attemptCount}.js`
      )
      fs.writeFileSync(scriptPath, code)

      // Execute and capture results
      try {
        console.log(`Executing scraper for ${site.name}...`)
        const output = execSync(`node ${scriptPath}`, {
          encoding: 'utf8',
          timeout: config.timeoutSeconds * 1000, // Convert to milliseconds
          killSignal: 'SIGTERM',
        })

        // Try to parse the output as JSON
        let result
        try {
          result = JSON.parse(output)
        } catch (_parseError) {
          console.log('Failed to parse output as JSON:')
          console.log(`${output.substring(0, 500)}...`)
          throw new Error('Failed to parse script output as JSON')
        }

        if (result.paragraph && result.paragraph.length > 20) {
          // Lower threshold for demo
          console.log(`✅ Successfully scraped ${site.name}!`)
          console.log(`Paragraph: ${result.paragraph.substring(0, 100)}...`)
          results[site.name] = {
            success: true,
            paragraph: result.paragraph,
            scriptPath,
          }

          // Record success in history
          history.successes[site.name] = {
            attempt: attemptCount,
            strategy: analyzeStrategy(code),
            timestamp: new Date().toISOString(),
          }
        } else {
          throw new Error('Paragraph too short or not found')
        }
      } catch (error) {
        console.log(`❌ Failed to scrape ${site.name}: ${error.message}`)

        // Record failure in history
        if (!history.failures[site.name]) history.failures[site.name] = []
        history.failures[site.name].push({
          attempt: attemptCount,
          error: error.message,
          timestamp: new Date().toISOString(),
        })

        results[site.name] = { success: false, error: error.message }
      }
    }

    // Check if all sites were successfully scraped
    allSuccessful = config.sites.every(
      (site) => results[site.name] && results[site.name].success
    )

    // Save updated history
    fs.writeFileSync(config.historyFile, JSON.stringify(history, null, 2))

    if (allSuccessful) {
      console.log('\n🎉 All sites successfully scraped!')

      // Generate synthesis article
      const synthesisScript = await generateSynthesisCode(results)
      const synthesisPath = path.join(config.codeDir, 'content-synthesis.js')
      fs.writeFileSync(synthesisPath, synthesisScript)

      console.log('Generating synthesized article...')
      const article = execSync(`node ${synthesisPath}`, { encoding: 'utf8' })

      console.log('\n===== SYNTHESIZED ARTICLE =====\n')
      console.log(article)

      // Save the article
      fs.writeFileSync('synthesized-article.md', article)
      console.log('\nArticle saved to synthesized-article.md')

      return { success: true, article }
    }
    console.log('\n🔄 Some sites failed. Improving strategies and retrying...')

    // Analyze failures and update strategies
    await analyzeFailuresAndImprove(results, history)
  }

  if (!allSuccessful) {
    console.log('❌ Maximum attempts reached without success')
    return { success: false, results }
  }
}

// Generate scraping code based on history
async function generateScrapingCode(site, history) {
  let prompt = `
Write a short, simple Playwright script that:
1. Navigates to ${site.url}
2. Finds the first paragraph or significant text content on the page
3. Returns ONLY a JSON object with the format: { "paragraph": "the text..." }

IMPORTANT:
- The script must execute in under ${config.timeoutSeconds} seconds
- Use headless: true for speed
- Set navigationTimeout and other timeouts to 10000 ms max
- Skip complex processing and just get the first visible paragraph
- Return only the JSON object, nothing else in stdout
`

  // Add insights from past failures
  if (history.failures[site.name] && history.failures[site.name].length > 0) {
    prompt += '\nPrevious attempts failed with these errors:\n'
    history.failures[site.name].slice(-2).forEach((failure) => {
      prompt += `- ${failure.error}\n`
    })
  }

  // Add insights from past successes on other sites
  const otherSuccesses = Object.entries(history.successes).filter(
    ([name]) => name !== site.name
  )

  if (otherSuccesses.length > 0) {
    prompt += '\nSuccessful strategies from other sites:\n'
    otherSuccesses.forEach(([name, data]) => {
      prompt += `- ${name}: ${data.strategy}\n`
    })
  }

  // Get code from Claude
  const response = execSync(
    `claude -p "${prompt.replace(/"/g, '\\"')}" --output-format text`,
    {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    }
  )

  // Extract code
  const codeMatch = response.match(/```(?:javascript|js)?([\s\S]*?)```/)
  return codeMatch ? codeMatch[1].trim() : response
}

// Generate synthesis code
async function generateSynthesisCode(results) {
  const paragraphs = {}

  for (const site of config.sites) {
    if (results[site.name] && results[site.name].success) {
      paragraphs[site.name] = results[site.name].paragraph
    }
  }

  const prompt = `
Write a Node.js script that synthesizes these three paragraphs into a coherent article:

${Object.entries(paragraphs)
  .map(([site, para]) => `${site}: "${para}"`)
  .join('\n\n')}

The script should:
1. Analyze the topics and themes in each paragraph
2. Create a coherent narrative that weaves them together
3. Output a well-formatted article with appropriate transitions
4. Print ONLY the final article text to stdout (no JSON, no code)

The output should be well-formatted markdown.
`

  // Get code from Claude
  const response = execSync(
    `claude -p "${prompt.replace(/"/g, '\\"')}" --output-format text`,
    {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    }
  )

  // Extract code
  const codeMatch = response.match(/```(?:javascript|js)?([\s\S]*?)```/)
  return codeMatch ? codeMatch[1].trim() : response
}

// Analyze the strategy used in code
function analyzeStrategy(code) {
  // Ask Claude to analyze the strategy
  const prompt = `
Analyze this web scraping code and describe the strategy used in 1-2 sentences:

${code}

Focus on the selector approach, waiting strategy, and error handling pattern.
`

  const response = execSync(
    `claude -p "${prompt.replace(/"/g, '\\"')}" --output-format text`,
    {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    }
  )

  return response.trim()
}

// Analyze failures and generate improved strategies
async function analyzeFailuresAndImprove(results, history) {
  const failedSites = config.sites.filter(
    (site) => !results[site.name] || !results[site.name].success
  )

  for (const site of failedSites) {
    const prompt = `
I'm trying to scrape the first paragraph from ${site.url} but facing challenges.

${
  history.failures[site.name]
    ? `Previous errors:\n${history.failures[site.name].map((f) => `- ${f.error}`).join('\n')}`
    : 'No specific errors recorded yet.'
}

Suggest 3 different approaches to successfully extract the first paragraph of the first article on this site. 
For each approach, explain:
1. What selectors or techniques to use
2. How to handle dynamic content loading
3. How to verify we're getting actual article content, not navigation or ads
`

    const response = execSync(
      `claude -p "${prompt.replace(/"/g, '\\"')}" --output-format text`,
      {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024,
      }
    )

    // Save the improvement suggestions
    const improvementFile = path.join(
      config.codeDir,
      `${site.name}-improvements.md`
    )
    fs.writeFileSync(improvementFile, response)

    console.log(`Generated improvement strategies for ${site.name}`)
  }
}

// Create a report summary of the current run
function generateRunReport(results, history) {
  let report = `\n====== AGENT RUN ${config.runId} REPORT ======\n\n`

  // Summarize attempt statistics
  const attemptsMade = Math.min(
    config.maxAttempts,
    Object.values(history.failures).reduce(
      (max, failures) => Math.max(max, failures?.length || 0),
      0
    ) + 1
  )

  report += `Attempts made: ${attemptsMade}/${config.maxAttempts}\n\n`

  // Summarize each site's status
  report += 'Site Status Summary:\n'
  for (const site of config.sites) {
    const siteResult = results[site.name]
    if (siteResult?.success) {
      report += `✅ ${site.name}: Successfully scraped\n`
      report += `   Paragraph length: ${siteResult.paragraph.length} characters\n`
      report += `   First 100 chars: "${siteResult.paragraph.substring(0, 100)}..."\n\n`
    } else {
      report += `❌ ${site.name}: Failed\n`
      if (siteResult?.error) {
        report += `   Error: ${siteResult.error}\n`
      }

      // Include failure history
      if (
        history.failures[site.name] &&
        history.failures[site.name].length > 0
      ) {
        report += '   Failure history:\n'
        history.failures[site.name].forEach((failure) => {
          report += `   - Attempt ${failure.attempt}: ${failure.error}\n`
        })
      }
      report += '\n'
    }
  }

  // Add strategy analysis
  report += 'Strategy Analysis:\n'
  for (const [site, data] of Object.entries(history.successes)) {
    report += `- ${site}: ${data.strategy}\n`
  }

  report += '\n======================================\n'
  return report
}

// Start the agent system
console.log(
  `Starting agentic content scraper and synthesizer (Run ${config.runId})...`
)
runAgentSystem()
  .then((result) => {
    const report = generateRunReport(result.results || {}, history)
    console.log(report)

    // Save the report
    fs.writeFileSync(`run-${config.runId}-report.md`, report)
    console.log(`Report saved to run-${config.runId}-report.md`)
  })
  .catch((error) => {
    console.error('Error in agent system:', error)
  })
