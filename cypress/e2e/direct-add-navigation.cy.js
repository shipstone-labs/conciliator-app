// cypress/e2e/direct-add-navigation.cy.js

describe('Direct Add Idea Navigation', () => {
  it(
    'should navigate to add-ip after login',
    { defaultCommandTimeout: 120000 },
    () => {
      // Visit the main page
      cy.visit(Cypress.env('BASE_URL') || 'https://safeidea.net')

      // Display instructions for manual login
      cy.log('MANUAL ACTION REQUIRED: Please log in to the application')

      // Wait for login to complete by checking for the Add Idea button
      cy.get('[data-testid="home-add-idea-button"]', { timeout: 60000 })
        .should('be.visible')
        .then(() => {
          cy.log('Login detected, proceeding with direct navigation')

          // Navigate directly to the add-ip page
          const baseUrl = Cypress.env('BASE_URL') || 'https://safeidea.net'
          cy.visit(`${baseUrl}/add-ip`)
        })

      // Verify we've reached the add idea page by checking for the idea title input
      cy.get('[data-testid="idea-title-input"]', { timeout: 30000 })
        .should('be.visible')
        .then(() => {
          cy.log('Successfully navigated to Add Idea page')
        })
    }
  )
})
