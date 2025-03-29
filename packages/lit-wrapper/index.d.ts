// Type definitions for lit-wrapper
// This file allows TypeScript to understand the exported types from our bundled module
declare module 'lit-wrapper' {
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

  export function createLitClient(options?: LitClientOptions): Promise<LitClient>;

  export const utils: {
    encryptString: Function;
    decryptString: Function;
  };

  const defaultExport: {
    createLitClient: typeof createLitClient;
    LitNetworks: typeof LitNetworks;
    utils: typeof utils;
  };

  export default defaultExport;
}