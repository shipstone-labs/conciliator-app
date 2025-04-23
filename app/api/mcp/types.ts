/**
 * MCP type definitions for the JSON-RPC 2.0 based API
 */

// JSON-RPC 2.0 Request
export interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: any
  id: number | string
}

// JSON-RPC 2.0 Success Response
export interface JsonRpcSuccessResponse {
  jsonrpc: '2.0'
  result: any
  id: number | string
}

// JSON-RPC 2.0 Error Response
export interface JsonRpcErrorResponse {
  jsonrpc: '2.0'
  error: {
    code: number
    message: string
    data?: any
  }
  id: number | string | null
}

// JSON-RPC 2.0 Response (either success or error)
export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse

// MCP Tool definition
export interface MCPTool {
  description: string
  parameters: Record<
    string,
    {
      type: string
      description: string
      enum?: string[]
      items?: {
        type: string
      }
    }
  >
}

// MCP Resource definition
export interface MCPResource {
  description: string
  resource_id: string
  mime_type: string
}

// MCP Prompt definition
export interface MCPPrompt {
  description: string
  template: string
  parameters: Record<
    string,
    {
      type: string
      description: string
    }
  >
}

// Error codes per JSON-RPC 2.0 specification
export enum JsonRpcErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  // -32000 to -32099 are reserved for implementation-defined server errors
  SERVER_ERROR = -32000,
}
