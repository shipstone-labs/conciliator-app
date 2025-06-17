/**
 * Automated Add-IP Script for SafeIdea.net with Progress Tracking
 * This script fully automates the IP creation process including file upload
 * and provides detailed progress tracking during blockchain operations
 */

const { sdk } = require('@anthropic-ai/claude-sdk')
const _fs = require('node:fs').promises
const _path = require('node:path')

// Progress tracking helper
function getProgressFromStatus(statusText) {
  const stages = {
    'Storing encrypted document in Storacha': { progress: 10, emoji: '📦' },
    'Storing downsampled encrypted document': { progress: 20, emoji: '📦' },
    'AI generating token image': { progress: 30, emoji: '🤖' },
    'Storing AI generated token image': { progress: 40, emoji: '🖼️' },
    'Minting token for you': { progress: 50, emoji: '🪙' },
    'Storing token metadata': { progress: 70, emoji: '💾' },
    'Setting token metadata URI': { progress: 85, emoji: '⚙️' },
    'Updating database record': { progress: 95, emoji: '📝' },
    Finished: { progress: 100, emoji: '✅' },
  }

  for (const [key, value] of Object.entries(stages)) {
    if (statusText?.includes(key)) {
      return value
    }
  }
  return { progress: 0, emoji: '⏳' }
}

// Monitor progress with detailed status updates
async function monitorCreationProgress(page, maxWaitTime = 180000) {
  console.log('\n📊 Monitoring blockchain creation progress...\n')

  const startTime = Date.now()
  let lastStatus = ''
  let checkInterval

  return new Promise((resolve, reject) => {
    checkInterval = setInterval(async () => {
      try {
        // Check if we've exceeded max wait time
        if (Date.now() - startTime > maxWaitTime) {
          clearInterval(checkInterval)
          reject(new Error('Creation timeout exceeded'))
          return
        }

        // Check for redirect (completion)
        const currentUrl = page.url()
        if (currentUrl.includes('/details/') || currentUrl.includes('/view/')) {
          clearInterval(checkInterval)
          console.log('\n✅ Creation complete! Redirected to:', currentUrl)
          resolve(currentUrl)
          return
        }

        // Get current status text
        const statusElement = await page.$('text=/Creating Your Idea Page/')
        if (statusElement) {
          const parentDiv = await statusElement.$(
            'xpath=ancestor::div[contains(@class, "rounded-lg")]'
          )
          if (parentDiv) {
            const statusText = await parentDiv.textContent()

            // Only log if status changed
            if (statusText !== lastStatus) {
              lastStatus = statusText
              const { progress, emoji } = getProgressFromStatus(statusText)
              const elapsed = Math.floor((Date.now() - startTime) / 1000)

              // Extract blockchain details if available
              const contractMatch = statusText.match(
                /Contract Address:([^\s]+)/
              )
              const tokenMatch = statusText.match(/Token ID:([^\s]+)/)

              // Create progress bar
              const progressBar =
                '█'.repeat(Math.floor(progress / 5)) +
                '░'.repeat(20 - Math.floor(progress / 5))

              console.log(
                `${emoji} [${progressBar}] ${progress}% - ${elapsed}s`
              )
              console.log(`   Status: ${statusText.split('\n')[0]}`)

              if (contractMatch) {
                console.log(`   Contract: ${contractMatch[1]}`)
              }
              if (tokenMatch) {
                console.log(`   Token ID: ${tokenMatch[1]}`)
              }
              console.log('')
            }
          }
        }
      } catch (_error) {
        // Ignore errors during monitoring, keep checking
      }
    }, 1000) // Check every second
  })
}

