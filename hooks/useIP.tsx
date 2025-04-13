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
  type DocumentReference,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  type OrderByDirection,
  query,
  startAfter,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

export function useIP(tokenId: string) {
  const [ideaData, setIdeaData] = useState<IPDoc | undefined>()
  useEffect(() => {
    const fetchData = async () => {
      const fs = getFirestore()
      const docRef = await getDoc(doc(fs, 'ip', tokenId))
      if (docRef.exists()) {
        setIdeaData(castToUIDoc({ ...docRef.data(), id: docRef.id } as IPDoc))
      } else {
        setIdeaData(undefined)
      }
    }

    fetchData()
  }, [tokenId])

  return ideaData
}

export function useIPs(
  _orderBy = 'createdAt',
  _orderDir: OrderByDirection = 'desc',
  _limit = 10,
  _page = 1
) {
  const [ideaData, setIdeaData] = useState<{
    data: IPDoc[] | undefined
    pages: number
  }>()
  const [pages, setPages] = useState<
    Record<number, DocumentReference | undefined>
  >({ 1: undefined })
  useEffect(() => {
    const doIt = async () => {
      const fs = getFirestore()
      let qry = query(collection(fs, 'ip'), orderBy(_orderBy, _orderDir))
      const _startAfter = pages[_page]
      if (!_startAfter && _page > 1) {
        console.error('Last page')
        return
      }
      if (_startAfter) {
        qry = query(qry, startAfter(_startAfter))
      }
      qry = query(qry, limit(_limit))
      const snapshot = await getDocs(qry)
      let last: DocumentReference | undefined = undefined
      const data = snapshot.docs.map((doc) => {
        last = doc.ref
        return castToUIDoc({ ...doc.data(), id: doc.id } as IPDoc)
      })
      const _pages = pages
      if (last) {
        _pages[_page + 1] = last
        setPages(_pages)
      }
      setIdeaData({ data, pages: Object.keys(pages).length })
    }
    doIt()
  }, [_orderBy, _orderDir, _limit, _page, pages[_page]])
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
