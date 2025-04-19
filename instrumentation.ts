export const runtime = 'nodejs'
// Simple instrumentation module for Next.js
// Next.js automatically loads this file in server environments

/**
 * This is the required export for Next.js instrumentation.
 * This will only be executed on the server side.
 */
export async function register() {
  // Safety check to prevent browser execution
  if (typeof window !== 'undefined') {
    console.log(
      'OpenTelemetry: Skipping instrumentation in browser environment'
    )
    return
  }

  try {
    // We need to ensure we're not importing any browser-incompatible code here
    // Dynamically import the server-side tracing module - making sure it's not bundled for the browser
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const { initAPIConfig } = await import('./lib/apiUtils')
      await initAPIConfig()
      const { initServerTracing } = await import('./lib/server-tracing')
      await initServerTracing()
    } else {
      console.log('OpenTelemetry: Not initializing with non-nodejs runtime')
    }
  } catch (err) {
    console.error(
      'OpenTelemetry: Failed to initialize server instrumentation:',
      err
    )
  }
}

// This default export is required for Next.js instrumentation
export default register
