import { NextResponse, type NextRequest } from 'next/server'
import { withTracing } from '@/lib/apiWithTracing'
import { initAPIConfig } from '@/lib/apiUtils'

export const runtime = 'nodejs'

// MCP response type following JSON-RPC 2.0 spec
type MCPResponse = {
  jsonrpc: "2.0"
  id: string | number | null
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

// Available MCP methods
enum MCPMethod {
  INITIALIZE = "initialize",
  PING = "ping"
}

/**
 * Handle MCP Ping method - simple connectivity test
 */
function handlePing(): { status: string, timestamp: number } {
  return {
    status: "ok",
    timestamp: Date.now()
  }
}

/**
 * Handle MCP Initialize method - returns capabilities
 */
function handleInitialize(): { capabilities: Record<string, boolean> } {
  return {
    capabilities: {
      ping: true,
      // We'll add more capabilities as we implement them
      tools: false,
      resources: false,
      prompts: false
    }
  }
}

/**
 * Main MCP request handler
 */
async function handleMCPRequest(request: Record<string, any>): Promise<MCPResponse> {
  // Validate JSON-RPC structure
  if (request.jsonrpc !== "2.0" || typeof request.method !== 'string') {
    return {
      jsonrpc: "2.0",
      error: { code: -32600, message: "Invalid Request" },
      id: request.id ?? null
    }
  }

  // Prepare response object
  const response: MCPResponse = {
    jsonrpc: "2.0",
    id: request.id
  }

  try {
    // Route to appropriate method handler
    switch (request.method) {
      case MCPMethod.INITIALIZE:
        response.result = handleInitialize()
        break
      
      case MCPMethod.PING:
        response.result = handlePing()
        break
      
      default:
        response.error = { 
          code: -32601, 
          message: `Method not found: ${request.method}` 
        }
    }
  } catch (err) {
    console.error('MCP method error:', err)
    response.error = { 
      code: -32603, 
      message: `Internal error: ${(err as Error).message}` 
    }
  }

  return response
}

/**
 * MCP API Route Handler
 */
export const POST = withTracing(async (req: NextRequest) => {
  try {
    // Initialize API configuration
    await initAPIConfig()
    
    // Parse the request body
    const requestBody = await req.json()
    
    // Process the MCP request
    const response = await handleMCPRequest(requestBody)
    
    // Return the response
    return NextResponse.json(response, {
      status: response.error ? 400 : 200
    })
  } catch (error) {
    console.error('MCP API error:', error)
    
    // Handle parse errors (invalid JSON)
    return NextResponse.json({
      jsonrpc: "2.0",
      error: { 
        code: -32700, 
        message: `Parse error: ${(error as Error).message}` 
      },
      id: null
    }, { status: 400 })
  }
})