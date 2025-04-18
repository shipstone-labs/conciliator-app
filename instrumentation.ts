// Simple instrumentation module for Next.js
// Next.js automatically loads this file in server environments

/**
 * This is the required export for Next.js instrumentation.
 * This will only be executed on the server side.
 */
export async function register() {
  // Safety check to prevent browser execution
  if (typeof window !== 'undefined') {
    console.log('OpenTelemetry: Skipping instrumentation in browser environment');
    return;
  }
  
  try {
    // Use a regular dynamic import
    // Next.js should handle this correctly in server environments
    const { initServerTracing } = await import('./lib/server-tracing');
    await initServerTracing();
  } catch (err) {
    console.error('OpenTelemetry: Failed to initialize server instrumentation:', err);
  }
}

// This default export is required for Next.js instrumentation
export default register;