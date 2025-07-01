import { createW3Client, delegateClient } from 'web-storage-wrapper'
import {
  CHUNK_SIZE,
  createMetadataV4,
  type ChunkInfo,
  type MetadataV4,
} from './car-streaming-format'
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from './base64-utils'

interface WorkerMessage {
  type: 'init' | 'process-file' | 'upload' | 'upload-metadata'
  sessionToken?: string // JWT token for auth
  firebaseToken?: string // Firebase token if needed
  file?: File
  files?: File[]
  encryptionKey?: string // base64 encoded
  iv?: string // base64 encoded
  contract?: `0x${string}`
  contractName?: string
  to?: `0x${string}`
  unifiedAccessControlConditions?: any
  transportPublicKey?: string // base64 encoded
  encryptedMetadata?: string // For uploading LIT-encrypted metadata
}

interface WorkerResponse {
  type: 'ready' | 'progress' | 'complete' | 'error'
  progress?: number
  result?: {
    cid: string // For V3 this is manifest CID, for V4 this is metadata CID (when LIT encrypted)
    encryptedKey: string // base64 encoded
    iv: string // base64 encoded
    dataToEncryptHash: `0x${string}` // Hash of the symmetric key
    fileHash: `0x${string}` // Hash of the original file
    metadataBundle?: string // base64 encoded - V4: The complete metadata bundle to be encrypted by browser
    encryptedMetadataBundle?: string // V4: LIT-encrypted metadata (if LIT is used)
    bundleHash?: `0x${string}` // V4: Hash from LIT encryption
    chunkCIDs?: string[] // V4: The uploaded chunk CIDs
  }
  error?: string
}

