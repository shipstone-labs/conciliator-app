/**
 * HYDRATION DEBUG LOGGING SYSTEM
 * 
 * Temporary utility for tracking component rendering to debug React hydration errors.
 */

// Set to false to disable all logging
export const DEBUG_HYDRATION = true;

// Track components that have been logged to reduce noise
const loggedComponents = new Set<string>();

/**
 * Log hydration-related information with consistent formatting
 * 
 * @param componentName - Name of the component being logged
 * @param phase - Lifecycle phase ("init", "render", "effect", "unmount")
 * @param props - Optional additional information to log
 * @param oncePerComponent - If true, only log once per component+phase
 */
export function logHydration(
  componentName: string,
  phase = "render",
  props?: Record<string, any>,
  oncePerComponent = false
) {
  if (!DEBUG_HYDRATION) return;
  
  // Create unique key for this component+phase
  const logKey = `${componentName}:${phase}`;
  
  // Skip if already logged and oncePerComponent is true
  if (oncePerComponent && loggedComponents.has(logKey)) return;
  
  // Mark as logged
  if (oncePerComponent) {
    loggedComponents.add(logKey);
  }
  
  const environment = typeof window === "undefined" ? "SERVER" : "CLIENT";
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // Just time HH:MM:SS
  const logPrefix = `[HYDRATION][${timestamp}][${environment}][${componentName}][${phase}]`;
  
  if (props) {
    console.log(logPrefix, props);
  } else {
    console.log(logPrefix);
  }
}

/**
 * REMOVAL INSTRUCTIONS
 * 
 * Once hydration issues are resolved:
 * 
 * 1. Set DEBUG_HYDRATION to false to temporarily disable logging
 * 2. Create a branch for removal
 * 3. Run these commands to remove all logging:
 * 
 * # Find files with logHydration
 * grep -r "logHydration" --include="*.tsx" --include="*.ts" ./
 * 
 * # Remove import statements
 * find . -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' '/import.*debugUtils/d'
 * 
 * # Remove logHydration calls
 * find . -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' '/logHydration(/d'
 * 
 * 4. Remove this debugUtils.ts file
 * 5. Test thoroughly
 */