# Cypress Tests for SafeIdea

This directory contains Cypress end-to-end tests for the SafeIdea application.

## Available Tests

### Ideas Count Test

The `count-ideas.cy.js` test:
1. Navigates to the SafeIdea website
2. Clicks on the "Explore Ideas" link
3. Counts the number of ideas displayed on the list page
4. Outputs the count to the console and saves it to a JSON file

### Add Idea Navigation Test

The `add-idea-navigation.cy.js` test:
1. Navigates to the SafeIdea website
2. Waits for manual user login
3. Once logged in, navigates to the Add Idea page

This test is designed to run in interactive mode to allow manual login.

## Running Tests

### Using NPM Scripts

```bash
# Run the ideas count test (headless)
pnpm test:ideas-count

# Run the add idea navigation test (interactive)
pnpm test:add-idea

# Run all Cypress tests
pnpm cypress:run

# Open Cypress GUI
pnpm cypress:open
```

### Using Direct Commands

```bash
# Run the ideas count test with default URL (safeidea.net)
npx cypress run --spec cypress/e2e/count-ideas.cy.js

# Run the add idea test in interactive mode
npx cypress open --e2e

# Run with a custom URL
npx cypress run --spec cypress/e2e/count-ideas.cy.js --env BASE_URL=https://staging.safeidea.net
```

### Using Convenience Scripts

```bash
# Run idea count test with default URL (safeidea.net)
./run-ideas-count.sh

# Run add idea test with default URL (safeidea.net)
./run-add-idea.sh

# Run with custom URL
./run-ideas-count.sh https://staging.safeidea.net
./run-add-idea.sh https://staging.safeidea.net
```

## Test Output

The ideas count test outputs results in three ways:
1. In the Cypress test runner/console output
2. To the terminal via console.log for CI environments
3. To a JSON file at `cypress/downloads/ideas-count.json`

The JSON file contains:
- `count`: Number of ideas found
- `timestamp`: When the test was run
- `url`: The URL of the page where ideas were counted

## Configuration

Testing configuration is defined in `cypress.config.js` at the project root.

Key settings:
- Default URL: `https://safeidea.net`
- Video recording: Disabled by default (enable with `--config video=true`)
- Screenshots: Capture only on test failure
- Viewport: 1280×800 for consistent testing
- Timeouts: Generous timeouts for network conditions

## Test ID Reference

The test uses these data-testid attributes:
- `nav-explore-ideas`: The navigation link to the ideas list page

For other test IDs, refer to the HTML manifest at `/public/cypress-test.html`