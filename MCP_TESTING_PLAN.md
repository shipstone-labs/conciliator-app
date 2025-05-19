# MCP-Based Testing Strategy for SafeIdea Services

This document outlines a comprehensive testing approach for SafeIdea's three core services using Anthropic's Model Context Protocol (MCP) and Claude Code.

## Overview

This testing strategy covers SafeIdea's three primary services:
1. Adding new digital assets
2. Sharing digital assets
3. MCP-enabled AI Sales Agent (Conciliator) for discovery

The plan takes an incremental approach, starting with automating the simplest flow - adding new digital assets.

## Phase 1: Automating Tests for Adding New Digital Assets

### Initial Setup and Framework

1. **Create MCP Server for Playwright**
   - Use the Model Context Protocol TypeScript SDK to create an MCP server that wraps Playwright
   - Define the following tools:
     - `launchBrowser`: Launch a browser session
     - `navigateTo`: Navigate to a specific URL
     - `fillForm`: Fill form fields by selector
     - `clickElement`: Click an element by selector
     - `uploadFile`: Handle file upload by selector
     - `waitForElement`: Wait for element to appear
     - `captureScreenshot`: Take a screenshot for verification
     - `getElementText`: Extract text from an element

2. **Create MCP Server for Browser Console**
   - Build an MCP server that can access browser console logs
   - Define tools:
     - `getLogs`: Retrieve console logs
     - `getErrors`: Extract error messages
     - `clearLogs`: Clear the console log buffer

3. **Create Test Asset Repository**
   - Prepare a set of test assets for upload (text files, markdown, images)
   - Include metadata for these assets (title, description, tags, etc.)
   - Store these in a location accessible to the testing environment

4. **Create Test User Accounts**
   - Create dedicated test accounts with different permission levels
   - Implement secure storage of test credentials

### Step-by-Step Test Implementation for Adding Digital Assets

1. **Authentication Test**
   ```typescript
   // MCP Tool Definition
   {
     "name": "authenticate_user",
     "description": "Log in to the SafeIdea platform with test credentials",
     "parameters": {
       "username": { "type": "string", "description": "Test user email" },
       "password": { "type": "string", "description": "Test user password" },
       "role": { "type": "string", "description": "User role (admin, creator, viewer)" }
     }
   }
   
   // MCP Tool Implementation
   async function authenticateUser(params) {
     const { username, password, role } = params;
     const page = await playwright.newPage();
     await page.goto('https://safeidea.net/');
     await page.click('[data-testid="login-button"]');
     await page.fill('[data-testid="email-input"]', username);
     // Complete authentication flow...
     return { success: true, userId: "test-user-id" };
   }
   ```

2. **Basic Asset Creation Test**
   ```typescript
   // MCP Tool Definition
   {
     "name": "create_digital_asset",
     "description": "Create a new digital asset with basic information",
     "parameters": {
       "title": { "type": "string", "description": "Asset title" },
       "description": { "type": "string", "description": "Asset description" },
       "assetType": { "type": "string", "description": "Type of asset (document, image, etc.)" },
       "filePath": { "type": "string", "description": "Path to test file" }
     }
   }
   
   // MCP Tool Implementation
   async function createDigitalAsset(params) {
     const { title, description, assetType, filePath } = params;
     // Navigate to add asset page
     await page.goto('https://safeidea.net/add-ip');
     // Fill in basic information
     await page.fill('[data-testid="idea-title-input"]', title);
     await page.fill('[data-testid="idea-description-input"]', description);
     await page.selectOption('[data-testid="asset-type-select"]', assetType);
     // Upload file
     await page.setInputFiles('[data-testid="file-upload-input"]', filePath);
     // Submit form
     await page.click('[data-testid="create-idea-button"]');
     // Wait for success confirmation
     await page.waitForSelector('[data-testid="success-message"]');
     // Extract asset ID from URL or response
     const assetId = await extractAssetId(page);
     return { success: true, assetId };
   }
   ```

