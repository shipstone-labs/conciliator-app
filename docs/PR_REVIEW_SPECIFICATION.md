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
1. Identify deployment URLs:
   - Standard site: `pr-XXX---conciliator-55rclsk2qa-uc.a.run.app`
   - AI site: `pr-XXX---conciliator-ai-55rclsk2qa-uc.a.run.app`

2. Connect to Chrome:
   ```bash
   open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
   ```

3. Test systematically based on PR scope

### Phase 4: Feature-Specific Testing

#### Marketing/Public Pages
- Test without authentication first
- Verify all text changes, links, and functionality
- Check both site variants if applicable

#### Add-IP Workflow
- Standard site routes to `/add-ip`
- AI site routes to `/add-ip/protect`
- Both require authentication
- Test vocabulary service on both variants

#### Authenticated Features
- Clearly communicate when login is needed
- Batch authenticated tests for efficiency
- Document what specific features need verification

### Phase 5: Documentation
Create these documents in the working directory (not committed):
1. Test execution log with timestamps
2. Screenshots of key behaviors
3. Issue classification by severity
4. Clear pass/fail recommendation

## Communication Guidelines

### With Users
- Be concise and direct about findings
- Clearly separate "tested" from "needs manual verification"
- When requesting login: specify exactly what will be tested and estimated time

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

## Red Flags That Block Approval
1. Core functionality doesn't work as described
2. Build or linting failures
3. Regressions in existing features
4. Incomplete implementation (e.g., vocabulary service only on one site variant)

## Success Criteria
A PR is ready to merge when:
- ✅ All static analysis passes
- ✅ All claimed features work as described
- ✅ No regressions found
- ✅ Site-specific features work on correct variants
- ✅ Clear documentation of what was tested

## Example: PR #154 Review
This PR demonstrated the complete review process:
1. Initial review found vocabulary service incomplete (only on standard site)
2. Fixed the issue by applying to AI site component
3. Verified all features working correctly
4. Documented findings and received approval to merge

## References
- Session reports: Git history contains previous session reports
- Test helpers: `/test/claude-sdk-mcp/` directory
- Project documentation: `CLAUDE.md` files (root and project-specific)

## Future Improvements
- Pattern recognition for common issues
- Test coverage metrics
- Automated regression test suggestions

---
*Last updated: June 22, 2025*
*Based on PR #154 review experience*