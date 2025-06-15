# Add-IP Test Prompts for Claude Desktop

## Standard Add-IP Automation Test

Please run the add-ip automation test to create [NUMBER] ideas with the following requirements:

### Test Setup
1. Connect to Chrome using MCP Puppeteer (port 9222)
2. Verify you're logged in (check for "Add Idea" button)
3. If not logged in, notify me to complete manual authentication

### Test Execution
For each idea:

1. **Navigate to Add-IP page**
   - Use the navigation link, don't force URL navigation
   - Verify the form loads completely

2. **Use Direct TestID Approach**
   - Fill title using `idea-title-input` testid
   - Fill description using `idea-description-input` testid
   - Upload file using `file-upload-input` testid
   - Click `create-idea-button` testid (NOT `set-terms-button`)

3. **Content Generation**
   - Generate unique, creative titles and descriptions
   - Include timestamp in content for tracking
   - Create appropriate file content related to the idea

4. **Progress Monitoring**
   - Track status messages during creation
   - Note all stages (uploading, minting, AI generation)
   - Record total time from submit to completion
   - Watch for redirects or completion indicators

5. **Success Verification**
   - Check if redirected to details page
   - Navigate to My Ideas list
   - Verify the new idea appears
   - Note any discrepancies

### Data Collection
For each idea, record:
- Idea number and timestamp
- Title and description used
- Start time
- Status messages observed
- Completion time (or timeout)
- Success/failure status
- Final URL (if redirected)
- Token ID (if available)

### Error Handling
- If creation seems stuck after 2 minutes, check My Ideas
- Document any error messages
- Note if idea appears to succeed but isn't in My Ideas (silent failure)
- Take screenshots of any unexpected states

### Output Format
Provide results as:
1. Summary table of all attempts
2. Detailed timeline for each idea
3. List of any issues encountered
4. Success rate calculation

### Important Notes
- Do NOT click "Set Sharing Terms" unless explicitly instructed
- Use React-friendly value setting (native property setters)
- Maintain connection to browser throughout test
- If connection drops, reconnect and note in results

## Example Usage
"Please run the add-ip automation test to create 3 ideas"

## Variations

### Performance Test
"Please run the add-ip automation test to create 5 ideas, focusing on timing data and system performance"

### Error Recovery Test  
"Please run the add-ip automation test to create 2 ideas, but disconnect and reconnect between them to test recovery"

### Batch Test
"Please run the add-ip automation test to create 10 ideas in rapid succession, with minimal delay between submissions"