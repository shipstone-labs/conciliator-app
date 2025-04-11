// Type definitions for lit-wrapper
import type {
  AuthMethod,
  StytchOtpProvider,
} from '@lit-protocol/lit-auth-client'
import {
  LitAccessControlConditionResource,
  LitResourceAbilityRequest,
  newSessionCapabilityObject,
  SessionCapabilityObject,
  LitPKPResource,
  LitActionResource,
  capacityDelegationAuthSig,
  createSiweMessageWithRecaps,
  generateAuthSig,
  AuthCallbackParams,
} from '@lit-protocol/auth-helpers'
import {
  LIT_NETWORK,
  AUTH_METHOD_SCOPE,
  PROVIDER_TYPE,
  LIT_ABILITY,
} from '@lit-protocol/constants'
export { LitNodeClient } from '@lit-protocol/lit-node-client'

// This file allows TypeScript to understand the exported types from our bundled module
declare module 'lit-wrapper' {
  export const LitNetworks: {
    Datil: string
    Habanero: string
    Custom: string
  }

  export interface LitClientOptions {
    alertWhenUnauthorized?: boolean
    litNetwork?: string
    [key: string]: any
  }

  export interface AuthOptions {
    userId?: string
    appId?: string
    accessToken?: string
    relayApiKey?: string
  }

  export function createLitClient(
    options?: LitClientOptions
  ): Promise<LitNodeClient>

  export function authenticate(
    client: LitClient,
    options?: AuthOptions
  ): Promise<{
    authMethod: AuthMethod
    provider: StytchOtpProvider
    authId: string
  }>

  export const utils: {
    encryptString: typeof LitClient.encryptString
    decryptString: typeof LitClient.decryptString
  }

  const defaultExport: {
    LitNetworks: typeof LitNetworks
    utils: typeof utils
    LIT_NETWORK
    AUTH_METHOD_SCOPE
    PROVIDER_TYPE
    LIT_ABILITY
    newSessionCapabilityObject
    LitAccessControlConditionResource
    LitResourceAbilityRequest
    capacityDelegationAuthSig
    createSiweMessageWithRecaps
    generateAuthSig
    LitPKPResource
    LitActionResource
    generateAuthSig
  }

  export {
    LIT_NETWORK,
    AUTH_METHOD_SCOPE,
    PROVIDER_TYPE,
    LIT_ABILITY,
    SessionCapabilityObject,
    newSessionCapabilityObject,
    LitAccessControlConditionResource,
    LitResourceAbilityRequest,
    capacityDelegationAuthSig,
    createSiweMessageWithRecaps,
    generateAuthSig,
    LitPKPResource,
    LitActionResource,
    LitNodeClient,
    AuthCallbackParams,
    generateAuthSig,
  }
  export default defaultExport
}
