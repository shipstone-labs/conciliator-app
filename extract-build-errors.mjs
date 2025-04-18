#!/usr/bin/env node

import * as fs from 'node:fs'
// You'll need to install: npm install strip-ansi
import stripAnsi from 'strip-ansi'

// Get input and output file paths from command line arguments
if (process.argv.length < 3) {
  console.error(
    'Usage: node extract-build-errors.js <input-log-file> [output-md-file]'
  )
  process.exit(1)
}

const inputFile = process.argv[2]
const outputFile = process.argv.length > 3 ? process.argv[3] : null

// Read the log file
try {
  const logContent = fs.readFileSync(inputFile, 'utf8')
  processLog(logContent, outputFile)
} catch (error) {
  console.error(`Error reading file: ${error.message}`)
  process.exit(1)
}

function processLog(logContent, outputFile) {
  const buildSections = []
  const lines = logContent.split('\n')

  // Find build wrapper section
  const wrapperSection = extractSection(
    lines,
    (line) => line.includes('RUN pnpm build-wrappers'),
    (line) => line.includes('END')
  )

  // Find build section
  const buildSection = extractSection(
    lines,
    (line) => line.includes('next build'),
    (line) => line.includes('END')
  )

  // Collect sections with errors
  if (
    wrapperSection.content &&
    (wrapperSection.hasError || wrapperSection.hasFailed)
  ) {
    buildSections.push({
      title: 'Wrapper Build Errors',
      content: wrapperSection.content,
    })
  }

  if (
    buildSection.content &&
    (buildSection.hasError || buildSection.hasFailed)
  ) {
    buildSections.push({
      title: 'Main Build Errors',
      content: buildSection.content,
    })
  }

  // If no errors found, exit
  if (buildSections.length === 0) {
    console.log('No build errors detected')
    return
  }

  // Format output as markdown
  let mdOutput = '# Build Errors\n\n'

  buildSections.forEach((section) => {
    mdOutput += `## ${section.title}\n\n\`\`\`console\n${section.content}\n\`\`\`\n\n`
  })

  if (outputFile) {
    // Write to output file
    try {
      fs.writeFileSync(outputFile, mdOutput)
      console.log(`Error details written to ${outputFile}`)
    } catch (error) {
      console.error(`Error writing output file: ${error.message}`)
      process.exit(1)
    }
  } else {
    // Output to stdout
    console.log(mdOutput)
  }
}

function extractSection(lines, startPredicate, endPredicate) {
  let inSection = false
  const sectionLines = []
  let buildId = null
  let hasError = false
  let hasFailed = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Extract build ID (#xx) from start line
    if (!inSection && startPredicate(line)) {
      inSection = true

      // Extract the build ID (#xx)
      const match = line.match(/#(\d+)/)
      if (match) {
        buildId = match[0] // Store the full "#xx" format
      }

      // Add the line to our section, cleaning up timestamps
      sectionLines.push(cleanLine(line))
      continue
    }

    if (inSection) {
      // Check if the line has the same build ID and is an end marker
      if (buildId && line.includes(buildId) && endPredicate(line)) {
        // Add the end line
        sectionLines.push(cleanLine(line))

        // Check if it has ELIFECYCLE failure
        if (
          line.includes('ELIFECYCLE') &&
          line.includes('Command failed with exit code')
        ) {
          hasFailed = true
        }
        break // End of section
      }

      // Add line to section if it has the right build ID
      if (!buildId || line.includes(buildId)) {
        const cleanedLine = cleanLine(line)
        sectionLines.push(cleanedLine)

        // Check for error indicators
        if (/Error|Failed/i.test(cleanedLine)) {
          hasError = true
        }
      }
    }
  }

  return {
    content: sectionLines.join('\n'),
    hasError,
    hasFailed,
  }
}

function cleanLine(line) {
  // Remove build ID and timestamp pattern (#xx xxx.xxx)
  const noPrefix = line.replace(/^#\d+\s(\d+\.\d+\s)?/, '')
  // Strip ANSI color codes
  return stripAnsi(noPrefix)
}
