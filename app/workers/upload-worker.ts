import { createW3Client, delegateClient } from 'web-storage-wrapper'
import {
  CHUNK_SIZE,
  createManifestV4,
  createMetadataV4,
  type ChunkInfo,
  type MetadataV4,
} from './car-streaming-format'
import type {
  FileItem,
  FileStats,
  UploadProgress,
  WorkerMessage,
  WorkerResponse,
} from './upload-worker-types'
import { createSHA256 } from 'hash-wasm'
import type { Hex } from 'viem'

let client: Awaited<ReturnType<typeof createW3Client>> | undefined
const ASSUMED_METADATA_LENGTH = 1024

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
    returnMetadata,
    transportPublicKey,
    useLit,
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

        // Always use V4 for better privacy (encrypted metadata)
        const result = await processAndUploadFilesV4(
          filesToProcess,
          {
            contract,
            contractName,
            to,
            unifiedAccessControlConditions,
            returnMetadata: returnMetadata ?? false,
            useLit: useLit ?? false,
          },
          encryptionKey,
          iv,
          transportPublicKey // Optional RSA encryption on top
        )

        self.postMessage({
          type: 'complete',
          result,
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

        const result: Array<FileItem> = []

        try {
          for (const file of event.data.encryptedMetadata) {
            const { metadataBuffer, dataToEncryptHash, fileMetadata } = file
            if (!metadataBuffer || !dataToEncryptHash) {
              result.push(file)
              continue
            }
            const { bytes: manifest } = await createManifestV4(
              unifiedAccessControlConditions,
              metadataBuffer,
              dataToEncryptHash
            )
            const metadataFile = new File([manifest], fileMetadata.name, {
              type: 'application/cbor',
            })
            file.stats.total += manifest.byteLength - ASSUMED_METADATA_LENGTH
            self.postMessage({
              type: 'progress',
              progress: calcStats(
                event.data.encryptedMetadata.map(({ stats }) => stats)
              ),
            } as WorkerResponse)
            const cid = await client.uploadFile(metadataFile)
            file.stats.saved += manifest.byteLength
            self.postMessage({
              type: 'progress',
              progress: calcStats(
                event.data.encryptedMetadata.map(({ stats }) => stats)
              ),
            } as WorkerResponse)
            result.push({ ...file, cid: cid.toString() })
          }
          self.postMessage({
            type: 'complete',
            result,
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
  returnMetadata: boolean
  useLit: boolean
}

// Removed old processAndUploadFiles - using only V3 format

async function getOrGenerateEncryption(
  providedKey?: Uint8Array,
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

const units = ['B', 'KB', 'MB', 'GB', 'TB']
function calcStats(stats: Array<FileStats>): UploadProgress {
  let grandTotal = 0
  let grandSaved = 0
  let grandStart = undefined
  for (const { total, saved, start } of stats) {
    grandTotal += total
    grandSaved += saved
    grandStart = start
  }
  const progress = (100 * grandSaved) / grandTotal
  let speed = grandStart ? (1000 * grandSaved) / grandStart : 0
  let unitIndex = 0
  while (speed > 1024) {
    speed /= 1024
    unitIndex++
  }
  const unit = units[unitIndex]
  return { progress, speed: unit ? speed : 0, unit }
}

// V4 implementation - metadata bundle contains symmetric key & IV
// Enhanced security (RSA) encrypts the entire bundle when enabled
async function processAndUploadFilesV4(
  files: File[],
  _options: ProcessOptions,
  providedKey?: Uint8Array,
  providedIv?: Uint8Array,
  transportPublicKey?: Uint8Array // For RSA encryption of entire bundle
): Promise<Array<FileItem>> {
  if (!client) {
    throw new Error('Client not initialized')
  }

  const allMetadata: Array<{ file: File; item: FileItem }> = []
  const start = Date.now()
  for (const file of files) {
    let chunkSize = CHUNK_SIZE
    while (file.size / chunkSize > 16) {
      chunkSize <<= 1
    }
    while (chunkSize > 100 * 1024 * 1024) {
      chunkSize >>= 1
    }
    allMetadata.push({
      file,
      item: {
        stats: {
          total: file.size + (_options.useLit ? ASSUMED_METADATA_LENGTH : 0),
          saved: 0,
          start,
        },
        fileMetadata: {
          name: file.name,
          size: file.size,
          type: file.type,
          chunkSize,
        },
      },
    })
  }
  for (const { file, item } of allMetadata) {
    // Generate or use provided encryption key
    const { key, iv } = await getOrGenerateEncryption(providedKey, providedIv)

    // Calculate hash of original file data
    const sha = await createSHA256()

    // Process file in chunks (same as V3)
    const chunks: ChunkInfo[] = []
    const chunkSize = item.fileMetadata.chunkSize
    const stats = item.stats
    let chunkIndex = 0
    let offset = 0

    // Create file stream for chunking
    const stream = file.stream()
    const reader = stream.getReader()
    let buffer = new Uint8Array(0)

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (value) {
          sha.update(value)
          // Append to buffer
          const newBuffer = new Uint8Array(buffer.length + value.length)
          newBuffer.set(buffer)
          newBuffer.set(value, buffer.length)
          buffer = newBuffer
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

          stats.total += encryptedChunk.byteLength - chunkData.byteLength

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
            stats.saved = current + status.loaded
            self.postMessage({
              type: 'progress',
              progress: calcStats(
                allMetadata.map(({ item: { stats } }) => stats)
              ),
            } as WorkerResponse)
          }

          const chunkCid = await client.uploadFile(chunkFile, {
            onUploadProgress,
            fetchWithUploadProgress: globalThis.fetch,
          })

          current += chunkFile.size
          stats.saved = current
          self.postMessage({
            type: 'progress',
            progress: calcStats(
              allMetadata.map(({ item: { stats } }) => stats)
            ),
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

    // Create metadata bundle
    const metadata: MetadataV4 = {
      symmetricKey: new Uint8Array(exportedKey),
      iv,
      fileHash: sha.digest('hex') as Hex,
      fileMetadata: item.fileMetadata,
      chunks,
    }

    // Encrypt the entire metadata bundle (including key and IV) with RSA
    let { bytes: metadataBuffer } = await createMetadataV4(metadata)
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
      metadataBuffer = new Uint8Array(
        await crypto.subtle.encrypt(
          { name: 'RSA-OAEP' },
          publicKey,
          metadataBuffer
        )
      )
    }
    item.metadata = metadata
    item.metadataBuffer = metadataBuffer
  }

  // Return metadata bundle and chunk info
  // Browser will handle LIT encryption and manifest creation
  return allMetadata.map(({ item }) => item)
}

// Export types for use in main thread
export type { WorkerMessage, WorkerResponse }
