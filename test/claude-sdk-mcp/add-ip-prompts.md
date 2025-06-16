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
   - Generate unique, creative titles and descriptions that are appropriate in format as patent applications or trade secrets
   - Do NOT include timestamps in titles
   - Create appropriate file content related to the idea

4. **Progress Monitoring**
   - After clicking create button, manually check status at:
     * 15 seconds
     * 30 seconds
     * 45 seconds
     * 60 seconds
     * 90 seconds
     * 2 minutes
     * 3 minutes
     * 5 minutes
     * 7 minutes (final check)
   - At each checkpoint, record what stage is visible:
     * "Creating Your Idea Page..." 
     * "Uploading your file to IPFS"
     * "Minting your NFT" (note token ID if shown)
     * "AI is generating..." 
     * Redirected to /details/[id] (SUCCESS - record full URL)
   - Build timeline from these snapshots
   - Record total time from create button click to redirect
   - Continue to next IP after redirect or 7-minute timeout

5. **Success Verification**
   - Continue providing real-time console updates during creation
   - SUCCESS: Redirected to /details/[id] page
   - FAILURE: No redirect after 7 minutes
   - Compile final summary report only after ALL IPs are processed
   - Include timing breakdowns for each IP in final report

### Data Collection
For each idea, record:
- Idea number and timestamp
- Title and description used
- Start time (when create button clicked)
- Status progression timeline:
  * 15s: [status observed]
  * 30s: [status observed]
  * 45s: [status observed]
  * etc...
- Total time from click to completion: X seconds
- Success/failure status (SUCCESS = redirected, FAILURE = 7-min timeout)
- Final details page URL: https://safeidea.net/details/[id]
- Token ID (if observed during minting)

### Error Handling
- If creation seems stuck after 2 minutes, check My Ideas
- Document any error messages
- Note if idea appears to succeed but isn't in My Ideas (silent failure)
- Take screenshots of any unexpected states

### Output Format
After all IPs are processed, provide final report with:
1. Summary table showing:
   - IP # | Title | Status | Total Time | Details URL
2. Detailed timing progression for each IP:
   - 15s: [stage]
   - 30s: [stage]
   - 45s: [stage]
   - When each transition occurred
   - Total time: X seconds
3. Overall success rate (X out of Y)
4. List of any issues or failures

### Important Notes
- Do NOT click "Set Sharing Terms" unless explicitly instructed
- Use React-friendly value setting (native property setters)
- Maintain connection to browser throughout test
- If connection drops, reconnect and note in results
- Session timeouts are common - recommended batch size is 3-5 IPs
- Average successful creation time: 2-3 minutes
- Most creations showing "Creating Your Idea Page" for 60+ seconds still succeed

## Example Usage
"Please run the add-ip automation test to create 3 ideas"

## Variations

### Performance Test
"Please run the add-ip automation test to create 5 ideas, focusing on timing data and system performance"

### Error Recovery Test  
"Please run the add-ip automation test to create 2 ideas, but disconnect and reconnect between them to test recovery"

### Batch Test
"Please run the add-ip automation test to create 10 ideas in rapid succession, with minimal delay between submissions"