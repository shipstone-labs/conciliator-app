'use client'

import { useState, useEffect } from 'react'
import { UploadWorkerClient } from '@/app/workers/upload-worker-client'
import type { Address, Hex } from 'viem'
import { useConfig, useSession } from '@/components/AuthLayout'
import { useStytch } from '@stytch/nextjs'
import type { AuthMethod, SessionSigsMap } from 'lit-wrapper'
import { getFirestore } from 'firebase/firestore'
import { createW3Client } from 'web-storage-wrapper'

export default function UploadPage() {
  // Get required dependencies - exactly like the original
  const { litClient: _litClient, sessionSigs: _sessionSigs } = useSession([
    'stytchUser',
    'fbUser',
  ])
  const [sessionSigs, setSessionSigs] = useState<{
    authMethod: AuthMethod
    pkpPublicKey: string
    address: Address
    sessionSigs: SessionSigsMap
  }>()
  const stytchClient = useStytch()
  const [delegation, setDelegation] = useState<ArrayBufferLike>()
  const config = useConfig()
  const _fb = getFirestore()
  const _storacha = useEffect(() => {
    _sessionSigs.wait().then((sessionSigs) => {
      console.log(sessionSigs)
      setSessionSigs(sessionSigs)
      setRecipientAddress(sessionSigs.address)
    })
  }, [_sessionSigs])
  useEffect(() => {
    createW3Client().then((client) => {
      const { session_jwt } = stytchClient?.session?.getTokens?.() || {}
      const did = client.agent.did()
      fetch('/api/ucan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session_jwt}`,
        },
        body: JSON.stringify({
          did,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to store invention')
          }
          return res.blob()
        })
        .then((data) => {
          return data.bytes()
        })
        .then((data) => {
          setDelegation(data.buffer)
        })
    })
  })
  const [uploadClient, setUploadClient] = useState<UploadWorkerClient | null>(
    null
  )
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Access control settings
  const [contractAddress, setContractAddress] = useState<Address>(
    (config.CONTRACT as Hex) || '0x'
  )
  const [contractName, setContractName] = useState<string>(
    (config.CONTRACT_NAME as string) || ''
  )
  const [recipientAddress, setRecipientAddress] = useState<Address>(
    sessionSigs?.address || '0x'
  )
  const [enhancedSecurity, setEnhancedSecurity] = useState(false)

  // Initialize upload client without LIT
  useEffect(() => {
    // Create upload client without LIT client
    const upClient = new UploadWorkerClient()
    setUploadClient(upClient)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
      setUploadResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!uploadClient || selectedFiles.length === 0) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Create access control conditions
      const unifiedAccessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress:
            contractAddress || '0x0000000000000000000000000000000000000000',
          standardContractType: '',
          chain: 'ethereum',
          method: 'balanceOf',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '>=',
            value: '0',
          },
        },
      ]

      // If recipient address is specified, add it to conditions
      if (recipientAddress) {
        unifiedAccessControlConditions.push({
          operator: 'or',
        } as any)
        unifiedAccessControlConditions.push({
          conditionType: 'evmBasic',
          contractAddress: '0x0000000000000000000000000000000000000000',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: recipientAddress,
          },
        })
      }

      // Create a dummy UCAN delegation (you'll need to get this from your auth system)
      if (!delegation) {
        throw new Error('No Delegation')
      }
      const result = await uploadClient.uploadFiles({
        files: selectedFiles,
        delegation,
        contract:
          contractAddress || '0x0000000000000000000000000000000000000000',
        contractName: contractName || 'Default',
        to: recipientAddress || '0x0000000000000000000000000000000000000000',
        unifiedAccessControlConditions,
        onProgress: (progress) => {
          setUploadProgress(progress)
        },
        enhancedSecurity,
      })

      setUploadResult(result)
      console.log('Upload result:', result)
    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Secure File Upload</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Files</h2>

        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="mb-4 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />

        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Selected Files:</h3>
            <ul className="list-disc list-inside">
              {selectedFiles.map((file, index) => (
                <li key={index} className="text-sm text-gray-600">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Access Control Settings</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="contract-address"
              className="block text-sm font-medium text-gray-700"
            >
              Contract Address (optional)
            </label>
            <input
              id="contract-address"
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value as Address)}
              placeholder="0x..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="contract-name"
              className="block text-sm font-medium text-gray-700"
            >
              Contract Name (optional)
            </label>
            <input
              type="text"
              id="contract-name"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="MyNFT"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="recipient-address"
              className="block text-sm font-medium text-gray-700"
            >
              Recipient Address (optional)
            </label>
            <input
              id="recipient-address"
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value as Address)}
              placeholder="0x..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              id="enhanced-security"
              type="checkbox"
              checked={enhancedSecurity}
              onChange={(e) => setEnhancedSecurity(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="enhanced-security"
              className="ml-2 block text-sm text-gray-900"
            >
              Enable enhanced security (RSA encryption during transport)
            </label>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleUpload}
        disabled={!uploadClient || selectedFiles.length === 0 || isUploading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
          hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
          transition-colors duration-200"
      >
        {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Files'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {uploadResult && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">
            Upload Successful!
          </h3>
          <div className="space-y-2">
            {uploadResult.cid ? (
              <>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Root CID:</span>{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {uploadResult.rootCid || uploadResult.cid}
                  </code>
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Metadata CID:</span>{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {uploadResult.metadataCid || uploadResult.cid}
                  </code>
                </p>
                <div className="mt-3">
                  <a
                    href={`/download?cid=${uploadResult.metadataCid || uploadResult.cid}`}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Test download this file →
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    No LIT client provided - Copy this manifest to download:
                  </p>
                  <textarea
                    readOnly
                    value={
                      uploadResult.metadataBundle
                        ? JSON.stringify(
                            JSON.parse(
                              new TextDecoder().decode(
                                uploadResult.metadataBundle
                              )
                            ),
                            null,
                            2
                          )
                        : 'No manifest available'
                    }
                    className="w-full h-64 p-2 text-xs font-mono bg-white border border-gray-300 rounded"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Save this manifest JSON - it contains the encryption key
                    needed to decrypt your files.
                  </p>
                </div>
                <div className="mt-3">
                  <a
                    href="/download"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Go to download page →
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
