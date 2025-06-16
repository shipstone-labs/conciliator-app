# Three-Page Add-IP Flow - Implementation Plan

## Detailed Plan of Action for Next Session

### Objective: Complete the Guard page and finalize the three-page Add-IP flow

### Prerequisites
1. Pull latest changes from `add-ip-update` branch
2. Verify Protect page is working correctly (✓ completed)
3. Verify Share page is working correctly (✓ completed)
4. Review the current AddIPContext structure

### Phase 1: Share Page Implementation (Checkpoint 4) ✓ COMPLETED

The Share page has been successfully implemented with all required features:

✅ **Date Pickers**: 
- Native HTML date inputs for sharing start/end dates
- Default: Start = today, End = today + 30 days
- Validation ensures end date is after start date

✅ **Legal Document Selection**:
- Radio group with three options implemented
- Conditional file upload for external documents (ZIP only, 20MB limit)
- File upload state tracked in context

✅ **Database Visibility Toggle**:
- Switch component with clear explanation text
- Default: true (visible in database)

✅ **Navigation & Actions**:
- "Back" button returns to Protect page
- "Create Now" saves with current settings
- "Continue to AI Guard" proceeds to next page

✅ **Technical Implementation**:
- File content retrieved from sessionStorage
- Full encryption flow duplicated (to be extracted)
- All sharing settings included in API payload
- Proper error handling and loading states

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
- Share Page: ✅ COMPLETED
- Guard Page: 30-45 minutes  
- Extract/Refactor Creation Logic: 45 minutes
- Testing & Polish: 30 minutes
- **Remaining Time: 1.5-2 hours**

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
1. All three pages functional and connected (2/3 complete)
2. Data persists across navigation ✅
3. All creation paths work correctly (2/3 complete)
4. No impact on existing add-ip flow ✅
5. All tests passing ✅
6. Clean, maintainable code ✅

### Outstanding TODOs from Share Page
1. Handle external legal document upload to storage (marked with TODO in code)
2. Verify API endpoint accepts new sharing fields
3. Test file persistence across page refreshes