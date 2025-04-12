import type { IPDoc } from '@/lib/types'
import { doc, getDoc, getFirestore } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { bytesToString, hexToBytes } from 'viem'

export function useIP(_tokenId: string) {
  let tokenId = _tokenId
  if (/^\d*$/.test(tokenId) || tokenId.startsWith('0x')) {
    const id = `0x${BigInt(tokenId).toString(16)}` as `0x${string}`
    tokenId = bytesToString(hexToBytes(id))
  }
  const fs = getFirestore()
  const [ideaData, setIdexData] = useState<IPDoc | undefined>()
  useEffect(() => {
    const fetchData = async () => {
      const docRef = await getDoc(doc(fs, 'ip', tokenId))
      if (docRef.exists()) {
        setIdexData(docRef.data() as IPDoc)
      } else {
        setIdexData(undefined)
      }
    }
    fetchData()
  }, [fs, tokenId])
  return ideaData
}
