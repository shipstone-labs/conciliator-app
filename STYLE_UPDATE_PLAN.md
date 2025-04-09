# Home Page Style Guide Update Plan

This document outlines the planned updates to align the home page with the SafeIdea style guide, organized by component and priority.

## Affected Files

1. `/components/home-app.tsx` - Primary styling and content updates
2. `/components/NavigationHeader.tsx` - Authentication button integration
3. `/components/LogoffButton.tsx` (potentially) - Styling standardization
4. `/components/AuthButton.tsx` (potentially) - Styling standardization

## Update Plan

### Phase 1: In-Place Button Styling (Lowest Risk)

Update button styling without moving components:

- Update LogoffButton styling in home-app.tsx:
  - Change from `rounded-md` to `rounded-xl`
  - Ensure proper animation effects (hover:scale-105)
  - Standardize shadow effects

- Update AuthButton styling in home-app.tsx:
  - Change from `rounded-md` to `rounded-xl`
  - Match button guidelines

- Update Call-to-Action buttons:
  - Use buttonVariants utility from button.tsx
  - Maintain current positions and behaviors

### Phase 2: Content Structure Improvements (Medium Risk)

- Convert description section to proper Card component
  - Replace custom div with shadcn/ui Card components
  - Maintain current glassmorphism effects

- Improve typography hierarchy:
  - Add proper heading tags (h1, h2, etc.)
  - Standardize font sizes according to the style guide
  - Ensure consistent font weights 

- Enhance responsive behavior:
  - Check padding/margin scaling for mobile
  - Verify stacking behavior for small screens

### Phase 3: Component Position Refactoring (Highest Risk)

- Move authentication buttons to NavigationHeader:
  - Refactor LogoffButton integration
  - Move AuthButton to navigation area
  - Ensure consistent z-index and positioning

## Testing Strategy

After each phase:
1. Test authentication flows (login/logout)
2. Verify responsive behavior across different screen sizes
3. Check animations and interactions
4. Ensure visual consistency with style guide

## Rollback Plan

- Commit after each phase to enable targeted reverts
- Document specific className changes for easy comparison
- Create screenshots before/after for visual regression testing
- Note any component position changes that might affect other pages

## Success Criteria

- All buttons follow button variant styling from the style guide
- Typography follows heading hierarchy guidelines
- Glassmorphism effects are consistent with other pages
- Responsive behavior meets mobile optimization requirements
- Authentication flows remain fully functional
- Visual consistency with style guide is maintained