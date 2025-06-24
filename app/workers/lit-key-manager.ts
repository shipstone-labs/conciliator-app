import type { LitNodeClient, SessionSigsMap } from 'lit-wrapper'
import { decode } from 'cbor-x'

// IndexedDB schema for sharing data between main thread and service worker
const DB_NAME = 'lit-key-store'
const DB_VERSION = 2 // Bumped for new schema
const STORE_NAMES = {
  SESSION_SIGS: 'sessionSigs',
  CRYPTO_KEYS: 'cryptoKeys', // New store for CryptoKey objects
  MANIFESTS: 'manifests', // Store for manifest data
  KEY_METADATA: 'keyMetadata', // Legacy, kept for migration
}

interface StoredCryptoKey {
  id: string // Same as manifest ID or CID
  cryptoKey: CryptoKey
  iv: Uint8Array
  algorithm: string
  created: number
}

interface StoredManifest {
  id: string // manifest-ID or CID
  manifest: import('./car-streaming-format').MetadataV4
  created: number
}

// Legacy interface for migration compatibility
interface KeyMetadata {
  cid: string
  dataToEncryptHash: `0x${string}`
  fileHash: `0x${string}`
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

      // New store for CryptoKey objects
      if (!db.objectStoreNames.contains(STORE_NAMES.CRYPTO_KEYS)) {
        const store = db.createObjectStore(STORE_NAMES.CRYPTO_KEYS, {
          keyPath: 'id',
        })
        store.createIndex('created', 'created', { unique: false })
      }

      // New store for manifests
      if (!db.objectStoreNames.contains(STORE_NAMES.MANIFESTS)) {
        const store = db.createObjectStore(STORE_NAMES.MANIFESTS, {
          keyPath: 'id',
        })
        store.createIndex('created', 'created', { unique: false })
      }

      // Legacy stores - kept for migration (remove after migration)
      // These stores are not actively used but kept to avoid errors

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
  litClient: LitNodeClient // Made public for setupMainThreadKeyListener
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

