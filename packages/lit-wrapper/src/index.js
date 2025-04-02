// Import directly from internal node_modules
// These imports will be bundled by esbuild
import { LIT_NETWORK } from "@lit-protocol/constants";
import {
  LitNodeClientNodeJs,
  decryptString,
  encryptString,
} from "@lit-protocol/lit-node-client";

// Create a simplified API that's more manageable
export const LitNetworks = {
  Datil: LIT_NETWORK.Datil,
  Habanero: LIT_NETWORK.Habanero,
  Custom: LIT_NETWORK.Custom,
};

// Expose a simpler function to create and connect a client
export async function createLitClient(options = {}) {
  try {
    const client = new LitNodeClientNodeJs({
      alertWhenUnauthorized: false,
      litNetwork: LIT_NETWORK.Datil,
      ...options,
    });
    await client.connect();
    return client;
  } catch (err) {
    console.error("Error initializing Lit client:", err);
    throw err;
  }
}

// Export only the functions we need
export const utils = {
  encryptString,
  decryptString,
};

// Default export for convenience
export default {
  createLitClient,
  LitNetworks,
  utils,
};
