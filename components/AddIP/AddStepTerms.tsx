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
import { legalDocuments, ViewNDA } from '../ViewNDA'

type AddStepTermsProps = {
  isLoading: boolean
  ipDoc: AddDoc
  onStore: (_e: MouseEvent<HTMLButtonElement>) => void
  setIPDoc: Dispatch<SetStateAction<AddDoc>>
  localStatus: string
  status: IPAudit | undefined
  setLocalStatus: Dispatch<SetStateAction<string>>
  stepsCompleted?: {
    step1: boolean
    step2: boolean
    step3: boolean
  }
}

export const AddStepTerms = memo(
  ({
    isLoading,
    ipDoc,
    setIPDoc,
    onStore,
    localStatus,
    status,
    // Using underscore in variable name to indicate intentional unused parameter
    stepsCompleted,
  }: AddStepTermsProps) => {
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
    const [isNdaModalOpen, setIsNdaModalOpen] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState('protected-eval')
    // Using underscore to mark variable as intentionally unused
    const [_termsAccepted, setTermsAccepted] = useState(false)
    const products = useProducts()
    const [selectedPrices, setSelectedPrices] = useState<Price[] | undefined>()

    const handleBusinessModelChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        const { value: _value } = e.target
        const value = _value || ''
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
        {/* Set Terms button - for Step 2 */}
        <Button
          onClick={handleCloseTermsModal}
          variant="outline"
          className="w-full border border-border/30 text-foreground/90 hover:bg-muted/30 py-3 px-4 rounded-xl transition-all h-12"
          disabled={isLoading || !ipDoc.content}
          data-testid="set-terms-button"
        >
          Set Sharing Terms
        </Button>

        {/* Create button section */}
        <div className="relative">
          <Button
            onClick={onStore}
            className="w-full bg-primary hover:bg-primary/80 text-black font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 h-12 mt-4"
            disabled={
              isLoading || !ipDoc.content || !ipDoc.name || !ipDoc.description
            }
            data-testid="create-idea-button"
            data-ready={(!(
              isLoading ||
              !ipDoc.content ||
              !ipDoc.name ||
              !ipDoc.description
            )).toString()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span className="text-foreground/90">
                  {status?.status ||
                    localStatus ||
                    'Creating a site for your Idea. This may take a minute or two.'}
                </span>
              </>
            ) : (
              'Create Your Idea Page'
            )}
          </Button>
          {status?.status || localStatus ? (
            <div className="p-4 rounded-lg border border-border/30 bg-muted/30 mb-2 mt-4">
              <div className="flex items-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span className="text-foreground/90">
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
          title="Set Sharing Terms"
          data-testid="terms-dialog"
          data-terms-ready="false"
        >
          <div className="space-y-5" data-testid="terms-content">
            <p className="text-foreground/90 mb-4">
              When someone shows interest in your idea (such as a potential
              investor or partner), you typically need to share details while
              maintaining protection. SafeIdea enhances traditional NDAs by
              adding verifiable tracking of shared information.
            </p>

            <p className="text-foreground/90 mb-4">You can customize:</p>

            <ul className="list-disc pl-5 mb-4 space-y-1 text-foreground/90">
              <li>
                Access period: Control how long someone can view your idea
              </li>
              <li>
                Access fee: Set a price for sharing your intellectual property
              </li>
              <li>
                Business model: Define how your idea can be commercially used
              </li>
              <li>NDA terms: Select or upload legal protection documents</li>
            </ul>

            <div className="space-y-2">
              <label
                htmlFor="business-model"
                className="text-sm font-medium text-foreground/90 block"
              >
                Business Model
              </label>
              <select
                id="business-model"
                value={ipDoc.terms?.businessModel || ''}
                onChange={handleBusinessModelChange}
                className="w-full p-3 border border-border/30 bg-muted/30 text-foreground rounded-xl h-11"
                data-testid="business-model-select"
              >
                {legalDocuments.map((doc) => (
                  <option
                    key={doc.id}
                    value={doc.id}
                    data-testid={`ip-business-model-option-${doc.id}`}
                  >
                    {doc.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-foreground/60 mt-1">
                Additional business models coming soon
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="evaluation-period"
                  className="text-sm font-medium text-foreground/90 block"
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
                <p className="text-xs text-foreground/60 mt-1">
                  Period begins after transaction is completed
                </p>
              </div>
            </div>

            {/* Price is now automatically set based on the evaluation period */}

            <div className="flex justify-between space-x-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setIsTermsModalOpen(false)}
                className="text-foreground/90 hover:bg-muted/50 rounded-xl h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setIsNdaModalOpen(true)
                }}
                variant="outline"
                className="bg-muted/30 border-border/30 text-foreground hover:bg-muted/50 rounded-xl h-11"
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
            <p className="text-foreground/90">
              Select the digital NDA sharing agreement and click OK. If you
              don&apos;t want to use an agreement within this system click the
              checkbox below.
            </p>

            {/* Document Selection Area */}
            <div className="space-y-3 p-4 rounded-lg border border-border/30 bg-muted/30">
              <h3 className="font-semibold text-primary text-sm">
                Available Documents
              </h3>

              <div className="space-y-2">
                {legalDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors ${selectedDoc === doc.id ? 'border border-primary/50 bg-muted/40' : 'border border-border/30'}`}
                    onClick={() => {
                      setSelectedDoc(doc.id)
                    }}
                  >
                    <span className="text-foreground/90">{doc.name}</span>
                    <ViewNDA
                      size="sm"
                      variant="ghost"
                      businessModel={doc.id}
                      className="text-primary hover:text-primary/80 hover:bg-muted/30"
                    >
                      Select Document
                    </ViewNDA>
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
                className="rounded border-border/30 bg-muted/30 text-primary"
              />
              <label
                htmlFor="no-nda"
                className="text-foreground/90 cursor-pointer"
              >
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
                className="text-foreground/90 hover:bg-muted/50 rounded-xl h-11"
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
      </>
    )
  }
)
