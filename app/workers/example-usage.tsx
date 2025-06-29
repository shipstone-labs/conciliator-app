'use client'

import { useState, useCallback } from 'react'
import {
  UploadWorkerClient,
  encryptKey,
  deriveKeyFromPassword,
} from './upload-worker-client'
import type { UploadResult } from './upload-worker-client'

// Example component showing how to use the upload worker
export function SecureFileUpload() {
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(selectedFiles)
  }

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      // 1. Get UCAN delegation from your API
      const delegationResponse = await fetch('/api/ucan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'unique-id-here', // Generate unique ID
          did: 'did:key:...', // Your DID
        }),
      })

      if (!delegationResponse.ok) {
        throw new Error('Failed to get delegation')
      }

      const delegation = await delegationResponse.arrayBuffer()

      // 2. Create worker client
      const client = new UploadWorkerClient()

      // 3. Configure LIT protocol parameters
      const contract = '0x...' as `0x${string}` // Your contract address
      const contractName = 'YourContract'
      const to = '0x...' as `0x${string}` // Recipient address
      const unifiedAccessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: contract,
          standardContractType: 'ERC1155',
          chain: 'filecoinCalibrationTestnet',
          method: 'balanceOf',
          parameters: [':userAddress', 'tokenId'],
          returnValueTest: {
            comparator: '>',
            value: '0',
          },
        },
      ]

      // 4. Upload files with encryption
      const uploadResult = await client.uploadFiles({
        files,
        delegation,
        contract,
        contractName,
        to,
        unifiedAccessControlConditions,
        onProgress: (progress) => setProgress(progress),
      })

      // 5. Further encrypt the AES key with a password-derived key
      const password = prompt('Enter a password to secure your encryption key:')
      if (!password) {
        throw new Error('Password required')
      }

      const { key: wrappingKey, salt } = await deriveKeyFromPassword(password)
      const securelyStoredKey = await encryptKey(
        uploadResult.encryptedKey,
        wrappingKey
      )

      // 6. Store the result (you would typically save this to your backend)
      console.log({
        cid: uploadResult.cid,
        encryptedKey: securelyStoredKey, // Store this securely
        iv: uploadResult.iv, // Store this with the encrypted data
        dataToEncryptHash: uploadResult.dataToEncryptHash, // Hash of symmetric key
        fileHash: uploadResult.fileHash, // Hash of original file
        salt, // Store this to recreate the wrapping key later
      })

      setResult(uploadResult)

      // Clean up
      client.terminate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [files])

  return (
    <div className="p-4 space-y-4">
      <div>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {files.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Selected Files:</h3>
          <ul className="list-disc list-inside">
            {files.map((file, index) => (
              <li key={index} className="text-sm">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={files.length === 0 || uploading}
        className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
      >
        {uploading ? 'Uploading...' : 'Upload Securely'}
      </button>

      {uploading && (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {progress.toFixed(1)}% complete
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="p-3 bg-green-100 text-green-700 rounded-md">
          <p>Upload successful!</p>
          <p className="text-sm mt-1">CID: {result.cid}</p>
        </div>
      )}
    </div>
  )
}

// Example of how to decrypt and retrieve files later
export async function retrieveAndDecryptFiles(
  cid: string,
  encryptedKey: ArrayBuffer,
  iv: Uint8Array,
  password: string,
  salt: Uint8Array
) {
  // 1. Recreate the wrapping key from password
  const { key: wrappingKey } = await deriveKeyFromPassword(password, salt)

  // 2. Decrypt the AES key
  const combinedKey = new Uint8Array(encryptedKey)
  const keyIv = combinedKey.slice(0, 12)
  const keyData = combinedKey.slice(12)

  const decryptedKeyData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: keyIv },
    wrappingKey,
    keyData
  )

  // 3. Import the decrypted AES key
  const aesKey = await crypto.subtle.importKey(
    'raw',
    decryptedKeyData,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  )

  // 4. Fetch the encrypted data from IPFS/Storacha
  const response = await fetch(`/api/download/${cid}`)
  const encryptedData = await response.arrayBuffer()

  // 5. Decrypt the data
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encryptedData
  )

  // 6. Parse CBOR data
  // Note: You'll need to import decode from cbor-x
  // const decoded = decode(new Uint8Array(decryptedData))

  return decryptedData
}
