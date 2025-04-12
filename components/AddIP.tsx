'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { Textarea } from './ui/textarea'
import { Modal } from './ui/modal'
import { useSession } from '@/hooks/useSession'
import type { EncryptResponse } from 'lit-wrapper'
import { downsample } from '@/lib/downsample'
import { useStytch } from '@stytch/nextjs'
import { collection, doc, getFirestore } from 'firebase/firestore'
import { bytesToHex } from 'viem'

const AppIP = () => {
  // Removed user authentication check since it's handled by the main navigation
  const [content, setContent] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  const [businessModel, setBusinessModel] = useState('Protected Evaluation')
  const [evaluationPeriod, setEvaluationPeriod] = useState('one-day')
  const [dayPrice, setDayPrice] = useState('5.00')
  const [weekPrice, setWeekPrice] = useState('25.00')
  const [monthPrice, setMonthPrice] = useState('90.00')
  const [ndaConfirmed, setNdaConfirmed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const stytchClient = useStytch()

  // =====================================================
  // TEMPORARY TEST MODE - REMOVE FOR PRODUCTION
  // =====================================================
  // To remove test mode:
  // 1. Delete this testTokenCounter state
  // 2. Remove the entire if-block checking for TEST_MODE below
  // 3. Remove the testTokenCounter from the dependency array
  // 4. Remove the test-specific code from handleFileSelection
  // =====================================================
  const [testTokenCounter, setTestTokenCounter] = useState(1000)
  const { litClient, sessionSigs } = useSession()

  const handleStore = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    // TESTING SHORTCUT: Check for test.md content
    // REMOVE THIS ENTIRE IF-BLOCK FOR PRODUCTION
    if (content.includes('TEST_MODE') || name.toLowerCase().includes('test')) {
      console.log('TEST MODE ACTIVATED - Bypassing encryption and tokenization')
      // Increment test token for unique test IDs
      const testTokenId = testTokenCounter
      setTestTokenCounter((prev) => prev + 1)

      // Simulate API delay
      setTimeout(() => {
        setIsLoading(false)
        // Redirect to details page with test token ID
        window.location.href = `/details/${testTokenId}`
      }, 1000)
      return
    }
    // =====================================================

    // Normal production flow
    try {
      if (!litClient) {
        throw new Error('Lit client is not initialized')
      }
      const fb = getFirestore()
      const ref = doc(collection(fb, 'ip'))
      const id = ref.id
      const tokenId = bytesToHex(new TextEncoder().encode(id))
      const { address } = sessionSigs || {}
      const unifiedAccessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: process.env.NEXT_PUBLIC_LIT_CONTRACT_ADDRESS,
          standardContractType: '',
          chain: 'filecoin',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: process.env.NEXT_PUBLIC_LIT_ADDRESS,
          },
        },
        { conditionType: 'operator', operator: 'or' },
        {
          conditionType: 'evmBasic',
          contractAddress: process.env.NEXT_PUBLIC_LIT_CONTRACT_ADDRESS,
          standardContractType: 'ERC1155',
          chain: 'filecoin',
          method: 'balanceOf',
          parameters: [':userAddress', tokenId],
          returnValueTest: {
            comparator: '>=',
            value: '0',
          },
        },
      ]
      const encrypted = await litClient
        .encrypt({
          dataToEncrypt: new TextEncoder().encode(content),
          unifiedAccessControlConditions,
        })
        .then(async (encryptedContent: EncryptResponse) => {
          if (!encryptedContent) {
            throw new Error('Failed to encrypt content')
          }
          return encryptedContent
        })
      const downSampledEncrypted = await litClient
        .encrypt({
          dataToEncrypt: new TextEncoder().encode(downsample(content)),
          unifiedAccessControlConditions,
        })
        .then(async (encryptedContent: EncryptResponse) => {
          if (!encryptedContent) {
            throw new Error('Failed to encrypt content')
          }
          return encryptedContent
        })
      const { session_jwt } = stytchClient?.session?.getTokens?.() || {}
      console.log(address)
      const body = {
        id,
        to: address,
        metadata: {
          tokenId,
          cid: '',
        },
        name,
        description,
        encrypted: {
          ...encrypted,
          unifiedAccessControlConditions,
        },
        downSampledEncrypted: {
          ...downSampledEncrypted,
          unifiedAccessControlConditions,
        },
      }
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
      window.location.href = `/details/${id}`
    } catch (err) {
      console.error('API Key validation error:', err)
      setError((err as { message: string }).message)
    } finally {
      setIsLoading(false)
    }
    // ⚠️ Remove testTokenCounter when removing test mode
  }, [
    content,
    description,
    name,
    testTokenCounter,
    litClient,
    stytchClient?.session,
    sessionSigs,
  ])

  const handleOpenFileDialog = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const handleFileSelection = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        setError('File size exceeds 2MB limit')
        return
      }

      // Check file type (only text and markdown)
      if (!file.type.includes('text') && !file.name.endsWith('.md')) {
        setError('Only text and markdown files are supported')
        return
      }

      // =====================================================
      // TEMPORARY TEST MODE - REMOVE FOR PRODUCTION
      // This section detects test.md files and enables test mode
      // =====================================================
      const isTestFile = file.name.toLowerCase() === 'test.md'

      const reader = new FileReader()
      reader.onload = (event) => {
        let fileContent = event.target?.result as string

        // If this is a test file, add TEST_MODE marker
        // REMOVE THIS BLOCK FOR PRODUCTION
        if (isTestFile && !fileContent.includes('TEST_MODE')) {
          fileContent = `TEST_MODE\n\n${fileContent}`
          console.log('Test file detected - Adding TEST_MODE marker')
        }

        setContent(fileContent)
        setIsModalOpen(false)

        // If it's a test file, show a helpful message
        // REMOVE THIS BLOCK FOR PRODUCTION
        if (isTestFile) {
          setError(null) // Clear any previous errors
        }
        // =====================================================
      }
      reader.readAsText(file)
    },
    []
  )

  // Reset terms when content changes
  useEffect(() => {
    setTermsAccepted(false)
  }, [])

  return (
    <div className="w-full py-8">
      <div className="max-w-6xl mx-auto space-y-8 px-4">
        {/* Logo removed from non-home pages - now using global header logo
        <Link
          href="/"
          className="fixed top-6 left-6 bg-[#1A1B25] w-12 h-12 flex items-center justify-center rounded-full shadow-xl hover:bg-[#1A1B25]/90 transition-all z-50 overflow-hidden border border-[#FFD700]"
        >
          <Image
            src="/svg/Black+Yellow.svg"
            alt="Home"
            width={26}
            height={26}
            className="transform scale-125"
          />
        </Link>
        */}

        {/* Logout button removed - now in hamburger menu */}
        <Card className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-primary">
              Add Your Idea
            </CardTitle>
            <CardDescription className="text-white/90 mt-2 text-base">
              Complete all three steps below to create your secure idea page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="p-4 rounded-lg border border-white/20 bg-muted/30 mb-2">
              <h3 className="font-semibold text-primary text-sm mb-1">
                Step 1: Public Information
              </h3>
              <p className="text-sm text-white/90">
                First enter the publicly available information you want to use
                to describe your idea. This information can be seen by others on
                the Internet.
              </p>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="public-title"
                className="text-sm font-medium text-white/90 block"
              >
                Public Title
              </label>
              <Input
                id="public-title"
                placeholder="Enter the title that will appear in public listings"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="border-white/20 bg-muted/50 text-white placeholder:text-white/60 focus:border-primary rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="public-description"
                className="text-sm font-medium text-white/90 block"
              >
                Public Description
              </label>
              <Textarea
                id="public-description"
                placeholder="Enter a description that will be visible to the public"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                className="min-h-24 border-white/20 bg-muted/50 text-white placeholder:text-white/60 focus:border-primary rounded-xl"
              />
            </div>

            <div className="p-4 rounded-lg border border-white/20 bg-muted/30 mb-2 mt-4">
              <h3 className="font-semibold text-primary text-sm mb-1">
                Step 2: Private Document
              </h3>
              <p className="text-sm text-white/90">
                Now you need to add a text or markdown file that contains the
                details about your idea. The file will be encrypted so that only
                you can access it.
              </p>
            </div>

            {content ? (
              <div className="p-4 rounded-lg border border-primary/30 bg-muted/30">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-white">
                    File uploaded successfully
                  </p>
                  <Button
                    onClick={() => setContent('')}
                    variant="ghost"
                    size="sm"
                    className="text-secondary hover:text-secondary/80 hover:bg-muted/30 rounded-xl"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleOpenFileDialog}
                variant="outline"
                className="w-full border border-white/20 bg-muted/30 text-white hover:bg-muted/50 py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 h-12"
                disabled={isLoading || !name || !description}
              >
                Add and Encrypt your Idea
              </Button>
            )}

            {error && (
              <Alert
                variant="destructive"
                className="border-red-300 bg-red-500/20"
              >
                <AlertDescription className="text-white">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success message shown when content exists */}
            {content && (
              <div className="p-4 rounded-lg border border-primary/30 bg-muted/30 mb-2 mt-4">
                <p className="text-sm font-semibold text-primary mb-1">
                  ✓ Document Encrypted
                </p>
                <p className="text-sm text-white/90">
                  Your Idea is safely encrypted.
                </p>
              </div>
            )}

            {/* Step 3 section - always visible */}
            <div className="p-4 rounded-lg border border-white/20 bg-muted/30 mb-2 mt-4">
              <h3 className="font-semibold text-primary text-sm mb-1">
                Step 3: Share Your Idea
              </h3>
              <p className="text-sm text-white/90">
                Now, you can choose how you want to share it. Click
                <strong> Set Terms </strong> to configure sharing options.
              </p>
            </div>

            {/* Set Terms button - disabled until content exists */}
            <Button
              onClick={() => setIsTermsModalOpen(true)}
              variant="outline"
              className="w-full border border-white/20 text-white/90 hover:bg-muted/30 py-3 px-4 rounded-xl transition-all h-12"
              disabled={isLoading || !content}
            >
              Set Terms
            </Button>

            {/* Create Page explanation */}
            <div className="p-4 rounded-lg border border-white/20 bg-muted/30 mb-2 mt-4">
              <p className="text-sm text-white/90">
                Clicking <strong>View Idea Page</strong> takes you to your new
                Idea page. You can share this page address with others to
                explore your secure idea.
              </p>
            </div>

            {/* Button moved below the note */}
            <div className="relative">
              {!termsAccepted && content && name && description ? (
                <div className="absolute -top-8 w-full text-center text-amber-300 text-sm animate-pulse">
                  ⚠️ Please set terms first
                </div>
              ) : null}
              <Button
                onClick={handleStore}
                className="w-full bg-primary hover:bg-primary/80 text-black font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 h-12 mt-4"
                disabled={
                  isLoading ||
                  !content ||
                  !name ||
                  !description ||
                  !termsAccepted
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating your Idea page (this may take a minute or so)
                  </>
                ) : (
                  'View Idea Page'
                )}
              </Button>
            </div>

            {/* File upload modal */}
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Upload Your Idea"
            >
              <div className="space-y-4">
                <p className="text-white/90">
                  Select a text or markdown file containing your idea
                  description. This file will be encrypted and stored securely.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelection}
                  accept=".txt,.md,.markdown,text/plain,text/markdown"
                  className="w-full p-3 border border-white/20 bg-muted/30 text-white rounded-xl"
                />
                <div className="flex justify-end space-x-3 mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-white/90 hover:bg-muted/50 rounded-xl h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-primary hover:bg-primary/80 text-black font-medium transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 rounded-xl h-11"
                  >
                    Select File
                  </Button>
                </div>
              </div>
            </Modal>
            {/* Terms Modal */}
            <Modal
              isOpen={isTermsModalOpen}
              onClose={() => setIsTermsModalOpen(false)}
              title="Set Terms"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="business-model"
                    className="text-sm font-medium text-white/90 block"
                  >
                    Business Model
                  </label>
                  <select
                    id="business-model"
                    value={businessModel}
                    onChange={(e) => setBusinessModel(e.target.value)}
                    className="w-full p-3 border border-white/20 bg-muted/30 text-white rounded-xl h-11"
                  >
                    <option value="Protected Evaluation">
                      Protected Evaluation
                    </option>
                    <option value="Provisional Patent" disabled>
                      Provisional Patent
                    </option>
                    <option value="One Year Subscription" disabled>
                      One Year Subscription
                    </option>
                  </select>
                  <p className="text-xs text-white/60 mt-1">
                    Additional business models coming soon
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="evaluation-period"
                      className="text-sm font-medium text-white/90 block"
                    >
                      Evaluation Period
                    </label>
                    <div className="space-y-3">
                      <div
                        className={`flex items-center space-x-2 p-3 border ${
                          evaluationPeriod === 'one-day'
                            ? 'border-primary/50'
                            : 'border-white/20'
                        } bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors`}
                        onClick={() => setEvaluationPeriod('one-day')}
                      >
                        <input
                          type="radio"
                          id="one-day"
                          name="evaluation-period"
                          value="one-day"
                          checked={evaluationPeriod === 'one-day'}
                          onChange={() => setEvaluationPeriod('one-day')}
                          className="text-primary rounded-full"
                        />
                        <label
                          htmlFor="one-day"
                          className="text-white cursor-pointer flex-grow"
                        >
                          One Day
                        </label>
                        <div className="flex items-center">
                          <span className="text-white/70 mr-2">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={dayPrice}
                            onChange={(e) => setDayPrice(e.target.value)}
                            className="w-16 p-1 rounded bg-muted/40 border-white/20 text-white text-right"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div
                        className={`flex items-center space-x-2 p-3 border ${
                          evaluationPeriod === 'one-week'
                            ? 'border-primary/50'
                            : 'border-white/20'
                        } bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors`}
                        onClick={() => setEvaluationPeriod('one-week')}
                      >
                        <input
                          type="radio"
                          id="one-week"
                          name="evaluation-period"
                          value="one-week"
                          checked={evaluationPeriod === 'one-week'}
                          onChange={() => setEvaluationPeriod('one-week')}
                          className="text-primary rounded-full"
                        />
                        <label
                          htmlFor="one-week"
                          className="text-white cursor-pointer flex-grow"
                        >
                          One Week
                        </label>
                        <div className="flex items-center">
                          <span className="text-white/70 mr-2">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={weekPrice}
                            onChange={(e) => setWeekPrice(e.target.value)}
                            className="w-16 p-1 rounded bg-muted/40 border-white/20 text-white text-right"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div
                        className={`flex items-center space-x-2 p-3 border ${
                          evaluationPeriod === 'one-month'
                            ? 'border-primary/50'
                            : 'border-white/20'
                        } bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors`}
                        onClick={() => setEvaluationPeriod('one-month')}
                      >
                        <input
                          type="radio"
                          id="one-month"
                          name="evaluation-period"
                          value="one-month"
                          checked={evaluationPeriod === 'one-month'}
                          onChange={() => setEvaluationPeriod('one-month')}
                          className="text-primary rounded-full"
                        />
                        <label
                          htmlFor="one-month"
                          className="text-white cursor-pointer flex-grow"
                        >
                          One Month
                        </label>
                        <div className="flex items-center">
                          <span className="text-white/70 mr-2">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={monthPrice}
                            onChange={(e) => setMonthPrice(e.target.value)}
                            className="w-16 p-1 rounded bg-muted/40 border-white/20 text-white text-right"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      Period begins after transaction is completed
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="nda-confirmed"
                      checked={ndaConfirmed}
                      onChange={() => setNdaConfirmed(!ndaConfirmed)}
                      className="rounded border-white/20 bg-muted/30 text-primary"
                    />
                    <label
                      htmlFor="nda-confirmed"
                      className="text-white/90 cursor-pointer"
                    >
                      I understand that transactions will require a signed NDA
                      with purchaser
                    </label>
                  </div>
                </div>

                {/* Price is now automatically set based on the evaluation period */}

                <div className="flex justify-between space-x-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setIsTermsModalOpen(false)}
                    className="text-white/90 hover:bg-muted/50 rounded-xl h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!ndaConfirmed) {
                        alert('Please confirm you have a signed NDA in place')
                        return
                      }
                      // Save terms logic would go here
                      setTermsAccepted(true)
                      setIsTermsModalOpen(false)
                    }}
                    className="bg-primary hover:bg-primary/80 text-black font-medium transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 rounded-xl h-11"
                    disabled={!ndaConfirmed}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </Modal>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AppIP
