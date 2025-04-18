import { trace, SpanStatusCode, context } from '@opentelemetry/api';

// Create a tracer for our application
export const tracer = trace.getTracer('conciliate-app');

// Helper function to create a span around an async operation
export async function withTracing<T>(
  name: string,
  operation: () => Promise<T>,
  attributes: Record<string, string | number | boolean> = {}
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      // Add attributes to the span
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
      
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      // Handle and record errors properly
      console.error(`Error in span ${name}:`, error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

// Enhanced logger that also records logs as span events
export const logger = {
  debug: (message: string, data?: any) => {
    console.debug(message, data);
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.addEvent('debug', { message, ...(data ? { data: JSON.stringify(data) } : {}) });
    }
  },
  
  info: (message: string, data?: any) => {
    console.info(message, data);
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.addEvent('info', { message, ...(data ? { data: JSON.stringify(data) } : {}) });
    }
  },
  
  warn: (message: string, data?: any) => {
    console.warn(message, data);
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.addEvent('warning', { message, ...(data ? { data: JSON.stringify(data) } : {}) });
    }
  },
  
  error: (message: string, error?: Error | any) => {
    console.error(message, error);
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.addEvent('error', { 
        message,
        errorType: error?.constructor?.name,
        stack: error?.stack,
        details: error?.message || String(error)
      });
    }
  }
};

// Create a middleware for API routes to add tracing
export const tracingMiddleware = async (
  req: Request,
  handler: (req: Request) => Promise<Response>
): Promise<Response> => {
  const url = new URL(req.url);
  const spanName = `HTTP ${req.method} ${url.pathname}`;
  
  return withTracing(
    spanName,
    () => handler(req),
    {
      'http.method': req.method,
      'http.url': url.pathname,
      'http.host': url.host,
    }
  );
};

export default tracer;