import {
  trace,
  SpanStatusCode,
  context,
  ROOT_CONTEXT,
} from '@opentelemetry/api'

// Get service name/version from environment or use defaults
const [serviceName, serviceVersion] = process.env.SERVICE_NAME?.split(':') || [
  'conciliate-app',
  '1.0.0',
]

// Create a tracer for our application
export const tracer = trace.getTracer(serviceName, serviceVersion)

// Export OpenTelemetry constants for convenience
export { SpanStatusCode, ROOT_CONTEXT }

// Helper function to create a span around an async operation
export async function withTracing<T>(
  name: string,
  operation: () => Promise<T>,
  attributes: Record<string, string | number | boolean> = {},
  options?: {
    root?: boolean // If true, creates a root span not connected to current context
  }
): Promise<T> {
  // Add service identification to all spans
  const spanAttributes = {
    'service.name': serviceName,
    'service.version': serviceVersion,
    ...attributes,
  }

  const spanOptions = {
    attributes: spanAttributes,
  }

  // Use the specified context or the current context
  const ctx = options?.root ? ROOT_CONTEXT : context.active()

  return tracer.startActiveSpan(name, spanOptions, ctx, async (span) => {
    try {
      // Add any additional attributes to the span (service ones already added above)
      Object.entries(attributes).forEach(([key, value]) => {
        if (!['service.name', 'service.version'].includes(key)) {
          span.setAttribute(key, value)
        }
      })

      const result = await operation()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      // Handle and record errors properly
      console.error(`Error in span ${name}:`, error)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      })
      throw error
    } finally {
      span.end()
    }
  })
}

// Enhanced logger that also records logs as span events
export const logger = {
  debug: (message: string, data?: any) => {
    console.debug(message, data)
    const currentSpan = trace.getActiveSpan()
    if (currentSpan) {
      currentSpan.addEvent('debug', {
        message,
        ...(data ? { data: JSON.stringify(data) } : {}),
      })
    }
  },

  info: (message: string, data?: any) => {
    console.info(message, data)
    const currentSpan = trace.getActiveSpan()
    if (currentSpan) {
      currentSpan.addEvent('info', {
        message,
        ...(data ? { data: JSON.stringify(data) } : {}),
      })
    }
  },

  warn: (message: string, data?: any) => {
    console.warn(message, data)
    const currentSpan = trace.getActiveSpan()
    if (currentSpan) {
      currentSpan.addEvent('warning', {
        message,
        ...(data ? { data: JSON.stringify(data) } : {}),
      })
    }
  },

  error: (message: string, error?: Error | any) => {
    console.error(message, error)
    const currentSpan = trace.getActiveSpan()
    if (currentSpan) {
      currentSpan.addEvent('error', {
        message,
        errorType: error?.constructor?.name,
        stack: error?.stack,
        details: error?.message || String(error),
      })
    }
  },
}

// Create a middleware for API routes to add tracing
export async function tracingMiddleware<T>(
  req: Request,
  callContext: T | undefined,
  handler: (req: Request, callContext?: T) => Promise<Response>
): Promise<Response> {
  const url = new URL(req.url)
  const spanName = `HTTP ${req.method} ${url.pathname}`

  return withTracing(spanName, () => handler(req, callContext), {
    'http.method': req.method,
    'http.url': url.pathname,
    'http.host': url.host,
  })
}

/**
 * Logs detailed fetch error information to the current active span.
 * This function can be called within a fetch catch block to attach detailed
 * error information to the current span.
 *
 * @param url - The URL that was being fetched
 * @param error - The error object from the catch block
 * @param requestDetails - Optional additional details about the request
 * @returns void
 *
 * @example
 * ```typescript
 * fetch(url, options)
 *   .then(response => response.json())
 *   .catch(error => {
 *     // Log the error to the current span
 *     logFetchErrorToSpan(url, error, { method: 'POST', body: JSON.stringify(data) });
 *     throw error;
 *   });
 * ```
 */
