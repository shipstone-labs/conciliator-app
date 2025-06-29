'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function DownloadPage() {
  const searchParams = useSearchParams()
  const [cid, setCid] = useState(searchParams.get('cid') || '')
  const [manifestJson, setManifestJson] = useState('')
  const [downloadMode, setDownloadMode] = useState<'cid' | 'manifest'>('cid')
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false)

  // Initialize service worker
  useEffect(() => {
    const initServiceWorker = async () => {
      try {
        // Register service worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register(
            '/download-service-worker.js'
          )

          // Wait for service worker to be active
          if (registration.active) {
            setServiceWorkerReady(true)
          } else {
            const sw = registration.installing || registration.waiting
            if (sw) {
              sw.addEventListener('statechange', () => {
                if (sw.state === 'activated') {
                  setServiceWorkerReady(true)
                }
              })
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize service worker:', err)
        setError('Failed to initialize download system')
      }
    }

    initServiceWorker()
  }, [])

  const handleDownload = async () => {
    setIsDownloading(true)
    setError(null)
    setSuccess(null)

    try {
      if (downloadMode === 'manifest' && manifestJson) {
        // Parse and validate the manifest
        const manifest = JSON.parse(manifestJson)

        if (!manifest.chunks || !manifest.symmetricKey || !manifest.iv) {
          throw new Error('Invalid manifest format')
        }

        // Generate a fake CID for the manifest
        const manifestId = `manifest-${Date.now()}-${Math.random().toString(36).substring(7)}`

        // Store manifest and key in the main key store
        const db = await openKeyStoreDB()

        // Import the symmetric key as CryptoKey
        const symmetricKey =
          manifest.symmetricKey instanceof Uint8Array
            ? manifest.symmetricKey
            : new Uint8Array(Object.values(manifest.symmetricKey))

        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          symmetricKey,
          { name: 'AES-CTR' },
          false, // non-extractable
          ['decrypt']
        )

        // Store manifest
        const manifestTx = db.transaction(['manifests'], 'readwrite')
        await manifestTx.objectStore('manifests').put({
          id: manifestId,
          manifest: {
            fileHash: manifest.fileHash,
            dataToEncryptHash: manifest.dataToEncryptHash,
            fileMetadata: manifest.fileMetadata,
            chunks: manifest.chunks,
          },
          created: Date.now(),
        })

        // Store crypto key
        const keyTx = db.transaction(['cryptoKeys'], 'readwrite')
        const iv =
          manifest.iv instanceof Uint8Array
            ? manifest.iv
            : new Uint8Array(Object.values(manifest.iv))

        await keyTx.objectStore('cryptoKeys').put({
          id: manifestId,
          cryptoKey,
          iv,
          algorithm: 'AES-CTR',
          created: Date.now(),
        })

        // Open download URL with manifest ID
        window.open(`/download/${manifestId}`, '_blank')
        setSuccess(
          'Download window opened! The file will be decrypted and downloaded automatically.'
        )

        // Clean up after 5 minutes
        setTimeout(
          async () => {
            try {
              const db = await openKeyStoreDB()
              const manifestTx = db.transaction(['manifests'], 'readwrite')
              await manifestTx.objectStore('manifests').delete(manifestId)
              const keyTx = db.transaction(['cryptoKeys'], 'readwrite')
              await keyTx.objectStore('cryptoKeys').delete(manifestId)
            } catch (e) {
              console.error('Failed to clean up:', e)
            }
          },
          5 * 60 * 1000
        )
      } else if (downloadMode === 'cid' && cid) {
        // Note: CID-based download requires LIT client from authentication system
        setError(
          'CID-based download requires LIT client from authentication system'
        )
      } else {
        setError('Please provide either a CID or manifest JSON')
      }
    } catch (err: any) {
      console.error('Download failed:', err)
      setError(err.message || 'Download failed')
    } finally {
      setIsDownloading(false)
    }
  }

  // Helper function to open the main key store DB
  const openKeyStoreDB = async () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('lit-key-store', 2)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('manifests')) {
          const store = db.createObjectStore('manifests', { keyPath: 'id' })
          store.createIndex('created', 'created', { unique: false })
        }

        if (!db.objectStoreNames.contains('cryptoKeys')) {
          const store = db.createObjectStore('cryptoKeys', { keyPath: 'id' })
          store.createIndex('created', 'created', { unique: false })
        }
      }
    })
  }

  const handleDirectDownload = () => {
    if (downloadMode === 'cid' && cid && serviceWorkerReady) {
      // Open download URL in new tab - service worker will intercept
      window.open(`/download/${cid}`, '_blank')
      setSuccess(
        'Download window opened! The file will be decrypted and downloaded automatically.'
      )
    } else if (downloadMode === 'manifest') {
      setError(
        'Direct download not available for manifest mode. Use the programmatic download button.'
      )
    } else {
      setError('Please provide a CID for direct download')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Secure File Download</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Download Settings</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="mode"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Download Method
            </label>
            <div id="mode" className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cid"
                  checked={downloadMode === 'cid'}
                  onChange={() => setDownloadMode('cid')}
                  className="mr-2"
                />
                CID (with LIT)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="manifest"
                  checked={downloadMode === 'manifest'}
                  onChange={() => setDownloadMode('manifest')}
                  className="mr-2"
                />
                Manifest JSON
              </label>
            </div>
          </div>

          {downloadMode === 'cid' ? (
            <div>
              <label
                htmlFor="cid"
                className="block text-sm font-medium text-gray-700"
              >
                File CID (Content Identifier)
              </label>
              <input
                id="cid"
                type="text"
                value={cid}
                onChange={(e) => setCid(e.target.value)}
                placeholder="Enter the metadata CID from upload"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the metadata CID you received after uploading a file
                (requires LIT)
              </p>
            </div>
          ) : (
            <div>
              <label
                htmlFor="manifest-json"
                className="block text-sm font-medium text-gray-700"
              >
                Manifest JSON
              </label>
              <textarea
                id="manifest-json"
                value={manifestJson}
                onChange={(e) => setManifestJson(e.target.value)}
                placeholder="Paste the manifest JSON here"
                rows={10}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Paste the complete manifest JSON that contains the encryption
                key and chunk information
              </p>
            </div>
          )}

          {!serviceWorkerReady && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                Initializing download system... Please wait.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={
            (downloadMode === 'cid' && !cid) ||
            (downloadMode === 'manifest' && !manifestJson) ||
            isDownloading ||
            !serviceWorkerReady
          }
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
            hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
            transition-colors duration-200"
        >
          {isDownloading ? 'Downloading...' : 'Download File (Programmatic)'}
        </button>

        <button
          type="button"
          onClick={handleDirectDownload}
          disabled={downloadMode !== 'cid' || !cid || !serviceWorkerReady}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium
            hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
            transition-colors duration-200"
        >
          Download File (Direct URL)
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3">How it works:</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700">CID Mode (with LIT):</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 ml-4">
              <li>Enter the metadata CID from a previous upload</li>
              <li>
                The system will connect to LIT Protocol to verify access
                permissions
              </li>
              <li>
                If you have permission, the file will be decrypted and
                downloaded
              </li>
              <li>
                The service worker handles transparent decryption during
                download
              </li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-gray-700">
              Manifest Mode (without LIT):
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 ml-4">
              <li>
                Paste the manifest JSON from upload (contains encryption key)
              </li>
              <li>
                The manifest includes all chunk CIDs and decryption information
              </li>
              <li>You can manually decrypt files using the manifest data</li>
              <li>No LIT Protocol access control is required</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
