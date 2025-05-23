'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { EncryptResponse } from 'lit-wrapper'
import { downsample } from '@/lib/downsample'
import { useStytch } from '@stytch/nextjs'
import { collection, doc, getFirestore, onSnapshot } from 'firebase/firestore'
import type { IPDoc, IPAudit } from '@/lib/types'
import { useConfig, useSession } from '../AuthLayout'
import { useCallback, useEffect, useState } from 'react'
import { AddStepPublic } from './AddStepPublic'
import { AddStepContent } from './AddStepContent'
import { AddStepTerms } from './AddStepTerms'
import { handleError } from '@/hooks/useIP'
import { testIds } from '@/lib/testIds'

export type AddDoc = Omit<IPDoc, 'id'> & {
  content?: string
  error?: string
  useAIAgent?: boolean
}

const AppIP = () => {
  const fb = getFirestore()
  // Removed user authentication check since it's handled by the main navigation
  const { litClient: _litClient, sessionSigs: _sessionSigs } = useSession([
    'stytchUser',
    'fbUser',
  ])
  const [ipDoc, setIPDoc] = useState<AddDoc>({} as AddDoc)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<IPAudit>()
  const [localStatus, setLocalStatus] = useState('')
  const [stepsCompleted, setStepsCompleted] = useState({
    step1: false,
    step2: false,
    step3: false,
  })

  const stytchClient = useStytch()
  const [docId, setDocId] = useState('')
  const config = useConfig()
  useEffect(() => {
    if (docId) {
      const statusDoc = doc(fb, 'ip', docId, 'status', 'status')
      return onSnapshot(
        statusDoc,
        (doc) => {
          setStatus((doc.data() as IPAudit) || undefined)
        },
        handleError(statusDoc)
      )
    }
  }, [docId, fb])

  // Update completion status when relevant fields change
  useEffect(() => {
    setStepsCompleted((prev) => ({
      ...prev,
      step1: Boolean(ipDoc.content),
      step2: Boolean(ipDoc.terms?.businessModel || ipDoc.terms?.pricing),
      step3: Boolean(ipDoc.useAIAgent !== undefined),
    }))
  }, [
    ipDoc.content,
    ipDoc.terms?.businessModel,
    ipDoc.terms?.pricing,
    ipDoc.useAIAgent,
  ])

  const handleStore = useCallback(async () => {
    if (!ipDoc.content) {
      setIPDoc((prev) => ({
        ...prev,
        error: 'Please upload a file first',
      }))
      return
    }
    const { content, ...internalDoc } = ipDoc
    setIsLoading(true)
    setLocalStatus('Encrypting your idea')

    // Normal production flow
    try {
      const litClient = await _litClient.wait()
      if (!litClient) {
        throw new Error('Lit client is not initialized')
      }
      const ref = doc(collection(fb, 'ip'))
      const id = ref.id
      const { tokenId } = await fetch('/api/prestore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${stytchClient?.session?.getTokens()?.session_jwt}`,
        },
        body: JSON.stringify({ id }),
      }).then((res) => {
        if (!res.ok) {
          throw new Error('Failed to get token ID')
        }
        return res.json()
      })
      setLocalStatus('Storing your idea')
      setDocId(id)
      const sessionSigs = await _sessionSigs.wait()
      const { address } = sessionSigs || {}
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
          parameters: [':userAddress', `${tokenId}`],
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
          parameters: [':userAddress', `${tokenId}`],
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
        // Include all terms information
        terms: {
          ...internalDoc.terms,
        },
        // Include AI Agent preference
        useAIAgent: internalDoc.useAIAgent || false,
      }
      setLocalStatus('Uploading encrypted content')
      await fetch('/api/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session_jwt}`,
        },
        // NOTE: This format is not identical to the final IPDoc,
        // Because some processing is done on the server side.
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
    // ⚠️ Remove testTokenCounter when removing test mode
  }, [ipDoc, _litClient, fb, stytchClient?.session, config, _sessionSigs])
  return (
    <div className="w-full py-8">
      <div className="max-w-6xl mx-auto space-y-8 px-4">
        <Card
          className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-background/30 border border-border/30 shadow-xl add-idea-form"
          data-form-ready="false"
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-primary">
              Add Your Idea
            </CardTitle>
            <CardDescription className="text-foreground/90 mt-2 text-base">
              Complete all three steps below to create your secure idea page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Public Information Section */}
            <AddStepPublic
              isLoading={isLoading}
              ipDoc={ipDoc}
              setIPDoc={setIPDoc}
            />

            {/* Step 1: Securely Save Your Idea (Required) */}
            <div className="p-4 mb-2 mt-4">
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mr-2">
                  1
                </div>
                <h3 className="font-semibold text-primary text-sm">
                  Securely Save Your Idea
                  {stepsCompleted.step1 && (
                    <span className="ml-2 text-green-500">✓</span>
                  )}
                </h3>
              </div>
              <p className="text-sm text-foreground/90 ml-8">
                Now you need to add the secret document that describes your idea
                in detail. This is the core of your intellectual property
                protection. The file will be encrypted using advanced security
                so that only you can access it.
              </p>
            </div>

            <AddStepContent
              isLoading={isLoading}
              ipDoc={ipDoc}
              setIPDoc={setIPDoc}
            />

            {ipDoc.error && (
              <Alert
                variant="destructive"
                className="border-red-300 bg-red-500/20"
              >
                <AlertDescription className="text-foreground">
                  {ipDoc.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success message shown when content exists */}
            {ipDoc.content && (
              <div className="p-4 rounded-lg border border-primary/30 bg-muted/30 mb-2 mt-4">
                <p className="text-sm font-semibold text-primary mb-1">
                  ✓ Document Encrypted
                </p>
                <p className="text-sm text-foreground/90">
                  Your document is now ready to be saved in the SafeIdea
                  database, an immutable decentralized system that timestamps
                  your Idea. This timestamp serves as proof of when you created
                  your idea, which can be valuable for intellectual property
                  claims.
                </p>
                <p className="text-sm text-foreground/90 mt-2">
                  Before finalizing, consider if you want to set up secure
                  sharing options (Step 2) or create an AI Sales Agent (Step 3).
                </p>
              </div>
            )}

            {/* Step 2: Securely Share Your Idea (Optional) */}
            <div className="p-4 mb-2 mt-4">
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mr-2">
                  2
                </div>
                <h3 className="font-semibold text-primary text-sm">
                  Securely Share Your Idea
                  <span className="ml-2 text-foreground/60 font-normal">
                    (Optional)
                  </span>
                  {stepsCompleted.step2 && (
                    <span className="ml-2 text-green-500">✓</span>
                  )}
                </h3>
              </div>
              <p className="text-sm text-foreground/90 ml-8">
                When someone shows interest in your idea (such as a potential
                investor or partner), you typically need to share details while
                maintaining protection. SafeIdea enhances traditional NDAs by
                adding verifiable tracking of shared information.
              </p>
            </div>

            {/* Step 3: Get Your Own AI Sales Agent (Optional) */}
            <div className="p-4 mb-2 mt-4">
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mr-2">
                  3
                </div>
                <h3 className="font-semibold text-primary text-sm">
                  Get Your Own AI Sales Agent
                  <span className="ml-2 text-foreground/60 font-normal">
                    (Optional)
                  </span>
                  {stepsCompleted.step3 && (
                    <span className="ml-2 text-green-500">✓</span>
                  )}
                </h3>
              </div>
              <p className="text-sm text-foreground/90 ml-8">
                SafeIdea offers a unique opportunity to actively promote your
                idea. Your AI Sales Agent will be trained on your idea details
                and your sharing terms, then work on your behalf to find
                interested parties.
              </p>
              <div className="ml-8 mt-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ai-agent-checkbox"
                  checked={ipDoc.useAIAgent || false}
                  onChange={(e) =>
                    setIPDoc((prev) => ({
                      ...prev,
                      useAIAgent: e.target.checked,
                    }))
                  }
                  disabled={isLoading}
                  className="rounded border-border/30 bg-muted/30 text-primary"
                  data-testid={testIds.addIdea.aiAgentCheckbox}
                />
                <label
                  htmlFor="ai-agent-checkbox"
                  className="text-foreground/90 cursor-pointer"
                >
                  I want my own AI Sales Agent
                </label>
              </div>
            </div>

            {/* Finalize section */}
            <div className="p-4 mb-2 mt-4">
              <h3 className="font-semibold text-primary text-sm mb-2">
                Finalize Your Submission
              </h3>
              <p className="text-sm text-foreground/90">
                You're all done! Click the button below to save your Idea in the
                SafeIdea database.
              </p>
            </div>

            <AddStepTerms
              isLoading={isLoading}
              ipDoc={ipDoc}
              setIPDoc={setIPDoc}
              status={status}
              setLocalStatus={setLocalStatus}
              onStore={handleStore}
              localStatus={localStatus}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AppIP
