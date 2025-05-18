# Conciliator App - Current Status

## Overview
This document tracks the current state of development with focus on validated functionality to ensure continuity between work sessions.

**Last Updated:** May 18, 2025

## Validated Functionality
- Improved subscription assessment page with more reliable user experience
- Fixed radio button selection to update UI without saving until Next button is clicked
- Added Back button functionality to all steps including results page
- Fixed duplicated navigation header issue in subscription layout
- Fixed vertical alignment of "Most Popular" badge on secure page
- Improved gradient underline styling to be more subtle and visually pleasant
- Created pre-commit testing script to catch issues before submitting to build server

## Current Session Development (Pending Validation)

## Next Steps (Priority Order)
1. Address directory structure duplication between plan and subscription features

## Directory Structure Improvement Proposal

### Current Structure

The current project has duplicate functionality and similar directory structures between the `/app/plan/` and `/app/subscription/` directories. This creates confusion and maintenance challenges:

- Both directories contain almost identical page structures: assessment, basic, complete, faq, home, how-it-works, plans, secure, signup, success
- Both contain similar helper files (PlanStorage.ts vs. SubscriptionStorage.ts, FunnelSteps.ts in both)
- The duplication could lead to inconsistency and maintenance headaches as features evolve

### Proposed Solution

#### Option 1: Consolidate into a single unified feature

1. Keep the `/app/subscription/` directory as the primary location for all functionality
2. Move any unique functionality from `/app/plan/` into `/app/subscription/`
3. Use feature flags or environment variables to control which "mode" is active
4. Update all references to plan-specific routes

Benefits:
- Single source of truth for subscription/plan logic
- Easier maintenance
- Consistent user experience

#### Option 2: Clear separation with shared utilities

1. Keep both directories but move common code to a shared location
2. Create `/lib/subscription/` for shared utilities used by both features
3. Move common functionality like:
   - `LocalStorageService.ts`
   - Assessment logic
   - Feature access controls

Benefits:
- Maintains separate routes for different business needs
- Reduces duplication through shared utilities
- Enables gradual transition from old to new implementation

#### Option 3: Use Next.js route groups for organization

1. Structure the app using Next.js route groups for better organization:
```
/app/
  /(marketing)/
    subscription/
      assessment/
      plans/
      ...
  /(legacy)/
    plan/
      assessment/
      plans/
      ...
  /(core)/
    dashboard/
    list-ip/
    ...
```

2. Move shared utilities to a common library location

Benefits:
- Clearly separates different parts of the application
- Maintains existing URLs
- Provides clear visual organization in the codebase

### Recommended Approach

**Option 2** provides the best balance of maintaining existing functionality while reducing duplication. 

Implementation steps:
1. Create `/lib/subscription/` directory
2. Move shared utilities to this directory
3. Update imports in both plan and subscription directories
4. Refactor gradually to avoid disruption

This allows the codebase to evolve without breaking existing functionality, while reducing maintenance burden over time.

## Running Test Validation
```bash
# View test points manifest directly
open http://localhost:3000/test-manifest.html
```

## Open Questions for Next Session
- Should we prioritize refactoring the directory structure or focus on adding more features first?
- Is there a preference among the three directory structure options?