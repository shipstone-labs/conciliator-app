import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type MouseEvent,
  type SetStateAction,
  useCallback,
  useState,
} from 'react'
import type { AddDoc } from '.'
import type { IPAudit } from '@/lib/types'
import { type Price, useProducts } from '@/hooks/useProducts'
import { Button } from '../ui/button'
import { Loader2 } from 'lucide-react'
import { Modal } from '../ui/modal'
import { SortedProducts } from './SortedProducts'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type AddStepTermsProps = {
  isLoading: boolean
  ipDoc: AddDoc
  onStore: (_e: MouseEvent<HTMLButtonElement>) => void
  setIPDoc: Dispatch<SetStateAction<AddDoc>>
  localStatus: string
  status: IPAudit | undefined
  setLocalStatus: Dispatch<SetStateAction<string>>
}

// Available legal documents
const legalDocuments = [
  {
    id: 'protected-eval',
    name: 'SafeIdea Protected Evaluation Agreement',
    path: '/legal-docs/protected-eval.md',
  },
]

export const AddStepTerms = memo(
  ({
    isLoading,
    ipDoc,
    setIPDoc,
    onStore,
    localStatus,
    status,
  }: AddStepTermsProps) => {
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
    const [isNdaModalOpen, setIsNdaModalOpen] = useState(false)
    const [isDocViewerOpen, setIsDocViewerOpen] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState('protected-eval')
    const [markdownContent, setMarkdownContent] = useState('')
    const [termsAccepted, setTermsAccepted] = useState(false)
    const products = useProducts()
    const [selectedPrices, setSelectedPrices] = useState<Price[] | undefined>()

    // Function to load document content
    const loadDocumentContent = useCallback(
      async (docId: string) => {
        try {
          const doc = legalDocuments.find((d) => d.id === docId)
          if (!doc) return

          const response = await fetch(doc.path)
          if (response.ok) {
            const markdown = await response.text()
            setMarkdownContent(markdown)
          } else {
            console.error('Failed to load document:', response.statusText)
            setIPDoc((prev) => ({
              ...prev,
              error: `Failed to load document: ${response.statusText}`,
            }))
          }
        } catch (err) {
          console.error('Error loading document:', err)
          setIPDoc((prev) => ({
            ...prev,
            error: 'Error loading document. Please try again.',
          }))
        }
      },
      [setIPDoc]
    )

    const handleBusinessModelChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        const { value: _value } = e.target
        const value = _value || 'Intellectual Property'
        setIPDoc((prev) => ({
          ...prev,
          category: value,
          terms: {
            ...prev.terms,
            businessModel: value,
          } as AddDoc['terms'],
        }))
      },
      [setIPDoc]
    )

    const handleCloseNdaModal = useCallback(() => setIsNdaModalOpen(false), [])

    const handleCloseTermsModal = useCallback(
      () => setIsTermsModalOpen(true),
      []
    )

    const handleNdaSelected = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const { checked } = e.target as HTMLInputElement
        setIPDoc((prev) => ({
          ...prev,
          terms: { ...prev.terms, ndaRequired: checked } as AddDoc['terms'],
        }))
        if (!checked) {
          setSelectedDoc('')
        }
      },
      [setIPDoc]
    )

    const handleSelectedPrices = useCallback(
      (selectedPrices: Price[]) => {
        setSelectedPrices(selectedPrices)
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
        setIPDoc((prev) => ({
          ...prev,
          terms: { ...prev.terms, pricing } as AddDoc['terms'],
        }))
      },
      [setIPDoc, products]
    )

    return (
      <>
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
          onClick={handleCloseTermsModal}
          variant="outline"
          className="w-full border border-white/20 text-white/90 hover:bg-muted/30 py-3 px-4 rounded-xl transition-all h-12"
          disabled={isLoading || !ipDoc.content}
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
          {!termsAccepted &&
          ipDoc.content &&
          ipDoc.name &&
          ipDoc.description ? (
            <div className="w-full text-center text-amber-300 text-sm mb-2">
              ⚠️ Please set terms first
            </div>
          ) : null}
          <Button
            onClick={onStore}
            className="w-full bg-primary hover:bg-primary/80 text-black font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 h-12 mt-4"
            disabled={
              isLoading ||
              !ipDoc.content ||
              !ipDoc.name ||
              !ipDoc.description ||
              !termsAccepted
            }
            data-testid="create-idea-button"
            data-ready={(!(
              isLoading ||
              !ipDoc.content ||
              !ipDoc.name ||
              !ipDoc.description ||
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
                value={ipDoc.terms?.businessModel || ''}
                onChange={handleBusinessModelChange}
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
                    onSelect={handleSelectedPrices}
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
        {/* NDA Selection Modal */}
        <Modal
          isOpen={isNdaModalOpen}
          onClose={handleCloseNdaModal}
          title="Select Sharing Agreement"
        >
          <div className="space-y-5">
            <p className="text-white/90">
              Select the digital NDA sharing agreement and click OK. If you
              don&apos;t want to use an agreement within this system click the
              checkbox below.
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
                checked={!ipDoc.terms?.ndaRequired}
                onChange={handleNdaSelected}
                className="rounded border-white/20 bg-muted/30 text-primary"
              />
              <label htmlFor="no-nda" className="text-white/90 cursor-pointer">
                I choose to not include a SafeIdea sharing agreement for my
                Idea.
              </label>
            </div>
            {!ipDoc.terms?.ndaRequired && !selectedDoc && (
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
                  setIPDoc((prev) => ({
                    ...prev,
                    terms: {
                      ...prev.terms,
                      ndaRequired: true,
                    } as AddDoc['terms'],
                  }))
                  setIsNdaModalOpen(false)
                }}
                className="bg-primary hover:bg-primary/80 text-black font-medium transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 rounded-xl h-11"
                disabled={!selectedDoc}
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
      </>
    )
  }
)
