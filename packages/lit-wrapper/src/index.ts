// Import directly from internal node_modules
// These imports will be bundled by esbuild
import {
  LIT_NETWORK,
  AUTH_METHOD_SCOPE,
  PROVIDER_TYPE,
  LIT_ABILITY,
} from '@lit-protocol/constants'
import type {
  AuthCallbackParams,
  SessionSigsMap,
  AuthSig,
} from '@lit-protocol/types'
// Import both the client and the nodejs client
import { LitNodeClient } from '@lit-protocol/lit-node-client'
// Also import the NodeJS client
import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client-nodejs'
import {
  LitAccessControlConditionResource,
  type LitResourceAbilityRequest,
  newSessionCapabilityObject,
  LitPKPResource,
  LitActionResource,
  createSiweMessageWithRecaps,
  generateAuthSig,
} from '@lit-protocol/auth-helpers'
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers'
import {
  LitRelay,
  StytchOtpProvider,
  getAuthIdByAuthMethod,
} from '@lit-protocol/lit-auth-client'
import type { AuthMethod, EncryptResponse } from '@lit-protocol/types'

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
// biome-ignore lint/style/noVar: <explanation>
var hasRequiredBrowserPonyfill = true

// globalThis.fetch = fetch;

export type AuthParams = {
  userId: string
  appId: string
  accessToken: string
  relayApiKey: string
}

export async function authenticate(
  client: LitNodeClient | LitNodeClientNodeJs,
  options: AuthParams
): Promise<{
  authMethod: AuthMethod
  provider: StytchOtpProvider
  authId: string
}> {
  const { userId, appId, accessToken, relayApiKey } = options

  // Try to get network from client.config or client.litNetwork
  const anyClient = client as any;
  const litNetwork =
    anyClient.config?.litNetwork ||
    anyClient.litNetwork ||
    LIT_NETWORK.Datil;

  console.log('network', litNetwork)

  const litRelay = new LitRelay({
    relayUrl: LitRelay.getRelayUrl(litNetwork),
    relayApiKey,
  })

  const session = new StytchOtpProvider(
    {
      relay: litRelay,
      litNodeClient: client,
    },
    {
      userId,
      appId,
    }
  )

  // from the above example of using the Stytch client to get an authenticated session
  const authMethod = await session.authenticate({
    accessToken,
  })
  const authId = await getAuthIdByAuthMethod(authMethod)
  return { authMethod, authId, provider: session }
}

// Expose a simpler function to create a client
export async function createLitClient(options = {}) {
  try {
    // Create a full LitNodeClientConfig object to avoid type issues
    const config = {
      alertWhenUnauthorized: false,
      litNetwork: LIT_NETWORK.Datil,
      debug: false,
      // Apply any custom options
      ...options,
    }

    const client = new LitNodeClient(config)

    // Note: Connection will be handled by the consumer of this client
    // The client has a connect() method that can be called, but it's not
    // in the TypeScript definitions, so we can't call it here

    return client
  } catch (err) {
    console.error('Error initializing Lit client:', err)
    throw err
  }
}

export {
  AUTH_METHOD_SCOPE,
  PROVIDER_TYPE,
  LIT_NETWORK,
  LIT_ABILITY,
  type AuthMethod,
  type AuthCallbackParams,
  type AuthSig,
  LitAccessControlConditionResource,
  PKPEthersWallet,
  type LitResourceAbilityRequest,
  newSessionCapabilityObject,
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitPKPResource,
  LitActionResource,
  LitNodeClient,
  type SessionSigsMap,
  type EncryptResponse,
}
