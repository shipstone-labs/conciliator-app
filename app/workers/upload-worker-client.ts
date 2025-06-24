import type { WorkerMessage, WorkerResponse } from './upload-worker'
import { LitKeyManager } from './lit-key-manager'
import type { LitNodeClient, SessionSigsMap } from 'lit-wrapper'
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from './base64-utils'

export interface UploadOptions {
  files: File[]
  delegation: ArrayBuffer
  contract: `0x${string}`
  contractName: string
  to: `0x${string}`
  unifiedAccessControlConditions: any
  onProgress?: (progress: number) => void
  encryptionKey?: ArrayBuffer
  iv?: Uint8Array
  litClient?: LitNodeClient // Optional LIT client for key management
  sessionSigs?: SessionSigsMap // Optional session sigs (supports delegate sigs, relayer, etc.)
  enhancedSecurity?: boolean // Enable ephemeral key encryption for worker transport
  dontReturnMetadata?: boolean // Skip returning metadata bundle when using LIT
}

export interface UploadResult {
  cid: string // When LIT is used: CID of the CBOR file with ACL + encrypted manifest
  encryptedKey: ArrayBuffer // V3: actual key, V4: empty (key in metadata)
  iv: Uint8Array // V3: actual IV, V4: empty (IV in metadata)
  dataToEncryptHash: `0x${string}` // Hash of the symmetric key
  fileHash: `0x${string}` // Hash of the original file
  // V4 optional fields
  metadataBundle?: ArrayBuffer // Raw metadata bundle when LIT is not used
  encryptedMetadataBundle?: string // LIT-encrypted metadata (if LIT is used)
  bundleHash?: `0x${string}` // Hash from LIT encryption
  chunkCIDs?: string[] // Uploaded chunk CIDs
}

export class UploadWorkerClient {
  private worker: Worker | null = null
  private initPromise: Promise<void> | null = null
  private keyManager: LitKeyManager | null = null

  constructor(litClient?: LitNodeClient) {
    // Worker will be lazy-loaded when needed
    if (litClient) {
      this.keyManager = new LitKeyManager(litClient)
    }
  }

  async initKeyManager() {
    if (this.keyManager) {
      await this.keyManager.init()
    }
  }

  private async ensureWorker(): Promise<Worker> {
    if (!this.worker) {
      this.worker = new Worker('/workers/upload-worker.js', {
        type: 'module',
      })
    }
    return this.worker
  }

