/**
 * Generate a synthetic idea following the IDEA_GENERATION_PROCESS.md specification
 */
const fs = require('node:fs')
const path = require('node:path')

// Random selection lists
const PROFESSIONS = [
  'Librarian', 'Surgeon', 'Archaeologist', 'Chef', 'Pilot', 
  'Marine Biologist', 'Architect', 'Data Scientist', 'Farmer', 
  'Musician', 'Astronomer', 'Psychologist', 'Engineer'
]

const SCIENTIFIC_FIELDS = [
  'Biomimetics', 'Quantum Physics', 'Neuroplasticity', 'Nanotechnology',
  'Genomics', 'Climate Science', 'Materials Science', 'Astrobiology',
  'Photonics', 'Synthetic Biology', 'Cryptography', 'Chaos Theory'
]

const TECH_DOMAINS = [
  'Information Retrieval', 'Nanorobotics', 'Virtual Reality', 'Blockchain',
  'Machine Learning', 'IoT Sensors', 'Quantum Computing', 'Edge Computing',
  'Augmented Reality', 'Brain-Computer Interfaces', 'Distributed Systems',
  'Computer Vision'
]

// Random selection function
function randomSelect(array) {
  return array[Math.floor(Math.random() * array.length)]
}

// Generate 3-digit random number
function random3Digit() {
  return Math.floor(Math.random() * 900) + 100
}

// Generate synthetic idea
function generateIdea() {
  const profession = randomSelect(PROFESSIONS)
  const scientificField = randomSelect(SCIENTIFIC_FIELDS)
  const techDomain = randomSelect(TECH_DOMAINS)
  
  console.log(`\n🎲 Random Selection:`)
  console.log(`   Profession: ${profession}`)
  console.log(`   Scientific Field: ${scientificField}`)
  console.log(`   Technology Domain: ${techDomain}\n`)
  
  // Generate the idea content
  const title = `${scientificField}-Enhanced ${techDomain} System for ${profession}s`
  
  const description = `A revolutionary platform that applies ${scientificField.toLowerCase()} principles to create an advanced ${techDomain.toLowerCase()} solution specifically designed for ${profession.toLowerCase()}s. This innovation addresses critical challenges in the field by leveraging cutting-edge scientific understanding to deliver unprecedented capabilities and efficiency improvements.`
  
  const paragraph1 = `The ${title} represents a groundbreaking convergence of ${scientificField.toLowerCase()} and ${techDomain.toLowerCase()} specifically tailored to meet the unique needs of ${profession.toLowerCase()}s. Current solutions in this space fail to address the complex requirements of modern ${profession.toLowerCase()} workflows, leading to inefficiencies, missed opportunities, and suboptimal outcomes. By applying principles from ${scientificField.toLowerCase()}, we've developed a system that fundamentally reimagines how ${profession.toLowerCase()}s interact with technology in their daily practice.`
  
  const paragraph2 = `At its core, the system utilizes advanced ${scientificField.toLowerCase()} algorithms integrated with state-of-the-art ${techDomain.toLowerCase()} infrastructure. The technical architecture employs a multi-layered approach where ${scientificField.toLowerCase()}-inspired models process data in real-time, enabling dynamic adaptation to ${profession.toLowerCase()}-specific contexts. Key innovations include proprietary ${techDomain.toLowerCase()} protocols that ensure seamless integration with existing workflows while providing quantum leaps in performance. The system's unique ability to learn from ${profession.toLowerCase()} behavior patterns allows it to anticipate needs and optimize operations continuously.`
  
  const paragraph3 = `What makes this solution truly transformative is its ability to bridge the gap between theoretical ${scientificField.toLowerCase()} research and practical ${profession.toLowerCase()} applications. Unlike existing ${techDomain.toLowerCase()} solutions that offer generic functionality, our system provides ${profession.toLowerCase()}-specific intelligence that evolves with use. Early pilot studies have shown productivity improvements of up to 300%, with ${profession.toLowerCase()}s reporting dramatic enhancements in decision-making accuracy and workflow efficiency. The platform's scalable architecture and intuitive interface make it accessible to ${profession.toLowerCase()}s at all skill levels, democratizing access to advanced ${scientificField.toLowerCase()}-powered tools.`
  
  const content = `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`
  
  // Determine business model based on the combination
  const businessModels = ['SaaS', 'Hardware+Service', 'Licensing', 'Platform-as-a-Service', 'Enterprise Solutions']
  const businessModel = randomSelect(businessModels)
  
  // Create the JSON structure
  const ideaJson = {
    title,
    description,
    content,
    businessModel,
    evaluationPeriod: Math.random() > 0.5 ? "Standard" : "Premium",
    tags: [
      profession.toLowerCase(),
      scientificField.toLowerCase().replace(/\s+/g, '-'),
      techDomain.toLowerCase().replace(/\s+/g, '-'),
      'innovation',
      'cross-disciplinary'
    ].slice(0, 5),
    ndaRequired: Math.random() > 0.3,
    category: techDomain
  }
  
  return { ideaJson, profession, scientificField, techDomain }
}

