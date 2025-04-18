// Server-side only imports - these will never be bundled for the browser
import { NodeSDK } from '@opentelemetry/sdk-node'
// Use the HTTP exporter instead of the gRPC (proto) exporter to avoid protocol mismatches
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import {
  resourceFromAttributes,
  envDetector,
  processDetector,
  osDetector,
  defaultResource,
} from '@opentelemetry/resources'
// Import the GCP trace exporter
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter'

// Define attribute keys (standard, not deprecated)
const ATTR_SERVICE_NAME = 'service.name'
const ATTR_SERVICE_VERSION = 'service.version'
const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment'

// Global variable to track initialization state
let isInitialized = false
let sdk: NodeSDK | undefined

export async function initServerTracing() {
  // Skip if already initialized or running in a browser environment
  if (
    isInitialized ||
    typeof window !== 'undefined' ||
    (!process.env.OTEL_SERVICE_NAME && !process.env.GOOGLE_CLOUD_PROJECT)
  ) {
    console.log(
      'OpenTelemetry: SDK already initialized or not in server environment'
    )
    return
  }

  // Set flag early to prevent concurrent initialization attempts
  isInitialized = true

  console.log('OpenTelemetry: Initializing server instrumentation')

  // Use a more specific service name that will stand out in the Jaeger UI
  const tracingServiceName =
    process.env.NEXT_PUBLIC_SERVICE_NAME || 'conciliate-app-backend'

  // Configure the OTLP exporter - using HTTP protocol (port 4318) instead of gRPC (port 4317)
  // Then in your initialization code:
  // Choose the appropriate exporter based on environment
  const exporter = process.env.GOOGLE_CLOUD_PROJECT
    ? new TraceExporter({
        // The project ID is optional, it will use the default from the environment
        // if running on GCP, or from the credentials file
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
      })
    : new OTLPTraceExporter({
        url:
          process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
          'http://localhost:4318/v1/traces',
        headers: {
          // Add any required headers for authentication
        },
      })

  try {
    // Create resources by detecting and merging
    const baseResource = defaultResource()

    // The detectors are already instantiated - just call detect() directly
    const envResource = await envDetector.detect()
    const processResource = await processDetector.detect()
    const osResource = await osDetector.detect()

    // Create our custom resource with the service attributes
    const customResource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: tracingServiceName,
      [ATTR_SERVICE_VERSION]: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
      [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    })

    // Extract attributes from detected resources and create a new resource
    const allAttributes = {
      ...baseResource.attributes,
      ...envResource.attributes,
      ...processResource.attributes,
      ...osResource.attributes,
      ...customResource.attributes,
    }

    // Create a combined resource from all attributes
    const combinedResource = resourceFromAttributes(allAttributes)

    // Create a new SDK instance
    sdk = new NodeSDK({
      resource: combinedResource,
      spanProcessor: new SimpleSpanProcessor(exporter),
      instrumentations: [
        new HttpInstrumentation({
          ignoreIncomingRequestHook: (request) => {
            // Check if the path starts with '/_next/static'
            const url = request.url || ''
            return (
              url.startsWith('/_next/static') ||
              url.startsWith('/__nextjs-original-stack-frames')
            )
          },
        }),
        new ExpressInstrumentation(),
        // Note: gRPC instrumentation has been removed to avoid Node.js module dependencies issues
      ],
    })

    // Initialize the SDK
    await sdk.start()
    console.log(
      'OpenTelemetry: Server tracing initialized with attributes:',
      Object.fromEntries(
        Object.entries(combinedResource.attributes).filter(
          ([key]) => key.startsWith('service.') || key.startsWith('deployment.')
        )
      )
    )

    // Add shutdown hook to clean up resources
    process.on('SIGTERM', () => {
      if (sdk) {
        sdk
          .shutdown()
          .then(() => console.log('OpenTelemetry: Tracing terminated'))
          .catch((error) =>
            console.error('OpenTelemetry: Error terminating tracing', error)
          )
          .finally(() => process.exit(0))
      }
    })
  } catch (error) {
    console.error('OpenTelemetry: Error initializing tracing', error)
    // Reset initialization flag so we can try again later if needed
    isInitialized = false
  }
}
