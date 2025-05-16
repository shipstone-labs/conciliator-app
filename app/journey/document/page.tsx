'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  FileIcon,
  FileTextIcon,
  UploadIcon,
} from '@radix-ui/react-icons'
import {
  saveJourneyData,
  getJourneyData,
  markStepComplete,
} from '@/app/journey/JourneyStorage'
import {
  isNotEmpty,
  hasMinLength,
  validateForm,
} from '@/app/journey/FormValidation'

export default function DocumentPage() {
  const router = useRouter()

  // Load saved data or use defaults
  const [activeTab, setActiveTab] = useState(() =>
    getJourneyData('documentationMethod', 'write')
  )
  const [title, setTitle] = useState(() => getJourneyData('documentTitle', ''))
  const [description, setDescription] = useState(() =>
    getJourneyData('documentDescription', '')
  )
  const [document, setDocument] = useState(() =>
    getJourneyData('documentContent', '')
  )
  const [fileError, setFileError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(() =>
    getJourneyData('hasAgreedToDocTerms', false)
  )
  const [loading, setLoading] = useState(false)

  // We can't store File objects in localStorage, so we'll just track if one was selected
  const [fileName, setFileName] = useState(() =>
    getJourneyData('documentFileName', '')
  )
  const [fileSelected, setFileSelected] = useState(() =>
    getJourneyData('documentFileSelected', false)
  )

  // Save state changes to storage
  useEffect(() => {
    saveJourneyData('documentationMethod', activeTab)
    saveJourneyData('documentTitle', title)
    saveJourneyData('documentDescription', description)
    saveJourneyData('documentContent', document)
    saveJourneyData('hasAgreedToDocTerms', agreedToTerms)
    saveJourneyData('documentFileName', fileName)
    saveJourneyData('documentFileSelected', fileSelected)
  }, [
    activeTab,
    title,
    description,
    document,
    agreedToTerms,
    fileName,
    fileSelected,
  ])

  // Client-side validation
  const isValid = () => {
    const commonValidation = {
      title: isNotEmpty(title),
      description: isNotEmpty(description),
      terms: agreedToTerms,
    }

    if (activeTab === 'write') {
      return validateForm({
        ...commonValidation,
        document: hasMinLength(document, 100),
      })
    }
    return validateForm({
      ...commonValidation,
      file: fileSelected,
    })
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setFileError('')

    if (!selectedFile) {
      setFileSelected(false)
      setFileName('')
      return
    }

    // Check file type (allow markdown, text, doc, docx, pdf)
    const acceptedTypes = [
      'text/markdown',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
    ]

    // File type checking - relaxed for demo purposes
    const fileType = selectedFile.type || ''
    const fileExtension =
      selectedFile.name.split('.').pop()?.toLowerCase() || ''
    const acceptedExtensions = ['md', 'txt', 'doc', 'docx', 'pdf']

    const isAcceptedType =
      acceptedTypes.includes(fileType) ||
      acceptedExtensions.includes(fileExtension)

    if (!isAcceptedType) {
      setFileError(
        'Please upload a supported file type (Markdown, Text, Word, or PDF)'
      )
      setFileSelected(false)
      setFileName('')
      return
    }

    // Check file size (2MB max)
    if (selectedFile.size > 2 * 1024 * 1024) {
      setFileError('File size exceeds 2MB limit')
      setFileSelected(false)
      setFileName('')
      return
    }

    setFileSelected(true)
    setFileName(selectedFile.name)
  }

  // Handle form submission
  const handleContinue = async () => {
    if (!isValid()) return

    setLoading(true)

    // In a real implementation, we would:
    // 1. Upload the document/file to a storage service
    // 2. Store metadata in a database
    // 3. Link to user's account

    // For this implementation, we just mark the step as complete
    markStepComplete('document')

    // Wait briefly to simulate processing
    setTimeout(() => {
      // Navigate to the next step
      router.push('/journey/provisional')
    }, 1000)
  }

  return (
    <main>
      <Card className="rounded-xl border border-border/30 bg-background/30 backdrop-blur-lg shadow-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Document Your Idea
          </CardTitle>
          <CardDescription>
            Thorough documentation is essential to establish your idea's
            uniqueness and serves as a foundation for any intellectual property
            protection.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Title and Description Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">
                Idea Title
              </Label>
              <Input
                id="title"
                placeholder="Enter a clear, descriptive title for your idea"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="journey-doc-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">
                Brief Description
              </Label>
              <Textarea
                id="description"
                placeholder="Provide a concise summary of your idea (1-2 sentences)"
                className="h-20 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="journey-doc-description"
              />
            </div>
          </div>

          {/* Documentation Methods Tabs */}
          <Tabs
            defaultValue="write"
            value={activeTab as string}
            onValueChange={(v) => setActiveTab(v)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write" data-testid="journey-doc-tab-write">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Write Document
              </TabsTrigger>
              <TabsTrigger value="upload" data-testid="journey-doc-tab-upload">
                <UploadIcon className="mr-2 h-4 w-4" />
                Upload File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="write" className="pt-4 pb-2">
              <div className="space-y-4">
                <div className="p-3 bg-muted/20 rounded-md flex items-start space-x-3">
                  <FileTextIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-foreground/80">
                    <p className="font-medium mb-1">Documentation Guidelines</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>
                        Clearly describe what your idea does and how it works
                      </li>
                      <li>
                        Explain what problem it solves and how it's unique
                      </li>
                      <li>
                        Include any technical details, processes, or methods
                      </li>
                      <li>
                        Describe potential applications and implementations
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document" className="text-base font-medium">
                    Detailed Documentation
                  </Label>
                  <Textarea
                    id="document"
                    placeholder="Provide detailed documentation of your idea..."
                    className="min-h-[300px]"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    data-testid="journey-doc-content"
                  />
                  <p className="text-xs text-foreground/60">
                    {document.length} characters (minimum 100 recommended)
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="pt-4 pb-2">
              <div className="space-y-4">
                <div className="p-3 bg-muted/20 rounded-md flex items-start space-x-3">
                  <FileIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-foreground/80">
                    <p className="font-medium mb-1">File Upload Guidelines</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>
                        Supported formats: Markdown, Text, Word documents, PDF
                      </li>
                      <li>Maximum file size: 2MB</li>
                      <li>
                        Make sure your document follows the documentation
                        guidelines
                      </li>
                      <li>
                        Include both overview and technical details in your file
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label
                    htmlFor="file-upload"
                    className="border-2 border-dashed border-border/60 hover:border-primary/60 rounded-lg p-6 text-center block cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UploadIcon className="h-10 w-10 text-primary/70" />
                      <span className="text-base font-medium">
                        {fileName
                          ? fileName
                          : 'Click to upload or drag and drop'}
                      </span>
                      <span className="text-sm text-foreground/60">
                        Markdown, Text, Word, or PDF (max 2MB)
                      </span>
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".md,.txt,.doc,.docx,.pdf"
                      data-testid="journey-doc-file"
                    />
                  </Label>

                  {fileError && (
                    <p className="text-sm text-red-500">{fileError}</p>
                  )}

                  {fileSelected && fileName && (
                    <p className="text-sm text-foreground/70">
                      Selected file: {fileName}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Terms Checkbox */}
          <div className="pt-2 border-t border-border/30">
            <div className="flex items-start space-x-2 py-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) =>
                  setAgreedToTerms(checked === true)
                }
                data-testid="journey-doc-terms"
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="terms" className="text-sm text-foreground/90">
                  I confirm this is my original idea and I have the right to
                  document and protect it
                </Label>
                <p className="text-sm text-foreground/60">
                  By checking this box, you affirm that this idea is your
                  original creation or that you have proper authorization to
                  seek protection for it.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t border-border/30 p-6 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/journey/start')}
            className="gap-1"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleContinue}
            disabled={!isValid() || loading}
            className="gap-1"
            data-testid="journey-doc-continue"
          >
            {loading ? 'Processing...' : 'Continue'}
            {!loading && <ArrowRightIcon className="w-4 h-4" />}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
