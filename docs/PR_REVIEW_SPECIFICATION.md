# PR Review Specification for Claude Code

## Purpose
This document defines how Claude should conduct pull request reviews for the conciliator-app repository. It emphasizes thoroughness, tool consistency, and clear communication while maintaining flexibility for different PR types.

## Core Principles

### 1. Complete Testing is Non-Negotiable
- A PR with 90% tested is an incomplete review
- All claimed functionality must be verified
- "Probably works" is not acceptable for approval

### 2. Tool Consistency is Critical
**⚠️ IMPORTANT**: If you don't have the required tools available, **STOP IMMEDIATELY** and inform the user. Do NOT attempt to use alternative tools or workarounds. Different tools can make validation impossible. Work together with the user to solve tool access issues.

Required tools:
- MCP Puppeteer (for browser automation)
- Chrome with remote debugging enabled
- Access to PR preview deployments
- Git/GitHub CLI
- Standard development tools (npm/pnpm, linting, etc.)

### 3. Review Authority
- **Testing**: Complete all testing independently
- **Fixing**: Offer to fix bugs found, but wait until testing is complete
- **Merging**: Offer to merge, but wait for explicit approval

## Review Process

### Phase 1: Initial Assessment
1. Read the PR description and all commit messages
2. Identify all changes (user-visible and infrastructure)
3. Map each change to specific test requirements
4. Categorize tests by authentication requirements

### Phase 2: Static Analysis
Always run these checks first:
```bash
# Install dependencies
pnpm install

# Run exact same checks as CI/build
npx @biomejs/biome@^1.9.4 lint .
npx @biomejs/biome@^1.9.4 check .
pnpm build
```

### Phase 3: Deployment Testing

### Phase 3.5: Test Coverage Verification
Before concluding testing, verify that all modified files have been tested:
```bash
# List files changed in the commit
git show --name-only --pretty="" HEAD

# Compare with tested pages/components
# Ensure 1:1 mapping between changed files and tested functionality
```

### Phase 4: Visual Testing Protocol
When testing UI changes across multiple variants:
1. Use consistent screenshot naming: `[variant]-[page]-[feature]`
2. Test the same pages in the same order on each variant
3. Document visual differences systematically
4. For vocabulary changes, verify both terminology AND context

#### Browser Setup and Management
**CRITICAL**: Always use a fresh Chrome instance for testing:
```bash
open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
```

**Browser Management Hints**:
- Other Chrome instances may be running with windows open
- NEVER use browser windows that weren't opened specifically for testing
- Always close any windows opened during testing when complete
- Check if Chrome is listening: `lsof -i :9222`
- If connection fails with undefined, Chrome may not be running on the expected port

#### Connecting to Browser
```javascript
// Wait for Chrome to start before connecting
sleep 2

// Connect to Chrome
mcp__puppeteer__puppeteer_connect_active_tab({ debugPort: 9222 })
```

#### JavaScript Evaluation
**IMPORTANT**: When using `puppeteer_evaluate`, always use explicit `return` statements:
```javascript
// ❌ Wrong - returns undefined
window.location.hostname

// ✅ Correct - returns the value
return window.location.hostname

// ✅ For complex objects
return {
  hostname: window.location.hostname,
  href: window.location.href,
  includesAI: window.location.hostname.includes('conciliator-ai')
}
```

#### Build Monitoring
**Reliable Build Completion Check**:
```bash
# Don't just wait and hope - actively check for completion
while true; do
  STATUS=$(gh pr view [PR_NUMBER] --json statusCheckRollup | jq -r '.statusCheckRollup[0].status')
  CONCLUSION=$(gh pr view [PR_NUMBER] --json statusCheckRollup | jq -r '.statusCheckRollup[0].conclusion')
  echo "$(date): Build status: $STATUS"
  if [ "$STATUS" = "COMPLETED" ]; then
    echo "Build completed with conclusion: $CONCLUSION"
    break
  fi
  sleep 10
done
```

**Important**: Don't rely on page refreshes to detect deployment updates. Wait for build completion status first.

#### Deployment URLs
1. Identify deployment URLs:
   - Standard site: `pr-XXX---conciliator-55rclsk2qa-uc.a.run.app`
   - AI site: `pr-XXX---conciliator-ai-55rclsk2qa-uc.a.run.app`

2. Test systematically based on PR scope

### Phase 5: Feature-Specific Testing

#### Marketing/Public Pages
- Test without authentication first
- Verify all text changes, links, and functionality
- Check both site variants if applicable
- Use screenshots for visual verification of changes

#### Add-IP Workflow
- Standard site routes to `/add-ip`
- AI site routes to `/add-ip/protect`
- Both require authentication
- Test vocabulary service on both variants

#### Authenticated Features
- Clearly communicate when login is needed
- Batch authenticated tests for efficiency
- Document what specific features need verification

### Phase 6: Documentation
Create these documents in the working directory (not committed):
1. Test execution log with timestamps
2. Screenshots of key behaviors
3. Issue classification by severity
4. Clear pass/fail recommendation

## Step-by-Step Testing Protocol

### When Testing a PR:
1. **Stop and consult with user when encountering unexpected behavior**
2. **Use discussions to build "hints" for future testing**
3. **Test step by step, not all at once**

### Testing Flow:
1. **Start Testing Session**:
   ```bash
   # Start Chrome with debugging
   open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
   
   # Wait for Chrome to be ready
   sleep 2
   
   # Verify port is listening
   lsof -i :9222
   ```

2. **Connect and Navigate**:
   - Connect MCP Puppeteer to port 9222
   - Navigate to PR preview URL
   - Take initial screenshot for verification

