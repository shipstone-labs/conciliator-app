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

export type AddDoc = Omit<IPDoc, 'id'> & { content?: string; error?: string }

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
          className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl add-idea-form"
          data-form-ready="false"
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-primary">
              Add Your Idea
            </CardTitle>
            <CardDescription className="text-white/90 mt-2 text-base">
              Complete all three steps below to create your secure idea page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <AddStepPublic
              isLoading={isLoading}
              ipDoc={ipDoc}
              setIPDoc={setIPDoc}
            />

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
                <AlertDescription className="text-white">
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
                <p className="text-sm text-white/90">
                  Your Idea is safely encrypted.
                </p>
              </div>
            )}

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
