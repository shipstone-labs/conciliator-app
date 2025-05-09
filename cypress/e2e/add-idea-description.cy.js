// cypress/e2e/add-idea-description.cy.js

describe('Add Idea Title and Description', () => {
  const ideaTitle =
    'Xanthanide-Infused Neural Bridge System for Enhanced Human-Computer Integration'
  const ideaDescription =
    'A revolutionary neural interface system that utilizes biocompatible xanthanide compounds to establish stable, long-term connections between human neural tissue and electronic systems. The Xanthanide Neural Bridge (XNB) employs proprietary rare-earth xanthanide complexes that form semi-organic structures capable of transmitting both electrical and biochemical signals.'

  it('should add a title and description to the idea form', () => {
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

    // Step 1: Fill out the title using chunked typing approach
    cy.get('[data-testid="idea-title-input"]')
      .should('be.visible')
      .scrollIntoView() // Ensure element is in view
      .as('titleInput')

    // Clear the input first
    cy.get('@titleInput').clear({ force: true })

    // Type the title in chunks to avoid React re-render issues
    const titleChunks = ideaTitle.match(/.{1,5}/g) || []
    titleChunks.forEach((chunk) => {
      cy.get('[data-testid="idea-title-input"]')
        .scrollIntoView() // Keep ensuring element is in view while typing
        .type(chunk, { delay: 5 })
        .wait(100) // Small wait to allow React to settle
    })

    // Verify the title was entered correctly
    cy.get('[data-testid="idea-title-input"]')
      .should('have.value', ideaTitle)
      .then(() => {
        cy.log(`Title successfully entered: ${ideaTitle}`)
      })

    // Step 2: Fill out the description using the same chunked approach
    cy.log('Now filling out the description field')

    cy.get('[data-testid="idea-description-input"]')
      .should('be.visible')
      .scrollIntoView() // Ensure element is in view
      .as('descriptionInput')

    // Clear the input first
    cy.get('@descriptionInput').clear({ force: true })

    // Type the description in chunks to avoid React re-render issues
    const descriptionChunks = ideaDescription.match(/.{1,5}/g) || []
    descriptionChunks.forEach((chunk) => {
      cy.get('[data-testid="idea-description-input"]')
        .scrollIntoView() // Keep ensuring element is in view while typing
        .type(chunk, { delay: 5 })
        .wait(100) // Small wait to allow React to settle
    })

    // Verify the description was entered correctly
    cy.get('[data-testid="idea-description-input"]')
      .should('have.value', ideaDescription)
      .then(() => {
        cy.log('Description successfully entered')
      })

    // Complete with success message
    cy.log('FORM FIELDS COMPLETED SUCCESSFULLY')
    cy.log('Title and description have been entered correctly')
  })
})
