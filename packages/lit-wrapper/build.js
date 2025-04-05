import fs from "node:fs";

// Make sure the dist directory exists
if (!fs.existsSync("./dist")) {
  fs.mkdirSync("./dist");
}

// Simple re-export for the index to work with Next.js
const indexContent = `// Main entry point
// Re-export specific functions to avoid issues with Node.js built-ins
import * as LitJsSdk from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';

// Export only what we need
export const LitNetworks = {
  Datil: LIT_NETWORK.Datil,
  Habanero: LIT_NETWORK.Habanero,
  Custom: LIT_NETWORK.Custom
};

// Create a function to initialize the client
export async function createLitClient(options = {}) {
  try {
    const client = new LitJsSdk.LitNodeClientNodeJs({
      alertWhenUnauthorized: false,
      litNetwork: LIT_NETWORK.Datil,
      ...options
    });
    await client.connect();
    return client;
  } catch (err) {
    console.error('Error initializing Lit client:', err);
    throw err;
  }
}

// Export selected utilities
export const utils = {
  encryptString: LitJsSdk.encryptString,
  decryptString: LitJsSdk.decryptString
};

// Default export
export default { createLitClient, LitNetworks, utils };`;

// Write the index file
fs.writeFileSync("./dist/index.js", indexContent);

console.log("📦 Lit wrapper built successfully!");
