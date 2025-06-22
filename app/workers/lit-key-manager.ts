import type { LitNodeClient, SessionSigsMap } from 'lit-wrapper'

// IndexedDB schema for sharing data between main thread and service worker
const DB_NAME = 'lit-key-store'
const DB_VERSION = 1
const STORE_NAMES = {
  SESSION_SIGS: 'sessionSigs',
  ENCRYPTED_KEYS: 'encryptedKeys',
  KEY_METADATA: 'keyMetadata',
}

interface KeyMetadata {
  cid: string
  dataToEncryptHash: `0x${string}` // Hash of the symmetric key (from LIT)
  fileHash: `0x${string}` // Hash of the original file content
  unifiedAccessControlConditions: any[]
  encryptedSymmetricKey: string
  createdAt: number
}

// Initialize IndexedDB
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Store for session signatures
      if (!db.objectStoreNames.contains(STORE_NAMES.SESSION_SIGS)) {
        db.createObjectStore(STORE_NAMES.SESSION_SIGS)
      }

      // Store for encrypted keys
      if (!db.objectStoreNames.contains(STORE_NAMES.ENCRYPTED_KEYS)) {
        const store = db.createObjectStore(STORE_NAMES.ENCRYPTED_KEYS, {
          keyPath: 'cid',
        })
        store.createIndex('dataToEncryptHash', 'dataToEncryptHash', {
          unique: false,
        })
      }

      // Store for key metadata
      if (!db.objectStoreNames.contains(STORE_NAMES.KEY_METADATA)) {
        const store = db.createObjectStore(STORE_NAMES.KEY_METADATA, {
          keyPath: 'cid',
        })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
}

// Main thread functions
export class LitKeyManager {
  private litClient: LitNodeClient
  private db: IDBDatabase | null = null

  constructor(litClient: LitNodeClient) {
    this.litClient = litClient
  }

  async init() {
    this.db = await initDB()
  }

  // Store session signatures in IndexedDB for service worker access
  async storeSessionSigs(sessionSigs: SessionSigsMap): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const tx = this.db.transaction([STORE_NAMES.SESSION_SIGS], 'readwrite')
    const store = tx.objectStore(STORE_NAMES.SESSION_SIGS)

