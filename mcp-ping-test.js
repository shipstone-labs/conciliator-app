// Simple test script for MCP ping functionality
// This script demonstrates how the MCP ping would work
// without needing to run the full development server

/**
 * Simple MCP request handler - mimics the server implementation
 */
function handleMCPRequest(request) {
  console.log('Received request:', JSON.stringify(request, null, 2))

  // Validate JSON-RPC structure
  if (request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
    return {
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid Request' },
      id: request.id ?? null,
    }
  }

  // Handle ping method
  if (request.method === 'ping') {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        status: 'ok',
        timestamp: Date.now(),
        version: '0.1.0',
      },
    }
  }

  // Handle any other method (not implemented)
  return {
    jsonrpc: '2.0',
    error: {
      code: -32601,
      message: `Method not found: ${request.method}`,
    },
    id: request.id,
  }
}

// Test with some sample requests
const testRequests = [
  // Valid ping request
  {
    jsonrpc: '2.0',
    method: 'ping',
    id: 1,
  },

  // Invalid method
  {
    jsonrpc: '2.0',
    method: 'nonexistent_method',
    id: 2,
  },

  // Invalid request (missing jsonrpc field)
  {
    method: 'ping',
    id: 3,
  },
]

// Run the tests
console.log('=== MCP Ping Test ===\n')

testRequests.forEach((request, index) => {
  console.log(`\n----- Test ${index + 1} -----`)
  const response = handleMCPRequest(request)
  console.log('Response:', JSON.stringify(response, null, 2))
})

console.log('\n=== Test Complete ===')
