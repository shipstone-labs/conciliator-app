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
      return new NextResponse(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : String(error),
        }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }
  }
}
