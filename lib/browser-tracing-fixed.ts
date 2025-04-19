'use client'

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { Resource } from '@opentelemetry/resources'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { trace } from '@opentelemetry/api'

// Current resource attribute constants
const ATTR_SERVICE_NAME = 'service.name'
const ATTR_SERVICE_VERSION = 'service.version'
const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment'

let isInitialized = false

export function initBrowserTracing() {
  // Only run in browser and only initialize once
  if (typeof window === 'undefined' || isInitialized) {
    return
  }

  try {
    console.log('Initializing browser tracing')

    const serviceName = 'conciliate-app-frontend'

    // Create and configure the OpenTelemetry Web Tracer Provider
    const provider = new WebTracerProvider({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: serviceName,
        [ATTR_SERVICE_VERSION]: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
        [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      }),
    })

    // Configure trace exporter to send to your backend collector endpoint
    // In development, you can point directly to the collector if running locally
    const isDev = process.env.NODE_ENV === 'development'
    const collectorEndpoint = isDev
      ? 'http://localhost:4318/v1/traces' // Direct to collector in development
      : '/api/telemetry' // Proxy through API in production

    const exporter = new OTLPTraceExporter({
      url: collectorEndpoint,
    })

    // Add the span processor to batch and export spans
    provider.addSpanProcessor(new BatchSpanProcessor(exporter))

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
          ignoreUrls: [/localhost:3000\/api\/telemetry/],
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
    console.log('Browser tracing initialized')
  } catch (e) {
    console.error('Failed to initialize browser tracing:', e)
  }
}

// Create a tracer for use in the browser
export const browserTracer = trace.getTracer('conciliate-app-frontend')

// Helper to create client-side spans
export function createClientSpan(
  name: string,
  fn: () => void,
  attributes = {}
) {
  return browserTracer.startActiveSpan(name, (span) => {
    try {
      // Add attributes
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, String(value))
      })

      // Execute the function
      const result = fn()
      span.end()
      return result
    } catch (error) {
      span.recordException(error as Error)
      span.end()
      throw error
    }
  })
}

// Export a hook for React components
export function useTracing() {
  if (!isInitialized && typeof window !== 'undefined') {
    initBrowserTracing()
  }

  return {
    traceFunction: (name: string, fn: () => void, attributes = {}) => {
      return createClientSpan(name, fn, attributes)
    },
    tracePromise: async <T>(
      name: string,
      fn: () => Promise<T>,
      attributes = {}
    ): Promise<T> => {
      return browserTracer.startActiveSpan(name, async (span) => {
        try {
          // Add attributes
          Object.entries(attributes).forEach(([key, value]) => {
            span.setAttribute(key, String(value))
          })

          // Execute the function
          const result = await fn()
          span.end()
          return result
        } catch (error) {
          span.recordException(error as Error)
          span.end()
          throw error
        }
      })
    },
  }
}
