import { NextResponse, type NextRequest } from 'next/server'
import { withTracing } from '@/lib/apiWithTracing'
import { initAPIConfig } from '@/lib/apiUtils'
import {
  JsonRpcErrorCode,
  type MCPTool,
  type MCPResource,
  type MCPPrompt,
} from './types'

export const runtime = 'nodejs'

// Placeholder tools - to be replaced with actual implementations
const tools: Record<string, MCPTool> = {
  search_ideas: {
    description: 'Search for ideas',
    parameters: {
      query: { type: 'string', description: 'Search query' },
      domains: {
        type: 'array',
        description: 'Domains to filter by',
        items: { type: 'string' },
      },
    },
  },
  examine_idea: {
    description: 'Get idea details',
    parameters: {
      id: { type: 'string', description: 'Idea identifier' },
      access_level: {
        type: 'string',
        description: 'Access level',
        enum: ['preview', 'licensed'],
      },
    },
  },
}

// Placeholder resources - to be replaced with actual implementations
const resources: Record<string, MCPResource> = {
  idea_catalog: {
    description: 'Catalog of available IP ideas',
    resource_id: 'idea_catalog',
    mime_type: 'application/json',
  },
  idea_details: {
    description: 'Details about a specific idea',
    resource_id: 'idea/{id}',
    mime_type: 'application/json',
  },
}

// Placeholder prompts - to be replaced with actual implementations
const prompts: Record<string, MCPPrompt> = {
  idea_discovery: {
    description: 'Guide for discovering ideas',
    template: 'Find ideas for {problem_statement} in {domain}',
    parameters: {
      problem_statement: { type: 'string', description: 'Problem to solve' },
      domain: { type: 'string', description: 'Domain area' },
    },
  },
}

/**
 * MCP API Route Handler with full MCP support
 *
 * This implements a Model Context Protocol endpoint
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
          error: {
            code: JsonRpcErrorCode.INVALID_REQUEST,
            message: 'Invalid Request',
          },
          id: request.id ?? null,
        },
        { status: 400 }
      )
    }

    // Process methods based on the request
    switch (request.method) {
      case 'ping':
        // Handle ping method
        return NextResponse.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            status: 'ok',
            timestamp: Date.now(),
            version: '0.1.0',
          },
        })

      case 'initialize':
        // Handle initialize method
        return NextResponse.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            name: 'Conciliator MCP',
            version: '0.1.0',
            vendor: 'SafeIdea',
            capabilities: {
              methods: [
                'ping',
                'initialize',
                'listTools',
                'callTool',
                'listResources',
                'readResource',
                'listPrompts',
                'getPrompt',
              ],
              protocols: ['json-rpc-2.0'],
              contentTypes: ['application/json'],
              compression: ['none'],
            },
            extensions: [],
            environment: {
              runtime: 'Next.js',
            },
            timestamp: Date.now(),
          },
        })

      case 'listTools':
        // Handle listTools method - list available tools
        return NextResponse.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: Object.keys(tools),
          },
        })

      case 'callTool': {
        // Handle callTool method - validate params
        if (typeof request.params?.tool !== 'string') {
          return NextResponse.json(
            {
              jsonrpc: '2.0',
              error: {
                code: JsonRpcErrorCode.INVALID_PARAMS,
                message: 'Invalid params: tool name is required',
              },
              id: request.id,
            },
            { status: 400 }
          )
        }

        // Check if tool exists
        const toolName = request.params.tool
        if (!tools[toolName]) {
          return NextResponse.json(
            {
              jsonrpc: '2.0',
              error: {
                code: JsonRpcErrorCode.INVALID_PARAMS,
                message: `Tool not found: ${toolName}`,
              },
              id: request.id,
            },
            { status: 404 }
          )
        }

        // Return placeholder response for now
        return NextResponse.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            result: {
              status: 'ok',
              message: `Tool '${toolName}' called with placeholder implementation`,
              timestamp: Date.now(),
            },
          },
        })
      }

      case 'listResources':
        // Handle listResources method - list available resources
        return NextResponse.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            resources: Object.values(resources),
          },
        })

      case 'readResource':
        // Handle readResource method - validate params
        if (typeof request.params?.resource !== 'string') {
          return NextResponse.json(
            {
              jsonrpc: '2.0',
              error: {
                code: JsonRpcErrorCode.INVALID_PARAMS,
                message: 'Invalid params: resource identifier is required',
              },
              id: request.id,
            },
            { status: 400 }
          )
        }

        // For now, return a placeholder response
        return NextResponse.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: {
              status: 'ok',
              message: `Resource '${request.params.resource}' accessed with placeholder implementation`,
              timestamp: Date.now(),
            },
            mime_type: 'application/json',
          },
        })

      case 'listPrompts':
        // Handle listPrompts method - list available prompts
        return NextResponse.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            prompts: Object.keys(prompts),
          },
        })

      case 'getPrompt': {
        // Handle getPrompt method - validate params
        if (typeof request.params?.prompt !== 'string') {
          return NextResponse.json(
            {
              jsonrpc: '2.0',
              error: {
                code: JsonRpcErrorCode.INVALID_PARAMS,
                message: 'Invalid params: prompt identifier is required',
              },
              id: request.id,
            },
            { status: 400 }
          )
        }

        // Check if prompt exists
        const promptName = request.params.prompt
        if (!prompts[promptName]) {
          return NextResponse.json(
            {
              jsonrpc: '2.0',
              error: {
                code: JsonRpcErrorCode.INVALID_PARAMS,
                message: `Prompt not found: ${promptName}`,
              },
              id: request.id,
            },
            { status: 404 }
          )
        }

        // Return placeholder response
        return NextResponse.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: prompts[promptName].template,
            parameters: prompts[promptName].parameters,
          },
        })
      }

      default:
        // Handle any other method (not implemented)
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            error: {
              code: JsonRpcErrorCode.METHOD_NOT_FOUND,
              message: `Method not found: ${request.method}`,
            },
            id: request.id,
          },
          { status: 404 }
        )
    }
  } catch (error) {
    console.error('MCP API error:', error)

    // Handle parse errors (invalid JSON)
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: JsonRpcErrorCode.PARSE_ERROR,
          message: `Parse error: ${(error as Error).message}`,
        },
        id: null,
      },
      { status: 400 }
    )
  }
})
