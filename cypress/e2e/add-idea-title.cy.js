// cypress/e2e/add-idea-title.cy.js

describe('Add Idea Title Only', () => {
  const ideaTitle =
    'Xanthanide-Infused Neural Bridge System for Enhanced Human-Computer Integration'

  it('should add a title to the idea form', () => {
    // Visit the main page with increased timeout for initial load
    cy.visit(Cypress.env('BASE_URL') || 'https://safeidea.net', {
      timeout: 30000,
    })

    // Display clear instructions for manual login
    cy.log('PLEASE LOG IN MANUALLY NOW')
    cy.log('After login is complete, the test will continue automatically')

    // Wait for login to complete by checking for the Add Idea button
    cy.get('[data-testid="home-add-idea-button"]', {
      timeout: 120000, // 2 minute timeout for login
    }).should('be.visible')

    cy.log('Login detected, proceeding to Add Idea page')

    // Navigate directly to the add-ip page using the URL
    cy.visit(`${Cypress.env('BASE_URL') || 'https://safeidea.net'}/add-ip`, {
      timeout: 30000,
    })

    // Verify we've reached the add idea page by checking for the idea title input
    cy.get('[data-testid="idea-title-input"]', {
      timeout: 30000,
    }).should('be.visible')

    cy.log('Add Idea page loaded, filling out the title')

    // Step: Fill out the title - broken into parts to handle React re-renders
    // First, get the input and give it an alias
    cy.get('[data-testid="idea-title-input"]')
      .should('be.visible')
      .scrollIntoView() // Ensure element is in view
      .as('titleInput')

    // Clear the input first
    cy.get('@titleInput').clear({ force: true })

    // Now type the title, character by character with pauses to avoid re-render issues
    // This types chunks of text with pauses between to avoid React re-render conflicts
    const chunks = ideaTitle.match(/.{1,5}/g) || []
    chunks.forEach((chunk, _index) => {
      cy.get('[data-testid="idea-title-input"]')
        .scrollIntoView() // Keep ensuring element is in view while typing
        .type(chunk, { delay: 5 })
        .wait(100) // Small wait to allow React to settle
    })

    // Finally, verify the result
    cy.get('[data-testid="idea-title-input"]')
      .should('have.value', ideaTitle)
      .then(() => {
        cy.log(`Title successfully entered: ${ideaTitle}`)
      })
  })
})
