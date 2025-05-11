// cypress/e2e/add-idea-navigation.cy.js

describe('Add Idea Navigation Test', () => {
  it('should navigate to the add idea page after manual login', () => {
    // Visit the main page (configurable via environment variable)
    cy.visit(Cypress.env('BASE_URL') || 'https://safeidea.net')

    // Display instructions for manual login
    cy.log('MANUAL ACTION REQUIRED: Please log in to the application')

    // Wait for login to complete by checking for the Add Idea button
    // This button only appears for logged-in users, so it's a reliable indicator
    cy.get('[data-testid="home-add-idea-button"]', { timeout: 60000 })
      .should('be.visible')
      .then(($button) => {
        cy.log('Login detected, proceeding with test')

        // Get the href attribute from the button link
        // This is more reliable than clicking
        const href = $button.attr('href')

        // If href exists, navigate directly to that URL
        if (href) {
          // Use the base URL plus the href path
          const baseUrl = Cypress.env('BASE_URL') || 'https://safeidea.net'
          const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`

          cy.log(`Navigating to: ${fullUrl}`)
          cy.visit(fullUrl)
        } else {
          // Fallback: Try clicking it anyway
          cy.log('No href found, attempting click')
          cy.wrap($button).click()
        }
      })

    // Verify we've reached the add idea page by checking for the idea title input
    cy.get('[data-testid="idea-title-input"]', { timeout: 10000 })
      .should('be.visible')
      .then(() => {
        cy.log('Successfully navigated to Add Idea page')
      })
  })
})