export function logFetchErrorToSpan(
  url: string,
  error: Error | unknown,
  requestDetails?: Record<string, any>
): void {
  const currentSpan = trace.getActiveSpan()

  if (!currentSpan) {
    // If there's no active span, just log to console
    console.error(`Fetch error for ${url}:`, error)
    return
  }

  // Mark the span as error
  currentSpan.setStatus({
    code: SpanStatusCode.ERROR,
    message: error instanceof Error ? error.message : String(error),
  })

  // Add error attributes to the span
  currentSpan.setAttribute('error', true)
  currentSpan.setAttribute(
    'error.type',
    error instanceof Error ? error.constructor.name : 'FetchError'
  )

  if (error instanceof Error) {
    currentSpan.setAttribute('error.message', error.message)
    if (error.stack) {
      currentSpan.setAttribute('error.stack', error.stack)
    }
  } else {
    currentSpan.setAttribute('error.message', String(error))
  }

  // Add request-specific attributes
  currentSpan.setAttribute('http.url', url)

  // Add the detailed error event to the span
  currentSpan.addEvent('fetch.error', {
    url,
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
    ...requestDetails,
  })

  // If it's a Response object (fetch API sometimes returns these as errors)
  if (error instanceof Response) {
    currentSpan.setAttribute('http.status_code', error.status)
    currentSpan.setAttribute('http.status_text', error.statusText)

    // Try to get response details if available
    error
      .text()
      .then((text) => {
        try {
          const parsed = JSON.parse(text)
          currentSpan.addEvent('fetch.error.response', {
            status: error.status,
            statusText: error.statusText,
            responseBody: JSON.stringify(parsed).substring(0, 1000), // Limit size
          })
        } catch {
          // If it's not JSON, add as plain text
          currentSpan.addEvent('fetch.error.response', {
            status: error.status,
            statusText: error.statusText,
            responseBody: text.substring(0, 1000), // Limit size
          })
        }
      })
      .catch((textError) => {
        // If we can't get the response text
        currentSpan.addEvent('fetch.error.response', {
          status: error.status,
          statusText: error.statusText,
          responseReadError: String(textError),
        })
      })
  }
}

/**
 * Utility function to add custom error data to the current active span.
 * Can be used anywhere in your application to enrich spans with error details.
 *
 * @param error - The error object or string message
 * @param context - Additional context information to include with the error
 * @returns boolean - Whether the error was successfully logged to a span
 *
 * @example
 * ```typescript
 * try {
 *   // Some operation that might fail
 *   await processData();
 * } catch (error) {
 *   // Log the error to the current span if one exists
 *   logErrorToCurrentSpan(error, {
 *     operation: 'processData',
 *     dataId: '12345',
 *     customData: someValue
 *   });
 *
 *   // Continue with error handling
 *   console.error('Failed to process data:', error);
 * }
 * ```
 */
export function logErrorToCurrentSpan(
  error: Error | unknown,
  context: Record<string, any> = {}
): boolean {
  const currentSpan = trace.getActiveSpan()

  if (!currentSpan) {
    return false
  }

  // Mark the span as error
  currentSpan.setStatus({
    code: SpanStatusCode.ERROR,
    message: error instanceof Error ? error.message : String(error),
  })

  // Add basic error attributes to the span
  currentSpan.setAttribute('error', true)
  currentSpan.setAttribute(
    'error.type',
    error instanceof Error ? error.constructor.name : typeof error
  )

  if (error instanceof Error) {
    currentSpan.setAttribute('error.message', error.message)
    if (error.stack) {
      currentSpan.setAttribute('error.stack', error.stack)
    }
  } else {
    currentSpan.setAttribute('error.message', String(error))
  }

  // Add detailed error event with context
  currentSpan.addEvent('error', {
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
    timestamp: Date.now(),
    ...context,
  })

  return true
}

/**
 * Creates a new detached root span that is not connected to the current context.
 * This is useful for operations that outlive the request-response cycle,
 * such as long-lived connections, background operations, or periodic tasks.
 *
 * @param name - Name of the span
 * @param attributes - Optional span attributes
 * @returns The created span (must be manually ended)
 *
 * @example
 * ```typescript
 * // Create a root span for a websocket connection
 * const wsSpan = createRootSpan('websocket-connection', { 'destination': 'wss://example.com/socket' });
 *
 * // Set up a websocket
 * const ws = new WebSocket('wss://example.com/socket');
 *
 * ws.onopen = () => {
 *   wsSpan.addEvent('websocket.open');
 * };
 *
 * ws.onmessage = (event) => {
 *   // For important events, create child spans of the root span
 *   tracer.startActiveSpan('process-websocket-message',
 *     { attributes: { 'message.type': event.type } },
 *     trace.setSpan(ROOT_CONTEXT, wsSpan),
 *     async (childSpan) => {
 *       try {
 *         // Process the message
 *         await processMessage(event.data);
 *         childSpan.setStatus({ code: SpanStatusCode.OK });
 *       } catch (error) {
 *         childSpan.setStatus({
 *           code: SpanStatusCode.ERROR,
 *           message: error instanceof Error ? error.message : String(error)
 *         });
 *       } finally {
 *         childSpan.end();
 *       }
 *     }
 *   );
 * };
 *
 * ws.onerror = (error) => {
 *   wsSpan.setStatus({
 *     code: SpanStatusCode.ERROR,
 *     message: String(error)
 *   });
 *   wsSpan.end(); // End the span on error
 * };
 *
 * ws.onclose = () => {
 *   wsSpan.addEvent('websocket.close');
 *   wsSpan.end(); // End the span when connection closes
 * };
 * ```
 */
export function createRootSpan(
  name: string,
  attributes: Record<string, string | number | boolean> = {}
) {
  // Always add service identification to root spans
  const spanAttributes = {
    'service.name': serviceName,
    'service.version': serviceVersion,
    ...attributes,
  }

  return tracer.startSpan(name, { attributes: spanAttributes }, ROOT_CONTEXT)
}

export default tracer
