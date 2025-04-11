// Import directly from internal node_modules
// These imports will be bundled by esbuild
import {
  LIT_NETWORK,
  AUTH_METHOD_SCOPE,
  PROVIDER_TYPE,
  LIT_ABILITY,
} from '@lit-protocol/constants'
import {
  LitNodeClient,
  decryptString,
  encryptString,
} from '@lit-protocol/lit-node-client'
import {
  LitAccessControlConditionResource,
  LitResourceAbilityRequest,
  newSessionCapabilityObject,
  LitPKPResource,
  LitActionResource,
  capacityDelegationAuthSig,
  createSiweMessageWithRecaps,
  generateAuthSig,
  AuthCallbackParams,
} from '@lit-protocol/auth-helpers'
import {
  LitRelay,
  StytchOtpProvider,
  getAuthIdByAuthMethod,
} from '@lit-protocol/lit-auth-client'

// Create a simplified API that's more manageable
export const LitNetworks = {
  Datil: LIT_NETWORK.Datil,
  DatilTest: LIT_NETWORK.DatilTest,
  Habanero: LIT_NETWORK.Habanero,
  Custom: LIT_NETWORK.Custom,
}

export async function authenticate(client, options) {
  const { userId, appId, accessToken, relayApiKey } = options

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
    })

    return client
  } catch (err) {
    console.error('Error initializing Lit client:', err)
    throw err
  }
}

// Export only the functions we need
export const utils = {
  encryptString,
  decryptString,
}

export {
  AUTH_METHOD_SCOPE,
  PROVIDER_TYPE,
  LIT_NETWORK,
  LIT_ABILITY,
  LitNodeClient,
  LitAccessControlConditionResource,
  LitResourceAbilityRequest,
  newSessionCapabilityObject,
  capacityDelegationAuthSig,
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitPKPResource,
  AuthCallbackParams,
  LitActionResource,
}

// Default export for convenience
export default {
  createLitClient,
  authenticate,
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitNetworks,
  LitNodeClient,
  LitAccessControlConditionResource,
  LitResourceAbilityRequest,
  newSessionCapabilityObject,
  capacityDelegationAuthSig,
  LitPKPResource,
  LitActionResource,
  utils,
  AuthCallbackParams,
  AUTH_METHOD_SCOPE,
  PROVIDER_TYPE,
  LIT_NETWORK,
  LIT_ABILITY,
}
