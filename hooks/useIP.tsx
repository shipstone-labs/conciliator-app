import { castToUIDoc, type IPDoc } from '@/lib/types'
import { doc, getDoc, getFirestore } from 'firebase/firestore'
import { useEffect, useState } from 'react'

export function useIP(tokenId: string) {
  const [ideaData, setIdeaData] = useState<IPDoc | undefined>()
  useEffect(() => {
    // Guard clause to prevent executing with undefined tokenId
    if (!tokenId) return;
    
    const fetchData = async () => {
      // Move Firestore initialization inside the effect
      const fs = getFirestore()
      const docRef = await getDoc(doc(fs, 'ip', tokenId))
      if (docRef.exists()) {
        setIdeaData(castToUIDoc(docRef.data() as IPDoc))
      } else {
        setIdeaData(undefined)
      }
    }

    fetchData()
  }, [tokenId])

  return ideaData
}
