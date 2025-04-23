import { NextResponse, type NextRequest } from 'next/server'
import { withTracing } from '@/lib/apiWithTracing'
import { initAPIConfig } from '@/lib/apiUtils'
import { getFirestore } from '../firebase'
import { castToUIDoc, type IPDoc } from '@/lib/types'
import {
  JsonRpcErrorCode,
  type MCPTool,
  type MCPResource,
  type MCPPrompt,
} from './types'

export const runtime = 'nodejs'

// MCP tools with implementation
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

// MCP resources with implementation
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

async function getAllIdeas() {
  const fb = getFirestore()
  console.log('MCP: Querying ip collection')
  const doc = await fb
    .collection('ip')
    .orderBy('createdAt', 'desc')
    .select(
      'name',
      'description',
      'createdAt',
      'metadata',
      'terms',
      'tags',
      'image'
    )
    .get()
    .catch((error) => {
      console.error('MCP: Firestore query error', error)
      throw error
    })

  console.log(`MCP: Retrieved ${doc.docs.length} documents`)

  return doc.docs.map((d) => {
    return { id: d.id, ...d.data() }
  })
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

        // Handle search_ideas tool
        if (toolName === 'search_ideas') {
          try {
            console.log('MCP: Processing search_ideas tool request')

            // Get the search query if provided
            const query = request.params.arguments?.query || ''

            // Access Firestore directly following the app's existing pattern
            // This matches the implementation in /app/doc/[id]/route.ts which
            // successfully accesses Firestore without authentication
            console.log('MCP: Getting Firestore reference')

            const allIdeas = await getAllIdeas()

            // If no query, return all ideas
            if (!query) {
              return NextResponse.json({
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  result: allIdeas,
                },
              })
            }

            // Simple filtering on client side
            const searchTerms = query.toLowerCase()
            const filteredIdeas = allIdeas.filter((idea: any) => {
              const name = idea.name || ''
              const description = idea.description || ''

              return (
                name.toLowerCase().includes(searchTerms) ||
                description.toLowerCase().includes(searchTerms)
              )
            })

            return NextResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                result: filteredIdeas,
              },
            })
          } catch (error) {
            console.error('Error in search_ideas tool:', error)
            // Log detailed error information
            if (error instanceof Error) {
              console.error('Error name:', error.name)
              console.error('Error message:', error.message)
              console.error('Error stack:', error.stack)
            }

            return NextResponse.json(
              {
                jsonrpc: '2.0',
                error: {
                  code: JsonRpcErrorCode.INTERNAL_ERROR,
                  message: `Error searching ideas: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
                id: request.id,
              },
              { status: 500 }
            )
          }
        }

        // For other tools, return placeholder response
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

        // Handle idea_catalog resource - fetch real data
        if (request.params.resource === 'idea_catalog') {
          try {
            console.log('MCP: Processing idea_catalog resource request')

            const ideas = await getAllIdeas()

            // Return the list of ideas
            return NextResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: ideas,
                mime_type: 'application/json',
              },
            })
          } catch (error) {
            console.error('Error accessing idea_catalog:', error)
            // Log detailed error information
            if (error instanceof Error) {
              console.error('Error name:', error.name)
              console.error('Error message:', error.message)
              console.error('Error stack:', error.stack)
            }

            return NextResponse.json(
              {
                jsonrpc: '2.0',
                error: {
                  code: JsonRpcErrorCode.INTERNAL_ERROR,
                  message: `Error accessing idea catalog: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
                id: request.id,
              },
              { status: 500 }
            )
          }
        }

        // Handle idea/{id} resource pattern
        if (request.params.resource.startsWith('idea/')) {
          try {
            // Extract the idea ID
            const actualDocId = request.params.resource.split('/')[1]

            console.log(`MCP: Processing idea/${actualDocId} resource request`)

            console.log('MCP: Getting Firestore reference')
            const fb = getFirestore()

            console.log(`MCP: Fetching document ip/${actualDocId}`)
            // Use the native Firestore from admin SDK
            const docRef = fb.collection('ip').doc(actualDocId)
            const snapshot = await docRef.get()

            if (!snapshot.exists) {
              console.log(`MCP: Document not found for id=${actualDocId}`)
              return NextResponse.json(
                {
                  jsonrpc: '2.0',
                  error: {
                    code: JsonRpcErrorCode.INVALID_PARAMS,
                    message: `Idea not found: ${actualDocId}`,
                  },
                  id: request.id,
                },
                { status: 404 }
              )
            }

            // Format data using same casting function used in the app
            const data = snapshot.data()
            const ideaData = castToUIDoc({
              ...data,
              id: snapshot.id,
            } as IPDoc)

            console.log(`MCP: Successfully retrieved idea/${actualDocId}`)

            // Return the idea data
            return NextResponse.json({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: ideaData,
                mime_type: 'application/json',
              },
            })
          } catch (error) {
            console.error('MCP: Error fetching idea details:', error)
            // Log detailed error information
            if (error instanceof Error) {
              console.error('Error name:', error.name)
              console.error('Error message:', error.message)
              console.error('Error stack:', error.stack)
            }

            return NextResponse.json(
              {
                jsonrpc: '2.0',
                error: {
                  code: JsonRpcErrorCode.INTERNAL_ERROR,
                  message: `Error accessing idea details: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
                id: request.id,
              },
              { status: 500 }
            )
          }
        }

        // For other resources, return a placeholder response for now
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
