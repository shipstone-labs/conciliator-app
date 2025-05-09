// cypress/e2e/add-complete-idea.cy.js

describe('Add Complete Idea with File Upload', () => {
  const ideaTitle =
    'Xanthanide-Infused Neural Bridge System for Enhanced Human-Computer Integration'
  const ideaDescription =
    'A revolutionary neural interface system that utilizes biocompatible xanthanide compounds to establish stable, long-term connections between human neural tissue and electronic systems. The Xanthanide Neural Bridge (XNB) employs proprietary rare-earth xanthanide complexes that form semi-organic structures capable of transmitting both electrical and biochemical signals between neurons and electronic components while minimizing rejection and degradation.\nThe invention specifically addresses the challenge of creating durable, high-fidelity man-machine interfaces by leveraging xanthanide corposes - self-assembling molecular structures that adapt to both biological neural patterns and digital signals. This bidirectional communication system enables unprecedented bandwidth for direct neural control of external devices while simultaneously allowing precise machine feedback to be interpreted naturally by the human nervous system, effectively creating a seamless extension of human perception and control.'
  const _inventorInfo = 'Inventor: Cartwright Reed (cart@shipstone.com)'

  // Path to file upload - we'll use the file found in Downloads
  const fileUploadPath = '/Users/creed/Downloads/xanthanide-invention.md'

  it('should add a complete idea with title, description and file upload', () => {
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

    cy.log('Add Idea page loaded, filling out the form')

    // Step 1: Fill out the title
    cy.get('[data-testid="idea-title-input"]').clear().type(ideaTitle)

    // Step 2: Fill out the description
    cy.get('[data-testid="idea-description-input"]')
      .clear()
      .type(ideaDescription)

    // Step 3: Upload the file
    cy.log('Preparing to upload file')

    // Prepare file input for upload (it may be hidden, so force it)
    cy.get('[data-testid="file-upload-input"]', { timeout: 10000 })
      .should('exist')
      .selectFile(fileUploadPath, { force: true })

    // Wait for upload to complete - look for a success indicator
    cy.get('[data-testid="file-upload-zone"]', { timeout: 30000 }).should(
      'be.visible'
    )

    cy.log('File uploaded successfully')

    // Step 4: Now click the encrypt/submit button
    cy.get('[data-testid="add-encrypt-button"]').should('be.visible').click()

    // Wait for processing to complete - this may take some time
    cy.log('Processing idea submission...')

    // Look for completion indicators - this may need adjustment based on the UI flow
    // We're looking for either a success message or navigation to a new page
    cy.get('[data-testid="create-idea-button"]', { timeout: 60000 })
      .should('be.visible')
      .then(() => {
        cy.log('Idea encrypted successfully, proceeding to final submission')

        // Final submission
        cy.get('[data-testid="create-idea-button"]').click()

        // Wait for redirect to the details page or confirmation
        cy.url().should('include', '/details/', { timeout: 60000 })

        cy.log('SUCCESS: Idea added and redirected to details page')
      })
  })
})
