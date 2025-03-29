import fs from 'fs';

// Make sure the dist directory exists
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

// Simple implementation for the Lilypad wrapper
const indexContent = `// Main entry point
// Simple implementation of Lilypad client wrapper

/**
 * Interface for Lilypad client
 * @typedef {Object} LilypadClient
 * @property {function(string): Promise<string>} generateImage - Generate an image from a prompt
 */

/**
 * Get a Lilypad client instance
 * @returns {LilypadClient} Lilypad client with generateImage method
 */
export function getLilypadClient() {
  return {
    /**
     * Generate an image from a prompt using Lilypad
     * @param {string} prompt - The text prompt to generate an image from
     * @returns {Promise<string>} URL or data URL of the generated image
     */
    async generateImage(prompt) {
      try {
        // This is a placeholder implementation
        // In a real implementation, this would call the actual Lilypad API
        console.log('Generating image with prompt:', prompt);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return a placeholder data URL (a 1x1 transparent pixel)
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      } catch (error) {
        console.error('Error generating image with Lilypad:', error);
        throw error;
      }
    }
  };
}

// Default export
export default { getLilypadClient };`;

// Write the index file
fs.writeFileSync('./dist/index.js', indexContent);

// Create TypeScript definition file
const dtsContent = `// Type definitions for lilypad-wrapper
export interface LilypadClient {
  /**
   * Generate an image from a prompt using Lilypad
   * @param prompt - The text prompt to generate an image from
   * @returns URL or data URL of the generated image
   */
  generateImage(prompt: string): Promise<string>;
}

/**
 * Get a Lilypad client instance
 * @returns Lilypad client with generateImage method
 */
export function getLilypadClient(): LilypadClient;

declare const _default: {
  getLilypadClient: typeof getLilypadClient;
};

export default _default;`;

// Write the TypeScript definition file
fs.writeFileSync('./dist/index.d.ts', dtsContent);

console.log('📦 Lilypad wrapper built successfully!');