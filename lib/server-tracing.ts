// Server-side only imports - these will never be bundled for the browser
import { NodeSDK } from '@opentelemetry/sdk-node'
// Use the HTTP exporter instead of the gRPC (proto) exporter to avoid protocol mismatches
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
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
// We need to do a try/catch import for the gRPC instrumentation
// to handle cases where the module can't be loaded
let GrpcInstrumentation: any

async function isRunningInGCP() {
  if (process.env.FORCE_GCP_FOR_TESTING) {
    return true
  }
  try {
    const response = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/id',
      { headers: { 'Metadata-Flavor': 'Google' } }
    )
    return response.ok
  } catch {
    return false
  }
}

export const runtime = 'nodejs'

// Define attribute keys (standard, not deprecated)
const ATTR_SERVICE_NAME = 'service.name'
const ATTR_SERVICE_VERSION = 'service.version'
const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment'

// Global variable to track initialization state
let isInitialized = false
let sdk: NodeSDK | undefined

export async function initServerTracing() {
  // Skip if already initialized or running in a browser environment
  if (isInitialized) {
    return
  }
  if (isInitialized || typeof window !== 'undefined') {
    console.log(
      'OpenTelemetry: SDK already initialized or not in server environment'
    )
    return
  }
  console.log('OpenTelemetry: Initializing server tracing')

  // Set flag early to prevent concurrent initialization attempts
  isInitialized = true

  const isGCP = await isRunningInGCP()
  console.log('OpenTelemetry: Initializing server instrumentation')

  // Try to dynamically import the gRPC instrumentation
  try {
    if (isGCP) {
      // We use dynamic import to ensure this only happens on the server side
      const grpcModule = await import('@opentelemetry/instrumentation-grpc')
      GrpcInstrumentation = grpcModule.GrpcInstrumentation
      console.log('OpenTelemetry: Successfully loaded gRPC instrumentation')
    }
  } catch (error) {
    console.warn(
      'OpenTelemetry: gRPC instrumentation could not be loaded',
      error
    )
    // We'll continue without gRPC instrumentation
  }

  // Configure the OTLP exporter - using HTTP protocol (port 4318) instead of gRPC (port 4317)
  // Then in your initialization code:
  // Choose the appropriate exporter based on environment
  const exporter = isGCP
    ? new TraceExporter()
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

    const [tracingServiceName, tracingServiceVersion] =
      process.env.SERVICE_NAME?.split(':') || [
        'conciliate-app-backend',
        'unknown',
      ]
    // Create our custom resource with the service attributes
    const customResource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: tracingServiceName,
      [ATTR_SERVICE_VERSION]: tracingServiceVersion,
      [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      'service.namespace': `${tracingServiceName}:${tracingServiceVersion}`,
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

    // Create the instrumentations array
    const instrumentations = [
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
    ]

    // Add gRPC instrumentation if available
    if (GrpcInstrumentation) {
      instrumentations.push(new GrpcInstrumentation())
      console.log('OpenTelemetry: Added gRPC instrumentation')
    }

    // Create a span processor that adds key attributes before exporting
    const spanProcessor = new BatchSpanProcessor(exporter, {
      // Use a batch span processor for better performance
      maxQueueSize: 1000,
      scheduledDelayMillis: 5000,
      exportTimeoutMillis: 30000,
      maxExportBatchSize: 100,
    })

    // Create a new SDK instance
    sdk = new NodeSDK({
      resource: combinedResource,
      serviceName: `${tracingServiceName}:${tracingServiceVersion}`,
      spanProcessors: [spanProcessor],
      traceExporter: exporter,
      instrumentations,
    })

    // Initialize the SDK
    sdk.start()
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
