import { tracingMiddleware } from './tracing'
import { type NextRequest, NextResponse } from 'next/server'

// Higher-order function to wrap API route handlers with tracing
export function withAPITracing<T>(
  handler: (
    req: NextRequest,
    context: T
  ) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest, context: T): Promise<NextResponse> => {
    try {
      return (await tracingMiddleware<T>(
        req,
        context,
        handler as any
      )) as NextResponse
    } catch (error) {
      console.error('API handler error:', error)

      // Extract any available error details
      const errorObj = error as {
        message?: string
        status?: number
        name?: string
        request_id?: string
      }

      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            message: errorObj.message || 'Internal Server Error',
            code: errorObj.name || 'INTERNAL_ERROR',
            request_id: errorObj.request_id,
            status: errorObj.status || 500,
            details: error instanceof Error ? error.stack : undefined,
          },
        }),
        {
          status: errorObj.status || 500,
          headers: { 'content-type': 'application/json' },
        }
      )
    }
  }
}
