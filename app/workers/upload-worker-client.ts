import type { WorkerMessage, WorkerResponse } from './upload-worker'
import { LitKeyManager } from './lit-key-manager'
import type { LitNodeClient, SessionSigsMap } from 'lit-wrapper'
import {
  arrayBufferToBase64,
  base64ToUint8Array,
  uint8ArrayToBase64,
} from './base64-utils'
import type { FileItem, UploadProgress } from './upload-worker-types'

export interface UploadOptions {
  files: File[]
  sessionToken?: string // JWT token for auth
  firebaseToken?: string // Firebase token if needed
  contract: `0x${string}`
  contractName: string
  to: `0x${string}`
  unifiedAccessControlConditions: any
  onProgress?: (progress: UploadProgress) => void
  encryptionKey?: ArrayBufferLike
  iv?: Uint8Array
  litClient?: LitNodeClient // Optional LIT client for key management
  sessionSigs?: SessionSigsMap // Optional session sigs (supports delegate sigs, relayer, etc.)
  enhancedSecurity?: boolean // Enable ephemeral key encryption for worker transport
  returnMetadata?: boolean // Skip returning metadata bundle when using LIT
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
      this.worker = new Worker(new URL('./upload-worker.ts', import.meta.url), {
        type: 'module',
      })
    }
    return this.worker
  }

  async initialize(options: {
    delegation?: ArrayBufferLike
    sessionToken?: string
    firebaseToken?: string
  }): Promise<void> {
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

        const message: WorkerMessage = { type: 'init' }

        if (options.sessionToken) {
          // New flow: pass session token to worker
          message.sessionToken = options.sessionToken
          if (options.firebaseToken) {
            message.firebaseToken = options.firebaseToken
          }
        } else {
          reject(new Error('Either delegation or sessionToken is required'))
          return
        }

        worker.postMessage(message)
      })
    })()

    return this.initPromise
  }

  async uploadFiles(options: UploadOptions): Promise<Array<FileItem>> {
    const {
      files,
      contract,
      contractName,
      to,
      unifiedAccessControlConditions,
      onProgress,
      encryptionKey,
      iv,
      returnMetadata,
    } = options

    // Ensure initialized
    await this.initialize({
      sessionToken: options.sessionToken,
      firebaseToken: options.firebaseToken,
    })

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

      return new Promise<Array<FileItem>>((resolve, reject) => {
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
                const result: Array<FileItem> = []
                for (const { metadataBuffer: _metadataBuffer, ...rest } of event
                  .data.result) {
                  let metadataBuffer: Uint8Array | undefined = _metadataBuffer
                  let dataToEncryptHash: string | undefined
                  if (metadataBuffer) {
                    if (options.enhancedSecurity && transportPrivateKey) {
                      metadataBuffer = new Uint8Array(
                        await crypto.subtle.decrypt(
                          { name: 'RSA-OAEP' },
                          transportPrivateKey,
                          metadataBuffer
                        )
                      )
                    }
                    if (this.keyManager && options.litClient) {
                      const {
                        ciphertext,
                        dataToEncryptHash: _dataToEncryptHash,
                      } = await options.litClient.encrypt({
                        unifiedAccessControlConditions,
                        dataToEncrypt: metadataBuffer,
                      })
                      dataToEncryptHash = _dataToEncryptHash
                      metadataBuffer = base64ToUint8Array(ciphertext)
                    } else {
                      metadataBuffer = undefined
                    }
                  }
                  result.push({ metadataBuffer, dataToEncryptHash, ...rest })
                }

                // Send CBOR back to worker for IPFS upload
                const uploadResponse = await new Promise<Array<FileItem>>(
                  (resolve, reject) => {
                    const uploadHandler = (
                      event: MessageEvent<WorkerResponse>
                    ) => {
                      if (event.data.type === 'complete' && event.data.result) {
                        worker.removeEventListener('message', uploadHandler)
                        resolve(event.data.result)
                      } else if (event.data.type === 'error') {
                        worker.removeEventListener('message', uploadHandler)
                        reject(new Error(event.data.error))
                      }
                    }

                    worker.addEventListener('message', uploadHandler)
                    worker.postMessage({
                      type: 'upload-metadata',
                      encryptedMetadatas: result,
                    } as WorkerMessage)
                  }
                )

                // Store session sigs for service worker access
                if (options.sessionSigs && this.keyManager) {
                  await this.keyManager.storeSessionSigs(options.sessionSigs)
                }

                resolve(uploadResponse)
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
          useLit: this.keyManager != null,
          returnMetadata,
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
  keyToEncrypt: ArrayBufferLike,
  wrappingKey: CryptoKey
): Promise<ArrayBuffer> {
  // Generate IV for key wrapping
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Encrypt the key
  const encryptedKey = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    new Uint8Array(keyToEncrypt)
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
