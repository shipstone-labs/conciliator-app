# Test Plan for PR #157: Vocabulary Support for Subscription Pages

## PR Overview
This PR extends the vocabulary system to all subscription pages, allowing different terminology for the standard site (safeidea.net) and AI site (app.safeidea.ai).

## Changes to Test
1. **Vocabulary additions** in `lib/vocabulary.ts`:
   - New subscription-specific vocabulary terms
   - URL-based fallback for AI site detection

2. **Modified subscription pages**:
   - `/subscription/home` - Hero text and content
   - `/subscription/basic` - Basic plan page
   - `/subscription/complete` - Complete plan page  
   - `/subscription/faq` - FAQ page
   - `/subscription/how-it-works` - How it works page
   - `/subscription/plans` - Plans comparison page
   - `/subscription/secure` - Security features page

3. **Infrastructure changes**:
   - `lib/getServerConfig.ts` - Features environment variable allowlist
   - URL-based fallback for vocabulary when FEATURES env var is not available

## Test Requirements

### Phase 1: Static Analysis
```bash
# Run in the PR branch
pnpm install
npx @biomejs/biome@^1.9.4 lint .
npx @biomejs/biome@^1.9.4 check .
pnpm build
```

### Phase 2: Deployment URLs
- Standard site PR preview: `pr-157---conciliator-55rclsk2qa-uc.a.run.app`
- AI site PR preview: `pr-157---conciliator-ai-55rclsk2qa-uc.a.run.app`

### Phase 3: Vocabulary Testing

#### Test Matrix
For each subscription page, verify the vocabulary differences between sites:

| Page | Standard Site (.net) | AI Site (.ai) |
|------|---------------------|---------------|
| `/subscription/home` | "Ideas" terminology | "IP/Intellectual Property" terminology |
| `/subscription/basic` | Creator-focused language | IP manager-focused language |
| `/subscription/complete` | Digital asset protection | Professional IP management |
| `/subscription/faq` | Neutral terminology (same on both) | Neutral terminology (same on both) |
| `/subscription/how-it-works` | Idea protection workflow | IP protection workflow |
| `/subscription/plans` | Plan comparisons with "ideas" | Plan comparisons with "IP" |
| `/subscription/secure` | Security for creators | Security for IP professionals |

#### Specific Vocabulary Checks

1. **Home Page** (`/subscription/home`):
   - Standard: "Because Your Ideas Are Worth Protecting"
   - AI: "Because Your Intellectual Property Needs Professional Protection"

2. **Basic Plan** (`/subscription/basic`):
   - Standard: "Protect Your Ideas with Basic Protection"
   - AI: "Essential IP Protection for Professionals"

3. **Complete Plan** (`/subscription/complete`):
   - Standard: "Complete Protection for All Your Ideas"
   - AI: "Comprehensive IP Management Suite"

4. **FAQ Page** (`/subscription/faq`):
   - Should use neutral terminology on BOTH sites
   - Verify questions don't change between variants

5. **How It Works** (`/subscription/how-it-works`):
   - Standard: Focus on idea submission process
   - AI: Focus on IP documentation workflow

6. **Plans Page** (`/subscription/plans`):
   - Standard: "Choose the Right Plan for Your Ideas"
   - AI: "Select Your IP Protection Package"

7. **Secure Page** (`/subscription/secure`):
   - Standard: "Your Ideas Are Safe With Us"
   - AI: "Enterprise-Grade IP Security"

### Phase 4: URL Fallback Testing
Since PR previews may not have FEATURES env var set correctly (Issue #159):

1. Verify vocabulary works correctly on both PR preview URLs
2. Check that URL-based detection is functioning:
   - Pages should detect `.conciliator-ai` in hostname
   - Vocabulary should switch appropriately

### Phase 5: Visual Testing Protocol
1. Take screenshots of each page on both sites
2. Use naming: `[site]-subscription-[page]` (e.g., `standard-subscription-home`, `ai-subscription-home`)
3. Document visual differences systematically

### Phase 6: Navigation Testing
1. Verify all subscription page links work correctly
2. Check that navigation between subscription pages maintains correct vocabulary
3. Test browser back/forward maintains vocabulary consistency

## Test Execution Checklist

- [ ] Static analysis passes (lint, check, build)
- [ ] Build completes successfully on GitHub
- [ ] PR preview deployments are accessible

**Standard Site Testing** (pr-157---conciliator):
- [ ] /subscription/home - "Ideas" terminology visible
- [ ] /subscription/basic - Creator-focused language
- [ ] /subscription/complete - Digital asset focus
- [ ] /subscription/faq - Neutral terminology
- [ ] /subscription/how-it-works - Idea workflow
- [ ] /subscription/plans - Ideas comparison
- [ ] /subscription/secure - Creator security focus

**AI Site Testing** (pr-157---conciliator-ai):
- [ ] /subscription/home - "IP/Intellectual Property" terminology visible
- [ ] /subscription/basic - Professional IP language
- [ ] /subscription/complete - IP management focus
- [ ] /subscription/faq - Neutral terminology (same as standard)
- [ ] /subscription/how-it-works - IP workflow
- [ ] /subscription/plans - IP comparison
- [ ] /subscription/secure - Enterprise security focus

**Technical Verification**:
- [ ] URL-based vocabulary fallback working
- [ ] No console errors on any page
- [ ] Pages load completely without issues
- [ ] Navigation between pages works correctly

## Known Issues
- FEATURES environment variable may not be set in PR previews (Issue #159)
- URL-based fallback should compensate for this

## Success Criteria
- All vocabulary changes display correctly on respective sites
- FAQ page maintains neutral terminology on both sites
- No regressions in existing functionality
- URL-based fallback ensures vocabulary works even without FEATURES env var

## Time Estimate
- Static analysis: 2 minutes
- Visual testing all pages: 15-20 minutes
- Documentation: 5 minutes
- Total: ~30 minutes