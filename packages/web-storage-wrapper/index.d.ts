// Type definitions for web-storage-wrapper
declare module 'web-storage-wrapper' {
  export interface Web3StorageClient {
    login(email: string): Promise<void>;
    currentSpace(): Promise<any>;
    spaces(): Promise<any[]>;
    createSpace(name: string): Promise<any>;
    uploadBlob(blob: Blob): Promise<{ toString(): string }>;
    capability: {
      store: {
        list(options: { space: string }): Promise<any[]>;
      };
    };
    [key: string]: any;
  }

  export interface AuthResult {
    success: boolean;
    email: string;
  }

  export interface StoreResult {
    success: boolean;
    cid: string;
  }

  export function createW3Client(): Promise<Web3StorageClient>;
  export function authenticateWithEmail(client: Web3StorageClient, email: string): Promise<AuthResult>;
  export function storeContent(client: Web3StorageClient, content: any): Promise<StoreResult>;
  export function listUploads(client: Web3StorageClient): Promise<any[]>;

  export const w3Storage: {
    create: typeof createW3Client;
    authenticate: typeof authenticateWithEmail;
    store: typeof storeContent;
    list: typeof listUploads;
  };

  export default w3Storage;
}