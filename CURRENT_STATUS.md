# SafeIdea Project Status - Current Implementation

> **Updated**: May 25, 2025

## Project Overview

SafeIdea is a production web application designed to help users protect, share, and monitor their intellectual property (IP). The platform provides three core services:

1. **Secure Encryption of Digital Assets**: Using threshold cryptography via LIT Protocol to encrypt and store digital assets on decentralized storage (IPFS/Filecoin).

2. **Secure Sharing with NDA Enforcement**: Allowing IP owners to share assets with potential partners or investors under controlled conditions with legal protection through digital NDAs.

3. **IP Monitoring and Protection**: Using AI-powered agents to monitor for unauthorized use and provide comprehensive protection reports for intellectual property.

## Technical Architecture

### Frontend

- **Framework**: Next.js with React 19
- **UI Components**: Custom components built with shadcn/ui and Tailwind CSS
- **Authentication**: Stytch for passwordless authentication
- **Styling**: Dark-theme-first design with glassmorphism effects

### Backend & Data Storage

- **Database**: Firebase Firestore for storing metadata and user information
- **Decentralized Storage**: IPFS/Filecoin for storing encrypted IP content
- **File Encryption**: LIT Protocol for threshold cryptography
- **Payments**: Stripe integration for subscription management
- **Deployment**: Google Cloud Run (migrated from Cloudflare due to runtime compatibility)

### Key Features

#### IP Protection Flow

1. Users upload IP documents (supports multiple file types)
2. Documents are encrypted client-side using LIT Protocol
3. Original and downsampled versions are encrypted with different access conditions
4. Encrypted content is stored on IPFS with references in Firestore
5. A token (ERC-1155) is minted to represent ownership

#### Secure Sharing

1. IP owners set sharing terms (business model, evaluation period, pricing)
2. Potential partners must agree to digital NDAs
3. Access is time-limited and tracked in an audit log
4. Access control is enforced through token-gated decryption

#### AI Protection Agent

1. Each IP can have an associated "Conciliator" AI agent
2. Agent monitors the internet for unauthorized use of IP
3. Provides detailed reports on potential infringement with evidence
4. Tracks and analyzes potential IP violations across multiple platforms

#### Subscription Model

- **Basic Plan**: Essential protection with secure storage and timestamping
- **Secure Plan**: Enhanced sharing controls with NDA integration and activity tracking
- **Complete Plan**: Full monitoring with AI agents, infringement detection, and priority support

## Implementation Details

### Authentication & User Management

- Passwordless authentication using Stytch
- Session management with custom hooks (useSession, useStytchUser)
- User data stored in Firestore

### File Processing & Encryption

- Client-side file reading with size and type validation
- Downsampling for creating reduced versions of IP content
- Encryption using LIT Protocol with access control conditions
- Storage references maintained in Firestore

### Access Control

- Token-based access control (ERC-1155)
- Time-limited access periods
- NDA acceptance tracking
- Audit logging of all access events

### Subscription Management

- Tiered subscription model with feature gating
- Storage of subscription data in Firestore
- Local storage for assessment data and funnel steps

## Project Structure

The project follows Next.js conventions with several key directories:

- `/app`: Page routes and API endpoints
- `/components`: Reusable UI components
- `/hooks`: Custom React hooks
- `/lib`: Utility functions and types
- `/public`: Static assets and legal documents

Notable features in the directory structure:
- Complete subscription flow implementation in `/app/subscription`
- API endpoints in `/app/api` for various functionalities including MCP support
- UI components organized by feature area (AddIP, DetailIP, etc.)
- Comprehensive testing infrastructure in `/test` directories

## Development Practices

- Dark-theme first design approach
- Component-based architecture
- Authentication-gated routes
- Feature-gated functionality based on subscription tier
- Client-side cryptography for security

## Claude SDK MCP Testing Implementation

A comprehensive testing framework has been developed using Claude Code SDK with the Multi-Context Protocol (MCP) to automate testing of the application's key flows.

### Testing Architecture

- **Testing Directory**: Located in `/test/claude-sdk-mcp` and `/test/mcp`
- **Framework**: Uses Playwright for browser automation (migrated from Cypress)
- **MCP Integration**: Claude Code SDK is used to generate and analyze tests
- **Test Scripting**: Both pre-defined and dynamically generated test scripts
- **TestID Support**: Components throughout the application have testid attributes for stable and reliable testing
- **Test Manifest**: HTML-based test manifest at `/public/test-manifest.html` maintains centralized testid registry

### Key Testing Components

