import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Initialize Firebase
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Reloads environment variables from the specified .env file
 * @param path Path to the .env file (defaults to /env/.env)
 * @returns Promise that resolves when the environment is reloaded
 */
export async function reloadEnvironment(path: string = '/env/.env'): Promise<void> {
  try {
    // Dynamic import to avoid bundling dotenv in client
    const dotenv = await import('dotenv');
    
    // Force reload the .env file
    dotenv.config({ path, override: true });
    
    console.log(`Environment variables reloaded from ${path}`);
    
    // Clear any cached configs
    global.__ENV_LAST_RELOAD = Date.now();
    
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to reload environment variables:', error);
    return Promise.reject(error);
  }
}
