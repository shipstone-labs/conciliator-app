// Import directly from internal node_modules
import * as w3Client from '@web3-storage/w3up-client';

/**
 * Creates a new Web3 Storage client
 * @returns {Promise<Object>} The Web3 Storage client
 */
export async function createW3Client() {
  try {
    // Create client
    const client = await w3Client.create();
    return client;
  } catch (err) {
    console.error('Error creating Web3 Storage client:', err);
    throw err;
  }
}

/**
 * Authenticate with Web3 Storage using provided email
 * @param {Object} client - The Web3 Storage client
 * @param {string} email - Email for authentication
 * @returns {Promise<Object>} Authentication result
 */
export async function authenticateWithEmail(client, email) {
  try {
    await client.login(email);
    return { success: true, email };
  } catch (err) {
    console.error('Error authenticating with Web3 Storage:', err);
    throw err;
  }
}

/**
 * Store content on Web3 Storage
 * @param {Object} client - The authenticated Web3 Storage client
 * @param {any} content - Content to store (File or Blob)
 * @returns {Promise<Object>} Result with CID
 */
export async function storeContent(client, content) {
  try {
    // Make sure we have a space
    const space = await client.currentSpace();
    if (!space) {
      const spaces = await client.spaces();
      if (spaces.length === 0) {
        await client.createSpace('my-space');
      }
    }
    
    // Store the content
    const uploadable = new Blob([content]);
    const cid = await client.uploadBlob(uploadable);
    
    return { 
      success: true, 
      cid: cid.toString()
    };
  } catch (err) {
    console.error('Error storing content:', err);
    throw err;
  }
}

/**
 * List all uploaded content
 * @param {Object} client - The authenticated Web3 Storage client
 * @returns {Promise<Array>} List of uploaded content
 */
export async function listUploads(client) {
  try {
    const space = await client.currentSpace();
    const uploads = await client.capability.store.list({ space: space.did() });
    return uploads;
  } catch (err) {
    console.error('Error listing uploads:', err);
    throw err;
  }
}

// Export Web3 Storage utilities
export const w3Storage = {
  create: createW3Client,
  authenticate: authenticateWithEmail,
  store: storeContent,
  list: listUploads
};

// Default export
export default w3Storage;