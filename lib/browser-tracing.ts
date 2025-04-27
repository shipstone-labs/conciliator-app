'use client'

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { SpanStatusCode, trace } from '@opentelemetry/api'
import type { AppConfig } from './session'
import { useConfig } from '@/components/AuthLayout'

// Define attribute keys (standard, not deprecated)
const ATTR_SERVICE_NAME = 'service.name'
const ATTR_SERVICE_VERSION = 'service.version'
const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment'

let isInitialized = false

export function initBrowserTracing(config: AppConfig) {
  // Only run in browser and only initialize once
  if (typeof window === 'undefined' || isInitialized) {
    return
  }

  try {
    console.log('Initializing browser tracing')

    const serviceName =
      (config.SERVICE_NAME as string) || 'conciliate-app:unknown'

    // Create a custom resource with the service attributes
    const customResource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
      [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    })

    // Configure trace exporter to send to your backend collector endpoint
    // In development, you can point directly to the collector if running locally
    const isDev = process.env.NODE_ENV === 'development'
    const collectorEndpoint = isDev
      ? 'http://localhost:4318/v1/traces' // Direct to collector in development
      : `${window.location.origin}/api/telemetry` // Proxy through API in production

    const exporter = new OTLPTraceExporter({
      url: collectorEndpoint,
    })

    // Create and configure the OpenTelemetry Web Tracer Provider
    const provider = new WebTracerProvider({
      resource: customResource,
    })

    // Create and configure span processor - the method is different in v2.x
    const batchProcessor = new BatchSpanProcessor(exporter)

    // We need to get the internal tracer provider for v2.0.0
    // Using type assertion to suppress TypeScript errors
    const tracerProvider = provider as any
    if (
      tracerProvider._tracerProvider &&
      typeof tracerProvider._tracerProvider.addSpanProcessor === 'function'
    ) {
      tracerProvider._tracerProvider.addSpanProcessor(batchProcessor)
    } else {
      console.warn(
        'Could not add span processor - incompatible OpenTelemetry SDK version'
      )
    }

    // Set global propagator
    provider.register({
      contextManager: new ZoneContextManager(),
      propagator: new W3CTraceContextPropagator(),
    })

    // Register automatic instrumentations
    registerInstrumentations({
      instrumentations: [
        // Instrument fetch requests
        new FetchInstrumentation({
          ignoreUrls: [/\/api\/telemetry/],
          propagateTraceHeaderCorsUrls: [
            new RegExp(`${window.location.origin}.*`, 'g'),
          ],
          clearTimingResources: true,
        }),
        // Instrument user interactions (clicks, etc)
        new UserInteractionInstrumentation(),
        // Instrument page load
        new DocumentLoadInstrumentation(),
      ],
    })

    isInitialized = true
  } catch (e) {
    console.error('Failed to initialize browser tracing:', e)
  }
}

// Create a tracer for use in the browser
export const browserTracer = trace.getTracer('conciliate-app-frontend')

// Helper to create client-side spans
export function createClientSpan(
  name: string,
  fn?: () => void,
  attributes = {}
) {
  return browserTracer.startActiveSpan(name, (span) => {
    try {
      // Add attributes
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, String(value))
      })

      // Execute the function
      const result = fn?.()
      // Explicitly mark span as successful
      span.setStatus({ code: SpanStatusCode.OK })
      span.end()
      return result
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      })
      span.end()
      throw error
    }
  })
}

// Export a hook for React components
export function useTracing() {
  const config = useConfig()
  if (!isInitialized && typeof window !== 'undefined') {
    initBrowserTracing(config)
  }

  return {
    traceFunction: (name: string, fn?: () => void, attributes = {}) => {
      return createClientSpan(name, fn, attributes)
    },
    tracePromise: async <T>(
      name: string,
      fn?: () => Promise<T | undefined> | undefined,
      attributes = {}
    ): Promise<T | undefined> => {
      return browserTracer.startActiveSpan(name, async (span) => {
        try {
          // Add attributes
          Object.entries(attributes).forEach(([key, value]) => {
            span.setAttribute(key, String(value))
          })

          // Execute the function
          const result = await fn?.()
          // Explicitly mark span as successful
          span.setStatus({ code: SpanStatusCode.OK })
          span.end()
          return result
        } catch (error) {
          span.recordException(error as Error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          })
          span.end()
          throw error
        }
      })
    },
  }
}