async function runAddIPAutomation() {
  const page = await sdk.getPage()

  console.log('🚀 Starting Add-IP automation with progress tracking...')

  // Step 0: Check if logged in
  console.log('📋 Checking login status...')
  try {
    await page.waitForSelector('[data-testid="nav-add-idea"]', {
      timeout: 5000,
    })
    console.log('✅ Already logged in')
  } catch {
    console.log('🔐 Not logged in. Please login manually...')
    console.log('   Click hamburger menu → Sign In')
    await page.waitForSelector('[data-testid="nav-add-idea"]', {
      timeout: 120000,
    })
    console.log('✅ Login successful')
  }

  // Step 1: Navigate to Add Idea page
  console.log('\n📝 Step 1: Navigating to Add Idea page...')
  await page.click('[data-testid="nav-add-idea"]')
  await page.waitForSelector('input[type="text"]', { timeout: 10000 })

  // Step 2: Generate and fill title
  console.log('🎯 Step 2: Generating and filling title...')
  const professions = [
    'architect',
    'surgeon',
    'chef',
    'pilot',
    'teacher',
    'engineer',
    'farmer',
    'musician',
    'lawyer',
    'designer',
  ]
  const sciences = [
    'mathematics',
    'physics',
    'chemistry',
    'biology',
    'neuroscience',
    'genetics',
    'astrophysics',
    'geology',
    'meteorology',
    'oceanography',
  ]
  const technologies = [
    'blockchain',
    'AI',
    'quantum computing',
    'nanotechnology',
    'biotechnology',
    'robotics',
    'IoT',
    'AR/VR',
    '3D printing',
    'renewable energy',
  ]

  const profession = professions[Math.floor(Math.random() * professions.length)]
  const science = sciences[Math.floor(Math.random() * sciences.length)]
  const technology =
    technologies[Math.floor(Math.random() * technologies.length)]

  // Format title with proper capitalization
  const formatWord = (word) => word.charAt(0).toUpperCase() + word.slice(1)
  const title = `A ${formatWord(profession)}'s ${formatWord(technology)} System Using ${formatWord(science)} for Enhanced Performance`
  console.log(`   Title: ${title}`)

  // Fill title - target by placeholder
  const titleInput = await page.$(
    'input[placeholder="Enter public title for your Idea here"]'
  )
  await titleInput.fill(title)

  // Step 3: Generate and fill description
  console.log('📄 Step 3: Generating and filling description...')
  const description = `This innovative ${technology} system leverages principles from ${science} to address key challenges faced by ${profession}s in their daily work. By integrating advanced ${science} concepts with ${technology}, the system provides unprecedented accuracy and efficiency in professional applications. The solution offers real-time analytics and automated processes that significantly enhance productivity and decision-making capabilities for ${profession}s.`

  const descriptionTextarea = await page.$(
    'textarea[placeholder="Enter public description of your Idea here"]'
  )
  await descriptionTextarea.fill(description)

  // Step 4: Create and upload file automatically
  console.log('📁 Step 4: Creating and uploading secret file...')

  // Generate detailed markdown content
  const content = generateDetailedContent(
    title,
    description,
    profession,
    technology,
    science
  )

  // Create file and upload using the hidden input
  await page.evaluate((fileContent) => {
    // Create a File object
    const blob = new Blob([fileContent], { type: 'text/markdown' })
    const file = new File([blob], 'generated-idea-document.md', {
      type: 'text/markdown',
      lastModified: Date.now(),
    })

    // Find the file input (it should have data-testid="file-upload-input")
    const fileInput =
      document.querySelector('[data-testid="file-upload-input"]') ||
      document.querySelector('input[type="file"]')

    if (fileInput) {
      // Create a DataTransfer object to hold our file
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      // Set the files property
      fileInput.files = dataTransfer.files

      // Trigger the change event
      const event = new Event('change', { bubbles: true })
      fileInput.dispatchEvent(event)
    }
  }, content)

  // Wait for file upload success
  await page.waitForSelector('text=/File uploaded successfully/', {
    timeout: 10000,
  })
  console.log('   ✅ File uploaded automatically - no manual selection needed!')

  // Step 5: Create the idea
  console.log('\n🎨 Step 5: Creating idea page...')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.click('button:text("Create Your Idea Page")')

  // Monitor creation with detailed progress
  try {
    const finalUrl = await monitorCreationProgress(page)
    console.log('\n🎉 Success! Your idea has been created!')
    console.log(`📍 View your idea at: ${finalUrl}`)
  } catch (error) {
    console.error('\n❌ Error during creation:', error.message)
  }
}

function generateDetailedContent(
  title,
  description,
  profession,
  technology,
  science
) {
  const paragraphs = [
    `## Technical Architecture\nThe ${technology} system employs a sophisticated multi-layered architecture that seamlessly integrates ${science} principles at its core. Each component has been meticulously designed to work in harmony, creating a robust framework that can adapt to the complex requirements of ${profession}s. The modular design allows for easy customization and scaling based on specific use cases.`,

    `## Core Innovation\nAt the heart of this invention lies a breakthrough algorithm that leverages ${science} to optimize ${technology} performance. This novel approach solves long-standing challenges in the field by introducing adaptive learning mechanisms that continuously improve based on real-world usage patterns. The system's ability to self-optimize sets it apart from conventional solutions.`,

    `## Implementation Details\nThe implementation utilizes state-of-the-art ${technology} frameworks combined with proprietary ${science}-based modules. The system processes data through multiple validation layers, ensuring accuracy and reliability at every step. Advanced error correction and redundancy mechanisms guarantee consistent performance even under challenging conditions.`,

    `## Performance Metrics\nExtensive testing has demonstrated significant performance improvements over existing solutions. The ${technology} system achieves up to 300% faster processing speeds while maintaining 99.9% accuracy rates. Energy efficiency has been optimized through ${science}-inspired algorithms, reducing operational costs by approximately 40%.`,

    `## User Interface and Experience\nThe system features an intuitive interface designed specifically for ${profession}s, minimizing the learning curve and maximizing productivity. Real-time visualization tools provide immediate feedback, while customizable dashboards allow users to focus on the metrics most relevant to their work. The mobile-responsive design ensures accessibility across all devices.`,

    `## Security and Privacy\nSecurity has been built into every layer of the system, with end-to-end encryption and blockchain-based audit trails. The ${science}-enhanced security protocols provide protection against both current and emerging threats. User privacy is maintained through advanced anonymization techniques that comply with global data protection regulations.`,

    `## Market Applications\nThe versatility of this ${technology} system opens up numerous market opportunities beyond the primary ${profession} sector. Adjacent industries have already expressed interest in adapted versions for their specific needs. The scalable architecture allows for easy customization to different market segments while maintaining core functionality.`,

    `## Future Development Roadmap\nOngoing research continues to expand the capabilities of the system, with planned integrations of emerging ${science} discoveries and next-generation ${technology} advancements. The development roadmap includes AI-powered predictive analytics, quantum computing compatibility, and enhanced collaborative features for team environments. Regular updates ensure the system remains at the forefront of innovation.`,
  ]

  return `# ${title}\n\n${description}\n\n${paragraphs.join('\n\n')}`
}

// Run the automation
runAddIPAutomation().catch(console.error)