  async getSessionSigs(): Promise<SessionSigsMap | null> {
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

  async init() {
    this.db = await initDB()
  }

  // Get manifest and corresponding CryptoKey
  async getManifestAndKey(id: string): Promise<{
    manifest: import('./car-streaming-format').MetadataV4
    cryptoKey: CryptoKey
    iv: Uint8Array
  } | null> {
    if (!this.db) throw new Error('Database not initialized')

    try {
      // First check if we have it cached in our stores
      const cached = await this.getCachedManifestAndKey(id)
      if (cached) return cached

      // If it's a CID, fetch from IPFS and cache
      if (!id.startsWith('manifest-')) {
        const manifest = await this.fetchAndDecryptManifest(id)
        if (manifest) {
          // Cache the manifest and key
          await this.cacheManifestAndKey(id, manifest)
          return this.getCachedManifestAndKey(id)
        }
      }

      return null
    } catch (error) {
      console.error('Failed to get manifest and key:', error)
      return null
    }
  }

  // Get cached manifest and key from IndexedDB
  private async getCachedManifestAndKey(id: string): Promise<{
    manifest: import('./car-streaming-format').MetadataV4
    cryptoKey: CryptoKey
    iv: Uint8Array
  } | null> {
    if (!this.db) return null

    // Get manifest
    const manifestTx = this.db.transaction([STORE_NAMES.MANIFESTS], 'readonly')
    const manifestStore = manifestTx.objectStore(STORE_NAMES.MANIFESTS)
    const manifestEntry = await new Promise<StoredManifest | undefined>(
      (resolve, reject) => {
        const request = manifestStore.get(id)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }
    )

    if (!manifestEntry) return null

    // Get crypto key
    const keyTx = this.db.transaction([STORE_NAMES.CRYPTO_KEYS], 'readonly')
    const keyStore = keyTx.objectStore(STORE_NAMES.CRYPTO_KEYS)
    const keyEntry = await new Promise<StoredCryptoKey | undefined>(
      (resolve, reject) => {
        const request = keyStore.get(id)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }
    )

    if (!keyEntry) return null

    return {
      manifest: manifestEntry.manifest,
      cryptoKey: keyEntry.cryptoKey,
      iv: keyEntry.iv,
    }
  }

  // Cache manifest and key after fetching from IPFS
  private async cacheManifestAndKey(
    id: string,
    manifest: import('./car-streaming-format').MetadataV4
  ): Promise<void> {
    if (!this.db) return

    // Import the symmetric key as CryptoKey
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      manifest.symmetricKey,
      { name: 'AES-CTR' },
      false, // non-extractable
      ['decrypt']
    )

    // Store manifest
    const manifestTx = this.db.transaction([STORE_NAMES.MANIFESTS], 'readwrite')
    const manifestStore = manifestTx.objectStore(STORE_NAMES.MANIFESTS)
    await new Promise<void>((resolve, reject) => {
      const request = manifestStore.put({
        id,
        manifest: {
          fileHash: manifest.fileHash,
          dataToEncryptHash: manifest.dataToEncryptHash,
          fileMetadata: manifest.fileMetadata,
          chunks: manifest.chunks,
        },
        created: Date.now(),
      } as StoredManifest)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    // Store crypto key
    const keyTx = this.db.transaction([STORE_NAMES.CRYPTO_KEYS], 'readwrite')
    const keyStore = keyTx.objectStore(STORE_NAMES.CRYPTO_KEYS)
    await new Promise<void>((resolve, reject) => {
      const request = keyStore.put({
        id,
        cryptoKey,
        iv: manifest.iv,
        algorithm: 'AES-CTR',
        created: Date.now(),
      } as StoredCryptoKey)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Fetch and decrypt manifest from IPFS (for CID-based downloads)
  private async fetchAndDecryptManifest(
    cid: string
  ): Promise<import('./car-streaming-format').MetadataV4 | null> {
    try {
      // Fetch the CBOR file from IPFS
      const response = await fetch(`/api/download/${cid}`)
      if (!response.ok) {
        throw new Error('Failed to fetch manifest from IPFS')
      }

      const data = await response.arrayBuffer()
      const { decode } = await import('cbor-x')
      const decoded = decode(new Uint8Array(data)) as import(
        './car-streaming-format'
      ).ManifestV4

      if (decoded.version !== 'LIT-ENCRYPTED-V4') {
        throw new Error('Unsupported manifest version')
      }

      // Request decryption from main thread
      const decryptedManifest = await this.requestManifestDecryption(
        cid,
        decoded.accessControlConditions,
        decoded.encryptedManifest
      )

      return decryptedManifest
    } catch (error) {
      console.error('Failed to fetch and decrypt manifest:', error)
      return null
    }
  }

  // Request manifest decryption from main thread
  private async requestManifestDecryption(
    cid: string,
    accessControlConditions: any[],
    encryptedManifest: string
  ): Promise<import('./car-streaming-format').MetadataV4 | null> {
    return new Promise((resolve) => {
      const channel = new BroadcastChannel('lit-key-requests')
      const timeout = setTimeout(() => {
        channel.close()
        resolve(null)
      }, 5000)

      channel.onmessage = (event) => {
        if (event.data.type === 'manifest-response' && event.data.cid === cid) {
          clearTimeout(timeout)
          channel.close()
          resolve(event.data.manifest || null)
        }
      }

      channel.postMessage({
        type: 'manifest-request',
        cid,
        accessControlConditions,
        encryptedManifest,
      })
    })
  }
}

// Main thread listener for key requests
export function setupMainThreadKeyListener(manager: LitKeyManager) {
  const channel = new BroadcastChannel('lit-key-requests')

  channel.onmessage = async (event) => {
    if (event.data.type === 'manifest-request') {
      const { cid, accessControlConditions, encryptedManifest } = event.data
      try {
        // Decrypt the manifest using LIT
        const sessionSigs = await manager.getSessionSigs()
        if (!sessionSigs) {
          throw new Error('No session signatures available')
        }

        // Parse the encrypted data
        const encryptedData = JSON.parse(encryptedManifest)

        // Decrypt with LIT
        const decrypted = await manager.litClient.decrypt({
          unifiedAccessControlConditions: accessControlConditions,
          ciphertext: encryptedData.ciphertext,
          dataToEncryptHash: encryptedData.dataToEncryptHash,
          sessionSigs,
          chain: 'filecoinCalibrationTestnet',
        })

        // Parse the decrypted manifest
        const manifest = decode(new Uint8Array(decrypted.decryptedData))

        channel.postMessage({
          type: 'manifest-response',
          cid,
          manifest,
        })
      } catch (error) {
        console.error('Failed to decrypt manifest:', error)
        channel.postMessage({
          type: 'manifest-response',
          cid,
          manifest: null,
        })
      }
    }
  }

  return () => channel.close()
}