1. **Claude SDK Integration**:
   - Uses the Claude CLI (`claude -p "prompt"`) to generate Playwright test scripts dynamically
   - Generated code is saved and executed to test the application
   - Results are analyzed by Claude to provide feedback and improvement suggestions
   - Full feedback loop: prompt → test generation → execution → result analysis → improvement

2. **Test Types**:
   - **Simple Tests**: Basic website interaction tests (`simple-site-test.js`, `simple-sdk-test.js`)
   - **Assessment Flow Tests**: Comprehensive tests of the subscription assessment workflow
   - **Data-Testid Tests**: Tests using stable attributes for selecting UI elements (`correct-testid-test.js`)
   - **Text-Based Tests**: Alternative tests using text content for more flexible selection (`text-based-assessment-test.js`)

3. **Testing Framework Features**:
   - Screenshot capture at each test step for visual verification
   - Robust error handling with fallback strategies
   - Test reporting and result analysis
   - Execution tools for both local and CI environments

### Notable Test Files

- **claude-mcp-demo.js**: Showcases the complete workflow - generating tests from prompts, executing them, and analyzing results
- **claude-sdk-demo.js**: Demonstrates basic integration with Claude for generating and running tests
- **fixed-assessment-test.js**: Tests the subscription assessment flow using data-testid selectors
- **text-based-assessment-test.js**: Alternative implementation using text-based selectors
- **testid-based-test.js**: Navigation test that verifies core application flow using testid attributes

### Test Generation Process

1. **Natural Language Test Definition**:
   ```javascript
   const testPrompt = `
   Write a Playwright script that tests the subscription assessment form at 
   https://safeidea.net/subscription/assessment. The script should:

   1. Navigate to the assessment page
   2. For each question, select the third option (or the middle option if less than 5 options)
   3. Take screenshots before and after each selection
   4. Click the Next button after each selection
   5. Verify we reach the results page
   6. Take a screenshot of the results page
   7. Log the recommended plan if possible
   8. Include proper error handling throughout
   
   Use the following information about the page structure:
   - Each question has a data-testid attribute like: data-testid="question-type", etc.
   - Options have data-testid attributes like: data-testid="option-business-model"
   - The Next button has: data-testid="next-question-button"
   - The results container has: data-testid="assessment-results"
   `
   ```

2. **Test Generation**:
   ```javascript
   const generatedTest = generateTestWithClaude(testPrompt)
   ```

3. **Test Execution**:
   ```javascript
   const testResult = executeTest(generatedTest.filePath)
   ```

4. **Result Analysis**:
   ```javascript
   const analysis = analyzeTestResults(testResult, generatedTest.code)
   ```

### Test Implementation Details

- Uses data-testid attributes for reliable element selection:
  ```javascript
  await page.click(`[data-testid="option-${optionId}"]`)
  ```

- Implements robust error handling with fallback strategies:
  ```javascript
  try {
    await page.click(`[data-testid="option-${optionValue}"]`)
  } catch (error) {
    console.warn(`Could not select option ${optionValue}: ${error.message}`)
    // Try alternative selection strategies...
  }
  ```

- Takes screenshots at each step for visual verification:
  ```javascript
  await page.screenshot({
    path: path.join(screenshotDir, `${questionNumber}-question-${question.type}.png`),
    fullPage: true
  })
  ```

### MCP Integration Benefits

1. **Natural Language Test Generation**: Create tests by describing requirements in plain English
2. **Adaptive Testing**: Claude can analyze test failures and suggest improvements
3. **Reduced Maintenance**: Test scripts can be regenerated as the application evolves
4. **Comprehensive Analysis**: Claude provides detailed reports on test execution results
5. **Self-Improving Tests**: Claude can learn from test failures and generate more robust tests
6. **Arbitrary Prompt Support**: Tests can be created from any natural language description

### Verified Testing Components

The PR #134 has successfully implemented and validated the data-testid attributes throughout the application, particularly in the subscription assessment flow. The tests have confirmed:

1. Proper implementation of all necessary data-testid attributes
2. Successful navigation through the application using these attributes
3. Correct selection of options in the assessment flow
4. Proper detection of the results page and recommended plan
5. Reliable test execution with robust error handling

### Future Enhancements

- Expanding test coverage to include IP protection and sharing flows
- Implementing CI/CD integration for automated testing
- Developing more sophisticated MCP prompts for advanced test scenarios
- Creating a standardized test reporting framework
- Extending testid coverage to all major application components
- Implementing a testid verification tool to ensure consistency between code and test manifest
- Creating a migration guide to transition from text-based selectors to testid-based selectors in existing tests

## Technical Architecture Decisions

### Browser-Side Encryption
**Rationale**: All encryption handled client-side using LIT Protocol ensures true end-to-end security with zero-knowledge architecture. This is required for best practices security.

