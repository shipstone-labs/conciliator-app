import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useDebounce } from 'use-debounce'
import type { AddDoc } from '.'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

type AddStepPublicProps = {
  isLoading: boolean
  ipDoc: AddDoc
  setIPDoc: Dispatch<SetStateAction<AddDoc & { content?: string }>>
}

export const AddStepPublic = memo(
  ({ isLoading, ipDoc, setIPDoc }: AddStepPublicProps) => {
    const [name, setName] = useState(ipDoc.name || '')
    const [description, setDescription] = useState(ipDoc.description || '')
    const handleNameChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value),
      []
    )

    const handleDescriptionChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value),
      []
    )

    const [debouncedName] = useDebounce(name, 500)
    const [debouncedDescription] = useDebounce(description, 500)

    useEffect(() => {
      // Update that part of the document
      setIPDoc((doc) => ({
        ...doc,
        name: debouncedName,
        description: debouncedDescription,
      }))
    }, [debouncedName, debouncedDescription, setIPDoc])

    return (
      <>
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
            First enter the publicly available information you want to use to
            describe your idea. This information can be seen by others on the
            Internet.
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
            data-testid="idea-title-input"
            data-ready="false"
            value={name}
            onChange={handleNameChange}
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
            data-testid="idea-description-input"
            data-ready="false"
            value={description}
            onChange={handleDescriptionChange}
            disabled={isLoading}
            className="min-h-24 border-white/20 bg-muted/50 text-white placeholder:text-white/60 focus:border-primary rounded-xl"
          />
        </div>
      </>
    )
  }
)
