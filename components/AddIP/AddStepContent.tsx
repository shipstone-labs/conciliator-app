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

        // Check file size (20MB limit)
        if (file.size > 20 * 1024 * 1024) {
          setIPDoc((prev) => ({
            ...prev,
            error: 'File size exceeds 20MB limit',
          }))
          return
        }

        // Check file type (only text, markdown, and HTML)
        const fileName = file.name.toLowerCase()
        const isValidType =
          fileName.endsWith('.txt') ||
          fileName.endsWith('.md') ||
          fileName.endsWith('.markdown') ||
          fileName.endsWith('.html') ||
          fileName.endsWith('.htm') ||
          file.type === 'text/plain' ||
          file.type === 'text/markdown' ||
          file.type === 'text/html'

        if (!isValidType) {
          setIPDoc((prev) => ({
            ...prev,
            error: 'Only Markdown, HTML, or Text files are supported',
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
        {ipDoc.content ? (
          <div
            className="p-4 rounded-lg border border-primary/30 bg-muted/30"
            data-testid="file-upload-zone"
          >
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
            Upload File
          </Button>
        )}
        {/* Hidden file input for the Select File button to reference */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelection}
          accept=".txt,.md,.markdown,.html,.htm,text/plain,text/markdown,text/html"
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
              Upload a Markdown, HTML, or Text file. Note that only one file is
              accepted per IP. The file can be up to 20MB. Your file will be
              encrypted and stored securely.
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
