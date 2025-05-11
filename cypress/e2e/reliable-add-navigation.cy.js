// cypress/e2e/reliable-add-navigation.cy.js

describe('Reliable Add Idea Navigation', () => {
  it('should navigate to add-ip page after login', () => {
    // Visit the main page with increased timeout for initial load
    cy.visit(Cypress.env('BASE_URL') || 'https://safeidea.net', {
      timeout: 30000,
    })

    // Display clear instructions for manual login
    cy.log('PLEASE LOG IN MANUALLY NOW')
    cy.log('After login is complete, the test will continue automatically')

    // Wait for an indicator that login has completed - the Add Idea button
    // This is a reliable indicator as it only appears for logged-in users
    cy.get('[data-testid="home-add-idea-button"]', {
      timeout: 120000, // 2 minute timeout for login
    }).should('be.visible')

    // Log that login was successful and we're continuing
    cy.log('Login detected, proceeding to Add Idea page')

    // Navigate directly to the add-ip page using the URL
    // This is more reliable than clicking as it bypasses client-side routing complexities
    cy.visit(`${Cypress.env('BASE_URL') || 'https://safeidea.net'}/add-ip`, {
      timeout: 30000,
    })

    // Verify we've reached the add idea page by checking for a key element
    cy.get('[data-testid="idea-title-input"]', {
      timeout: 30000,
    }).should('be.visible')

    cy.log('SUCCESS: Reached the Add Idea page')
  })
})
