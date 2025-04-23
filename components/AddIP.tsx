'use client'

import { useCallback, useState, useRef, useEffect, useMemo } from 'react'
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
import { formatNumber, type IPAudit } from '@/lib/types'
import { useConfig } from '@/app/authLayout'
import { type Price, type Product, useProducts } from '@/hooks/useProducts'
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const getSortedPrices = (prices: Record<string, Price>) => {
  const sorted = Object.values(prices).sort((a, b) => {
    if (a.unit_amount === b.unit_amount) {
      return a.id.localeCompare(b.id)
    }
    return a.unit_amount - b.unit_amount
  })
  return [...sorted]
}

const SortedProducts = ({
  products,
  value,
  onSelect,
}: {
  products: Record<string, Product>
  value: Price[] | undefined
  onSelect: (select: Price[]) => void
}) => {
  const order = ['day', 'week', 'month']
  const sortedProducts = useMemo(
    () =>
      Object.values(products)
        .filter((product) => order.indexOf(product.metadata?.duration) !== -1)
        .map((product) => ({
          ...product,
          order: order.indexOf(product.metadata?.duration),
        }))
        .sort((a, b) => {
          return a.order - b.order
        }),
    [products]
  )

  const defaultPrices = useMemo<Price[]>(() => {
    return sortedProducts.map(
      (product) => getSortedPrices(product.prices)[0]
    ) as Price[]
  }, [sortedProducts])
  return sortedProducts.map((product, index) => {
    const sortedPrices = getSortedPrices(product.prices)
    return (
      <div key={product.id} className="flex flex-col">
        <div className="flex items-center space-x-2 p-3 border bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors">
          <Select
            value={value?.[index]?.id || defaultPrices[0].id}
            onValueChange={(_priceValue: string) => {
              const priceValue = _priceValue === '__none__' ? '' : _priceValue
              const newPrice = sortedPrices.find(
                (price) => price.id === priceValue
              )
              const newPrices: Price[] = value ? [...value] : [...defaultPrices]
              newPrices[index] = newPrice as Price
              console.log('newPrices', newPrices)
              onSelect(newPrices)
            }}
          >
            <SelectTrigger className="flex flex-row justify-items-start">
              {value?.[index] && value?.[index]?.id !== ''
                ? formatNumber(
                    (value[index].unit_amount || 0) / 100,
                    'currency',
                    value[index]?.currency?.toUpperCase?.() || 'USD'
                  )
                : '-- NA --'}{' '}
              <div className="text-xs text-white/60">{product.name}</div>
            </SelectTrigger>
            <SelectContent>
              {sortedPrices.map((price) => (
                <SelectItem key={price.id} value={price.id || '__none__'}>
                  {price.id !== ''
                    ? formatNumber(
                        price.unit_amount / 100,
                        'currency',
                        price?.currency || 'USD'
                      )
                    : '-- NA --'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>{product.description}</div>
      </div>
    )
  })
}

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
  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  const [businessModel, setBusinessModel] = useState('Protected Evaluation')
  const [selectedPrices, setSelectedPrices] = useState<Price[] | undefined>()
  const [ndaConfirmed, setNdaConfirmed] = useState(false)
  const [noNdaSelected, setNoNdaSelected] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState('protected-eval')
  const [isNdaModalOpen, setIsNdaModalOpen] = useState(false)
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Available legal documents
  const legalDocuments = [
    {
      id: 'protected-eval',
      name: 'SafeIdea Protected Evaluation Agreement',
      path: '/legal-docs/protected-eval.md',
    },
  ]
  const stytchClient = useStytch()
  const [docId, setDocId] = useState('')
  const [status, setStatus] = useState<IPAudit>()
  const [localStatus, setLocalStatus] = useState('')
  const { litClient, fbPromise, litPromise, sessionSigs } = useSession()
  const products = useProducts()
  const config = useConfig()
  useEffect(() => {
    if (docId) {
      const statusDoc = doc(fb, 'ip', docId, 'status', 'status')
      return onSnapshot(statusDoc, (doc) => {
        setStatus((doc.data() as IPAudit) || undefined)
      })
    }
  }, [docId, fb])

  // Initialize the global readiness object for automation
  useEffect(() => {
    // Use TypeScript guard for browser APIs to prevent SSR errors
    if (typeof window !== 'undefined') {
      // Use type assertion for the extended window interface
      const win = window as Window &
        typeof globalThis & {
          importToolReady?: {
            formLoaded: boolean
            titleInputReady: boolean
            descriptionInputReady: boolean
            fileUploadReady: boolean
            fileUploadComplete: boolean
            termsDialogReady: boolean
            createButtonReady: boolean
            submissionComplete: boolean
            currentStep?: number
            formStepComplete?: boolean[]
            [key: string]: any
          }
        }

      // Create global readiness object if it doesn't exist
      win.importToolReady = win.importToolReady || {
        formLoaded: false,
        titleInputReady: false,
        descriptionInputReady: false,
        fileUploadReady: false,
        fileUploadComplete: false,
        termsDialogReady: false,
        createButtonReady: false,
        submissionComplete: false,
      }

      // Set form loaded flag after a short delay to ensure all is initialized
      setTimeout(() => {
        // Update the DOM attribute
        const formElement = document.querySelector('.add-idea-form')
        if (formElement) {
          formElement.setAttribute('data-form-ready', 'true')
        }

        // Update the global readiness flag - use null checking
        if (win.importToolReady) {
          win.importToolReady.formLoaded = true
        }
      }, 500)

      // Set title input ready when it's available
      if (titleInputRef.current) {
        // Update the DOM attribute
        titleInputRef.current.setAttribute('data-ready', 'true')

        // Update the global readiness flag - use null checking
        if (win.importToolReady) {
          win.importToolReady.titleInputReady = true
        }
      }

      // Set description input ready when it's available
      if (descriptionInputRef.current) {
        // Update the DOM attribute
        descriptionInputRef.current.setAttribute('data-ready', 'true')

        // Update the global readiness flag - use null checking
        if (win.importToolReady) {
          win.importToolReady.descriptionInputReady = true
        }
      }

      // Set file upload ready when it's available
      if (fileInputRef.current) {
        if (win.importToolReady) {
          win.importToolReady.fileUploadReady = true
        }
      }
    }
  }, [])

  // Optional logging for debugging readiness states
  useEffect(() => {
    // Use TypeScript guard for browser APIs
    if (typeof window === 'undefined') return

    // Use type assertion for the extended window interface
    const win = window as Window &
      typeof globalThis & {
        importToolReady?: {
          formLoaded: boolean
          titleInputReady: boolean
          [key: string]: any
        }
      }

    const trackReadinessChanges = () => {
      // Create a proxy to monitor changes to the importToolReady object
      // Use safe null checking pattern
      if (!win.importToolReady) return

      const originalImportToolReady = win.importToolReady
      win.importToolReady = new Proxy(originalImportToolReady, {
        set(target, property, value) {
          // Handle property access types properly - Symbol could be a key
          console.log(
            `[ImportTool] Readiness change: ${String(property)} = ${value}`
          )
          target[property as keyof typeof target] = value
          return true
        },
      })
    }

    trackReadinessChanges()
  }, [])

  const handleStore = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    setLocalStatus('Encrypting your idea')

    // Normal production flow
    try {
      await litPromise
      await fbPromise
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
      const pricing: Record<
        string,
        {
          product: string
          price: string
          index: number
          duration: string
        }
      > = {}
      for (
        let index = 0;
        selectedPrices && index < selectedPrices.length;
        index++
      ) {
        const price = selectedPrices[index]
        pricing[products[price.product].id] = {
          product: price.product,
          duration: products[price.product].metadata?.duration,
          price: price.id,
          index,
        }
      }
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
        tags: ['IP'],
        // Include all terms information
        terms: {
          businessModel,
          pricing,
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
      setError((err as { message: string }).message)
    } finally {
      setIsLoading(false)
    }
    // ⚠️ Remove testTokenCounter when removing test mode
  }, [
    content,
    description,
    name,
    litClient,
    fbPromise,
    litPromise,
    businessModel,
    selectedPrices,
    products,
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

        // Update file upload completion status for automation
        if (typeof window !== 'undefined') {
          const win = window as Window &
            typeof globalThis & {
              importToolReady?: { fileUploadComplete?: boolean }
            }

          if (win.importToolReady) {
            win.importToolReady.fileUploadComplete = true
          }

          // Add a data attribute to the content container
          const fileUploadZone = document.querySelector(
            '.p-4.rounded-lg.border.border-primary\\/30.bg-muted\\/30'
          )
          if (fileUploadZone) {
            fileUploadZone.setAttribute('data-upload-complete', 'true')
            fileUploadZone.setAttribute('data-testid', 'file-upload-zone')
          }
        }
      }
      reader.readAsText(file)
    },
    []
  )

  // Reset terms when content changes
  useEffect(() => {
    setTermsAccepted(false)
  }, [])

  // Set terms dialog readiness
  useEffect(() => {
    if (!isTermsModalOpen) return

    if (typeof window !== 'undefined') {
      const win = window as Window &
        typeof globalThis & {
          importToolReady?: { termsDialogReady?: boolean }
        }

      // Set terms dialog ready after a short delay for animations
      setTimeout(() => {
        const termsDialog = document.querySelector(
          '[data-testid="terms-dialog"]'
        )
        if (termsDialog) {
          termsDialog.setAttribute('data-terms-ready', 'true')
        }

        if (win.importToolReady) {
          win.importToolReady.termsDialogReady = true
        }
      }, 500)
    }
  }, [isTermsModalOpen])

  // Track create button readiness
  const readyToCreate = useMemo(() => {
    return !isLoading && content && name && description && termsAccepted
  }, [isLoading, content, name, description, termsAccepted])

  // Calculate form step completion status
  const formStepComplete = useMemo(() => {
    return [
      // Step 1: Basic info (name and description)
      Boolean(name && description),
      // Step 2: Upload content
      Boolean(content),
      // Step 3: Set terms
      Boolean(termsAccepted),
      // Step 4: Ready to create
      readyToCreate,
    ]
  }, [name, description, content, termsAccepted, readyToCreate])

  // Calculate current step based on completion status
  const currentStep = useMemo(() => {
    if (!formStepComplete[0]) return 1
    if (!formStepComplete[1]) return 2
    if (!formStepComplete[2]) return 3
    return 4
  }, [formStepComplete[0], formStepComplete[1], formStepComplete[2]])

  // Track create button readiness and update global readiness API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as Window &
        typeof globalThis & {
          importToolReady?: {
            createButtonReady?: boolean
            currentStep?: number
            formStepComplete?: boolean[]
          }
        }

      if (win.importToolReady) {
        win.importToolReady.createButtonReady = Boolean(readyToCreate)
        win.importToolReady.currentStep = currentStep
        win.importToolReady.formStepComplete = formStepComplete.map((status) =>
          Boolean(status)
        )
      }
    }
  }, [
    readyToCreate,
    currentStep,
    formStepComplete[0],
    formStepComplete[1],
    formStepComplete[2],
  ])

  // Function to load document content
  const loadDocumentContent = useCallback(async (docId: string) => {
    try {
      const doc = legalDocuments.find((d) => d.id === docId)
      if (!doc) return

      const response = await fetch(doc.path)
      if (response.ok) {
        const markdown = await response.text()
        setMarkdownContent(markdown)
      } else {
        console.error('Failed to load document:', response.statusText)
        setError(`Failed to load document: ${response.statusText}`)
      }
    } catch (err) {
      console.error('Error loading document:', err)
      setError('Error loading document. Please try again.')
    }
  }, [])

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

            {/* Hidden form progress indicators for automation */}
            <div className="hidden">
              <div
                data-testid="form-step-1"
                data-step-complete={formStepComplete[0].toString()}
              />
              <div
                data-testid="form-step-2"
                data-step-complete={formStepComplete[1].toString()}
              />
              <div
                data-testid="form-step-3"
                data-step-complete={formStepComplete[2].toString()}
              />
              <div
                data-testid="form-step-4"
                data-step-complete={formStepComplete[3].toString()}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="p-4 mb-2">
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mr-2">
                  1
                </div>
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
                ref={titleInputRef}
                placeholder="Enter the title that will appear in public listings"
                data-testid="idea-title-input"
                data-ready="false"
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
                ref={descriptionInputRef}
                placeholder="Enter a description that will be visible to the public"
                data-testid="idea-description-input"
                data-ready="false"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                className="min-h-24 border-white/20 bg-muted/50 text-white placeholder:text-white/60 focus:border-primary rounded-xl"
              />
            </div>

            <div className="p-4 mb-2 mt-4">
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mr-2">
                  2
                </div>
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
                data-testid="add-encrypt-button"
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
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mr-2">
                  3
                </div>
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
              data-testid="set-terms-button"
            >
              Set Terms
            </Button>

            {/* Create Page explanation */}
            <div className="p-4 mb-2 mt-4">
              <p className="text-sm text-white/90">
                Clicking <strong>Create Idea Page</strong> submits your idea and
                takes you to your new idea page. You can share this page address
                with others to explore your secure idea.
              </p>
            </div>

            {/* Button moved below the note */}
            <div className="relative">
              {!termsAccepted && content && name && description ? (
                <div className="w-full text-center text-amber-300 text-sm mb-2">
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
                data-testid="create-idea-button"
                data-ready={(!(
                  isLoading ||
                  !content ||
                  !name ||
                  !description ||
                  !termsAccepted
                )).toString()}
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
              data-testid="terms-dialog"
              data-terms-ready="false"
            >
              <div className="space-y-5" data-testid="terms-content">
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
                    data-testid="business-model-select"
                  >
                    <option
                      value="Protected Evaluation"
                      data-testid="ip-protected-eval-option"
                    >
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
                      <SortedProducts
                        products={products}
                        value={selectedPrices}
                        onSelect={setSelectedPrices}
                      />
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
                      // Save terms logic would go here
                      setTermsAccepted(true)
                      setIsTermsModalOpen(false)
                    }}
                    className="bg-primary hover:bg-primary/80 text-black font-medium transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 rounded-xl h-11"
                    data-testid="terms-accept-button"
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
              data-testid="file-upload-input"
            />

            {/* NDA Selection Modal */}
            <Modal
              isOpen={isNdaModalOpen}
              onClose={() => setIsNdaModalOpen(false)}
              title="Select Sharing Agreement"
            >
              <div className="space-y-5">
                <p className="text-white/90">
                  Select the digital NDA sharing agreement and click OK. If you
                  don&apos;t want to use an agreement within this system click
                  the checkbox below.
                </p>

                {/* Document Selection Area */}
                <div className="space-y-3 p-4 rounded-lg border border-white/20 bg-muted/30">
                  <h3 className="font-semibold text-primary text-sm">
                    Available Documents
                  </h3>

                  <div className="space-y-2">
                    {legalDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className={`flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors ${selectedDoc === doc.id ? 'border border-primary/50 bg-muted/40' : 'border border-white/20'}`}
                        onClick={() => {
                          setSelectedDoc(doc.id)
                          loadDocumentContent(doc.id)
                        }}
                      >
                        <span className="text-white/90">{doc.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            loadDocumentContent(doc.id)
                            setIsDocViewerOpen(true)
                          }}
                          className="text-primary hover:text-primary/80 hover:bg-muted/30"
                        >
                          Select Document
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
                      setNoNdaSelected(!noNdaSelected)
                      if (!noNdaSelected) {
                        setSelectedDoc('')
                      }
                    }}
                    className="rounded border-white/20 bg-muted/30 text-primary"
                  />
                  <label
                    htmlFor="no-nda"
                    className="text-white/90 cursor-pointer"
                  >
                    I choose to not include a SafeIdea sharing agreement for my
                    Idea.
                  </label>
                </div>
                {!noNdaSelected && !selectedDoc && (
                  <div className="w-full text-center text-amber-300 text-sm mb-2 mt-2">
                    ⚠️ Select the NDA Document you want to use
                  </div>
                )}

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
                      setNdaConfirmed(true)
                      setIsNdaModalOpen(false)
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
                    {markdownContent ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {markdownContent}
                      </ReactMarkdown>
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
