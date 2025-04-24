// Default runtime to Node.js for all API routes that import this file
export const runtime = 'nodejs'

// Import the server config initialization function
import { getServerConfig } from './getServerConfig'
import { tracer, logFetchErrorToSpan, ROOT_CONTEXT } from './tracing'
import { context, SpanStatusCode, type trace } from '@opentelemetry/api'

/**
 * Initialize the server configuration for API routes
 * Call this at the beginning of API route handlers
 */
export async function initAPIConfig() {
  try {
    await getServerConfig()
    return true
  } catch (error) {
    console.error('Failed to initialize API config:', error)
    return false
  }
}

/**
 * Wraps fetch calls with OpenTelemetry tracing, automatically adding span attributes
 * and handling errors by logging them to the span.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param spanName - Optional custom span name (defaults to 'fetch url')
 * @param endSpan - Whether to end the span after fetch completes (defaults to false)
 * @param createRootSpan - Whether to create a root span (defaults to false)
 * @returns Promise with an object containing the response and the active span
 *
 * @example
 * ```typescript
 * // Basic usage
 * const { response } = await tracedFetch('https://api.example.com/data');
 *
 * // Access both response and span
 * const { response, span } = await tracedFetch(
 *   'https://api.example.com/data',
 *   { method: 'POST', body: JSON.stringify({ key: 'value' }) }
 * );
 * // Add custom attributes to the span
 * span.setAttribute('business.entity_id', entityId);
 * span.addEvent('process.complete', { timestamp: Date.now() });
 * span.end(); // Don't forget to end the span when you're done with it!
 *
 * // Or let the function end the span for you
 * const { response } = await tracedFetch(
 *   'https://api.example.com/data',
 *   { method: 'GET' },
 *   'fetch user data',
 *   true // This will automatically end the span
 * );
 *
 * // Create a root span for long-lived connections
 * const { response, span } = await tracedFetch(
 *   'wss://api.example.com/stream',
 *   // websocket options,
 *   'websocket stream connection',
 *   false,
 *   true // Create a root span not connected to parent context
 * );
 * ```
 */
export async function tracedFetch(
  url: string,
  options?: RequestInit,
  spanName?: string,
  endSpan = false,
  createRootSpan = false
): Promise<{ response: Response; span: ReturnType<typeof trace.getSpan> }> {
  const actualSpanName = spanName || `fetch ${new URL(url).pathname}`

  // Set up span attributes with service identification
  const attributes: Record<string, string | number | boolean> = {
    'http.url': url,
    'http.method': options?.method || 'GET',
    'service.name': process.env.SERVICE_NAME?.split(':')[0] || 'conciliate-app',
    'service.version': process.env.SERVICE_NAME?.split(':')[1] || '1.0.0',
  }

  return (await tracer.startActiveSpan(
    actualSpanName,
    { attributes },
    createRootSpan ? ROOT_CONTEXT : context.active(),
    async (span) => {
      try {
        // Attributes are already set when creating the span,
        // but we'll add any header details here

        // If there are headers, add them as attributes (excluding sensitive ones)
        if (options?.headers) {
          const headers = options.headers as Record<string, string>
          Object.entries(headers)
            .filter(
              ([key]) =>
                !key.toLowerCase().includes('authorization') &&
                !key.toLowerCase().includes('cookie') &&
                !key.toLowerCase().includes('token')
            )
            .forEach(([key, value]) => {
              span.setAttribute(
                `http.request.headers.${key.toLowerCase()}`,
                value
              )
            })
        }

        // Execute the fetch
        const response = await fetch(url, options)

        // Add response details to span
        span.setAttribute('http.status_code', response.status)
        span.setAttribute('http.status_text', response.statusText)

        // Handle error responses
        if (!response.ok) {
          // Clone the response so we can read the body without consuming it
          const responseClone = response.clone()

          try {
            // Try to read response body for error details
            const contentType = response.headers.get('content-type') || ''
            let errorDetails: string | Record<string, any> = ''

            if (contentType.includes('application/json')) {
              const errorJson = await responseClone.json()
              errorDetails = errorJson
              span.setAttribute(
                'error.details',
                JSON.stringify(errorDetails).substring(0, 1000)
              )
            } else {
              errorDetails = await responseClone.text()
              span.setAttribute(
                'error.details',
                errorDetails.substring(0, 1000)
              )
            }

            // Add the error event
            span.addEvent('fetch.error.response', {
              status: response.status,
              statusText: response.statusText,
              url,
              ...(typeof errorDetails === 'object'
                ? errorDetails
                : { message: errorDetails }),
            })

            // Set the span status to error
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP error ${response.status}: ${response.statusText}`,
            })
          } catch (parseError) {
            // If we couldn't parse the error response
            span.addEvent('fetch.error.parse_failed', {
              status: response.status,
              statusText: response.statusText,
              parseError: String(parseError),
            })

            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP error ${response.status}: ${response.statusText}`,
            })
          }
        } else {
          span.setStatus({ code: SpanStatusCode.OK })
        }

        // If endSpan is true, end the span now
        if (endSpan) {
          span.end()
        }

        // Return both response and span so caller can add more attributes or events
        return { response, span }
      } catch (error) {
        // For network/fetch errors, not HTTP status errors
        logFetchErrorToSpan(url, error, {
          method: options?.method || 'GET',
          headers: options?.headers
            ? JSON.stringify(options.headers)
            : undefined,
        })

        // Always end span on error to avoid leaks
        if (!endSpan) {
          span.end()
        }

        // Rethrow the error
        throw error
      }
    }
  )) as { response: Response; span: ReturnType<typeof trace.getSpan> }
}
