# Three-Page Add IP Flow Implementation - Status and Plan

## Overview
Replace the current single-page Add IP flow (`/app/add-ip/page.tsx` and `/components/AddIP/index.tsx`) with a three-page flow that provides better user experience and clearer progression through the IP protection process.

## Current Status
- **Branch**: `add-ip-update`
- **PR**: #146
- **Deployment URL**: https://pr-146---conciliator-55rclsk2qa-uc.a.run.app/

### Completed Checkpoints

#### ✅ CHECKPOINT 1: Route Structure & Progress Indicator (COMPLETED)
- **Commit**: `866863f` - "feat: Add three-page route structure with progress indicator"
- **Status**: Deployed and tested

**What was implemented:**
- Created directory structure with `/app/add-ip/{protect,share,guard}/page.tsx`
- Created `ProgressIndicator` component showing 3 steps
- Created layout that detects current route and displays progress
- All placeholder pages show "Under Construction" text

**Test Results:**
- All pages accessible at their routes
- Progress indicator correctly highlights active step
- Original `/add-ip` page still works
- No console errors

#### ✅ CHECKPOINT 2: Shared State Management (COMPLETED)
- **Commit**: `1e2a0b4` - "feat: Add shared state management for multi-page flow"
- **Status**: Deployed and tested

**What was implemented:**
- Created `AddIPContext` with all form fields
- SessionStorage persistence (auto-save/load)
- Context provider wrapped in layout
- Test page at `/add-ip/test-context`

**Test Results:**
- Context successfully provides state to all pages
- Default values correctly set (30 days, view-only)
- Test page shows all context values and update buttons
- SessionStorage shows "N/A (SSR)" on initial load (expected)

---

## Pre-Commit Testing Strategy

### CRITICAL: Run These EXACT Commands Before Every Commit
```bash
# 1. Install/sync dependencies
pnpm install

# 2. Run the EXACT same checks as CI/build process
npx @biomejs/biome@^1.9.4 lint .     # Biome linter (same version as CI)
npx @biomejs/biome@^1.9.4 check .    # Biome checker (formatting)
pnpm build                           # Full Next.js build

# Alternative if biome is in package.json:
pnpm format                          # Auto-fix formatting
pnpm check                           # Type checking + linting
pnpm build                           # Build test
```

### Why This Matters
- CI uses specific Biome version directly, not project scripts
- Pre-commit hooks only check staged files, not all files
- Build failures in CI are expensive (5-10 minute feedback loop)
- Common issues: unused imports, formatting, type errors

---

## Deployment Testing Strategy

### Using WebFetch for Quick Checks
```javascript
// After push, wait for build (~5-7 minutes), then:
WebFetch('https://pr-146---conciliator-55rclsk2qa-uc.a.run.app/[path]')
```

### Using Claude Code SDK / Playwright (in /test/claude-sdk-mcp/)
```javascript
// For interactive testing that WebFetch can't do:
// - Form interactions
// - Multi-page flows  
// - SessionStorage verification
// Reference: /test/claude-sdk-mcp/claude-sdk-demo.js
```

---

## Remaining Implementation Plan

### ✅ CHECKPOINT 3: Page 1 - Protect Implementation (COMPLETED)

#### Design Decisions
1. **Reuse existing components** from `/components/AddIP/`:
   - `AddStepContent.tsx` - Title/description inputs
   - `AddStepPublic.tsx` - File upload logic
   - Extract validation logic, keep UI minimal

2. **State Management**:
   - Use `useAddIPContext()` for all form data
   - Update context on every field change
   - No local component state except UI (loading, errors)

3. **Navigation**:
   - "Continue Setup" → `/add-ip/share` (saves to context)
   - "Create Now" → calls existing `handleStore` with defaults

