// This file is no longer used as encoding is done in build.js
// Keeping for reference purposes

import fs from 'fs';

// Read the WASM file
const wasmFile = fs.readFileSync('./go/mymodule.wasm');

// Convert to Base64
const base64Wasm = Buffer.from(wasmFile).toString('base64');

// Create JavaScript module that embeds the WASM
const jsContent = `// Auto-generated file containing embedded WASM
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

// Initialize WebAssembly module
async function initWasm() {
  const wasmBytes = decodeWasm();
  
  // Create a WebAssembly instance
  const wasmModule = await WebAssembly.instantiate(wasmBytes, {
    env: {
      // TinyGo WASM imports
      'syscall/js.valueGet': () => {},
      'syscall/js.valuePrepareString': () => {},
      'syscall/js.valueSetIndex': () => {},
      // Add any other required imports
    }
  });
  
  return wasmModule.instance.exports;
}

export const wasmInstance = initWasm();

// Export wrapped functions
export async function processData(input) {
  const instance = await wasmInstance;
  // Call the WASM function
  return instance.processData(input);
}

export default {
  processData,
  wasmInstance
};`;

// This file is no longer used for the build