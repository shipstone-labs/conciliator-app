// Create shims for node built-ins to work in the browser
export const process = {
  env: {
    NODE_ENV: "production"
  }
};

// Empty shims for Node.js built-ins
export const fs = {};
export const path = {};
export const crypto = {
  randomBytes: () => {
    return new Uint8Array(32);
  }
};

// Handle require for CommonJS modules
globalThis.require = function(mod) {
  if (mod === 'fs' || mod === 'path' || mod.startsWith('node:')) {
    console.warn(`Warning: Module '${mod}' is not available in the browser`);
    return {};
  }
  throw new Error(`Cannot find module '${mod}'`);
};

// Add Buffer if it doesn't exist
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = {
    from: (data, encoding) => {
      if (typeof data === 'string') {
        const encoder = new TextEncoder();
        return encoder.encode(data);
      }
      return new Uint8Array(data);
    },
    isBuffer: () => false
  };
}