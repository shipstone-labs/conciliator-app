'use client'

import { useAddIPContext } from '@/components/AddIP/AddIPContext'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Shield, Brain, Bell } from 'lucide-react'
import { useSession, useConfig } from '@/components/AuthLayout'
import { useStytch } from '@stytch/nextjs'
import { collection, doc, getFirestore } from 'firebase/firestore'
import type { EncryptResponse } from 'lit-wrapper'
import { downsample } from '@/lib/downsample'
import { bytesToHex, type Hex, pad } from 'viem'

// Copy helper function from share page
const firestoreIdToHex = (base64: string): Hex => {
  return bytesToHex(
    pad(new Uint8Array([...atob(base64)].map((c) => c.charCodeAt(0))), {
      size: 32,
      dir: 'left',
    })
  )
}

export default function GuardPage() {
  const { formData, updateFormData } = useAddIPContext()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState<string>('')
  const [error, setError] = useState<string>()

  // Dependencies for creation
  const { litClient: _litClient, sessionSigs: _sessionSigs } = useSession([
    'stytchUser',
    'fbUser',
  ])
  const stytchClient = useStytch()
  const config = useConfig()
  const fb = getFirestore()

  // Check if we can proceed
  const canProceed = formData.title && formData.description && formData.fileName

  const handleBack = () => {
    router.push('/add-ip/share')
  }

  // Create IP with all settings including AI
  const handleCreate = useCallback(async () => {
    if (!canProceed) return

    setIsLoading(true)
    setLocalStatus('Preparing your protected idea...')
    setError(undefined)

    try {
      const litClient = await _litClient.wait()
      if (!litClient) {
        throw new Error('Lit client is not initialized')
      }

      // Get the stored file content from session
      const fileContent = sessionStorage.getItem('safeidea_add_ip_file_content')
      if (!fileContent) {
        throw new Error(
          'File content not found. Please go back and re-upload your file.'
        )
      }

      const ref = doc(collection(fb, 'ip'))
      const id = ref.id
      const tokenId = firestoreIdToHex(id)

      setLocalStatus('Encrypting your idea...')
      const sessionSigs = await _sessionSigs.wait()
      const { address } = sessionSigs || {}

      // Access control conditions
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

      const encrypted = await litClient
        .encrypt({
          dataToEncrypt: new TextEncoder().encode(fileContent),
          unifiedAccessControlConditions:
            documentUnifiedAccessControlConditions,
        })
        .then(async (encryptedContent: EncryptResponse) => {
          if (!encryptedContent) {
            throw new Error('Failed to encrypt content')
          }
          return encryptedContent
        })

      setLocalStatus('Processing your idea...')
      const downSampled = downsample(fileContent)

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

      // Build API payload with all settings including AI
      const body = {
        name: formData.title,
        description: formData.description,
        creator: '',
        category: 'protected',
        tags: ['IP'],
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
        // Add all settings from previous pages
        sharingStartDate: formData.sharingStartDate?.toISOString(),
        sharingEndDate: formData.sharingEndDate?.toISOString(),
        legalDocuments: formData.legalDocuments,
        showInDatabase: formData.showInDatabase,
        enableAI: formData.enableAI,
        // TODO: Handle external legal file upload if selected
      }

      setLocalStatus('Uploading encrypted content...')
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

      // Clear form data
      updateFormData({
        title: '',
        description: '',
        file: null,
        fileName: '',
        sharingStartDate: null,
        sharingEndDate: null,
        legalDocuments: 'none',
        externalLegalFile: null,
        externalLegalFileName: '',
        showInDatabase: true,
        enableAI: false,
      })

      // Clear stored file content
      sessionStorage.removeItem('safeidea_add_ip_file_content')

      window.location.href = `/details/${id}`
    } catch (err) {
      console.error('Creation failed:', err)
      setError((err as { message: string }).message)
      setIsLoading(false)
    }
  }, [
    canProceed,
    formData,
    updateFormData,
    _litClient,
    _sessionSigs,
    stytchClient?.session,
    config,
    fb,
  ])

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">AI Protection (Optional)</h2>
        <p className="text-muted-foreground">
          Enable AI-powered monitoring to help protect and promote your idea.
        </p>
      </div>

      <div className="space-y-6">
        {/* AI Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Brain className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Smart Matching</h3>
              <p className="text-sm text-muted-foreground">
                AI identifies potential partners and investors interested in
                your idea
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">24/7 Protection</h3>
              <p className="text-sm text-muted-foreground">
                Continuous monitoring for similar ideas and potential
                infringement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Bell className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Automated Outreach</h3>
              <p className="text-sm text-muted-foreground">
                AI agent responds to inquiries and manages initial conversations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Enable AI Monitoring</CardTitle>
            <CardDescription>
              Let our AI agent work to protect and promote your idea
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="ai-toggle" className="text-base font-normal">
                  Activate AI Agent
                </Label>
                <p className="text-sm text-muted-foreground">
                  You can enable or disable this feature later from your idea
                  dashboard
                </p>
              </div>
              <Switch
                id="ai-toggle"
                checked={formData.enableAI}
                onCheckedChange={(checked) =>
                  updateFormData({ enableAI: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* What AI Does */}
        <Card>
          <CardHeader>
            <CardTitle>What the AI Agent Does</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">When enabled, your AI agent will:</p>
            <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
              <li>
                Monitor patent databases and publications for similar ideas
              </li>
              <li>Identify companies and investors in your idea's domain</li>
              <li>Generate tailored responses to inquiries about your idea</li>
              <li>
                Track engagement and interest levels from potential partners
              </li>
              <li>Alert you to important developments or opportunities</li>
            </ul>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
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
          <Button onClick={handleBack} variant="outline" disabled={isLoading}>
            Back
          </Button>
          <div className="flex-1" />
          <Button
            onClick={handleCreate}
            disabled={!canProceed || isLoading}
            data-testid="guard-create-button"
          >
            {isLoading ? 'Creating...' : 'Create Protected Idea'}
          </Button>
        </div>
      </div>
    </div>
  )
}