3. **For Each Test**:
   - Navigate to test URL
   - Take screenshot for visual verification
   - Use `puppeteer_evaluate` with explicit returns for data checks
   - Document any unexpected behavior immediately
   - STOP and discuss with user if something doesn't work as expected

4. **When Builds Update**:
   - Monitor build status to completion
   - Reload page after build completes
   - Retest affected functionality

5. **Cleanup** (CRITICAL - Always perform before ending session):
   ```bash
   # Close Chrome instance used for testing
   pkill -f "chrome.*--remote-debugging-port=9222"
   
   # Verify it's closed
   lsof -i :9222  # Should return nothing
   ```
   
   **Important**: Always close the test browser to prevent resource leaks and confusion in future sessions.

## Environment Variable Issues

**Known Issue**: PR preview deployments may not have FEATURES environment variable set correctly (Issue #159).

**Symptoms**:
- `useFeature('ai')` returns false on AI site variants
- Features that depend on env vars don't work in PR previews
- NavigationHeader has URL fallback but other components may not

**Workaround Pattern** (until issue #159 is resolved):
```typescript
// Check both feature flag and URL (fallback for PR previews)
const isAISite = isAISiteFeature || 
  (typeof window !== 'undefined' && 
    (window.location.hostname.includes('conciliator-ai') || 
     window.location.hostname.includes('app.safeidea.ai')))
```

## Communication Guidelines

### With Users
- Be concise and direct about findings
- Clearly separate "tested" from "needs manual verification"
- When requesting login: specify exactly what will be tested and estimated time
- **When encountering unexpected behavior: stop and discuss before proceeding**

### With Developers
- **All communication stays within Claude Code** (this is an open source project)
- Questions about implementation should be documented in gitignored files
- Focus on observable behavior, not implementation assumptions

## Site-Specific Considerations

### SafeIdea.net (Standard Site)
- Uses "Ideas" terminology
- Routes to `/add-ip` for creation
- Marketing focus on creators and digital assets

### App.SafeIdea.ai (AI Site)
- Uses "IP/Intellectual Property" terminology
- Routes to `/add-ip/protect` for creation
- Marketing focus on IP managers and inventors
- May require URL-based detection in PR previews

## Red Flags That Block Approval
1. Core functionality doesn't work as described
2. Build or linting failures
3. Regressions in existing features
4. Incomplete implementation (e.g., vocabulary service only on one site variant)
5. Environment variable dependencies without URL fallbacks

## Success Criteria
A PR is ready to merge when:
- ✅ All static analysis passes
- ✅ All claimed features work as described
- ✅ No regressions found
- ✅ Site-specific features work on correct variants
- ✅ Clear documentation of what was tested
- ✅ Any workarounds are documented with issue references

## Testing Hints Knowledge Base

### Verifying Expected Behavior
1. Check session reports or commit messages for intended behavior
2. Don't assume inconsistencies are bugs - verify design intent
3. Look for patterns (e.g., "neutral terminology" for shared content)
4. Cross-reference with existing vocabulary/configuration files

### When Things Don't Match Expectations
1. Check session status reports for implementation notes
2. Grep/search for related configuration (e.g., vocabulary entries)
3. Verify if feature was intentionally excluded or pending
4. Document findings before concluding there's an issue

### Testing Efficiency
1. For repetitive testing across variants, establish a rhythm:
   - Navigate to standard site → screenshot → navigate to AI site → screenshot
2. Use browser tabs strategically (but always verify correct variant)
3. For vocabulary testing, spot-check key differences rather than reading entire pages

### Browser Management
- Always start fresh Chrome instance with exact command from spec
- Never reuse existing browser windows
- Close all test windows when complete
- Connection failures often mean Chrome isn't on expected port

### JavaScript Evaluation
- Always use explicit `return` statements in puppeteer_evaluate
- Without `return`, expressions evaluate to undefined
- Complex objects need explicit return with proper structure

### Build Monitoring
- Don't rely on timing - actively check build status
- Use while loops with status checks for reliability
- Wait for COMPLETED status before testing deployments
- Page reloads don't guarantee new deployment is ready

### Environment Variables
- PR previews may not have correct env vars
- URL-based detection provides reliable fallback
- Check existing code for URL fallback patterns
- Document when workarounds are needed with issue references

### Debugging Approach
- When something unexpected happens, investigate root cause
- Check if it's an environment issue vs code issue
- Look for existing workarounds in similar components
- Create issues for infrastructure problems

## Example Reviews

### PR #154 Review
This PR demonstrated the review process:
1. Initial review found vocabulary service incomplete (only on standard site)
2. Fixed the issue by applying to AI site component
3. Verified all features working correctly
4. Documented findings and received approval to merge

### PR #157 Review
This PR revealed critical testing insights:
1. Discovered vocabulary not working on AI site in PR preview
2. Investigated and found FEATURES env var not set
3. Found existing URL fallback pattern in NavigationHeader
4. Applied same pattern to vocabulary system
5. Created issue #159 for proper infrastructure fix
6. Documented workaround and testing procedure

## References
- Session reports: Git history contains previous session reports
- Test helpers: `/test/claude-sdk-mcp/` directory
- Project documentation: `CLAUDE.md` files (root and project-specific)

## Future Improvements
- Automated detection of env var issues
- Pre-flight checks for common problems
- Test result templates
- Build configuration fixes for env vars

### PR #157 Testing Session
This session demonstrated the importance of:
1. Comparing tested pages with actual commit changes
2. Understanding design intent (e.g., neutral FAQ terminology)
3. Efficient visual testing across site variants
4. Verifying vocabulary implementation systematically

---
*Last updated: June 22, 2025*
*Based on PR #154 and #157 review experiences*