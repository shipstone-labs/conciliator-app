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
import { collection, doc, getFirestore, onSnapshot } from 'firebase/firestore'
import type { IPAudit } from '@/lib/types'
import { useConfig } from '@/app/authLayout'

const AppIP = () => {
  const fb = getFirestore()
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
  const [isDayEnabled, setIsDayEnabled] = useState(false)
  const [isWeekEnabled, setIsWeekEnabled] = useState(false)
  const [isMonthEnabled, setIsMonthEnabled] = useState(false)
  const [dayPrice, setDayPrice] = useState('0')
  const [weekPrice, setWeekPrice] = useState('0')
  const [monthPrice, setMonthPrice] = useState('0')
  const [ndaConfirmed, setNdaConfirmed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isDayPriceModalOpen, setIsDayPriceModalOpen] = useState(false)
  const [isWeekPriceModalOpen, setIsWeekPriceModalOpen] = useState(false)
  const [isMonthPriceModalOpen, setIsMonthPriceModalOpen] = useState(false)
  const stytchClient = useStytch()
  const [docId, setDocId] = useState('')
  const [status, setStatus] = useState<IPAudit>()
  const [localStatus, setLocalStatus] = useState('')
  const { litClient, sessionSigs } = useSession()
  const config = useConfig()
  useEffect(() => {
    if (docId) {
      const statusDoc = doc(fb, 'ip', docId, 'status', 'status')
      return onSnapshot(statusDoc, (doc) => {
        setStatus((doc.data() as IPAudit) || undefined)
      })
    }
  }, [docId, fb])

  const handleStore = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    setLocalStatus('Encrypting your idea')
    try {
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
          unifiedAccessControlConditions:
            documentUnifiedAccessControlConditions,
        },
        downSampledEncrypted: {
          ...downSampledEncrypted,
          unifiedAccessControlConditions:
            downSampledUnifiedAccessControlConditions,
        },
        category: businessModel || 'Intellectual Property',
        tags: ['IP', 'custom-pricing'],
        // Include all terms information
        terms: {
          businessModel,
          enabledPeriods: {
            day: isDayEnabled,
            week: isWeekEnabled,
            month: isMonthEnabled,
          },
          pricing: {
            dayPrice: isDayEnabled ? dayPrice : '0',
            weekPrice: isWeekEnabled ? weekPrice : '0',
            monthPrice: isMonthEnabled ? monthPrice : '0',
          },
          ndaRequired: ndaConfirmed,
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
      window.location.href = `/details/${id}`
    } catch (err) {
      console.error('API Key validation error:', err)
      setError((err as { message: string }).message)
    } finally {
      setIsLoading(false)
    }
  }, [
    content,
    description,
    name,
    litClient,
    businessModel,
    isDayEnabled,
    isWeekEnabled,
    isMonthEnabled,
    dayPrice,
    weekPrice,
    monthPrice,
    fb,
    stytchClient?.session,
    config,
    sessionSigs,
    ndaConfirmed,
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

      const reader = new FileReader()
      reader.onload = (event) => {
        const fileContent = event.target?.result as string
        setContent(fileContent)
        setIsModalOpen(false)
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
            <div className="p-4 mb-2">
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mr-2">1</div>
                <h3 className="font-semibold text-primary text-sm">
                  Public Information
                </h3>
              </div>
              <p className="text-sm text-white/90 ml-8">
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

            <div className="p-4 mb-2 mt-4">
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mr-2">2</div>
                <h3 className="font-semibold text-primary text-sm">
                  Private Document
                </h3>
              </div>
              <p className="text-sm text-white/90 ml-8">
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
            <div className="p-4 mb-2 mt-4">
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mr-2">3</div>
                <h3 className="font-semibold text-primary text-sm">
                  Share Your Idea
                </h3>
              </div>
              <p className="text-sm text-white/90 ml-8">
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
            <div className="p-4 mb-2 mt-4">
              <p className="text-sm text-white/90">
                Clicking <strong>Create Idea Page</strong> submits your idea and takes you to your new
                idea page. You can share this page address with others to
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
                    <span className="text-white/90">
                      {status?.status ||
                        localStatus ||
                        'Creating a site for your Idea. This may take a minute or two.'}
                    </span>
                  </>
                ) : (
                  'Create Idea Page'
                )}
              </Button>
              {status?.status || localStatus ? (
                <div className="p-4 rounded-lg border border-white/20 bg-muted/30 mb-2 mt-4">
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span className="text-white/90">
                      {status?.status || localStatus || ''}
                    </span>
                  </div>
                </div>
              ) : null}
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
                          isDayEnabled
                            ? 'border-primary/50'
                            : 'border-white/20'
                        } bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors`}
                        onClick={() => setIsDayEnabled(!isDayEnabled)}
                      >
                        <input
                          type="checkbox"
                          id="one-day"
                          checked={isDayEnabled}
                          onChange={() => setIsDayEnabled(!isDayEnabled)}
                          className="text-primary rounded"
                        />
                        <label
                          htmlFor="one-day"
                          className="text-white cursor-pointer flex-grow"
                        >
                          One Day
                        </label>
                        <div className="flex items-center">
                          <span className="text-white/70 mr-2">$</span>
                          <button
                            type="button"
                            className={`py-1 px-3 rounded ${
                              isDayEnabled 
                                ? 'bg-muted/40 border border-white/20 text-white'
                                : 'bg-muted/20 border border-white/10 text-white/50 cursor-not-allowed'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDayEnabled) {
                                setIsDayPriceModalOpen(true);
                              }
                            }}
                            disabled={!isDayEnabled}
                          >
                            {dayPrice}
                          </button>
                        </div>
                      </div>

                      <div
                        className={`flex items-center space-x-2 p-3 border ${
                          isWeekEnabled
                            ? 'border-primary/50'
                            : 'border-white/20'
                        } bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors`}
                        onClick={() => setIsWeekEnabled(!isWeekEnabled)}
                      >
                        <input
                          type="checkbox"
                          id="one-week"
                          checked={isWeekEnabled}
                          onChange={() => setIsWeekEnabled(!isWeekEnabled)}
                          className="text-primary rounded"
                        />
                        <label
                          htmlFor="one-week"
                          className="text-white cursor-pointer flex-grow"
                        >
                          One Week
                        </label>
                        <div className="flex items-center">
                          <span className="text-white/70 mr-2">$</span>
                          <button
                            type="button"
                            className={`py-1 px-3 rounded ${
                              isWeekEnabled 
                                ? 'bg-muted/40 border border-white/20 text-white'
                                : 'bg-muted/20 border border-white/10 text-white/50 cursor-not-allowed'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isWeekEnabled) {
                                setIsWeekPriceModalOpen(true);
                              }
                            }}
                            disabled={!isWeekEnabled}
                          >
                            {weekPrice}
                          </button>
                        </div>
                      </div>

                      <div
                        className={`flex items-center space-x-2 p-3 border ${
                          isMonthEnabled
                            ? 'border-primary/50'
                            : 'border-white/20'
                        } bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors`}
                        onClick={() => setIsMonthEnabled(!isMonthEnabled)}
                      >
                        <input
                          type="checkbox"
                          id="one-month"
                          checked={isMonthEnabled}
                          onChange={() => setIsMonthEnabled(!isMonthEnabled)}
                          className="text-primary rounded"
                        />
                        <label
                          htmlFor="one-month"
                          className="text-white cursor-pointer flex-grow"
                        >
                          One Month
                        </label>
                        <div className="flex items-center">
                          <span className="text-white/70 mr-2">$</span>
                          <button
                            type="button"
                            className={`py-1 px-3 rounded ${
                              isMonthEnabled 
                                ? 'bg-muted/40 border border-white/20 text-white'
                                : 'bg-muted/20 border border-white/10 text-white/50 cursor-not-allowed'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isMonthEnabled) {
                                setIsMonthPriceModalOpen(true);
                              }
                            }}
                            disabled={!isMonthEnabled}
                          >
                            {monthPrice}
                          </button>
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
                      
                      // Check if at least one duration is selected
                      if (!isDayEnabled && !isWeekEnabled && !isMonthEnabled) {
                        alert('Please select at least one evaluation period')
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

            {/* Hidden file input for the Select File button to reference */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelection}
              accept=".txt,.md,.markdown,text/plain,text/markdown"
              className="hidden"
            />

            {/* Day Price Modal */}
            <Modal
              isOpen={isDayPriceModalOpen}
              onClose={() => setIsDayPriceModalOpen(false)}
              title="Select Daily Price"
            >
              <div className="space-y-4">
                <p className="text-white/90">
                  Select a price for one day access:
                </p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setDayPrice('0');
                      setIsDayPriceModalOpen(false);
                    }}
                    className="p-4 border border-white/20 bg-muted/30 rounded-xl hover:bg-muted/50 text-white text-center"
                  >
                    $0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDayPrice('50');
                      setIsDayPriceModalOpen(false);
                    }}
                    className="p-4 border border-white/20 bg-muted/30 rounded-xl hover:bg-muted/50 text-white text-center"
                  >
                    $50
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDayPrice('100');
                      setIsDayPriceModalOpen(false);
                    }}
                    className="p-4 border border-white/20 bg-muted/30 rounded-xl hover:bg-muted/50 text-white text-center"
                  >
                    $100
                  </button>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setIsDayPriceModalOpen(false)}
                    className="text-white/90 hover:bg-muted/50 rounded-xl h-11"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Modal>

            {/* Week Price Modal */}
            <Modal
              isOpen={isWeekPriceModalOpen}
              onClose={() => setIsWeekPriceModalOpen(false)}
              title="Select Weekly Price"
            >
              <div className="space-y-4">
                <p className="text-white/90">
                  Select a price for one week access:
                </p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setWeekPrice('0');
                      setIsWeekPriceModalOpen(false);
                    }}
                    className="p-4 border border-white/20 bg-muted/30 rounded-xl hover:bg-muted/50 text-white text-center"
                  >
                    $0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWeekPrice('50');
                      setIsWeekPriceModalOpen(false);
                    }}
                    className="p-4 border border-white/20 bg-muted/30 rounded-xl hover:bg-muted/50 text-white text-center"
                  >
                    $50
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWeekPrice('200');
                      setIsWeekPriceModalOpen(false);
                    }}
                    className="p-4 border border-white/20 bg-muted/30 rounded-xl hover:bg-muted/50 text-white text-center"
                  >
                    $200
                  </button>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setIsWeekPriceModalOpen(false)}
                    className="text-white/90 hover:bg-muted/50 rounded-xl h-11"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Modal>

            {/* Month Price Modal */}
            <Modal
              isOpen={isMonthPriceModalOpen}
              onClose={() => setIsMonthPriceModalOpen(false)}
              title="Select Monthly Price"
            >
              <div className="space-y-4">
                <p className="text-white/90">
                  Select a price for one month access:
                </p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMonthPrice('0');
                      setIsMonthPriceModalOpen(false);
                    }}
                    className="p-4 border border-white/20 bg-muted/30 rounded-xl hover:bg-muted/50 text-white text-center"
                  >
                    $0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMonthPrice('200');
                      setIsMonthPriceModalOpen(false);
                    }}
                    className="p-4 border border-white/20 bg-muted/30 rounded-xl hover:bg-muted/50 text-white text-center"
                  >
                    $200
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMonthPrice('800');
                      setIsMonthPriceModalOpen(false);
                    }}
                    className="p-4 border border-white/20 bg-muted/30 rounded-xl hover:bg-muted/50 text-white text-center"
                  >
                    $800
                  </button>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setIsMonthPriceModalOpen(false)}
                    className="text-white/90 hover:bg-muted/50 rounded-xl h-11"
                  >
                    Cancel
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