let client: Awaited<ReturnType<typeof createW3Client>> | undefined

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const {
    type,
    file,
    files,
    encryptionKey,
    iv,
    contract,
    contractName,
    to,
    unifiedAccessControlConditions,
  } = event.data

  try {
    switch (type) {
      case 'init': {
        if (event.data.sessionToken) {
          // New flow: create client and fetch delegation
          client = await createW3Client()
          const did = client.agent.did()

          // Fetch UCAN delegation from API
          const response = await fetch('/api/ucan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${event.data.sessionToken}`,
            },
            body: JSON.stringify({ did }),
          })

          if (!response.ok) {
            throw new Error(
              `Failed to fetch delegation: ${response.statusText}`
            )
          }

          const delegationBuffer = await response.arrayBuffer()
          await delegateClient(client, delegationBuffer)
        } else {
          throw new Error(
            'Either delegation or sessionToken is required for initialization'
          )
        }

        self.postMessage({ type: 'ready' } as WorkerResponse)
        break
      }
      case 'process-file': {
        if (!client) {
          throw new Error('Client not initialized')
        }
        const filesToProcess = files || (file ? [file] : [])
        if (filesToProcess.length === 0) {
          throw new Error('No files provided')
        }

        // Validate required LIT protocol parameters
        if (
          !contract ||
          !contractName ||
          !to ||
          !unifiedAccessControlConditions
        ) {
          throw new Error('Missing required LIT protocol parameters')
        }

        // Decode binary data from base64
        const decodedEncryptionKey = encryptionKey
          ? base64ToArrayBuffer(encryptionKey)
          : undefined
        const decodedIv = iv ? base64ToUint8Array(iv) : undefined
        const decodedTransportPublicKey = event.data.transportPublicKey
          ? base64ToArrayBuffer(event.data.transportPublicKey)
          : undefined

        // Always use V4 for better privacy (encrypted metadata)
        const result = await processAndUploadFilesV4(
          filesToProcess,
          {
            contract,
            contractName,
            to,
            unifiedAccessControlConditions,
          },
          decodedEncryptionKey,
          decodedIv,
          decodedTransportPublicKey // Optional RSA encryption on top
        )

        // Encode binary data to base64 for response
        const encodedResult = {
          ...result,
          encryptedKey: arrayBufferToBase64(result.encryptedKey),
          iv: uint8ArrayToBase64(result.iv),
          metadataBundle: result.metadataBundle
            ? arrayBufferToBase64(result.metadataBundle)
            : undefined,
        }

        self.postMessage({
          type: 'complete',
          result: encodedResult,
        } as WorkerResponse)
        break
      }

      case 'upload-metadata': {
        if (!client) {
          throw new Error('Client not initialized')
        }
        if (!event.data.encryptedMetadata) {
          throw new Error('No encrypted metadata provided')
        }

        try {
          // The encryptedMetadata is the full JSON-stringified LIT encrypted object
          // We store it as-is to preserve all the metadata needed for decryption
          const metadataBytes = new TextEncoder().encode(
            event.data.encryptedMetadata
          )

          // Create a File object from the encrypted data
          const metadataFile = new File([metadataBytes], 'metadata.enc', {
            type: 'application/json',
          })

          // Upload to IPFS
          const cid = await client.uploadFile(metadataFile)

          self.postMessage({
            type: 'complete',
            result: { cid: cid.toString() },
          } as WorkerResponse)
        } catch (error) {
          throw new Error(
            `Failed to upload metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
        break
      }

      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as WorkerResponse)
  }
}

interface ProcessOptions {
  contract: `0x${string}`
  contractName: string
  to: `0x${string}`
  unifiedAccessControlConditions: any
}

// Removed old processAndUploadFiles - using only V3 format

async function getOrGenerateEncryption(
  providedKey?: ArrayBuffer,
  providedIv?: Uint8Array
): Promise<{ key: CryptoKey; iv: Uint8Array }> {
  let key: CryptoKey
  let iv: Uint8Array

  if (providedKey && providedIv) {
    // Import provided key for AES-CTR
    key = await crypto.subtle.importKey(
      'raw',
      providedKey,
      { name: 'AES-CTR', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    iv = providedIv
  } else {
    // Generate new key for AES-CTR
    key = await crypto.subtle.generateKey(
      { name: 'AES-CTR', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    iv = crypto.getRandomValues(new Uint8Array(12))
  }

  return { key, iv }
}

// V4 implementation - metadata bundle contains symmetric key & IV
// Enhanced security (RSA) encrypts the entire bundle when enabled
async function processAndUploadFilesV4(
  files: File[],
  _options: ProcessOptions,
  providedKey?: ArrayBuffer,
  providedIv?: Uint8Array,
  transportPublicKey?: ArrayBuffer // For RSA encryption of entire bundle
): Promise<{
  cid: string
  encryptedKey: ArrayBuffer
  iv: Uint8Array
  dataToEncryptHash: `0x${string}`
  fileHash: `0x${string}`
  metadataBundle?: ArrayBuffer
  chunkCIDs?: string[]
}> {
  if (!client) {
    throw new Error('Client not initialized')
  }

  // Generate or use provided encryption key
  const { key, iv } = await getOrGenerateEncryption(providedKey, providedIv)

  const allMetadata: MetadataV4[] = []

  for (const file of files) {
    // Calculate hash of original file data
    const fileBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer)
    const fileHash = `0x${Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}` as `0x${string}`

    // Process file in chunks (same as V3)
    const chunks: ChunkInfo[] = []
    const chunkSize = CHUNK_SIZE
    let offset = 0
    let chunkIndex = 0

    // Create file stream for chunking
    const stream = file.stream()
    const reader = stream.getReader()
    let buffer = new Uint8Array(0)

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (value) {
          // Append to buffer
          const newBuffer = new Uint8Array(buffer.length + value.length)
          newBuffer.set(buffer)
          newBuffer.set(value, buffer.length)
          buffer = newBuffer

          // Report progress
          // self.postMessage({
          //   type: 'progress',
          //   progress: ((offset + buffer.length) / file.size) * 100,
          // } as WorkerResponse)
        }

        // Process complete chunks
        let current = 0
        while (buffer.length >= chunkSize || (done && buffer.length > 0)) {
          const chunkData = buffer.slice(0, Math.min(chunkSize, buffer.length))

          // Create counter for this chunk
          const chunkIv = new Uint8Array(16)
          chunkIv.set(iv.slice(0, 12))
          const view = new DataView(chunkIv.buffer)
          view.setUint32(12, chunkIndex, false)

          // Encrypt chunk
          const encryptedChunk = await crypto.subtle.encrypt(
            { name: 'AES-CTR', counter: chunkIv, length: 64 },
            key,
            chunkData
          )

          // Upload encrypted chunk
          const chunkFile = new File(
            [encryptedChunk],
            `${file.name}.chunk${chunkIndex}`,
            { type: 'application/octet-stream' }
          )
          const onUploadProgress = (status: {
            total: number
            loaded: number
            lengthComputable: boolean
          }) => {
            console.log(
              status.total,
              status.loaded,
              Math.round((100 * status.loaded) / status.total)
            )
            self.postMessage({
              type: 'progress',
              progress: ((offset + status.loaded + current) / file.size) * 100,
            } as WorkerResponse)
          }
          const chunkCid = await client.uploadFile(chunkFile, {
            onUploadProgress,
            fetchWithUploadProgress: globalThis.fetch,
          })

          current += chunkFile.size
          self.postMessage({
            type: 'progress',
            progress: ((offset + current) / file.size) * 100,
          } as WorkerResponse)

          // Store chunk info
          chunks.push({
            cid: chunkCid.toString(),
            offset,
            size: chunkData.length,
            encryptedSize: encryptedChunk.byteLength,
            counter: chunkIndex,
          })

          offset += chunkData.length
          chunkIndex++
          buffer = buffer.slice(chunkData.length)

          if (done && buffer.length === 0) break
        }

        if (done) break
      }
    } finally {
      reader.releaseLock()
    }

    // Export the key for storage
    const exportedKey = await crypto.subtle.exportKey('raw', key)

    // Calculate hash of the symmetric key
    const keyHashBuffer = await crypto.subtle.digest('SHA-256', exportedKey)
    const dataToEncryptHash = `0x${Array.from(new Uint8Array(keyHashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}` as `0x${string}`

    // Create metadata bundle
    const metadata: MetadataV4 = {
      symmetricKey: new Uint8Array(exportedKey),
      iv,
      fileHash,
      dataToEncryptHash,
      fileMetadata: {
        name: file.name,
        size: file.size,
        type: file.type,
        chunkSize: CHUNK_SIZE,
      },
      chunks,
    }

    allMetadata.push(metadata)
  }

  // Handle multiple files
  let finalMetadata: MetadataV4
  if (allMetadata.length === 1) {
    finalMetadata = allMetadata[0]
  } else {
    // For multiple files, create a combined metadata
    finalMetadata = {
      ...allMetadata[0],
      fileMetadata: {
        name: 'Multiple files',
        size: allMetadata.reduce((sum, m) => sum + m.fileMetadata.size, 0),
        type: 'multipart/mixed',
        chunkSize: CHUNK_SIZE,
      },
      chunks: allMetadata.flatMap((m) => m.chunks),
    }
  }

  // Encode metadata as CBOR
  const { bytes: metadataBytes } = await createMetadataV4(finalMetadata)

  // Apply enhanced security (RSA encryption) if requested
  let metadataToReturn: ArrayBuffer
  if (transportPublicKey) {
    // Import the public key
    const publicKey = await crypto.subtle.importKey(
      'spki',
      transportPublicKey,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    )

    // Encrypt the entire metadata bundle (including key and IV) with RSA
    metadataToReturn = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      metadataBytes
    )
  } else {
    // Standard flow - return plaintext metadata bundle
    // Browser will encrypt this with LIT before storage
    const buffer = metadataBytes.buffer.slice(
      metadataBytes.byteOffset,
      metadataBytes.byteOffset + metadataBytes.byteLength
    )
    // Ensure it's an ArrayBuffer, not SharedArrayBuffer
    metadataToReturn =
      buffer instanceof ArrayBuffer ? buffer : new ArrayBuffer(0)
  }

  // Extract all chunk CIDs
  const chunkCIDs = finalMetadata.chunks.map((chunk) => chunk.cid)

  // Return metadata bundle and chunk info
  // Browser will handle LIT encryption and manifest creation
  return {
    cid: '', // Placeholder - browser will generate final CID after LIT encryption
    encryptedKey: new ArrayBuffer(0), // Key is in metadata bundle
    iv: new Uint8Array(0), // IV is in metadata bundle
    dataToEncryptHash: finalMetadata.dataToEncryptHash,
    fileHash: finalMetadata.fileHash,
    metadataBundle: metadataToReturn,
    chunkCIDs,
  }
}

// Export types for use in main thread
export type { WorkerMessage, WorkerResponse }
