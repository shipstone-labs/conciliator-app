import type { IPDoc } from '@/lib/types'
import { doc, getDoc, getFirestore, Timestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'

// Helper function to convert Firestore data to proper format
function convertFirestoreData(data: any): IPDoc {
  // If this is not an object, return as is
  if (!data || typeof data !== 'object') return data;
  
  // Handle createdAt and updatedAt timestamps
  const result = { ...data };
  
  // Keep Firestore Timestamp objects as they are, since they have the toDate() method
  // We'll handle conversion in the component

  return result as IPDoc;
}

export function useIP(tokenId: string) {
  const fs = getFirestore()
  const [ideaData, setIdeaData] = useState<IPDoc | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = await getDoc(doc(fs, 'ip', tokenId))
        if (docRef.exists()) {
          // Process the data to handle timestamps properly
          const processedData = convertFirestoreData(docRef.data())
          setIdeaData(processedData)
        } else {
          setIdeaData(undefined)
        }
      } catch (err) {
        console.error('Error fetching idea data:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
        setIdeaData(undefined)
      }
    }
    
    fetchData()
  }, [fs, tokenId])
  
  return ideaData
}