// Save files
function saveIdea() {
  const { ideaJson, profession, scientificField, techDomain } = generateIdea()
  
  // Save JSON
  const jsonPath = path.join(__dirname, 'synthetic-idea.json')
  fs.writeFileSync(jsonPath, JSON.stringify(ideaJson, null, 2))
  console.log(`✅ JSON saved to: ${jsonPath}`)
  
  // Create synthetic-ideas directory if it doesn't exist
  const ideasDir = path.join(__dirname, 'synthetic-ideas')
  if (!fs.existsSync(ideasDir)) {
    fs.mkdirSync(ideasDir)
  }
  
  // Create markdown filename
  const mdFilename = ideaJson.title.toLowerCase().replace(/\s+/g, '-') + '.md'
  const mdPath = path.join(ideasDir, mdFilename)
  
  // Format the markdown content
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  const docId = `TS-${random3Digit()}-${new Date().getFullYear()}-${random3Digit()}`
  
  const markdown = `# CONFIDENTIAL TRADE SECRET
## ${ideaJson.title}
### SafeIdea Research Institute

**PUBLIC TITLE:** ${ideaJson.title}

**PUBLIC DESCRIPTION:** ${ideaJson.description}

---

## RESTRICTED INFORMATION - TRADE SECRET
*Access Level: Alpha-1*
*Document ID: ${docId}*

### Fundamental Innovation

${ideaJson.content}

### Intellectual Property

**Category:** ${ideaJson.category}
**Business Model:** ${ideaJson.businessModel}
**Evaluation Period:** ${ideaJson.evaluationPeriod}
**Tags:** ${ideaJson.tags.join(', ')}
**NDA Required:** ${ideaJson.ndaRequired ? 'Yes' : 'No'}

---

*This document contains SafeIdea Research Institute confidential and proprietary information. Unauthorized disclosure or reproduction is strictly prohibited and may result in severe civil and criminal penalties.*

*Created: ${currentDate}*

**Generated With:** ${profession}, ${scientificField}, ${techDomain}`
  
  fs.writeFileSync(mdPath, markdown)
  console.log(`✅ Markdown saved to: ${mdPath}`)
  
  console.log('\n📋 Generated Idea Summary:')
  console.log(`   Title: ${ideaJson.title}`)
  console.log(`   Business Model: ${ideaJson.businessModel}`)
  console.log(`   NDA Required: ${ideaJson.ndaRequired}`)
  console.log(`   Tags: ${ideaJson.tags.join(', ')}`)
  
  return { jsonPath, mdPath, ideaJson }
}

// Run if called directly
if (require.main === module) {
  saveIdea()
}

// Export for use in other scripts
module.exports = { generateIdea, saveIdea }