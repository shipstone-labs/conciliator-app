'use client'

import { type PropsWithChildren, useCallback, useState } from 'react'
import { Button } from './ui/button'
import { Modal } from './ui/modal'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Available legal documents
export const legalDocuments = [
  {
    id: 'protected-eval',
    name: 'SafeIdea Protected Evaluation Agreement',
    path: '/legal-docs/protected-eval.md',
  },
  {
    id: 'provisional-patent',
    name: 'Provisional Patent Agreement',
    path: '/legal-docs/protected-eval.md',
  },
  {
    id: 'one-year-subscription',
    name: 'One Year Subscription Agreement',
    path: '/legal-docs/protected-eval.md',
  },
]

interface ViewNDAProps {
  businessModel?: string
  variant?: 'default' | 'outline' | 'subtle' | 'ghost'
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function ViewNDA({
  businessModel = 'protected-eval',
  variant = 'outline',
  className = '',
  size = 'default',
  children,
}: PropsWithChildren<ViewNDAProps>) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Load document content
  const loadDocumentContent = useCallback(async () => {
    const doc = legalDocuments.find((doc) => doc.id === businessModel)
    if (!doc) {
      setMarkdownContent('Document not found')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(doc.path)

      if (response.ok) {
        const markdown = await response.text()
        setMarkdownContent(markdown)
      } else {
        console.error('Failed to load document:', response.statusText)
        setMarkdownContent(`Failed to load document: ${response.statusText}`)
      }
    } catch (err) {
      console.error('Error loading document:', err)
      setMarkdownContent('Error loading document. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [businessModel])

  // Handle button click to show modal
  const handleShowNDA = useCallback(() => {
    setIsModalOpen(true)
    loadDocumentContent()
  }, [loadDocumentContent])

  return (
    <>
      <Button
        onClick={handleShowNDA}
        variant={variant as any}
        size={size}
        className={className}
      >
        {children || 'View NDA'}
      </Button>

      {/* Document Viewer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Non-Disclosure Agreement"
      >
        <div className="space-y-4">
          <div className="bg-muted/20 border border-white/10 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
            <div className="prose prose-invert max-w-none">
              {isLoading ? (
                <p className="text-white/90">Loading document...</p>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdownContent}
                </ReactMarkdown>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setIsModalOpen(false)}
              className="bg-primary hover:bg-primary/80 text-black font-medium transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 rounded-xl h-11"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
