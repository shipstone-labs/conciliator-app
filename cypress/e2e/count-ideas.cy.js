// cypress/e2e/count-ideas.cy.js

describe('Ideas Count Test', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies()
    cy.clearLocalStorage()

    // Set viewport size to ensure consistent testing
    cy.viewport(1280, 800)
  })

  it(
    'should navigate to the ideas list page and count ideas',
    { retries: 2 },
    () => {
      // Visit the main page (configurable via environment variable)
      cy.visit(Cypress.env('BASE_URL') || 'https://safeidea.net', {
        timeout: 30000, // Allow generous timeout for initial page load
        failOnStatusCode: false, // Don't fail on non-200 responses
        retryOnNetworkFailure: true, // Auto-retry on network failures
      })

      // Wait for page to be fully loaded
      cy.title().should('not.be.empty')

      // Click on the "Explore Ideas" navigation link using its test ID
      cy.get('[data-testid="nav-explore-ideas"]', { timeout: 10000 })
        .should('be.visible')
        .click()

      // Wait for the ideas to load (using the card grid)
      // Adding a more specific approach with better error messaging
      cy.get('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4', {
        timeout: 15000,
      })
        .should('be.visible')
        .then(($grid) => {
          if (!$grid.length) {
            throw new Error('Card grid not found or not visible')
          }
        })

      // Count all idea cards and log the result
      cy.get(
        '.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 > .shadow-xl'
      ).then(($cards) => {
        const count = $cards.length

        // Log extensive information for debugging
        cy.log(`Found ${count} ideas on the page`)
        cy.log(`Current URL: ${window.location.href}`)

        // Store count in Cypress environment for later reporting
        Cypress.env('ideasCount', count)

        // Store result in Cypress alias
        cy.wrap(count).as('ideasCount')

        // Write count to file for external integration or report generation
        cy.writeFile('cypress/downloads/ideas-count.json', {
          count,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        })

        // Print to console for CI environments
        console.log(`\n=== IDEAS COUNT: ${count} ===\n`)
      })
    }
  )

  afterEach(() => {
    // Check if the ideasCount alias exists and log it
    cy.get('@ideasCount').then((count) => {
      if (count) {
        cy.log(`Test complete - Found ${count} ideas`)
      }
    })
  })
})
