import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useRef,
  useState,
} from 'react'
import type { AddDoc } from '.'
import { Button } from '../ui/button'
import { Modal } from '../ui/modal'

type AddStepContentProps = {
  isLoading: boolean
  ipDoc: AddDoc
  setIPDoc: Dispatch<SetStateAction<AddDoc>>
}

export const AddStepContent = memo(
  ({ isLoading, ipDoc, setIPDoc }: AddStepContentProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const handleRemoveFile = useCallback(
      () => setIPDoc((prev) => ({ ...prev, content: undefined })),
      [setIPDoc]
    )
    const handleOpenFileDialog = useCallback(() => {
      setIsModalOpen(true)
    }, [])
    const handleFileSelection = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
          setIPDoc((prev) => ({
            ...prev,
            error: 'File size exceeds 2MB limit',
          }))
          return
        }

        // Check file type (only text and markdown)
        if (!file.type.includes('text') && !file.name.endsWith('.md')) {
          setIPDoc((prev) => ({
            ...prev,
            error: 'Only text and markdown files are supported',
          }))
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          const fileContent = event.target?.result as string

          setIPDoc((prev) => ({ ...prev, content: fileContent }))
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
      [setIPDoc]
    )
    return (
      <>
        <div className="p-4 mb-2 mt-4">
          <div className="flex items-center mb-1">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mr-2">
              2
            </div>
            <h3 className="font-semibold text-primary text-sm">
              Private Document
            </h3>
          </div>
          <p className="text-sm text-foreground/90 ml-8">
            Now you need to add a text or markdown file that contains the
            details about your idea. The file will be encrypted so that only you
            can access it.
          </p>
        </div>

        {ipDoc.content ? (
          <div className="p-4 rounded-lg border border-primary/30 bg-muted/30">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-foreground">
                File uploaded successfully
              </p>
              <Button
                onClick={handleRemoveFile}
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
            className="w-full border border-border/30 bg-muted/30 text-foreground hover:bg-muted/50 py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 h-12"
            disabled={isLoading || !ipDoc.name || !ipDoc.description}
            data-testid="add-encrypt-button"
          >
            Add and Encrypt your Idea
          </Button>
        )}
        {/* Hidden file input for the Select File button to reference */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelection}
          accept=".txt,.md,.markdown,text/plain,text/markdown"
          className="hidden"
          data-testid="file-upload-input"
        />
        {/* File upload modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Upload Your Idea"
        >
          <div className="space-y-4">
            <p className="text-foreground/90">
              Select a text or markdown file containing your idea description.
              This file will be encrypted and stored securely.
            </p>
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-foreground/90 hover:bg-muted/50 rounded-xl h-11"
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
      </>
    )
  }
)
