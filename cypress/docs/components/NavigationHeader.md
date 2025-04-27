# NavigationHeader Component - Cypress Test Selectors

This document provides information about the available test selectors for the NavigationHeader component.

## Overview

The NavigationHeader component contains the main navigation elements of the application including:
- Logo/Home link
- Main navigation links
- Theme toggle
- Account menu dropdown

## Test Selectors

| Selector | Element Type | Description | Visibility Condition |
|----------|--------------|-------------|----------------------|
| `[data-testid="nav-container"]` | `div` | Main navigation container | Always visible |
| `[data-testid="nav-home-link"]` | `Link` | Logo/Home link (top left) | Always visible |
| `[data-testid="nav-main-menu"]` | `nav` | Main navigation menu container | Always visible |
| `[data-testid="nav-add-idea-link"]` | `Link` | "Add Idea" navigation link | Only when authenticated |
| `[data-testid="nav-my-ideas-link"]` | `Link` | "My Ideas" navigation link | Only when authenticated |
| `[data-testid="nav-explore-ideas-link"]` | `Link` | "Explore Ideas" navigation link | Always visible |
| `[data-testid="nav-theme-container"]` | `div` | Theme toggle container | Always visible |
| `[data-testid="nav-account-menu"]` | `div` | Account menu dropdown container | Always visible |
| `[data-testid="nav-dropdown-trigger"]` | `DropdownMenuTrigger` | Hamburger menu button | Always visible |
| `[data-testid="nav-dropdown-account"]` | `DropdownMenuItem` | "Account" dropdown option | Only when authenticated |
| `[data-testid="nav-dropdown-signout"]` | `DropdownMenuItem` | "Sign Out" dropdown option | Only when authenticated |
| `[data-testid="nav-dropdown-signin"]` | `DropdownMenuItem` | "Sign In" dropdown option | Only when not authenticated |

## Common Testing Scenarios

### Basic Navigation

```javascript
// Navigate to home page by clicking logo
cy.get('[data-testid="nav-home-link"]').click();

// Navigate to Add Idea page (when authenticated)
cy.get('[data-testid="nav-add-idea-link"]').click();

// Navigate to Explore Ideas page
cy.get('[data-testid="nav-explore-ideas-link"]').click();
```

### Authentication Workflows

```javascript
// Sign in flow
cy.get('[data-testid="nav-dropdown-trigger"]').click();
cy.get('[data-testid="nav-dropdown-signin"]').click();

// Sign out flow
cy.get('[data-testid="nav-dropdown-trigger"]').click();
cy.get('[data-testid="nav-dropdown-signout"]').click();
```

### Conditional Testing

```javascript
// Check if user is authenticated
cy.get('[data-testid="nav-main-menu"]').then($menu => {
  if ($menu.find('[data-testid="nav-add-idea-link"]').length > 0) {
    // User is authenticated - perform authenticated user tests
    cy.get('[data-testid="nav-add-idea-link"]').should('be.visible');
  } else {
    // User is not authenticated - perform unauthenticated user tests
    cy.get('[data-testid="nav-dropdown-trigger"]').click();
    cy.get('[data-testid="nav-dropdown-signin"]').should('be.visible');
  }
});
```

## Component Location

This component is located at:
```
/components/NavigationHeader.tsx
```

## Testing Notes

- The navigation header adapts to authentication state, showing/hiding certain options
- The hamburger menu (dropdown trigger) must be clicked before dropdown items become visible
- Testing authentication-dependent elements requires proper auth setup in your tests