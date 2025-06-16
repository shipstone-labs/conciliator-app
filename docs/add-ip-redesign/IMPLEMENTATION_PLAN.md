# Three-Page Add-IP Flow - Implementation Plan

## Detailed Plan of Action for Next Session

### Objective: Complete the Share and Guard pages for the three-page Add-IP flow

### Prerequisites
1. Pull latest changes from `add-ip-update` branch
2. Verify Protect page is working correctly (✓ completed)
3. Review the current AddIPContext structure

### Phase 1: Share Page Implementation (Checkpoint 4)

#### 1.1 UI Components Needed
- **Date Pickers**: For sharing start/end dates
  - Use existing UI components or add a date picker library
  - Default: Start = today, End = today + 30 days
  
- **Legal Document Selection**: 
  - Radio group with three options:
    - No Legal Documents
    - Generic NDA (default)
    - External Legal Documentation
  - If "External" selected, show file upload for ZIP files

- **Database Visibility Toggle**:
  - Switch component with explanation text
  - Default: true (visible in database)

#### 1.2 Implementation Steps
```typescript
// /app/add-ip/share/page.tsx structure
- Import context and navigation hooks
- Create state for external legal file handling
- Build form with four sections:
  1. Sharing Duration (date pickers)
  2. Legal Protection (radio group)
  3. External Docs Upload (conditional)
  4. Public Visibility (toggle)
- Add navigation buttons:
  - "Back" → /add-ip/protect
  - "Create Now" → Store with current settings
  - "Continue to AI Guard" → /add-ip/guard
```

#### 1.3 Key Considerations
- Date validation (end date must be after start date)
- File upload for external legal docs (ZIP files only, 20MB limit)
- Clear explanations for each option
- Preserve all data in context when navigating

### Phase 2: Guard Page Implementation (Checkpoint 5)

#### 2.1 UI Components
- **Information Cards**: Explain AI monitoring benefits
  - Smart Matching
  - 24/7 Protection  
  - Automated Outreach

- **Simple Toggle**: Enable/disable AI agent
- **Descriptive Text**: What the AI agent does

#### 2.2 Implementation Steps
```typescript
// /app/add-ip/guard/page.tsx structure
- Import context and final creation logic
- Display benefit cards
- Show AI toggle with description
- Add final action buttons:
  - "Back" → /add-ip/share
  - "Create Protected Idea" → Final submission
```

### Phase 3: Final Creation Logic (Checkpoint 6)

#### 3.1 Extract Shared Creation Function
Create `/lib/createIP.ts`:
- Move encryption logic from Protect page
- Accept all context data as parameters
- Handle different creation paths:
  - From Protect: Basic protection only
  - From Share: Include sharing terms
  - From Guard: Include all options

#### 3.2 API Payload Modifications
- Add new fields to store endpoint:
  - `sharingStartDate`
  - `sharingEndDate`
  - `legalDocuments`
  - `showInDatabase`
  - `enableAI`

#### 3.3 Update Success Handling
- Clear context after successful creation
- Ensure proper redirect to details page

### Phase 4: Testing & Polish

#### 4.1 End-to-End Testing
- Test all three paths:
  1. Protect → Create Now
  2. Protect → Share → Create Now
  3. Protect → Share → Guard → Create
- Verify data persistence across pages
- Test navigation (back/forward)
- Verify all data saved correctly

#### 4.2 Add Loading States
- During creation process
- Consistent status messages
- Error handling for each page

#### 4.3 Update Redirect Logic
- Original `/add-ip` should redirect to `/add-ip/protect`
- Clean up old implementation files

### Estimated Timeline
- Share Page: 1-1.5 hours
- Guard Page: 30-45 minutes  
- Extract/Refactor Creation Logic: 45 minutes
- Testing & Polish: 30 minutes
- **Total: 3-4 hours**

### Technical Considerations

#### State Management
- All form data stored in AddIPContext
- SessionStorage persistence for page refreshes
- Clear data after successful creation

#### API Integration
- Extend existing `/api/store` endpoint
- Maintain backward compatibility
- Add new fields without breaking existing flow

#### Component Reuse
- Use existing UI components from `/components/ui/`
- Follow established patterns from Protect page
- Maintain consistent styling

#### Error Handling
- Show inline errors for validation
- Global error state for API failures
- Preserve form data on errors

### Success Criteria
1. All three pages functional and connected
2. Data persists across navigation
3. All creation paths work correctly
4. No impact on existing add-ip flow
5. All tests passing
6. Clean, maintainable code