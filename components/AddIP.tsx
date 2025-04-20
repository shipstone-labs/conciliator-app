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
import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'

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
  const [isNdaModalOpen, setIsNdaModalOpen] = useState(false)
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false)
  const [businessModel, setBusinessModel] = useState('Protected Evaluation')
  const [evaluationPeriod, setEvaluationPeriod] = useState('one-day')
  const [dayPrice, setDayPrice] = useState('5.00')
  const [weekPrice, setWeekPrice] = useState('25.00')
  const [monthPrice, setMonthPrice] = useState('90.00')
  const [ndaConfirmed, setNdaConfirmed] = useState(false)
  const [noNdaSelected, setNoNdaSelected] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState('protected-eval')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [ndaDocument, setNdaDocument] = useState('')
  
  // Available legal documents
  const legalDocuments = [
    { id: 'protected-eval', name: 'SafeIdea Protected Evaluation Agreement', path: '/legal-docs/protected-eval.md' }
  ]
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
        tags: ['IP', evaluationPeriod],
        // Include all terms information
        terms: {
          businessModel,
          evaluationPeriod,
          pricing: {
            dayPrice,
            weekPrice,
            monthPrice,
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
    evaluationPeriod,
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
  
  // Function to load document content
  const loadDocumentContent = useCallback(async (docId: string) => {
    try {
      const doc = legalDocuments.find(d => d.id === docId);
      if (!doc) return;
      
      const response = await fetch(doc.path);
      if (response.ok) {
        const markdown = await response.text();
        // Convert markdown to HTML and sanitize
        const html = DOMPurify.sanitize(marked.parse(markdown));
        setNdaDocument(html);
      } else {
        console.error('Failed to load document:', response.statusText);
        setError(`Failed to load document: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Error loading document. Please try again.');
    }
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
                <strong> Set Terms for Sharing </strong> to configure sharing options.
              </p>
            </div>

            {/* Set Terms button - disabled until content exists */}
            <Button
              onClick={() => setIsTermsModalOpen(true)}
              variant="outline"
              className="w-full border border-white/20 text-white/90 hover:bg-muted/30 py-3 px-4 rounded-xl transition-all h-12"
              disabled={isLoading || !content}
            >
              Set Terms for Sharing
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
                    <span className="text-white/90">
                      {status?.status ||
                        localStatus ||
                        'Creating a site for your Idea. This may take a minute or two.'}
                    </span>
                  </>
                ) : (
                  'View Idea Page'
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
                      setIsNdaModalOpen(true)
                    }}
                    variant="outline"
                    className="bg-muted/30 border-white/20 text-white hover:bg-muted/50 rounded-xl h-11"
                  >
                    Review NDA
                  </Button>
                  <Button
                    onClick={() => {
                      if (!ndaConfirmed) {
                        alert('Please review the NDA options first')
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
            
            {/* NDA Selection Modal */}
            <Modal
              isOpen={isNdaModalOpen}
              onClose={() => setIsNdaModalOpen(false)}
              title="Select Sharing Agreement"
            >
              <div className="space-y-5">
                <p className="text-white/90">
                  Select the digital NDA sharing agreement and click OK. If you don&apos;t want to use an agreement within this system click the checkbox below.
                </p>
                
                {/* Document Selection Area */}
                <div className="space-y-3 p-4 rounded-lg border border-white/20 bg-muted/30">
                  <h3 className="font-semibold text-primary text-sm">Available Documents</h3>
                  
                  <div className="space-y-2">
                    {legalDocuments.map(doc => (
                      <div 
                        key={doc.id}
                        className={`flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors ${selectedDoc === doc.id ? 'border border-primary/50 bg-muted/40' : 'border border-white/20'}`}
                        onClick={() => {
                          setSelectedDoc(doc.id);
                          loadDocumentContent(doc.id);
                        }}
                      >
                        <span className="text-white/90">{doc.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadDocumentContent(doc.id);
                            setIsDocViewerOpen(true);
                          }}
                          className="text-primary hover:text-primary/80 hover:bg-muted/30"
                        >
                          View Document
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Opt-out Checkbox */}
                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="no-nda"
                    checked={noNdaSelected}
                    onChange={() => {
                      setNoNdaSelected(!noNdaSelected);
                      if (!noNdaSelected) {
                        setSelectedDoc('');
                      }
                    }}
                    className="rounded border-white/20 bg-muted/30 text-primary"
                  />
                  <label
                    htmlFor="no-nda"
                    className="text-white/90 cursor-pointer"
                  >
                    I choose to not include a SafeIdea sharing agreement for my Idea.
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setIsNdaModalOpen(false)}
                    className="text-white/90 hover:bg-muted/50 rounded-xl h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Set NDA confirmed based on selection
                      setNdaConfirmed(true);
                      setIsNdaModalOpen(false);
                    }}
                    className="bg-primary hover:bg-primary/80 text-black font-medium transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 rounded-xl h-11"
                    disabled={!selectedDoc && !noNdaSelected}
                  >
                    OK
                  </Button>
                </div>
              </div>
            </Modal>
            
            {/* Document Viewer Modal */}
            <Modal
              isOpen={isDocViewerOpen}
              onClose={() => setIsDocViewerOpen(false)}
              title="Document Viewer"
            >
              <div className="space-y-4">
                <div className="bg-muted/20 border border-white/10 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
                  <div className="prose prose-invert max-w-none">
                    {ndaDocument ? (
                      // We're using DOMPurify to sanitize the HTML before rendering
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized with DOMPurify
                      <div dangerouslySetInnerHTML={{ __html: ndaDocument }} />
                    ) : (
                      <p className="text-white/90">Loading document...</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsDocViewerOpen(false)}
                    className="bg-primary hover:bg-primary/80 text-black font-medium transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 rounded-xl h-11"
                  >
                    Close Document
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