### Threshold Cryptography via LIT Protocol
**Rationale**: LIT Protocol provides the best threshold cryptography solution available. Threshold cryptography is specifically required for complex ownership of digital assets, which is core to SafeIdea's functionality.

### Client-Heavy Architecture
**Rationale**: Extensive use of 'use client' directives is necessary because LIT Protocol requires browser-based computation for security purposes. This deliberate architectural choice ensures end-to-end security.

### Firestore + IPFS Hybrid Storage
**Rationale**: Firebase provides convenient handling of ERC-1155 tokens in IPFS. The tokens contain internal structure for complex ownership relationships, ensuring ownership questions are easily answered immutably on the blockchain.

### Flat Route Structure
**Rationale**: Appropriate for SafeIdea where most routes follow the same pattern of needing dynamic content. A deeper structure would add unnecessary complexity since most routes represent similar types of content (IP-related entities).

## Recent Major Updates

### AI Agent Strategic Pivot (May 2025)
- **Terminology Update**: Changed from "Sales Agent" to "Protection Agent" throughout platform
- **Focus Shift**: Emphasis moved from monetization to monitoring and infringement detection
- **Enhanced Capabilities**: Improved monitoring across websites, marketplaces, and digital platforms
- **UI Updates**: Updated all messaging to reflect protection-first approach

### Portfolio Interest Research Feature (May 2025)

Added a portfolio management research feature to gather insights from IP professionals and understand market demand for enterprise-level features.

- **Market Research**: Added comprehensive portfolio manager research form
- **Enterprise Focus**: Gathering requirements for enterprise IP management features
- **Target Timeline**: Late 2025 for enterprise feature rollout
- **Strategic Value**: Validating demand for higher-value enterprise customers

### Testing Framework Maturity (May 2025)
- **Claude SDK Integration**: Complete MCP testing framework implementation
- **Test Coverage**: Comprehensive automation for all subscription flows
- **Documentation**: Full testing guides and best practices established

### UI/UX Refinements (May 2025)
- **Pricing Display**: Added CSS blur effects during testing phases
- **Responsive Design**: Enhanced mobile experience across all subscription pages
- **Accessibility**: Improved navigation and form interactions

## TestID Implementation Guidelines

### Overview
SafeIdea uses data-testid attributes to enable automated testing with Claude Code SDK and Playwright. The test manifest has been removed in favor of direct DOM discovery.

### Naming Convention
Use the pattern: `[context]-[element]-[action]`

Examples:
- `ip-list-search-input`
- `ip-detail-decrypt-button` 
- `add-idea-title-input`
- `nav-home-link`

### Implementation Rules
1. **Add testids only to interactive elements** and key content areas
2. **Don't add testids to purely visual elements** (decorative divs, spacers, etc.)
3. **Be consistent with naming** - if similar elements exist elsewhere, use similar patterns
4. **Keep names descriptive but concise** - they should be self-documenting

### When to Add TestIDs
- ✅ Buttons, links, and other clickable elements
- ✅ Form inputs, selects, and textareas
- ✅ Key content containers that tests need to verify
- ✅ Modal dialogs and their close buttons
- ✅ Navigation elements
- ❌ Pure styling wrappers
- ❌ Static text unless it's a key assertion point
- ❌ Hidden elements used only for styling

### Current Coverage
**Well Covered:**
- Navigation components (nav-*)
- Add IP workflow
- Terms dialog
- Assessment flow
- Welcome/homepage

**Needs TestIDs:**
- IP Details/Discovery flow (priority)
- Individual IP list items
- Some modal dialogs

### Example Implementation
```tsx
// Good - interactive element with clear naming
<Button data-testid="ip-detail-view-button" onClick={handleView}>
  View Document
</Button>

// Good - form input with context
<Input data-testid="add-idea-title-input" value={title} />

// Good - content area that tests verify
<div data-testid="ip-detail-content">{content}</div>

// Bad - purely visual wrapper
<div data-testid="spacer-div" className="mt-4" />
```

## Known Issues

### TypeScript Compilation Blocking Commits (January 2025)

The pre-commit hook runs TypeScript compilation on the entire project, which can block commits of JavaScript-only files when there are unrelated TypeScript errors elsewhere in the codebase. 

**Current Errors:**
- Missing @radix-ui/react-switch dependency
- Missing @storacha/client dependencies in packages/web-storage-wrapper

**Workaround:** Use `git commit --no-verify` to bypass pre-commit hooks when necessary.

**See:** [TYPESCRIPT-COMMIT-ISSUE.md](./TYPESCRIPT-COMMIT-ISSUE.md) for full details and recommended solutions.