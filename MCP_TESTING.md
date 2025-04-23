# MCP Endpoint Testing Instructions

This document provides detailed instructions for testing the Model Context Protocol (MCP) endpoints implemented in the conciliator-app.

## Prerequisites
- Ensure the application is running locally with `pnpm dev`
- Navigate to the MCP test page at `http://localhost:3000/mcp-test` 
- Or test on the PR preview URL: `https://pr-95---conciliator-55rclsk2qa-uc.a.run.app/mcp-test`
- Open your browser's developer console (F12 or Cmd+Opt+I) to view detailed logs during testing

## Testing the `idea_catalog` Resource

### Using the MCP Test UI:
1. Go to the "Resources" tab
2. In the "Read Resource" section, ensure "idea_catalog" is entered in the input field
3. Click the "Read Resource" button
4. Verify in the response panel that you receive a JSON-RPC response containing real idea data from the database
5. The response should have this structure:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 123456789,
     "result": {
       "content": [
         {
           "name": "Example Idea",
           "description": "Description of the idea",
           ...
         },
         ...
       ],
       "mime_type": "application/json"
     }
   }
   ```

### Using cURL or Postman:
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "readResource",
    "params": {
      "resource": "idea_catalog"
    },
    "id": 1
  }'
```

### Verification Points:
- The response should contain real idea records from the database
- Each idea should have properties like name, description, tokenId, etc.
- The `mime_type` should be "application/json"
- Confirm there are no errors in the browser console or server logs

## Testing the `search_ideas` Tool

### Using the MCP Test UI:
1. Go to the "Tools" tab
2. In the "Call Tool" section, ensure "search_ideas" is entered in the input field
3. Click the "Call Tool" button to fetch all ideas (empty search)
4. Verify in the response panel that you receive a JSON-RPC response containing all ideas

5. To test search functionality, modify the request by clicking "Call Tool" again but enter this in the browser console first:
   ```javascript
   // This modifies the test page to include a search query
   // Run this in browser console before clicking "Call Tool"
   const toolButtons = Array.from(document.querySelectorAll('button'));
   const callToolButton = toolButtons.find(btn => btn.textContent.trim() === 'Call Tool');
   if (callToolButton) {
     callToolButton.onclick = function() {
       testMethod('callTool', {
         tool: 'search_ideas',
         arguments: {
           query: 'patent'  // Or any search term you expect to find
         }
       });
       return false;
     }
   }
   ```
6. Verify that only ideas containing "patent" in their name or description are returned

### Using cURL or Postman:
```bash
# Fetch all ideas (no query)
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "callTool",
    "params": {
      "tool": "search_ideas",
      "arguments": {}
    },
    "id": 1
  }'

# Search for specific ideas
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "callTool",
    "params": {
      "tool": "search_ideas",
      "arguments": {
        "query": "patent"
      }
    },
    "id": 1
  }'
```

### Verification Points:
- With no query, all ideas should be returned
- With a search query, only ideas matching the query in name or description should be returned
- The filtering should be case-insensitive
- Verify error handling by intentionally sending a malformed request:
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "2.0",
      "method": "callTool",
      "params": {
        "tool": "nonexistent_tool"
      },
      "id": 1
    }'
  ```
  This should return an appropriate error response with code -32602 (Invalid Params)

## Advanced Testing

### Error Handling:
- Test with invalid JSON-RPC formatting
- Test with missing required parameters
- Test with non-existent resources/tools

### Integration Testing:
- Verify the MCP endpoints integrate correctly with the database
- Check that the data returned matches what's available through the regular API endpoints

### Performance Testing:
- For large datasets, check response times
- Consider pagination or filtering options if the dataset grows substantially

## Debugging and Troubleshooting

### Using Console Logs

The MCP implementation includes detailed console logging to help with troubleshooting:

1. Open your browser's developer console while using the MCP test page
2. Look for logs prefixed with "MCP:" which trace the execution flow
3. For error cases, check for detailed error information including:
   - Error name
   - Error message
   - Full stack trace

Typical log flow for a successful request:
```
MCP: Processing search_ideas tool request
MCP: Getting Firestore reference
MCP: Querying ip collection
MCP: Retrieved XX documents
MCP: Processed XX unique ideas
```

### Common Issues

1. **No Data Returned**: 
   - Check console logs for connection errors
   - Verify Firebase configuration is correct
   - Ensure the 'ip' collection exists and contains documents

2. **Search Not Working**:
   - Verify the query parameter is being correctly passed
   - Check case sensitivity in your search terms
   - Examine the raw data to verify searchable content exists

3. **Error Responses**:
   - Most error responses include an error code and message
   - Check the JSON-RPC error code to understand the type of error:
     - `-32700`: Parse error (invalid JSON)
     - `-32600`: Invalid request
     - `-32601`: Method not found
     - `-32602`: Invalid params
     - `-32603`: Internal error
   - For internal errors, check server logs for more details

## Next Steps for Enhancement

Future enhancements to consider:
1. Add pagination support for large result sets
2. Implement more sophisticated search options (e.g., by domain, date range)
3. Add support for the remaining tools and resources with real data
4. Implement authentication and authorization for MCP endpoints
5. Enhance the test UI with parameter input forms for each tool