  async initialize(delegation: ArrayBuffer): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = (async () => {
      const worker = await this.ensureWorker()

      return new Promise<void>((resolve, reject) => {
        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.type === 'ready') {
            worker.removeEventListener('message', handleMessage)
            resolve()
          } else if (event.data.type === 'error') {
            worker.removeEventListener('message', handleMessage)
            reject(new Error(event.data.error))
          }
        }

        worker.addEventListener('message', handleMessage)
        // Encode delegation to base64
        worker.postMessage({
          type: 'init',
          delegation: arrayBufferToBase64(delegation),
        } as WorkerMessage)
      })
    })()

    return this.initPromise
  }

  async uploadFiles(options: UploadOptions): Promise<UploadResult> {
    const {
      files,
      delegation,
      contract,
      contractName,
      to,
      unifiedAccessControlConditions,
      onProgress,
      encryptionKey,
      iv,
    } = options

    // Ensure initialized
    await this.initialize(delegation)

    return (async () => {
      const worker = await this.ensureWorker()

      // Generate ephemeral key pair if enhanced security is enabled
      let transportPrivateKey: CryptoKey | undefined
      let transportPublicKey: ArrayBuffer | undefined

      if (options.enhancedSecurity) {
        const keyPair = await crypto.subtle.generateKey(
          {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
          },
          true,
          ['encrypt', 'decrypt']
        )
        transportPrivateKey = keyPair.privateKey
        const exportedPublicKey = await crypto.subtle.exportKey(
          'spki',
          keyPair.publicKey
        )
        transportPublicKey = exportedPublicKey
      }

      return new Promise<UploadResult>((resolve, reject) => {
        const handleMessage = async (event: MessageEvent<WorkerResponse>) => {
          switch (event.data.type) {
            case 'progress':
              if (onProgress && event.data.progress !== undefined) {
                onProgress(event.data.progress)
              }
              break

            case 'complete':
              worker.removeEventListener('message', handleMessage)
              if (event.data.result) {
                // Decode base64 responses back to binary
                let result = {
                  ...event.data.result,
                  encryptedKey: base64ToArrayBuffer(
                    event.data.result.encryptedKey
                  ),
                  iv: base64ToUint8Array(event.data.result.iv),
                  metadataBundle: event.data.result.metadataBundle
                    ? base64ToArrayBuffer(event.data.result.metadataBundle)
                    : undefined,
                }

                // Decrypt the key if enhanced security was used
                if (options.enhancedSecurity && transportPrivateKey) {
                  const decryptedKey = await crypto.subtle.decrypt(
                    { name: 'RSA-OAEP' },
                    transportPrivateKey,
                    result.encryptedKey
                  )
                  result = {
                    ...result,
                    encryptedKey: decryptedKey,
                  }
                }

                // Check if this is a V4 response with metadata bundle
                if (result.metadataBundle) {
                  // V4: Handle metadata bundle
                  if (this.keyManager && options.litClient) {
                    // Decrypt RSA if enhanced security was used
                    let metadataBundle = result.metadataBundle
                    if (options.enhancedSecurity && transportPrivateKey) {
                      metadataBundle = await crypto.subtle.decrypt(
                        { name: 'RSA-OAEP' },
                        transportPrivateKey,
                        result.metadataBundle
                      )
                    }

                    // Include the metadata bundle in the result (unless opted out)
                    if (!options.dontReturnMetadata) {
                      result = {
                        ...result,
                        metadataBundle, // May be RSA encrypted or plaintext
                      }
                    }

                    // If LIT is available, also encrypt and upload to IPFS
                    if (this.keyManager && options.litClient) {
                      // LIT flow: Encrypt metadata → Create CBOR with ACL → Upload
                      const { encryptedBundle, bundleHash } =
                        await this.keyManager.encryptMetadataBundle(
                          new Uint8Array(metadataBundle),
                          unifiedAccessControlConditions
                        )

                      // Create V4 CBOR structure with cleartext ACL
                      const { encode } = await import('cbor-x')
                      const v4Manifest = {
                        version: 'LIT-ENCRYPTED-V4',
                        accessControlConditions: unifiedAccessControlConditions,
                        encryptedManifest: encryptedBundle,
                        created: Date.now(),
                      }
                      const cborData = encode(v4Manifest)

                      // Send CBOR back to worker for IPFS upload
                      const uploadResponse = await new Promise<{ cid: string }>(
                        (resolve, reject) => {
                          const uploadHandler = (
                            event: MessageEvent<WorkerResponse>
                          ) => {
                            if (
                              event.data.type === 'complete' &&
                              event.data.result?.cid
                            ) {
                              worker.removeEventListener(
                                'message',
                                uploadHandler
                              )
                              resolve({ cid: event.data.result.cid })
                            } else if (event.data.type === 'error') {
                              worker.removeEventListener(
                                'message',
                                uploadHandler
                              )
                              reject(new Error(event.data.error))
                            }
                          }

                          worker.addEventListener('message', uploadHandler)
                          worker.postMessage({
                            type: 'upload-metadata',
                            encryptedMetadata: uint8ArrayToBase64(cborData),
                          } as WorkerMessage)
                        }
                      )

                      // Store reference for future retrieval
                      await this.keyManager.storeV4Metadata(
                        uploadResponse.cid,
                        uploadResponse.cid, // Same CID for both
                        bundleHash,
                        unifiedAccessControlConditions
                      )

                      // Update result with CID (but keep metadata bundle)
                      result = {
                        ...result,
                        cid: uploadResponse.cid,
                        encryptedMetadataBundle: encryptedBundle, // LIT-encrypted version (string)
                        // metadataBundle already set above
                      }
                    } else {
                      // No LIT: Just return bundle, no CID
                      result = {
                        ...result,
                        cid: '', // App decides how to store
                      }
                    }
                  }
                } else {
                  // V3: Handle key separately
                  if (this.keyManager && options.litClient) {
                    // Combine key and IV for storage
                    const combinedKey = new Uint8Array(32 + result.iv.length)
                    combinedKey.set(new Uint8Array(result.encryptedKey), 0)
                    combinedKey.set(result.iv, 32)

                    // Encrypt with LIT protocol
                    const { encryptedKey: encryptedSymmetricKey, keyHash } =
                      await this.keyManager.encryptSymmetricKey(
                        combinedKey.buffer,
                        result.dataToEncryptHash,
                        unifiedAccessControlConditions
                      )

                    // Store metadata with both hashes
                    await this.keyManager.storeKeyMetadata(
                      result.cid,
                      keyHash, // Hash of the symmetric key (from LIT)
                      result.dataToEncryptHash, // Hash of the original file
                      unifiedAccessControlConditions,
                      encryptedSymmetricKey
                    )
                  }
                }

                // Store session sigs for service worker access
                if (options.sessionSigs && this.keyManager) {
                  await this.keyManager.storeSessionSigs(options.sessionSigs)
                }

                resolve(result)
              } else {
                reject(new Error('Upload completed without result'))
              }
              break

            case 'error':
              worker.removeEventListener('message', handleMessage)
              reject(new Error(event.data.error))
              break
          }
        }

        worker.addEventListener('message', handleMessage)

        // Encode binary data to base64 before sending
        worker.postMessage({
          type: 'process-file',
          files,
          contract,
          contractName,
          to,
          unifiedAccessControlConditions,
          encryptionKey: encryptionKey
            ? arrayBufferToBase64(encryptionKey)
            : undefined,
          iv: iv ? uint8ArrayToBase64(iv) : undefined,
          transportPublicKey: transportPublicKey
            ? arrayBufferToBase64(transportPublicKey)
            : undefined,
        } as WorkerMessage)
      })
    })()
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.initPromise = null
    }
  }
}

// Helper function to encrypt the AES key with another key (for secure storage)
export async function encryptKey(
  keyToEncrypt: ArrayBuffer,
  wrappingKey: CryptoKey
): Promise<ArrayBuffer> {
  // Generate IV for key wrapping
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Encrypt the key
  const encryptedKey = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    keyToEncrypt
  )

  // Combine IV and encrypted key for storage
  const combined = new Uint8Array(iv.length + encryptedKey.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encryptedKey), iv.length)

  return combined.buffer
}

// Helper function to generate a wrapping key from a password
export async function deriveKeyFromPassword(
  password: string,
  salt?: Uint8Array
): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  // Generate or use provided salt
  const usedSalt = salt || crypto.getRandomValues(new Uint8Array(16))

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: usedSalt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  return { key, salt: usedSalt }
}