#### Implementation Steps
```typescript
// /app/add-ip/protect/page.tsx
'use client'

import { useAddIPContext } from '@/components/AddIP/AddIPContext'
import { useRouter } from 'next/navigation'
// Reuse components from existing AddIP
import AddStepContent from '@/components/AddIP/AddStepContent'
import AddStepPublic from '@/components/AddIP/AddStepPublic'

export default function ProtectPage() {
  const { formData, updateFormData } = useAddIPContext()
  const router = useRouter()
  
  // Reuse existing validation logic
  const canContinue = formData.title && formData.description && formData.file
  
  // Navigation handlers
  const handleContinue = () => {
    router.push('/add-ip/share')
  }
  
  const handleCreateNow = async () => {
    // Set defaults and create
    updateFormData({
      duration: 30,
      viewOnly: true,
      allowDownload: false,
      enableAI: false
    })
    // Call existing handleStore logic
    await createIP() // Extract from current implementation
    router.push('/details/[id]')
  }

  return (
    <div className="container">
      {/* What Happens Next info box */}
      <Card>
        <CardContent>
          <h3>What Happens Next</h3>
          <p>1. Your idea is encrypted and stored securely</p>
          <p>2. You get a unique link to share</p>
          <p>3. Track who views your idea</p>
        </CardContent>
      </Card>

      {/* Reuse existing form components */}
      <AddStepContent 
        publicTitle={formData.title}
        setPublicTitle={(v) => updateFormData({ title: v })}
        publicDescription={formData.description}
        setPublicDescription={(v) => updateFormData({ description: v })}
      />
      
      <AddStepPublic
        file={formData.file}
        setFile={(f) => updateFormData({ file: f, fileName: f?.name || '' })}
      />

      {/* Action buttons */}
      <div className="flex gap-4">
        <Button onClick={handleCreateNow} disabled={!canContinue}>
          Create Now
        </Button>
        <Button onClick={handleContinue} disabled={!canContinue} variant="default">
          Continue Setup
        </Button>
      </div>
    </div>
  )
}
```

#### Test Specification
```
AUTOMATED TEST WITH TESTIDS:
- idea-title-input
- idea-description-input  
- file-upload-input
- create-now-button
- continue-setup-button

1. Load /add-ip/protect
2. Verify info box visible
3. Verify buttons disabled initially
4. Enter title "Test Invention"
5. Enter description "Test Description"
6. Upload file
7. Verify both buttons enabled
8. Click "Continue Setup"
9. Verify navigation to /add-ip/share
10. Go back, verify data preserved
```

### ✅ CHECKPOINT 4: Page 2 - Share Implementation (COMPLETED)
- **Commit**: `501f6b4` - "feat: Implement Share page for three-page Add-IP flow"
- **Status**: Deployed and tested

**What was implemented:**
- Date pickers for sharing duration (start/end dates)
- Legal document selection (none, generic NDA, external)
- File upload for external legal documents (ZIP files)
- Database visibility toggle
- Both "Create Now" and "Continue to Guard" functionality
- Full encryption logic with sharing settings

### CHECKPOINT 4: Page 2 - Share Implementation

#### Design Decisions
1. **Simple card-based UI** for duration selection
2. **Toggle switches** with confirmation dialog for permissions
3. **Defaults**: 30 days, view-only access
4. **No API calls** - just update context

