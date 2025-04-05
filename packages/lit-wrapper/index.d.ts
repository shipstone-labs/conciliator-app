// Type definitions for lit-wrapper
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
  ): Promise<void>;

  export const utils: {
    encryptString: typeof LitClient.encryptString;
    decryptString: typeof LitClient.decryptString;
  };

  const defaultExport: {
    createLitClient: typeof createLitClient;
    authenticate: typeof authenticate;
    LitNetworks: typeof LitNetworks;
    utils: typeof utils;
  };

  export default defaultExport;
}
