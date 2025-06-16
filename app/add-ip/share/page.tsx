'use client'

import { useAddIPContext } from '@/components/AddIP/AddIPContext'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Calendar, Shield, Eye, FileText, Upload } from 'lucide-react'
import { useSession, useConfig } from '@/components/AuthLayout'
import { useStytch } from '@stytch/nextjs'
import { collection, doc, getFirestore } from 'firebase/firestore'
import type { EncryptResponse } from 'lit-wrapper'
import { downsample } from '@/lib/downsample'
import { bytesToHex, type Hex, pad } from 'viem'

// Copy helper function from protect page
const firestoreIdToHex = (base64: string): Hex => {
  return bytesToHex(
    pad(new Uint8Array([...atob(base64)].map((c) => c.charCodeAt(0))), {
      size: 32,
      dir: 'left',
    })
  )
}

export default function SharePage() {
  const { formData, updateFormData } = useAddIPContext()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState<string>('')
  const [error, setError] = useState<string>()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Format dates for input fields
  const formatDateForInput = (date: Date | null) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  // Parse date from input
  const parseDateFromInput = (value: string) => {
    if (!value) return null
    return new Date(value)
  }

  // Initialize dates if not set
  if (!formData.sharingStartDate) {
    updateFormData({ sharingStartDate: new Date() })
  }
  if (!formData.sharingEndDate) {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)
    updateFormData({ sharingEndDate: endDate })
  }

  const handleBack = () => {
    router.push('/add-ip/protect')
  }

  const handleContinue = () => {
    router.push('/add-ip/guard')
  }

  // Handle external legal file selection
  const handleLegalFileSelection = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Check file size (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        setError('Legal document file size exceeds 20MB limit')
        return
      }

      // Check file type (ZIP files only)
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (extension !== 'zip') {
        setError('Please upload a ZIP file containing your legal documents')
        return
      }

      // Store file reference (we'll handle upload during creation)
      updateFormData({
        externalLegalFile: file,
        externalLegalFileName: file.name,
      })
      setError(undefined)
    },
    [updateFormData]
  )

  // Create IP with sharing settings
  const handleCreateNow = useCallback(async () => {
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

      // Build API payload with sharing settings
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
        // Add sharing settings
        sharingStartDate: formData.sharingStartDate?.toISOString(),
        sharingEndDate: formData.sharingEndDate?.toISOString(),
        legalDocuments: formData.legalDocuments,
        showInDatabase: formData.showInDatabase,
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
        <h2 className="text-2xl font-bold mb-2">Set Sharing Preferences</h2>
        <p className="text-muted-foreground">
          Configure how and when others can access your protected idea.
        </p>
      </div>

      <div className="space-y-6">
        {/* Sharing Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sharing Duration
            </CardTitle>
            <CardDescription>
              Set the time period during which your idea can be shared
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formatDateForInput(formData.sharingStartDate)}
                  onChange={(e) =>
                    updateFormData({
                      sharingStartDate: parseDateFromInput(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formatDateForInput(formData.sharingEndDate)}
                  onChange={(e) =>
                    updateFormData({
                      sharingEndDate: parseDateFromInput(e.target.value),
                    })
                  }
                  min={formatDateForInput(formData.sharingStartDate)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Protection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Legal Protection
            </CardTitle>
            <CardDescription>
              Choose the legal framework for protecting your shared idea
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.legalDocuments}
              onValueChange={(value: any) =>
                updateFormData({ legalDocuments: value })
              }
              className="space-y-4"
            >
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="none" id="legal-none" />
                <div className="space-y-1">
                  <Label
                    htmlFor="legal-none"
                    className="font-normal cursor-pointer"
                  >
                    No Legal Documents
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share your idea without additional legal protection
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <RadioGroupItem value="generic-nda" id="legal-nda" />
                <div className="space-y-1">
                  <Label
                    htmlFor="legal-nda"
                    className="font-normal cursor-pointer"
                  >
                    Generic NDA Incorporated with IP
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Use SafeIdea's standard Non-Disclosure Agreement
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <RadioGroupItem value="external" id="legal-external" />
                <div className="space-y-1">
                  <Label
                    htmlFor="legal-external"
                    className="font-normal cursor-pointer"
                  >
                    External Legal Documentation
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Upload your own legal documents (ZIP file required)
                  </p>
                </div>
              </div>
            </RadioGroup>

            {/* External file upload - only show if external is selected */}
            {formData.legalDocuments === 'external' && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-3">
                  <Label htmlFor="legal-file" className="text-sm font-medium">
                    Upload Legal Documents (ZIP file, max 20MB)
                  </Label>
                  {formData.externalLegalFileName ? (
                    <div className="flex items-center justify-between p-3 border rounded bg-background">
                      <span className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {formData.externalLegalFileName}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateFormData({
                            externalLegalFile: null,
                            externalLegalFileName: '',
                          })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select ZIP File
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    id="legal-file"
                    type="file"
                    accept=".zip"
                    onChange={handleLegalFileSelection}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Public Visibility
            </CardTitle>
            <CardDescription>
              Control whether your idea appears in the SafeIdea public database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="visibility-toggle"
                  className="text-base font-normal"
                >
                  Show IP in SafeIdea Database
                </Label>
                <p className="text-sm text-muted-foreground">
                  Your encrypted content remains secure. Only the title and
                  description are visible.
                </p>
              </div>
              <Switch
                id="visibility-toggle"
                checked={formData.showInDatabase}
                onCheckedChange={(checked) =>
                  updateFormData({ showInDatabase: checked })
                }
              />
            </div>
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
            onClick={handleCreateNow}
            variant="outline"
            disabled={!canProceed || isLoading}
            data-testid="share-create-now-button"
          >
            {isLoading ? 'Creating...' : 'Create Now'}
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!canProceed || isLoading}
            data-testid="share-continue-button"
          >
            Continue to AI Guard
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Create Now saves with your current sharing settings. Continue to
          configure AI monitoring.
        </p>
      </div>
    </div>
  )
}