#### Implementation Steps
```typescript
// /app/add-ip/share/page.tsx
'use client'

import { useAddIPContext } from '@/components/AddIP/AddIPContext'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DURATION_OPTIONS = [
  { days: 7, label: '7 Days', description: 'Quick review period' },
  { days: 30, label: '30 Days', description: 'Standard protection', default: true },
  { days: 90, label: '90 Days', description: 'Extended review' },
  { days: 365, label: '1 Year', description: 'Long-term protection' }
]

export default function SharePage() {
  const { formData, updateFormData } = useAddIPContext()
  const [showDownloadWarning, setShowDownloadWarning] = useState(false)
  const router = useRouter()
  
  const handleBack = () => router.push('/add-ip/protect')
  const handleContinue = () => router.push('/add-ip/guard')
  
  const handleCreateNow = async () => {
    updateFormData({ enableAI: false })
    // Call existing handleStore
    await createIP()
    router.push('/details/[id]')
  }

  return (
    <div className="container space-y-6">
      <h2>Set Sharing Preferences</h2>
      
      {/* Duration Selection */}
      <div>
        <h3>How long should your idea be protected?</h3>
        <div className="grid grid-cols-2 gap-4">
          {DURATION_OPTIONS.map(opt => (
            <Card 
              key={opt.days}
              className={formData.duration === opt.days ? 'border-primary' : ''}
              onClick={() => updateFormData({ duration: opt.days })}
            >
              <CardContent>
                <h4>{opt.label}</h4>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Permission Toggles */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4>View in app only</h4>
              <p className="text-sm text-muted-foreground">
                Viewers can only see your idea in the secure viewer
              </p>
            </div>
            <Switch 
              checked={formData.viewOnly}
              onCheckedChange={(v) => updateFormData({ viewOnly: v })}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h4>Allow download</h4>
              <p className="text-sm text-muted-foreground">
                Viewers can download the original file
              </p>
            </div>
            <Switch 
              checked={formData.allowDownload}
              onCheckedChange={(v) => {
                if (v && !formData.allowDownload) {
                  setShowDownloadWarning(true)
                } else {
                  updateFormData({ allowDownload: v })
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* NDA Link */}
      <Button variant="link">Review SafeIdea Default NDA</Button>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={handleBack} variant="outline">Back</Button>
        <div className="space-x-4">
          <Button onClick={handleCreateNow}>Create Now</Button>
          <Button onClick={handleContinue}>Save Settings & Continue</Button>
        </div>
      </div>

      {/* Warning Dialog */}
      {showDownloadWarning && (
        <AlertDialog open={showDownloadWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enable Downloads?</AlertDialogTitle>
              <AlertDialogDescription>
                Allowing downloads means viewers can save a copy of your file. 
                This cannot be revoked later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDownloadWarning(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                updateFormData({ allowDownload: true })
                setShowDownloadWarning(false)
              }}>
                Enable Downloads
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
```

### ✅ CHECKPOINT 5: Page 3 - Guard & Creation Flow (COMPLETED)
- **Commit**: `4bd714c` - "feat: Implement Guard page for three-page Add-IP flow"
- **Status**: Deployed and tested

**What was implemented:**
- Guard protection focused on monitoring, reporting, and enforcement
- Three benefit cards (24/7 Monitoring, Periodic Reports, Legal Documentation)
- Guard toggle switch
- Detailed explanation of Guard protection features
- Full encryption logic with all settings
- "Create Protected Idea" functionality

**Recent Updates (Session 3):**
- Updated from "AI Guard" to "Guard" throughout
- Refocused content on IP protection rather than sales/marketing
- Changed messaging to emphasize monitoring, reporting, and legal enforcement

### CHECKPOINT 5: Page 3 - Guard & Creation Flow

#### Design Decisions
1. **Benefit cards** to explain AI agent features
2. **Simple checkbox** for AI enablement
3. **Reuse existing creation modal** from current implementation
4. **Extract `handleStore` logic** for reuse across all pages

