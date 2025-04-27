# SafeIdea Test Selectors Documentation

This directory contains documentation for test selectors used by the external Cypress testing repository (`safeidea-tester`).

## Purpose

- Provide a reference for test selectors available in the SafeIdea application
- Document component structure and test capabilities
- Facilitate testing without requiring testers to search through application code

## Usage by External Testing Repository

The documentation in this directory is intended to be used by tests in the `safeidea-tester` repository. Tests in that repository should reference these documents to find the appropriate selectors for interacting with UI elements.

## Component Documentation

- [NavigationHeader](./components/NavigationHeader.md) - Main navigation component selectors

## Adding New Documentation

When adding data-testid attributes to components, please:

1. Create a markdown file in the appropriate subdirectory:
   - `/cypress/docs/components/` for component selectors
   - `/cypress/docs/pages/` for page-specific selectors
   - `/cypress/docs/flows/` for multi-step flows

2. Follow the existing format including:
   - Table of selectors with visibility conditions
   - Example usage code
   - Component location information
   
## Integration Notes

- The `safeidea-tester` repository is responsible for all test implementation and configuration
- This repository only maintains test selectors and their documentation
- No Cypress configuration or test code should be added to this repository