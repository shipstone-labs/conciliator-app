// cypress/e2e/inspect-testids.cy.js

describe('Test ID Inspection', () => {
  it('should inspect all test IDs after login', () => {
    // Visit the main page
    cy.visit(Cypress.env('BASE_URL') || 'https://safeidea.net')

    // Display instructions for manual login
    cy.log('MANUAL ACTION REQUIRED: Please log in to the application')
    cy.log('After logging in, this test will inspect all available testIDs')

    // Wait for a reasonable time for manual login
    cy.wait(30000) // 30 seconds to perform login

    // After login completes, find and log all elements with data-testid
    cy.log('Looking for all elements with data-testid attributes:')
    cy.get('[data-testid]').then(($elements) => {
      if ($elements.length === 0) {
        cy.log('No elements with data-testid found!')
      } else {
        const testIds = Array.from($elements).map((el) =>
          el.getAttribute('data-testid')
        )
        cy.log(`Found ${testIds.length} elements with testIDs:`)
        cy.log(JSON.stringify(testIds, null, 2))

        // Also log element details for better debugging
        Array.from($elements).forEach((el, index) => {
          cy.log(
            `Element ${index + 1}: ${el.tagName} - testID: ${el.getAttribute('data-testid')}`
          )
          cy.log(`Text content: "${el.textContent.trim()}"`)
        })
      }
    })
  })
})
