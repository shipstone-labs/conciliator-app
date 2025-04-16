// Mark this file as server-only
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Initialize server-side configuration for all routes
 * This is a utility function to be called in middleware or route handlers
 */
export async function initServerConfig() {
  // Import getServerConfig dynamically to ensure it's only loaded server-side
  const { getServerConfig } = await import('./getServerConfig')
  await getServerConfig()
  return true
}