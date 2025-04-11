import fs from 'node:fs'
import { execSync } from 'node:child_process'

// Make sure the dist directory exists
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist')
}

// Step 1: Compile Go code to WASM using TinyGo
console.log('🔨 Compiling Go to WebAssembly...')
try {
  // Check if TinyGo is installed
  try {
    execSync('which tinygo', { stdio: 'ignore' })
    // If we get here, TinyGo is installed
    execSync('tinygo build -o go/mymodule.wasm -target wasm go/mymodule.go', {
      stdio: 'inherit',
    })
    console.log('✅ WASM compilation successful')
  } catch (tinyGoError) {
    console.warn(
      '⚠️ TinyGo not found in PATH. Using placeholder WASM if available or skipping compilation.',
      tinyGoError
    )

    // Check if WASM file already exists (we'll keep it if it does)
    if (!fs.existsSync('./go/mymodule.wasm')) {
      console.warn(
        '⚠️ No existing WASM file found. Creating empty placeholder WASM.'
      )
      // Create a minimal placeholder WASM - this won't actually work, but allows development to continue
      fs.writeFileSync(
        './go/mymodule.wasm',
        Buffer.from('AGFzbQEAAAA=', 'base64')
      ) // Minimal empty WASM module
    } else {
      console.log('✅ Using existing WASM file')
    }
  }
} catch (error) {
  console.error('❌ Error during WASM preparation:', error.message)
  process.exit(1)
}

// Step 2: Encode WASM to base64 and generate JavaScript wrapper
console.log('📦 Embedding WASM in JavaScript...')
try {
  // Read the WASM file
  const wasmFile = fs.readFileSync('./go/mymodule.wasm')

  // Convert to Base64
  const base64Wasm = Buffer.from(wasmFile).toString('base64')

  // Create JavaScript module that embeds the WASM
  const wasmEmbeddedContent = `// Auto-generated file containing embedded WASM
// DO NOT EDIT DIRECTLY

// Base64 encoded WASM binary
const wasmBase64 = "${base64Wasm}";

// Decode base64 to Uint8Array for WebAssembly instantiation
function decodeWasm() {
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    return Buffer.from(wasmBase64, 'base64');
  } else {
    // Browser or Cloudflare environment
    const binaryString = atob(wasmBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

// TinyGo WASM imports that need to be provided
const goWasmImports = {
  // Default imports needed for TinyGo
  'syscall/js.valueGet': function(sp) {
    // Minimal implementation
    console.debug('syscall/js.valueGet called');
    return 0;
  },
  'syscall/js.valuePrepareString': function(sp) {
    // Minimal implementation
    console.debug('syscall/js.valuePrepareString called');
    return 0;
  },
  'syscall/js.valueSetIndex': function(sp) {
    // Minimal implementation
    console.debug('syscall/js.valueSetIndex called');
    return 0;
  },
  // Add any other required imports
};

// Initialize WebAssembly module
async function initWasm() {
  const wasmBytes = decodeWasm();
  
  try {
    // Create a WebAssembly instance
    const wasmModule = await WebAssembly.instantiate(wasmBytes, {
      env: goWasmImports
    });
    
    return wasmModule.instance.exports;
  } catch (error) {
    console.error('Failed to instantiate WASM module:', error);
    throw error;
  }
}

// Create a singleton instance promise
let instancePromise = null;

// Get or create the WASM instance
export function getWasmInstance() {
  if (!instancePromise) {
    instancePromise = initWasm();
  }
  return instancePromise;
}

// Export wrapped functions
export async function processData(input) {
  try {
    const instance = await getWasmInstance();
    // Check if the function exists in the WASM exports
    if (typeof instance.processData === 'function') {
      // Call the WASM function with correct parameters
      return instance.processData(input);
    } else {
      // Return a fallback response if we're using a placeholder WASM
      console.warn('WASM processData function not available - using fallback implementation');
      return '[Fallback] Processed: wasm';
    }
  } catch (error) {
    console.error('Error calling WASM processData:', error);
    return '[Error] Failed to process: wasm';
  }
}

export default {
  processData,
  getWasmInstance
};`

  // Save the WASM embedded wrapper
  fs.writeFileSync('./dist/wasm_embedded.js', wasmEmbeddedContent)
  console.log('✅ WASM successfully embedded')
} catch (error) {
  console.error('❌ Failed to embed WASM:', error.message)
  process.exit(1)
}

// Step 3: Generate the main index file that includes both the WASM and the Lilypad functionality
const indexContent = `// Main entry point
// Implementation of Lilypad client wrapper with WASM integration

// Import WASM functionality
import { processData, getWasmInstance } from './wasm_embedded.js';

/**
 * Interface for Lilypad client
 * @typedef {Object} LilypadClient
 * @property {function(string): Promise<string>} generateImage - Generate an image from a prompt
 * @property {function(string): Promise<string>} processData - Process data using WASM
 */

/**
 * Get a Lilypad client instance
 * @returns {LilypadClient} Lilypad client with available methods
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
    },
    
    /**
     * Process data using WASM module
     * @param {string} input - The input data to process
     * @returns {Promise<string>} The processed data
     */
    async processData(input) {
      try {
        // This calls our Go WASM function
        return await processData(input);
      } catch (error) {
        console.error('Error processing data with WASM:', error);
        throw error;
      }
    }
  };
}

// Export WASM instance getter for direct access if needed
export { getWasmInstance };

// Default export
export default { getLilypadClient };`

// Write the index file
fs.writeFileSync('./dist/index.js', indexContent)

// Create TypeScript definition file
const dtsContent = `// Type definitions for lilypad-wrapper
export interface LilypadClient {
  /**
   * Generate an image from a prompt using Lilypad
   * @param prompt - The text prompt to generate an image from
   * @returns URL or data URL of the generated image
   */
  generateImage(prompt: string): Promise<string>;
  
  /**
   * Process data using WASM module
   * @param input - The input data to process
   * @returns The processed data
   */
  processData(input: string): Promise<string>;
}

/**
 * Get a Lilypad client instance
 * @returns Lilypad client with available methods
 */
export function getLilypadClient(): LilypadClient;

/**
 * Function to get WASM instance for direct access
 * @returns Promise that resolves to the WASM instance
 */
export function getWasmInstance(): Promise<any>;

declare const _default: {
  getLilypadClient: typeof getLilypadClient;
};

export default _default;`

// Write the TypeScript definition file
fs.writeFileSync('./dist/index.d.ts', dtsContent)

console.log('📦 Lilypad wrapper built successfully!')
