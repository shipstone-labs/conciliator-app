/**
 * Automated Add-IP Script for SafeIdea.net
 * This script fully automates the IP creation process including file upload
 */

const { sdk } = require('@anthropic-ai/claude-sdk')
const fs = require('node:fs').promises
const path = require('node:path')

async function runAddIPAutomation() {
  const page = await sdk.getPage()

  console.log('🚀 Starting Add-IP automation...')

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
  console.log('📝 Step 1: Navigating to Add Idea page...')
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
    'quantum physics',
    'biotechnology',
    'neuroscience',
    'materials science',
    'oceanography',
    'astrophysics',
    'genetics',
    'chemistry',
    'ecology',
    'robotics',
  ]
  const technologies = [
    'AI',
    'blockchain',
    '3D printing',
    'nanotechnology',
    'VR/AR',
    'IoT sensors',
    'drones',
    'laser technology',
    'solar panels',
    'biometrics',
  ]

  // Title case function - capitalizes all words except connectors
  const toTitleCase = (str) => {
    const connectors = [
      'a',
      'an',
      'and',
      'as',
      'at',
      'but',
      'by',
      'for',
      'from',
      'in',
      'into',
      'nor',
      'of',
      'on',
      'or',
      'so',
      'the',
      'to',
      'up',
      'with',
      'yet',
    ]
    return str
      .split(' ')
      .map((word, index) => {
        // Always capitalize first word, otherwise check if it's a connector
        if (index === 0 || !connectors.includes(word.toLowerCase())) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        }
        return word.toLowerCase()
      })
      .join(' ')
  }

  // Generate contextual outcome based on profession/technology/science
  const generateOutcome = (prof) => {
    const outcomes = {
      architect: [
        'Sustainable Building Design',
        'Structural Optimization',
        'Space Utilization',
        'Energy Efficiency',
      ],
      surgeon: [
        'Precision Surgery',
        'Patient Recovery',
        'Surgical Accuracy',
        'Medical Diagnostics',
      ],
      chef: [
        'Culinary Innovation',
        'Food Safety',
        'Recipe Optimization',
        'Kitchen Efficiency',
      ],
      pilot: [
        'Flight Safety',
        'Navigation Accuracy',
        'Fuel Efficiency',
        'Weather Prediction',
      ],
      teacher: [
        'Student Engagement',
        'Learning Outcomes',
        'Educational Assessment',
        'Classroom Management',
      ],
      engineer: [
        'System Reliability',
        'Process Automation',
        'Quality Control',
        'Resource Management',
      ],
      farmer: [
        'Crop Yield',
        'Agricultural Sustainability',
        'Harvest Prediction',
        'Soil Management',
      ],
      musician: [
        'Sound Quality',
        'Creative Composition',
        'Performance Enhancement',
        'Acoustic Analysis',
      ],
      lawyer: [
        'Case Analysis',
        'Legal Research',
        'Contract Review',
        'Compliance Monitoring',
      ],
      designer: [
        'Creative Workflow',
        'Design Iteration',
        'Visual Communication',
        'User Experience',
      ],
    }

    // Pick a relevant outcome for the profession, or generate a generic one
    const professionOutcomes = outcomes[prof] || [
      'Operational Excellence',
      'Performance Optimization',
      'Process Innovation',
      'Efficiency Gains',
    ]
    return professionOutcomes[
      Math.floor(Math.random() * professionOutcomes.length)
    ]
  }

  const profession = professions[Math.floor(Math.random() * professions.length)]
  const science = sciences[Math.floor(Math.random() * sciences.length)]
  const technology =
    technologies[Math.floor(Math.random() * technologies.length)]

  // Capitalize profession, technology, and science
  const professionCap = profession.charAt(0).toUpperCase() + profession.slice(1)
  const technologyCap = toTitleCase(technology)
  const scienceCap = toTitleCase(science)
  const outcome = generateOutcome(profession)

  const title = `A ${professionCap}'s ${technologyCap} System Using ${scienceCap} for ${outcome}`

  await page.fill('input[type="text"]', title)
  console.log(`   Title: ${title}`)

  // Step 3: Generate and fill description
  console.log('📄 Step 3: Generating and filling description...')
  const description = `This innovative ${technology} system leverages principles from ${science} to address key challenges faced by ${profession}s in their daily work. By integrating advanced ${science} concepts with ${technology}, the system provides unprecedented accuracy and efficiency in professional applications. The solution offers real-time analytics and automated processes that significantly enhance productivity and decision-making capabilities for ${profession}s.`

  await page.fill('textarea', description)

  // Step 4: Create and upload file (NEW AUTOMATED METHOD!)
  console.log('📁 Step 4: Creating and uploading secret file...')

  // Generate file content
  const fileContent = generateDetailedContent(
    title,
    description,
    profession,
    technology,
    science
  )
  const fileName = `ip-${Date.now()}.md`
  const filePath = path.join(__dirname, 'generated', fileName)

  // Ensure directory exists
  await fs.mkdir(path.join(__dirname, 'generated'), { recursive: true })

  // Write file
  await fs.writeFile(filePath, fileContent)
  console.log(`   Created file: ${fileName}`)

  // Here's the key automation - directly set the file on the hidden input!
  const fileInput = await page.$('[data-testid="file-upload-input"]')
  if (fileInput) {
    await fileInput.setInputFiles(filePath)
    console.log('✅ File uploaded successfully!')
  } else {
    // Fallback: If testid not found, use the modal approach
    console.log('⚠️  Hidden input not found, using modal approach...')
    await page.evaluate(() => window.scrollBy(0, 300))
    await page.click('button:text("Upload File")')
    await page.waitForSelector('button:text("Select File")', { timeout: 5000 })
    await page.click('button:text("Select File")')
    console.log('📂 Please manually select the file:', filePath)
    // Wait for file to be selected
    await page.waitForSelector('text=/File uploaded successfully/', {
      timeout: 30000,
    })
  }

  // Step 5: Create the idea
  console.log('🎨 Step 5: Creating idea page...')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.click('button:text("Create Your Idea Page")')

  console.log('⏳ Waiting for idea generation (this may take a few minutes)...')
  await page.waitForSelector('text=/Creating Your Idea Page/', {
    timeout: 5000,
  })

  // Wait for redirect to the new idea page
  await page.waitForURL(/\/(details|view)\//, { timeout: 180000 })

  console.log('🎉 Success! Your idea has been created!')
  console.log(`📍 Current URL: ${page.url()}`)
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
