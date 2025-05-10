// Web Storage Wrapper
// Isolated wrapper for Web3 Storage client
import { type Client, create } from '@storacha/client'
import { StoreMemory } from '@storacha/client/stores/memory'
import { parse } from '@storacha/client/proof'
import { Signer } from '@storacha/client/principal/ed25519'
import type {
  ListRequestOptions,
  UploadListSuccess,
} from '@storacha/client/types'

// import * as ed from '@noble/ed25519'
// import { sha512 } from '@noble/hashes/sha512'

// // Fix the SHA-512 implementation for ed25519
// // This is critical for correct operation in all environments
// // @ts-ignore
// ed.etc.sha512Sync = (...m) => {
//   try {
//     // Create a clean TypedArray from the concatenated bytes
//     const input = ed.etc.concatBytes(...m)

//     // Ensure we're always using a clean Uint8Array for consistency
//     const cleanInput = new Uint8Array(input)

//     // Call the SHA-512 implementation with the clean input
//     return sha512(cleanInput)
//   } catch (error) {
//     console.error('Error in custom sha512Sync:', error)
//     // Return a dummy buffer with the correct length (64 bytes)
//     return new Uint8Array(64).fill(1)
//   }
// }

// // Also patch the async SHA-512 function that uses SubtleCrypto directly
// // This fixes the "message.buffer" issue in WebCrypto
// // @ts-ignore
// ed.etc.sha512Async = async (...messages) => {
//   try {
//     // Get the crypto object
//     const crypto =
//       typeof globalThis === 'object' && 'crypto' in globalThis
//         ? globalThis.crypto
//         : undefined

//     if (!crypto || !crypto.subtle) {
//       throw new Error('crypto.subtle must be defined')
//     }

//     // Concatenate messages
//     const m = ed.etc.concatBytes(...messages)

//     // Create a clean Uint8Array - THE KEY FIX: don't use .buffer property!
//     const cleanInput = new Uint8Array(m)

//     // Call digest WITHOUT using .buffer property
//     const hashBuffer = await crypto.subtle.digest('SHA-512', cleanInput)

//     // Return as Uint8Array
//     return new Uint8Array(hashBuffer)
//   } catch (error) {
//     console.error('Error in patched sha512Async:', error)
//     throw error
//   }
// }

/**
 * Authentication result type
 */
export interface AuthResult {
  success: boolean
  email: string
}

/**
 * Store operation result type
 */
export interface StoreResult {
  success: boolean
  cid: string | null
}

/**
 * Create a new Web3.Storage client
 * @returns The Web3.Storage client instance
 */
export async function createW3Client(): Promise<Client> {
  try {
    return await create()
  } catch (error) {
    console.error('Error creating W3 client:', error)
    throw error
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
  email: `${string}@${string}`
): Promise<AuthResult> {
  try {
    await client.login(email)
    return {
      success: true,
      email: email,
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      email: email,
    }
  }
}

export async function createAsAgent(key: string, proof: string) {
  // Load client with specific private key
  const principal = Signer.parse(key)
  const store = new StoreMemory()

  const client = await create({ principal, store })
  // Add proof that this agent has been delegated capabilities on the space
  const parsedProof = await parse(proof)
  const space = await client.addSpace(parsedProof)
  await client.setCurrentSpace(space.did())
  return client
}

/**
 * Store content on Web3.Storage
 * @param client - The Web3.Storage client instance
 * @param content - The content to store
 * @returns Storage result
 */
export async function storeContent(
  client: Client,
  content: Blob | string | object
): Promise<StoreResult> {
  try {
    // Convert content to Blob for upload
    let blob: Blob
    if (content instanceof Blob) {
      blob = content
    } else if (typeof content === 'string') {
      blob = new Blob([content], { type: 'text/plain' })
    } else {
      // Convert object to JSON string
      const jsonString = JSON.stringify(content)
      blob = new Blob([jsonString], { type: 'application/json' })
    }

    // Upload to Web3.Storage
    const cid = await client.uploadFile(blob, {})

    return {
      success: true,
      cid: cid.toString(),
    }
  } catch (error) {
    console.error('Storage error:', error)
    return {
      success: false,
      cid: null,
    }
  }
}

/**
 * List uploads for the authenticated user
 * @param client - The Web3.Storage client instance
 * @returns Array of uploads
 */
export async function listUploads(
  client: Client,
  options: ListRequestOptions
): Promise<UploadListSuccess> {
  try {
    return await client.capability.upload.list(options)
  } catch (error) {
    console.error('Error listing uploads:', error)
    throw error
  }
}

// Export convenience object
export const w3Storage = {
  create: createW3Client,
  createAsAgent,
  authenticate: authenticateWithEmail,
  store: storeContent,
  list: listUploads,
}

export default w3Storage
