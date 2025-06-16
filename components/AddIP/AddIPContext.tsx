'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

export interface AddIPFormData {
  // From Protect page
  title: string
  description: string
  file: File | null
  fileName: string

  // From Share page
  sharingStartDate: Date | null
  sharingEndDate: Date | null
  legalDocuments: 'none' | 'generic-nda' | 'external'
  showInDatabase: boolean

  // From Guard page
  enableAI: boolean
}

interface AddIPContextType {
  formData: AddIPFormData
  updateFormData: (updates: Partial<AddIPFormData>) => void
  clearFormData: () => void
}

const defaultFormData: AddIPFormData = {
  title: '',
  description: '',
  file: null,
  fileName: '',
  sharingStartDate: null,
  sharingEndDate: null,
  legalDocuments: 'none',
  showInDatabase: true,
  enableAI: false,
}

const STORAGE_KEY = 'safeidea_add_ip_form'

const AddIPContext = createContext<AddIPContextType | undefined>(undefined)

export function AddIPProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<AddIPFormData>(defaultFormData)

  // Load from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Don't restore file object, only metadata
        setFormData({
          ...defaultFormData,
          ...parsed,
          file: null, // File objects can't be serialized
        })
      }
    } catch (error) {
      console.error('Error loading form data from sessionStorage:', error)
    }
  }, [])

  // Save to sessionStorage whenever formData changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      // Create a serializable version of the data
      const toStore = {
        ...formData,
        file: null, // Don't try to store File object
        // Keep fileName so user knows a file was selected
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    } catch (error) {
      console.error('Error saving form data to sessionStorage:', error)
    }
  }, [formData])

  const updateFormData = useCallback((updates: Partial<AddIPFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const clearFormData = useCallback(() => {
    setFormData(defaultFormData)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch (error) {
        console.error('Error clearing sessionStorage:', error)
      }
    }
  }, [])

  return (
    <AddIPContext.Provider value={{ formData, updateFormData, clearFormData }}>
      {children}
    </AddIPContext.Provider>
  )
}

export function useAddIPContext() {
  const context = useContext(AddIPContext)
  if (context === undefined) {
    throw new Error('useAddIPContext must be used within an AddIPProvider')
  }
  return context
}
