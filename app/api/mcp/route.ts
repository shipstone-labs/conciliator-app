import { NextResponse, type NextRequest } from 'next/server'
import { withTracing } from '@/lib/apiWithTracing'
import { initAPIConfig } from '@/lib/apiUtils'

export const runtime = 'nodejs'

/**
 * MCP API Route Handler with basic ping support
 *
 * This implements a minimal Model Context Protocol endpoint
 * following the JSON-RPC 2.0 specification
 */
export const POST = withTracing(async (req: NextRequest) => {
  try {
    // Initialize API configuration
    await initAPIConfig()

    // Parse the request body
    const request = await req.json()

    // Validate JSON-RPC structure
    if (request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Invalid Request' },
          id: request.id ?? null,
        },
        { status: 400 }
      )
    }

    // Handle ping method
    if (request.method === 'ping') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          status: 'ok',
          timestamp: Date.now(),
          version: '0.1.0',
        },
      })
    }

    // Handle any other method (not implemented)
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`,
        },
        id: request.id,
      },
      { status: 404 }
    )
  } catch (error) {
    console.error('MCP API error:', error)

    // Handle parse errors (invalid JSON)
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: `Parse error: ${(error as Error).message}`,
        },
        id: null,
      },
      { status: 400 }
    )
  }
})