3. **Verification Test**
   ```typescript
   // MCP Tool Definition
   {
     "name": "verify_asset_created",
     "description": "Verify that an asset was correctly created and is accessible",
     "parameters": {
       "assetId": { "type": "string", "description": "ID of the created asset" }
     }
   }
   
   // MCP Tool Implementation
   async function verifyAssetCreated(params) {
     const { assetId } = params;
     // Navigate to asset details page
     await page.goto(`https://safeidea.net/details/${assetId}`);
     // Verify asset details are displayed correctly
     const titleElement = await page.waitForSelector('[data-testid="asset-title"]');
     const titleText = await titleElement.textContent();
     // Check if asset is correctly encrypted
     const encryptionStatus = await page.waitForSelector('[data-testid="encryption-status"]');
     const statusText = await encryptionStatus.textContent();
     // Capture verification screenshot
     await page.screenshot({ path: `verification-${assetId}.png` });
     return { 
       success: true, 
       titleMatches: titleText === expectedTitle,
       isEncrypted: statusText.includes("Encrypted"),
       screenshotPath: `verification-${assetId}.png`
     };
   }
   ```

4. **Edge Case Tests**
   ```typescript
   // Additional tools for edge cases:
   // 1. Test with very large files
   // 2. Test with unsupported file types
   // 3. Test with special characters in title/description
   // 4. Test with empty required fields
   ```

### Integration with Claude Code

1. **Test Orchestration**
   - Create a Claude Code script that orchestrates the test execution:
   ```typescript
   // Claude Code test orchestration
   async function runAssetCreationTests() {
     // Initialize test context
     const testContext = {
       results: [],
       errors: [],
       screenshots: [],
     };
     
     // Run authentication
     try {
       const authResult = await callMCPTool("authenticate_user", {
         username: "test@example.com",
         password: "secure-test-password",
         role: "creator"
       });
       testContext.userId = authResult.userId;
     } catch (error) {
       testContext.errors.push({ stage: "authentication", error });
       return testContext; // Early return if auth fails
     }
     
     // Test basic asset creation
     const testAssets = [
       { title: "Test Document 1", description: "Basic test document", type: "document", path: "./test-assets/document.md" },
       { title: "Test Image", description: "Test image asset", type: "image", path: "./test-assets/image.png" },
       // Add more test assets...
     ];
     
     for (const asset of testAssets) {
       try {
         const result = await callMCPTool("create_digital_asset", {
           title: asset.title,
           description: asset.description,
           assetType: asset.type,
           filePath: asset.path
         });
         
         // Verify creation was successful
         const verification = await callMCPTool("verify_asset_created", {
           assetId: result.assetId
         });
         
         testContext.results.push({
           asset: asset.title,
           success: verification.success,
           details: verification
         });
         
         if (verification.screenshotPath) {
           testContext.screenshots.push(verification.screenshotPath);
         }
       } catch (error) {
         testContext.errors.push({ 
           stage: "asset_creation", 
           asset: asset.title, 
           error 
         });
       }
     }
     
     return testContext;
   }
   ```

2. **Test Results Analysis**
   - Create a Claude Code function to analyze test results:
   ```typescript
   function analyzeTestResults(testContext) {
     const summary = {
       totalTests: testContext.results.length,
       passed: testContext.results.filter(r => r.success).length,
       failed: testContext.results.filter(r => !r.success).length,
       errors: testContext.errors.length,
       recommendations: []
     };
     
     // Analyze error patterns
     if (testContext.errors.length > 0) {
       const authErrors = testContext.errors.filter(e => e.stage === "authentication");
       if (authErrors.length > 0) {
         summary.recommendations.push("Authentication system may be unstable. Review auth flow.");
       }
       
       // More error pattern analysis...
     }
     
     return summary;
   }
   ```

3. **Issue Creation via MCP-Ready GitHub**
   ```typescript
   // MCP Tool Definition
   {
     "name": "create_github_issue",
     "description": "Create a GitHub issue for a failed test",
     "parameters": {
       "title": { "type": "string", "description": "Issue title" },
       "body": { "type": "string", "description": "Issue description with test results" },
       "labels": { "type": "array", "items": { "type": "string" }, "description": "Issue labels" }
     }
   }
   
   // Usage in Claude Code
   async function reportFailedTests(testContext) {
     const failedTests = testContext.results.filter(r => !r.success);
     
     for (const test of failedTests) {
       const issueBody = `
         ## Failed Test: ${test.asset}
         
         **Details:**
         ${JSON.stringify(test.details, null, 2)}
         
         **Error Information:**
         ${testContext.errors.find(e => e.asset === test.asset)?.error?.message || "No error message"}
         
         **Screenshots:**
         ${test.details.screenshotPath ? `![Screenshot](${test.details.screenshotPath})` : "No screenshot available"}
       `;
       
       await callMCPTool("create_github_issue", {
         title: `Test Failure: ${test.asset}`,
         body: issueBody,
         labels: ["test-failure", "automated", "digital-asset-creation"]
       });
     }
   }
   ```

## Phase 2: Extending to Sharing Digital Assets

After successfully implementing and validating Phase 1, extend the testing framework to cover the sharing functionality:

1. **Additional MCP Tools for Sharing Tests**
   - `share_asset`: Share an asset with another user
   - `accept_nda`: Simulate accepting an NDA
   - `verify_access`: Verify a user has access to shared asset
   - `revoke_access`: Revoke access to test permission changes

2. **Multi-User Session Testing**
   - Create tools to manage multiple browser sessions
   - Implement user switching to test sharing from both sides
   - Validate NDA enforcement and time-limited access

## Phase 3: Testing MCP-Enabled AI Sales Agent

The final phase implements testing for the AI Sales Agent (Conciliator) functionality:

1. **MCP Tools for AI Agent Testing**
   - `start_agent_session`: Initialize a conversation with the AI agent
   - `send_query`: Send a question to the agent
   - `verify_response`: Verify agent response contents
   - `check_knowledge_boundaries`: Test if agent respects information boundaries

2. **Conversation Flow Testing**
   - Test standardized conversation flows to verify agent behavior
   - Validate that the agent only reveals permitted information
   - Verify proper handling of edge case questions

## Implementation Timeline and Dependencies

1. **Week 1-2: Framework Setup**
   - Set up MCP servers for Playwright and browser console
   - Create test asset repository and user accounts
   - Implement basic authentication tests

2. **Week 3-4: Asset Creation Testing**
   - Implement asset creation and verification tests
   - Set up Claude Code orchestration
   - Create test result analysis functions

3. **Week 5-6: Sharing Functionality**
   - Implement multi-user testing
   - Create sharing and access verification tests
   - Test NDA enforcement mechanisms

4. **Week 7-8: AI Agent Testing**
   - Implement AI Sales Agent testing tools
   - Create conversation flow tests
   - Validate information boundary enforcement

## Getting Started: First Implementation

To begin implementing this testing strategy, start with these concrete steps:

1. **Create a basic Playwright MCP server**
   ```bash
   # Install dependencies
   npm install @anthropic-ai/mcp-sdk playwright
   
   # Create MCP server for Playwright
   touch mcp-playwright-server.js
   ```

2. **Implement the simplest version of the asset creation test**
   ```javascript
   // mcp-playwright-server.js
   const { createServer } = require('@anthropic-ai/mcp-sdk');
   const { chromium } = require('playwright');
   
   let browser;
   let page;
   
   const server = createServer({
     tools: {
       // Tool to initialize browser
       async initBrowser() {
         browser = await chromium.launch({ headless: true });
         page = await browser.newPage();
         return { success: true };
       },
       
       // Tool to log in
       async login({ username, password }) {
         await page.goto('https://safeidea.net/');
         await page.click('[data-testid="login-button"]');
         await page.fill('[data-testid="email-input"]', username);
         // Complete login flow...
         return { success: true };
       },
       
       // Tool to create basic asset
       async createBasicAsset({ title, description, filePath }) {
         await page.goto('https://safeidea.net/add-ip');
         await page.fill('[data-testid="idea-title-input"]', title);
         await page.fill('[data-testid="idea-description-input"]', description);
         await page.setInputFiles('[data-testid="file-upload-input"]', filePath);
         await page.click('[data-testid="create-idea-button"]');
         
         try {
           await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
           const url = page.url();
           const assetId = url.split('/').pop();
           return { success: true, assetId };
         } catch (error) {
           return { 
             success: false, 
             error: error.message,
             screenshot: await page.screenshot({ encoding: 'base64' })
           };
         }
       },
     },
     resources: {
       // Resource to get test files info
       testAssets: {
         description: "Information about test assets",
         handler: async () => {
           return {
             content: [
               { name: "Test Document", path: "./test-assets/document.md", type: "markdown" },
               { name: "Test Image", path: "./test-assets/image.png", type: "image" },
             ],
             mime_type: "application/json"
           };
         }
       }
     }
   });
   
   server.listen();
   ```

3. **Create a Claude Code script to orchestrate the test**
   ```javascript
   // test-runner.js
   
   // This would be executed by Claude Code
   async function runBasicAssetCreationTest() {
     // Initialize the browser
     await callMCPTool("initBrowser");
     
     // Log in with test credentials
     await callMCPTool("login", {
       username: "test@example.com",
       password: "test-password"
     });
     
     // Create a test asset
     const result = await callMCPTool("createBasicAsset", {
       title: "Test Document",
       description: "This is a test document created by automated testing",
       filePath: "./test-assets/document.md"
     });
     
     // Report results
     if (result.success) {
       console.log(`Successfully created asset with ID: ${result.assetId}`);
     } else {
       console.error(`Failed to create asset: ${result.error}`);
       // Could automatically create GitHub issue here
     }
     
     return result;
   }
   ```

4. **Running the Test with Claude Code**
   - Launch the MCP server: `node mcp-playwright-server.js`
   - Configure Claude Code to connect to this MCP server
   - Execute the test script

This implementation provides a simple yet effective starting point that can be incrementally expanded to cover more complex scenarios and additional services.