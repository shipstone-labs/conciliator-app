// Web Storage Wrapper
// Isolated wrapper for Web3 Storage client
import { type Client, create } from "@web3-storage/w3up-client";

// /**
//  * Type definitions for Web3 Storage client
//  */
// export interface Web3StorageClient {
//   login(email: string): Promise<void>;
//   currentSpace(): Promise<any>;
//   spaces(): Promise<any[]>;
//   createSpace(name: string): Promise<any>;
//   uploadBlob(blob: Blob): Promise<{ toString(): string }>;
//   capability: {
//     store: {
//       list(options: { space: string }): Promise<any[]>;
//     };
//   };
//   [key: string]: any;
// }

/**
 * Authentication result type
 */
export interface AuthResult {
  success: boolean;
  email: string;
}

/**
 * Store operation result type
 */
export interface StoreResult {
  success: boolean;
  cid: string | null;
}

/**
 * Create a new Web3.Storage client
 * @returns The Web3.Storage client instance
 */
export async function createW3Client(): Promise<Client> {
  try {
    return await create();
  } catch (error) {
    console.error("Error creating W3 client:", error);
    throw error;
  }
}

/**
 * Authenticate with the Web3.Storage service using an email
 * @param client - The Web3.Storage client instance
 * @param email - The email to authenticate with
 * @returns Authentication result
 */
export async function authenticateWithEmail(
  client: Client,
  email: string
): Promise<AuthResult> {
  try {
    await client.login(email);
    return {
      success: true,
      email: email,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      email: email,
    };
  }
}

/**
 * Store content on Web3.Storage
 * @param client - The Web3.Storage client instance
 * @param content - The content to store
 * @returns Storage result
 */
export async function storeContent(
  client: Client,
  content: any
): Promise<StoreResult> {
  try {
    // Convert content to Blob for upload
    let blob: Blob;
    if (content instanceof Blob) {
      blob = content;
    } else if (typeof content === "string") {
      blob = new Blob([content], { type: "text/plain" });
    } else {
      // Convert object to JSON string
      const jsonString = JSON.stringify(content);
      blob = new Blob([jsonString], { type: "application/json" });
    }

    // Upload to Web3.Storage
    const cid = await client.uploadFile(blob);

    return {
      success: true,
      cid: cid.toString(),
    };
  } catch (error) {
    console.error("Storage error:", error);
    return {
      success: false,
      cid: null,
    };
  }
}

/**
 * List uploads for the authenticated user
 * @param client - The Web3.Storage client instance
 * @returns Array of uploads
 */
export async function listUploads(client: Client): Promise<any[]> {
  try {
    const space = await client.currentSpace();
    const uploads = await client.spaces.list({ space: space.did() });
    return uploads;
  } catch (error) {
    console.error("Error listing uploads:", error);
    throw error;
  }
}

// Export convenience object
export const w3Storage = {
  create: createW3Client,
  authenticate: authenticateWithEmail,
  store: storeContent,
  list: listUploads,
};

export default w3Storage;
