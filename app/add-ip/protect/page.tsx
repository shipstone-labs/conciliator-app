'use client'

import { useAddIPContext } from '@/components/AddIP/AddIPContext'
import { useRouter } from 'next/navigation'
import { AddStepContent } from '@/components/AddIP/AddStepContent'
import { AddStepPublic } from '@/components/AddIP/AddStepPublic'
import { useSession, useConfig } from '@/components/AuthLayout'
import { useStytch } from '@stytch/nextjs'
import { collection, doc, getFirestore } from 'firebase/firestore'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { AddDoc } from '@/components/AddIP'
import type { EncryptResponse } from 'lit-wrapper'
import { downsample } from '@/lib/downsample'
import { bytesToHex, type Hex, pad } from 'viem'

// Copy the helper function from the original component
const firestoreIdToHex = (base64: string): Hex => {
  return bytesToHex(
    pad(new Uint8Array([...atob(base64)].map((c) => c.charCodeAt(0))), {
      size: 32,
      dir: 'left',
    })
  )
}

export default function ProtectPage() {
  const { formData, updateFormData } = useAddIPContext()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState<string>('')

  // Get required dependencies - exactly like the original
  const { litClient: _litClient, sessionSigs: _sessionSigs } = useSession([
    'stytchUser',
    'fbUser',
  ])
  const stytchClient = useStytch()
  const config = useConfig()
  const fb = getFirestore()

  // Create ipDoc that bridges our context with the existing components
  const [ipDoc, setIPDoc] = useState<AddDoc>({
    // Map context fields to IPDoc fields
    name: formData.title,
    description: formData.description,
    creator: '',
    category: '',
    tags: ['IP'],
    metadata: {
      tokenId: '0x0' as `0x${string}`,
      cid: '',
      mint: '0x0' as `0x${string}`,
      transfer: '0x0' as `0x${string}`,
      update: '0x0' as `0x${string}`,
    },
    encrypted: {
      cid: '',
      acl: '',
      hash: '',
    },
    downSampled: {
      cid: '',
      acl: '',
      hash: '',
    },
    updatedAt: null as any,
    createdAt: null as any,
    // AddDoc specific fields
    content: formData.file ? 'file-loaded' : undefined,
    error: undefined,
    useAIAgent: formData.enableAI,
  })

  // Handle updates from AddStepPublic (updates name/description)
  const handlePublicUpdate = useCallback(
    (value: AddDoc | ((prev: AddDoc) => AddDoc)) => {
      setIPDoc((prev) => {
        const updated = typeof value === 'function' ? value(prev) : value
        // Sync name/description to our context's title/description
        updateFormData({
          title: updated.name,
          description: updated.description,
        })
        return updated
      })
    },
    [updateFormData]
  )

  // Handle updates from AddStepContent (handles file reading)
  const handleContentUpdate = useCallback(
    (value: AddDoc | ((prev: AddDoc) => AddDoc)) => {
      setIPDoc((prev) => {
        const updated = typeof value === 'function' ? value(prev) : value
        // When content is set, it means file was read
        if (updated.content && !formData.file) {
          // Get the file from the input
          const fileInput = document.querySelector(
            'input[type="file"]'
          ) as HTMLInputElement
          if (fileInput?.files?.[0]) {
            updateFormData({
              file: fileInput.files[0],
              fileName: fileInput.files[0].name,
            })
          }
        }
        return updated
      })
    },
    [formData.file, updateFormData]
  )

  // Check if we can continue/create
  const canContinue = ipDoc.name && ipDoc.description && ipDoc.content

  const handleContinue = () => {
    router.push('/add-ip/share')
  }

  // handleStore logic - copied from the original component with minimal changes
  const handleCreateNow = useCallback(async () => {
    if (!ipDoc.content) {
      setIPDoc((prev) => ({
        ...prev,
        error: 'Please upload a file first',
      }))
      return
    }

    // Set defaults for quick creation
    updateFormData({
      duration: 30,
      viewOnly: true,
      allowDownload: false,
      enableAI: false,
    })

    const { content, ...internalDoc } = ipDoc
    setIsLoading(true)
    setLocalStatus('Encrypting your idea')

    try {
      const litClient = await _litClient.wait()
      if (!litClient) {
        throw new Error('Lit client is not initialized')
      }
      const ref = doc(collection(fb, 'ip'))
      const id = ref.id
      const tokenId = firestoreIdToHex(id)

      setLocalStatus('Storing your idea')
      const sessionSigs = await _sessionSigs.wait()
      const { address } = sessionSigs || {}

      // Access control conditions - exactly as in original
      const downSampledUnifiedAccessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: config.CONTRACT,
          standardContractType: '',
          chain: 'filecoinCalibrationTestnet',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: config.LIT_ADDRESS,
          },
        },
        { conditionType: 'operator', operator: 'or' },
        {
          conditionType: 'evmBasic',
          contractAddress: config.CONTRACT,
          standardContractType: 'ERC1155',
          chain: 'filecoinCalibrationTestnet',
          method: 'balanceOf',
          parameters: [':userAddress', tokenId],
          returnValueTest: {
            comparator: '>',
            value: '0',
          },
        },
      ]

      const documentUnifiedAccessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: config.CONTRACT,
          standardContractType: 'ERC1155',
          chain: 'filecoinCalibrationTestnet',
          method: 'balanceOf',
          parameters: [':userAddress', tokenId],
          returnValueTest: {
            comparator: '>',
            value: '0',
          },
        },
      ]

      setLocalStatus('Encrypting your idea')
      const encrypted = await litClient
        .encrypt({
          dataToEncrypt: new TextEncoder().encode(content),
          unifiedAccessControlConditions:
            documentUnifiedAccessControlConditions,
        })
        .then(async (encryptedContent: EncryptResponse) => {
          if (!encryptedContent) {
            throw new Error('Failed to encrypt content')
          }
          return encryptedContent
        })

      setLocalStatus('Downsampling your idea')
      const downSampled = downsample(content)

      setLocalStatus('Encrypting downsampled idea')
      const downSampledEncrypted = await litClient
        .encrypt({
          dataToEncrypt: new TextEncoder().encode(downSampled),
          unifiedAccessControlConditions:
            downSampledUnifiedAccessControlConditions,
        })
        .then(async (encryptedContent: EncryptResponse) => {
          if (!encryptedContent) {
            throw new Error('Failed to encrypt content')
          }
          return encryptedContent
        })

      const { session_jwt } = stytchClient?.session?.getTokens?.() || {}
      const body = {
        ...internalDoc,
        id,
        to: address,
        metadata: {
          tokenId,
          cid: '',
        },
        encrypted: {
          ...encrypted,
          unifiedAccessControlConditions:
            documentUnifiedAccessControlConditions,
        },
        downSampledEncrypted: {
          ...downSampledEncrypted,
          unifiedAccessControlConditions:
            downSampledUnifiedAccessControlConditions,
        },
        tags: ['IP'],
        terms: {
          ...internalDoc.terms,
        },
        useAIAgent: internalDoc.useAIAgent || false,
      }

      setLocalStatus('Uploading encrypted content')
      await fetch('/api/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session_jwt}`,
        },
        body: JSON.stringify(body),
      }).then((res) => {
        if (!res.ok) {
          throw new Error('Failed to store invention')
        }
        return res.json()
      })

      // Update submission status for automation
      if (typeof window !== 'undefined') {
        const win = window as Window &
          typeof globalThis & {
            importToolReady?: { submissionComplete?: boolean }
          }

        if (win.importToolReady) {
          win.importToolReady.submissionComplete = true
        }
      }

      window.location.href = `/details/${id}`
    } catch (err) {
      console.error('API Key validation error:', err)
      setIPDoc((prev) => ({
        ...prev,
        error: (err as { message: string }).message,
      }))
    } finally {
      setIsLoading(false)
    }
  }, [
    ipDoc,
    _litClient,
    fb,
    stytchClient?.session,
    config,
    _sessionSigs,
    updateFormData,
  ])

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* What Happens Next info box */}
      <Card className="mb-8 backdrop-blur-lg bg-background/30 border border-border/30">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">What Happens Next</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start">
              <span className="text-primary mr-2">1.</span>
              <span>
                Your idea is encrypted and stored securely on decentralized
                storage
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-primary mr-2">2.</span>
              <span>
                You receive a unique link to share with potential partners
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-primary mr-2">3.</span>
              <span>
                Track who views your idea with our comprehensive audit log
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Protect Your Idea</h2>
          <p className="text-muted-foreground">
            Start by providing basic information about your idea and uploading
            your confidential document.
          </p>
        </div>

        {/* Public Information */}
        <AddStepPublic
          isLoading={isLoading}
          ipDoc={ipDoc}
          setIPDoc={handlePublicUpdate}
        />

        {/* File Upload */}
        <AddStepContent
          isLoading={isLoading}
          ipDoc={ipDoc}
          setIPDoc={handleContentUpdate}
        />

        {/* Error Display */}
        {ipDoc.error && (
          <Alert variant="destructive" className="border-red-300 bg-red-500/20">
            <AlertDescription>{ipDoc.error}</AlertDescription>
          </Alert>
        )}

        {/* Status Display */}
        {localStatus && isLoading && (
          <Alert className="border-primary/30 bg-primary/10">
            <AlertDescription>{localStatus}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            onClick={handleCreateNow}
            disabled={!canContinue || isLoading}
            size="lg"
            variant="outline"
            className="flex-1 sm:flex-none"
            data-testid="protect-create-now-button"
          >
            {isLoading ? 'Creating...' : 'Create Now'}
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!canContinue || isLoading}
            size="lg"
            className="flex-1 sm:flex-none"
            data-testid="protect-continue-button"
          >
            Continue Setup
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Create Now uses default settings (30 days, view-only). Continue Setup
          lets you customize sharing preferences.
        </p>
      </div>
    </div>
  )
}
