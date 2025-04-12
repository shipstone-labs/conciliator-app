import {
  castAuditDetailsToUIDoc,
  castAuditToUIDoc,
  castToUIDoc,
  type IPAuditDetails,
  type IPAudit,
  type IPDoc,
} from '@/lib/types'
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

export function useIP(tokenId: string) {
  const [ideaData, setIdeaData] = useState<IPDoc | undefined>()
  useEffect(() => {
    const fetchData = async () => {
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

export function useIPAudit(tokenId: string) {
  const [ideaData, setIdeaData] = useState<IPAudit | undefined>()
  useEffect(() => {
    let snapshot: () => void = () => {}
    const fetchData = async () => {
      const fs = getFirestore()
      snapshot = onSnapshot(
        query(
          collection(fs, 'audit', tokenId, 'details'),
          orderBy('createdAt', 'desc')
        ),
        (doc) => {
          const details = doc.docs.map((doc) =>
            castAuditDetailsToUIDoc({
              ...doc.data(),
              id: doc.id,
            } as IPAuditDetails)
          )
          setIdeaData((prev) => {
            return { ...prev, details } as IPAudit
          })
        }
      )
      const docRef = await getDoc(doc(fs, 'audit', tokenId))
      if (docRef.exists()) {
        setIdeaData((prev) => {
          return { ...prev, ...castAuditToUIDoc(docRef.data() as IPAudit) }
        })
      } else {
        setIdeaData(undefined)
      }
    }
    fetchData()
    return snapshot
  }, [tokenId])

  return ideaData
}
