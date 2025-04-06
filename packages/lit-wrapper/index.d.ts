// Type definitions for lit-wrapper
import type {
  AuthMethod,
  StytchOtpProvider,
} from "@lit-protocol/lit-auth-client";
import {
  LitAccessControlConditionResource,
  newSessionCapabilityObject,
  SessionCapabilityObject,
  LitPKPResource,
  LitActionResource,
  capacityDelegationAuthSig,
} from "@lit-protocol/auth-helpers";
import {
  LIT_NETWORKS,
  AUTH_METHOD_SCOPE,
  PROVIDER_TYPE,
  LIT_ABILITY,
} from "@lit-protocol/constants";
// This file allows TypeScript to understand the exported types from our bundled module
declare module "lit-wrapper" {
  export const LitNetworks: {
    Datil: string;
    Habanero: string;
    Custom: string;
  };

  export interface LitClientOptions {
    alertWhenUnauthorized?: boolean;
    litNetwork?: string;
    [key: string]: any;
  }

  export interface LitClient {
    connect(): Promise<void>;
    [key: string]: any;
  }
  export interface AuthOptions {
    userId?: string;
    appId?: string;
    accessToken?: string;
    relayApiKey?: string;
  }

  export function createLitClient(
    options?: LitClientOptions
  ): Promise<LitClient>;

  export function authenticate(
    client: LitClient,
    options?: AuthOptions
  ): Promise<{
    authMethod: AuthMethod;
    provider: StytchOtpProvider;
    authId: string;
  }>;

  export const utils: {
    encryptString: typeof LitClient.encryptString;
    decryptString: typeof LitClient.decryptString;
  };

  const defaultExport: {
    createLitClient: typeof createLitClient;
    authenticate: typeof StytchOtpProvider.authenticate;
    LitNetworks: typeof LitNetworks;
    utils: typeof utils;
    LIT_NETWORKS;
    AUTH_METHOD_SCOPE;
    PROVIDER_TYPE;
    LIT_ABILITY;
    SessionCapabilityObject;
    newSessionCapabilityObject;
    LitAccessControlConditionResource;
    capacityDelegationAuthSig;
    LitPKPResource;
    LitActionResource;
  };

  export {
    LIT_NETWORKS,
    AUTH_METHOD_SCOPE,
    PROVIDER_TYPE,
    LIT_ABILITY,
    SessionCapabilityObject,
    newSessionCapabilityObject,
    LitAccessControlConditionResource,
    capacityDelegationAuthSig,
    LitPKPResource,
    LitActionResource,
  };
  export default defaultExport;
}
