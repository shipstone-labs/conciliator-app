// cypress/e2e/add-idea-description-scroll.cy.js

describe('Add Idea Title and Description with Auto-Scrolling', () => {
  const ideaTitle =
    'Xanthanide-Infused Neural Bridge System for Enhanced Human-Computer Integration'
  const ideaDescription =
    'A revolutionary neural interface system that utilizes biocompatible xanthanide compounds to establish stable, long-term connections between human neural tissue and electronic systems. The Xanthanide Neural Bridge (XNB) employs proprietary rare-earth xanthanide complexes that form semi-organic structures capable of transmitting both electrical and biochemical signals.'

  it('should add a title and description to the idea form with auto-scrolling', () => {
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

    cy.log('Add Idea page loaded, filling out the title with auto-scrolling')

    // Step 1: Fill out the title using chunked typing approach with auto-scrolling
    cy.get('[data-testid="idea-title-input"]')
      .should('be.visible')
      .scrollIntoView({ duration: 300 }) // Ensure element is in view with animation

    cy.log('SCROLLING: Title field is now in view')

    // Break up the chain to avoid detached DOM elements
    cy.get('[data-testid="idea-title-input"]').clear({ force: true })

    // Type the title in larger chunks to reduce DOM operations
    const titleChunks = ideaTitle.match(/.{1,10}/g) || [] // Use larger chunks

    // Initial scroll before typing
    cy.get('[data-testid="idea-title-input"]').scrollIntoView({ duration: 100 })

    cy.log(`TYPING: Starting title input (${titleChunks.length} chunks)`)

    // Type each chunk with fewer DOM interactions
    titleChunks.forEach((chunk, index) => {
      // Only scroll every 3rd chunk to reduce jankiness
      if (index % 3 === 0) {
        cy.get('[data-testid="idea-title-input"]').scrollIntoView({
          duration: 50,
        })
      }

      cy.get('[data-testid="idea-title-input"]')
        .type(chunk, { delay: 5 })
        .wait(100) // Small wait to allow React to settle
    })

    // Verify the title was entered correctly - break up the chain
    cy.get('[data-testid="idea-title-input"]').scrollIntoView({ duration: 100 })

    // Break the chain before assertions to avoid DOM detachment
    cy.get('[data-testid="idea-title-input"]')
      .should('have.value', ideaTitle)
      .then(() => {
        cy.log('VERIFICATION: Title successfully entered and verified')
      })

    // Step 2: Fill out the description using the same chunked approach with auto-scrolling
    cy.log('Now filling out the description field with auto-scrolling')

    cy.get('[data-testid="idea-description-input"]')
      .should('be.visible')
      .scrollIntoView({ duration: 300 }) // Ensure element is in view with animation

    cy.log('SCROLLING: Description field is now in view')

    // Break up the chain to avoid detached DOM elements
    cy.get('[data-testid="idea-description-input"]').clear({ force: true })

    // Type the description in larger chunks to reduce DOM operations
    const descriptionChunks = ideaDescription.match(/.{1,20}/g) || [] // Use larger chunks

    // Initial scroll before typing
    cy.get('[data-testid="idea-description-input"]').scrollIntoView({
      duration: 100,
    })

    cy.log(
      `TYPING: Starting description input (${descriptionChunks.length} chunks)`
    )

    // Type each chunk with fewer DOM interactions
    descriptionChunks.forEach((chunk, index) => {
      // Only scroll occasionally to reduce jankiness
      if (index % 2 === 0) {
        cy.get('[data-testid="idea-description-input"]').scrollIntoView({
          duration: 50,
        })
      }

      cy.get('[data-testid="idea-description-input"]')
        .type(chunk, { delay: 5 })
        .wait(150) // Slightly longer wait for description field
    })

    // Verify the description was entered correctly - break up the chain
    cy.get('[data-testid="idea-description-input"]').scrollIntoView({
      duration: 100,
    })

    // Break the chain before assertions to avoid DOM detachment
    cy.get('[data-testid="idea-description-input"]')
      .should('have.value', ideaDescription)
      .then(() => {
        cy.log('VERIFICATION: Description successfully entered and verified')
      })

    // Complete with success message
    cy.log('FORM FIELDS COMPLETED SUCCESSFULLY')
    cy.log(
      'Title and description have been entered correctly with auto-scrolling'
    )
  })
})
