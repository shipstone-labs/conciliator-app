// ***********************************************************
// This is a basic support file for Cypress e2e tests
// ***********************************************************

// Import commands.js using ES2015 syntax:
// import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Log URL on page load
Cypress.on('window:load', (win) => {
  console.log('Page loaded:', win.location.href)
})

// Print helpful console message at start of each test
beforeEach(() => {
  cy.log(`Running test: ${Cypress.currentTest.title}`)
})

// Fail on uncaught exceptions
Cypress.on('uncaught:exception', (err, _runnable) => {
  // returning false here prevents Cypress from failing the test
  console.error('Uncaught exception:', err.message)
  return false
})