    // Store with timestamp for expiry checking
    store.put(
      {
        sigs: sessionSigs,
        timestamp: Date.now(),
      },
      'current'
    )

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(undefined)
      tx.onerror = () => reject(tx.error)
    })
  }

  // Encrypt the symmetric key using LIT protocol
  async encryptSymmetricKey(
    symmetricKey: ArrayBuffer,
    _dataToEncryptHash: `0x${string}`, // Currently LIT does not require it on the input, but for large content this would normally be preferred.
    unifiedAccessControlConditions: any[]
  ): Promise<{ encryptedKey: string; keyHash: `0x${string}` }> {
    const encryptedKey = await this.litClient.encrypt({
      unifiedAccessControlConditions,
      dataToEncrypt: new Uint8Array(symmetricKey),
    })
    return {
      encryptedKey: JSON.stringify(encryptedKey),
      keyHash: encryptedKey.dataToEncryptHash as `0x${string}`,
    }
  }

  // V4: Encrypt entire metadata bundle with LIT
  async encryptMetadataBundle(
    metadataBytes: Uint8Array,
    unifiedAccessControlConditions: any[]
  ): Promise<{ encryptedBundle: string; bundleHash: `0x${string}` }> {
    const encrypted = await this.litClient.encrypt({
      unifiedAccessControlConditions,
      dataToEncrypt: metadataBytes,
    })
    return {
      encryptedBundle: JSON.stringify(encrypted),
      bundleHash: encrypted.dataToEncryptHash as `0x${string}`,
    }
  }

  // V4: Store encrypted metadata bundle reference
  async storeV4Metadata(
    cid: string, // Manifest CID
    metadataCID: string, // Encrypted metadata CID
    bundleHash: `0x${string}`, // Hash of the metadata bundle
    unifiedAccessControlConditions: any[]
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const metadata = {
      cid,
      metadataCID,
      bundleHash,
      unifiedAccessControlConditions,
      version: 'V4',
      createdAt: Date.now(),
    }

    const tx = this.db.transaction([STORE_NAMES.KEY_METADATA], 'readwrite')
    const store = tx.objectStore(STORE_NAMES.KEY_METADATA)
    store.put(metadata)

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(undefined)
      tx.onerror = () => reject(tx.error)
    })
  }

  // Store encrypted key metadata (V3)
  async storeKeyMetadata(
    cid: string,
    dataToEncryptHash: `0x${string}`, // Hash of the symmetric key
    fileHash: `0x${string}`, // Hash of the original file
    unifiedAccessControlConditions: any[],
    encryptedSymmetricKey: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const metadata: KeyMetadata = {
      cid,
      dataToEncryptHash,
      fileHash,
      unifiedAccessControlConditions,
      encryptedSymmetricKey,
      createdAt: Date.now(),
    }

    const tx = this.db.transaction([STORE_NAMES.KEY_METADATA], 'readwrite')
    const store = tx.objectStore(STORE_NAMES.KEY_METADATA)
    store.put(metadata)

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(undefined)
      tx.onerror = () => reject(tx.error)
    })
  }

  // Get V4 decrypted key from encrypted metadata bundle
  async getV4DecryptedKey(
    cid: string,
    metadataCID: string
  ): Promise<{
    key: ArrayBuffer
    iv: Uint8Array
  } | null> {
    if (!this.db) throw new Error('Database not initialized')

    // Get V4 metadata
    const tx = this.db.transaction([STORE_NAMES.KEY_METADATA], 'readonly')
    const store = tx.objectStore(STORE_NAMES.KEY_METADATA)
    const metadata = await new Promise<any>((resolve, reject) => {
      const request = store.get(cid)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (!metadata || metadata.version !== 'V4') return null

    // Get session sigs
    const sessionSigs = await this.getSessionSigs()
    if (!sessionSigs) throw new Error('No session signatures available')

    // Fetch encrypted metadata bundle
    const response = await fetch(`/api/download/${metadataCID}`)
    if (!response.ok) {
      throw new Error('Failed to fetch encrypted metadata')
    }

    const encryptedBundleText = await response.text()

    // Parse the LIT-encrypted object that was stored as JSON
    const encryptedData = JSON.parse(encryptedBundleText)

    // Decrypt metadata bundle with LIT
    // Note: This assumes the metadata was encrypted with LIT, not RSA
    // For RSA-encrypted metadata, we'd need a different approach
    const decrypted = await this.litClient.decrypt({
      unifiedAccessControlConditions: metadata.unifiedAccessControlConditions,
      ciphertext: encryptedData.ciphertext,
      dataToEncryptHash: metadata.bundleHash,
      sessionSigs,
      chain: 'filecoinCalibrationTestnet',
    })

    // Parse decrypted metadata
    const { parseMetadataV4 } = await import('./car-streaming-format')
    const decryptedMetadata = await parseMetadataV4(
      new Uint8Array(decrypted.decryptedData)
    )

    // Ensure we return a proper ArrayBuffer
    const keyUint8Array = decryptedMetadata.symmetricKey
    // Create a new ArrayBuffer and copy the data
    const key = new ArrayBuffer(keyUint8Array.length)
    new Uint8Array(key).set(keyUint8Array)

    return {
      key,
      iv: decryptedMetadata.iv,
    }
  }

  // Retrieve and decrypt symmetric key (V3)
  async getDecryptedKey(
    cid: string
  ): Promise<{ key: ArrayBuffer; iv: Uint8Array } | null> {
    if (!this.db) throw new Error('Database not initialized')

    // Get metadata
    const tx = this.db.transaction([STORE_NAMES.KEY_METADATA], 'readonly')
    const store = tx.objectStore(STORE_NAMES.KEY_METADATA)
    const metadata = await new Promise<KeyMetadata | undefined>(
      (resolve, reject) => {
        const request = store.get(cid)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }
    )

    if (!metadata) return null

    // Get current session sigs
    const sessionSigs = await this.getSessionSigs()
    if (!sessionSigs) throw new Error('No session signatures available')

    // Decrypt the symmetric key using LIT
    const encryptedKey = JSON.parse(metadata.encryptedSymmetricKey)
    const decryptedKey = await this.litClient.decrypt({
      unifiedAccessControlConditions: metadata.unifiedAccessControlConditions,
      ciphertext: encryptedKey.ciphertext,
      dataToEncryptHash: metadata.dataToEncryptHash,
      sessionSigs,
      chain: 'filecoinCalibrationTestnet',
    })

    // The decrypted key should contain both key and IV
    // Assuming format: first 32 bytes = key, next 12 bytes = IV
    const keyData = new Uint8Array(decryptedKey.decryptedData)
    const key = keyData.slice(0, 32)
    const iv = keyData.slice(32, 44)

    return {
      key: key.buffer,
      iv,
    }
  }

  private async getSessionSigs(): Promise<SessionSigsMap | null> {
    if (!this.db) throw new Error('Database not initialized')

    const tx = this.db.transaction([STORE_NAMES.SESSION_SIGS], 'readonly')
    const store = tx.objectStore(STORE_NAMES.SESSION_SIGS)
    const data = await new Promise<any>((resolve, reject) => {
      const request = store.get('current')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (!data) return null

    // Check if expired (e.g., 24 hours)
    const AGE_LIMIT = 24 * 60 * 60 * 1000
    if (Date.now() - data.timestamp > AGE_LIMIT) {
      return null
    }

    return data.sigs
  }
}

// Service worker functions
export class ServiceWorkerKeyManager {
  private db: IDBDatabase | null = null
  private decryptedKeys = new Map<string, { key: CryptoKey; iv: Uint8Array }>()

  async init() {
    this.db = await initDB()
  }

  // Called when service worker needs to decrypt a file
  async getDecryptionKey(
    cid: string
  ): Promise<{ key: CryptoKey; iv: Uint8Array } | null> {
    // Check cache first
    const cached = this.decryptedKeys.get(cid)
    if (cached) return cached

    if (!this.db) throw new Error('Database not initialized')

    // Get metadata
    const metadataTx = this.db.transaction(
      [STORE_NAMES.KEY_METADATA],
      'readonly'
    )
    const metadataStore = metadataTx.objectStore(STORE_NAMES.KEY_METADATA)
    const metadata = await new Promise<any>((resolve, reject) => {
      const request = metadataStore.get(cid)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (!metadata) return null

    // Handle V4 metadata differently
    if (metadata.version === 'V4') {
      // For V4, we need to decrypt the metadata bundle first
      // This requires coordination with the main thread
      const keyData = await this.requestV4KeyFromMainThread(
        cid,
        metadata.metadataCID
      )
      if (!keyData) return null

      // Import and cache
      const key = await crypto.subtle.importKey(
        'raw',
        keyData.key,
        { name: 'AES-CTR', length: 256 },
        false,
        ['decrypt']
      )

      const result = { key, iv: keyData.iv }
      this.decryptedKeys.set(cid, result)
      return result
    }

    // For V3, check if we have a pre-decrypted key
    const keyTx = this.db.transaction([STORE_NAMES.ENCRYPTED_KEYS], 'readonly')
    const keyStore = keyTx.objectStore(STORE_NAMES.ENCRYPTED_KEYS)
    const encryptedKeyData = await new Promise<any>((resolve, reject) => {
      const request = keyStore.get(cid)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (!encryptedKeyData) {
      // Request key from main thread via BroadcastChannel
      const keyData = await this.requestKeyFromMainThread(cid)
      if (!keyData) return null

      // Import and cache
      const key = await crypto.subtle.importKey(
        'raw',
        keyData.key,
        { name: 'AES-CTR', length: 256 },
        false,
        ['decrypt']
      )

      const result = { key, iv: keyData.iv }
      this.decryptedKeys.set(cid, result)
      return result
    }

    return null
  }

  private async requestV4KeyFromMainThread(
    cid: string,
    metadataCID: string
  ): Promise<{ key: ArrayBuffer; iv: Uint8Array } | null> {
    return new Promise((resolve) => {
      const channel = new BroadcastChannel('lit-key-requests')
      const timeout = setTimeout(() => {
        channel.close()
        resolve(null)
      }, 5000)

      channel.onmessage = (event) => {
        if (event.data.cid === cid && event.data.key && event.data.iv) {
          clearTimeout(timeout)
          channel.close()
          resolve({
            key: event.data.key,
            iv: new Uint8Array(event.data.iv),
          })
        }
      }

      // Request V4 key with metadata CID
      channel.postMessage({ type: 'request-v4-key', cid, metadataCID })
    })
  }

  private async requestKeyFromMainThread(
    cid: string
  ): Promise<{ key: ArrayBuffer; iv: Uint8Array } | null> {
    return new Promise((resolve) => {
      const channel = new BroadcastChannel('lit-key-requests')
      const timeout = setTimeout(() => {
        channel.close()
        resolve(null)
      }, 5000)

      channel.onmessage = (event) => {
        if (event.data.type === 'key-response' && event.data.cid === cid) {
          clearTimeout(timeout)
          channel.close()
          resolve(
            event.data.key
              ? {
                  key: event.data.key,
                  iv: new Uint8Array(event.data.iv),
                }
              : null
          )
        }
      }

      channel.postMessage({ type: 'key-request', cid })
    })
  }

  // Clean up old keys
  async cleanup(maxAge: number = 24 * 60 * 60 * 1000) {
    if (!this.db) return

    const now = Date.now()
    const tx = this.db.transaction([STORE_NAMES.KEY_METADATA], 'readwrite')
    const store = tx.objectStore(STORE_NAMES.KEY_METADATA)
    const index = store.index('createdAt')

    const range = IDBKeyRange.upperBound(now - maxAge)
    const cursorRequest = index.openCursor(range)

    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }
  }
}

// Main thread listener for key requests
export function setupMainThreadKeyListener(manager: LitKeyManager) {
  const channel = new BroadcastChannel('lit-key-requests')

  channel.onmessage = async (event) => {
    if (event.data.type === 'key-request') {
      const { cid } = event.data
      try {
        const keyData = await manager.getDecryptedKey(cid)
        channel.postMessage({
          type: 'key-response',
          cid,
          key: keyData?.key,
          iv: keyData?.iv ? Array.from(keyData.iv) : null,
        })
      } catch (error) {
        console.error('Failed to decrypt key:', error)
        channel.postMessage({
          type: 'key-response',
          cid,
          key: null,
          iv: null,
        })
      }
    } else if (event.data.type === 'request-v4-key') {
      const { cid, metadataCID } = event.data
      try {
        // For V4, we need to fetch and decrypt the metadata bundle
        const keyData = await manager.getV4DecryptedKey(cid, metadataCID)
        channel.postMessage({
          type: 'key-response',
          cid,
          key: keyData?.key,
          iv: keyData?.iv ? Array.from(keyData.iv) : null,
        })
      } catch (error) {
        console.error('Failed to decrypt V4 key:', error)
        channel.postMessage({
          type: 'key-response',
          cid,
          key: null,
          iv: null,
        })
      }
    }
  }

  return () => channel.close()
}
