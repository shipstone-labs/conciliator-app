// Import directly from internal node_modules
// These imports will be bundled by esbuild
import { LIT_NETWORK } from "@lit-protocol/constants";
import {
  LitNodeClientNodeJs,
  decryptString,
  encryptString,
} from "@lit-protocol/lit-node-client";
import { LitRelay, StytchOtpProvider } from "@lit-protocol/lit-auth-client";

// Create a simplified API that's more manageable
export const LitNetworks = {
  Datil: LIT_NETWORK.Datil,
  DatilTest: LIT_NETWORK.DatilTest,
  Habanero: LIT_NETWORK.Habanero,
  Custom: LIT_NETWORK.Custom,
};

export async function authenticate(client, options) {
  const { userId, appId, accessToken, relayApiKey } = options;

  const litRelay = new LitRelay({
    relayUrl: LitRelay.getRelayUrl(client.config.litNetwork),
    relayApiKey,
  });

  const session = new StytchOtpProvider(
    {
      relay: litRelay,
      litNodeClient: client,
    },
    {
      userId,
      appId,
    }
  );

  // from the above example of using the Stytch client to get an authenticated session
  return await session.authenticate({
    accessToken,
  });
}

// Expose a simpler function to create and connect a client
export async function createLitClient(options = {}) {
  try {
    const client = new LitNodeClientNodeJs({
      alertWhenUnauthorized: false,
      litNetwork: LIT_NETWORK.Datil,
      ...options,
    });

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
  authenticate,
  LitNetworks,
  utils,
};
