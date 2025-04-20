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
import { LitNodeClient } from '@lit-protocol/lit-node-client'
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
  client: LitNodeClient,
  options: AuthParams
): Promise<{
  authMethod: AuthMethod
  provider: StytchOtpProvider
  authId: string
}> {
  const { userId, appId, accessToken, relayApiKey } = options

  console.log('network', client.config.litNetwork)
  const litRelay = new LitRelay({
    relayUrl: LitRelay.getRelayUrl(client.config.litNetwork),
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

// Expose a simpler function to create and connect a client
export async function createLitClient(options = {}) {
  try {
    const client = new LitNodeClient({
      alertWhenUnauthorized: false,
      litNetwork: LIT_NETWORK.Datil,
      ...options,
      debug: false,
    })

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
  type LitNodeClient,
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
  type SessionSigsMap,
  type EncryptResponse,
}