#### Implementation Steps
```typescript
// /app/add-ip/guard/page.tsx
'use client'

import { useAddIPContext } from '@/components/AddIP/AddIPContext'
import { Checkbox } from '@/components/ui/checkbox'
import { extractedHandleStore } from '@/lib/createIP' // Extract logic

const AI_BENEFITS = [
  {
    title: 'Smart Matching',
    description: 'AI finds potential partners and investors',
    icon: '🤖'
  },
  {
    title: '24/7 Protection',
    description: 'Continuous monitoring for similar ideas',
    icon: '🛡️'
  },
  {
    title: 'Automated Outreach',
    description: 'AI agent can respond to inquiries',
    icon: '📧'
  }
]

export default function GuardPage() {
  const { formData, updateFormData } = useAddIPContext()
  const [creating, setCreating] = useState(false)
  const router = useRouter()
  
  const handleCreate = async () => {
    setCreating(true)
    try {
      const result = await extractedHandleStore(formData)
      router.push(`/details/${result.tokenId}`)
    } catch (error) {
      console.error('Creation failed:', error)
      setCreating(false)
    }
  }

  return (
    <div className="container space-y-6">
      <h2>AI Protection (Optional)</h2>
      
      {/* Benefit Cards */}
      <div className="grid grid-cols-3 gap-4">
        {AI_BENEFITS.map(benefit => (
          <Card key={benefit.title}>
            <CardContent className="text-center">
              <div className="text-4xl mb-2">{benefit.icon}</div>
              <h4>{benefit.title}</h4>
              <p className="text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Toggle */}
      <Card>
        <CardContent>
          <label className="flex items-center space-x-3">
            <Checkbox
              checked={formData.enableAI}
              onCheckedChange={(v) => updateFormData({ enableAI: !!v })}
            />
            <div>
              <h4>I want AI Protection</h4>
              <p className="text-sm text-muted-foreground">
                Let our AI agent help protect and promote your idea
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Create Button */}
      <div className="flex justify-between">
        <Button 
          onClick={() => router.push('/add-ip/share')} 
          variant="outline"
        >
          Back
        </Button>
        <Button 
          onClick={handleCreate}
          disabled={creating}
          size="lg"
        >
          {creating ? (
            <>
              <Spinner className="mr-2" />
              Creating Your Idea Page...
            </>
          ) : (
            'Create Protected Idea'
          )}
        </Button>
      </div>

      {/* Reuse existing creation modal if needed */}
      {creating && <ExistingCreationModal />}
    </div>
  )
}
```

### CHECKPOINT 6: Cleanup & Migration

#### Tasks
1. **Extract shared logic**:
   - Move `handleStore` to `/lib/createIP.ts`
   - Extract validation functions
   - Create shared types

2. **Update routing**:
   ```typescript
   // /app/add-ip/page.tsx
   'use client'
   import { redirect } from 'next/navigation'
   
   export default function AddIPPage() {
     redirect('/add-ip/protect')
   }
   ```

3. **Archive old code**:
   - Move `/components/AddIP/index.tsx` to `/components/AddIP/index.old.tsx`
   - Keep for reference during transition

4. **Update tests**:
   - Add testids to all interactive elements
   - Update MCP test scripts for new flow

---

## Recent Updates - Session 3 (June 16, 2025)

### File Upload Component Updates
- **File size limit**: Increased from 2MB to 20MB
- **File types**: Restricted to Markdown (.md, .markdown), HTML (.html, .htm), and Text (.txt) files
- **Modal text**: Updated to clearly explain single file limit and accepted formats
- **Shared component**: Changes affect both `/add-ip` and `/add-ip/protect` pages

### Guard Page Rebranding
- Changed from "AI Guard" to "Guard" throughout the application
- Refocused messaging on:
  - **Monitoring**: 24/7 scanning for potential infringement
  - **Reporting**: Periodic alerts and detailed comparisons
  - **Enforcement**: Legal documentation and audit trails
- Removed sales/marketing agent references

## Key Implementation Principles

1. **NO EXPERIMENTS**: Use existing patterns and components
2. **REUSE CODE**: Extract from current implementation, don't rewrite
3. **SIMPLE STATE**: Context + sessionStorage only, no Redux/Zustand
4. **DEFENSIVE CODING**: Check for undefined, handle errors gracefully
5. **INCREMENTAL**: Each checkpoint must work independently

## Next Session Checklist

When resuming work:
1. Check PR build status
2. Pull latest from main
3. Run `pnpm install`
4. Check deployment URL is working
5. Review this document
6. Start with Checkpoint 3