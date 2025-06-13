/**
 * Add-IP Script for SafeIdea.net
 * This script automates the process of adding new intellectual property to SafeIdea's database
 * Prerequisites: User must be logged in
 *
 * IMPORTANT: This script requires manual login if the site is not in a "logged-in" state.
 * The script will pause and wait for manual authentication before proceeding.
 */

const addIPScript = {
  name: 'Add-IP',
  description: 'Automated script to add new intellectual property to SafeIdea',
  prerequisites: {
    requiresLogin: true,
    loginCheck: {
      selector: "[data-testid='nav-add-idea']",
      description: 'Check for Add Idea button in navigation to confirm login',
      timeout: 120000, // 2 minutes for manual login
      instructions:
        'If not logged in, click hamburger menu → Sign In and complete authentication',
    },
  },
  steps: [
    {
      step: 1,
      action: 'Find and click the Add Idea button',
      selector: "[data-testid='nav-add-idea']", // Common selector for navigation add button
      alternativeSelectors: [
        "button:contains('Add Idea')",
        "a:contains('Add Idea')",
        '.nav-add-idea',
      ],
      expectedResult: 'Navigate to the Add IP page',
      notes: 'Button typically appears in navigation after login',
    },
    {
      step: 2,
      action: 'Fill in the Public Title field',
      description:
        'On the Add Your Idea page, add a title using a randomly generated invention',
      selector: "[data-testid='add-ip-title-input']", // Common selector for title input
      alternativeSelectors: [
        "input[placeholder*='Title']",
        "input[name='title']",
        '#title-input',
      ],
      generateTitle: () => {
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

        const profession =
          professions[Math.floor(Math.random() * professions.length)]
        const science = sciences[Math.floor(Math.random() * sciences.length)]
        const technology =
          technologies[Math.floor(Math.random() * technologies.length)]

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
                return (
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
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

        // Capitalize profession, technology, and science
        const professionCap =
          profession.charAt(0).toUpperCase() + profession.slice(1)
        const technologyCap = toTitleCase(technology)
        const scienceCap = toTitleCase(science)
        const outcome = generateOutcome(profession)

        return `A ${professionCap}'s ${technologyCap} System Using ${scienceCap} for ${outcome}`
      },
      expectedResult:
        'Title field populated with generated invention description',
      notes:
        'Title should be one sentence describing a novel invention combining profession, science, and technology',
    },
    {
      step: 3,
      action: 'Fill in the Public Description field',
      description:
        'Generate three sentences about the invention from the Public Title',
      selector: "[data-testid='add-ip-description-input']", // Common selector for description textarea
      alternativeSelectors: [
        "textarea[placeholder*='Description']",
        "textarea[name='description']",
        '#description-input',
        "[data-testid='add-ip-description-textarea']",
      ],
      generateDescription: (title) => {
        // Extract components from the title
        const match = title.match(
          /A (\w+)'s (.+) system using (.+) for enhanced performance/
        )
        if (!match)
          return 'An innovative system that combines cutting-edge technology with scientific principles. This invention revolutionizes the field by providing enhanced performance and efficiency. The integration of advanced technologies creates new possibilities for professional applications.'

        const [_, profession, technology, science] = match

        const sentence1 = `This innovative ${technology} system leverages principles from ${science} to address key challenges faced by ${profession}s in their daily work.`
        const sentence2 = `By integrating advanced ${science} concepts with ${technology}, the system provides unprecedented accuracy and efficiency in professional applications.`
        const sentence3 = `The solution offers real-time analytics and automated processes that significantly enhance productivity and decision-making capabilities for ${profession}s.`

        return `${sentence1} ${sentence2} ${sentence3}`
      },
      expectedResult:
        'Description field populated with three sentences about the invention',
      notes:
        'Description should expand on the title with three sentences providing more detail about the invention',
    },
    {
      step: 4,
      action: 'Create and upload secret IP file',
      description: 'Create MD file with detailed IP description and upload it',
      subSteps: [
        'Create MD file with title, description, and 8 additional paragraphs',
        'Save file to test directory',
        'Scroll down to find Upload File button',
        'Click Upload File button',
        'Click Select File in the modal dialog',
        'Select the created file and click Open',
      ],
      selector: "[data-testid='add-ip-upload-button']", // Common selector for upload button
      alternativeSelectors: [
        "button:contains('Upload File')",
        "[data-testid='upload-file-button']",
        '.upload-file-btn',
      ],
      generateMDFile: (title, description) => {
        const filename = `ip-${Date.now()}.md`
        const filepath = `/test/claude-sdk-mcp/generated/${filename}`

        // Extract components for detailed generation
        const match = title.match(
          /A (\w+)'s (.+) system using (.+) for enhanced performance/
        )
        const [_, profession, technology, science] = match || [
          '',
          'innovative',
          'advanced technology',
          'cutting-edge science',
        ]

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

        const content = `# ${title}\n\n${description}\n\n${paragraphs.join('\n\n')}`

        return { filename, filepath, content }
      },
      expectedResult: 'MD file created and uploaded through file dialog',
      notes:
        'File should contain comprehensive IP documentation with title, description, and 8 detailed paragraphs',
    },
    {
      step: 5,
      action: 'Create the Idea page',
      description:
        "Click on 'Create Your Idea Page' button to generate the idea",
      selector: "[data-testid='create-idea-button']", // Common selector for create button
      alternativeSelectors: [
        "button:contains('Create Your Idea Page')",
        "[data-testid='add-ip-create-button']",
        '.create-idea-btn',
        "button:contains('Create Your Idea')",
      ],
      waitTime: 180000, // 3 minutes max wait time for idea generation
      expectedResult:
        'Idea page is generated and user is redirected to the new idea page',
      notes:
        'May need to scroll down to find the button. Generation process takes a few minutes.',
    },
  ],
}

// Export for use in automated testing
module.exports = addIPScript
