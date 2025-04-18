import {
  castAuditDetailsToUIDoc,
  castAuditToUIDoc,
  castToUIDoc,
  type IPAuditDetails,
  type IPAudit,
  type IPDoc,
} from '@/lib/types'
import { useStytchUser } from '@stytch/nextjs'
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
  type Query,
  query,
  type QueryCompositeFilterConstraint,
  startAfter,
  type Timestamp,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { bytesToString, numberToBytes } from 'viem'

export function useIP(docId: string) {
  const [ideaData, setIdeaData] = useState<IPDoc | undefined>()
  const { user } = useStytchUser()
  useEffect(() => {
    if (!user) {
      setIdeaData(undefined)
      return
    }
    const fetchData = async () => {
      const fs = getFirestore()
      const actualDocId =
        docId.startsWith('0x') || /^\d+$/.test(docId)
          ? bytesToString(numberToBytes(BigInt(docId)))
          : docId
      const docRef = await getDoc(doc(fs, 'ip', actualDocId))
      if (docRef.exists()) {
        const { creator } = docRef.data() as { creator?: string }
        let hasAccess = creator === user.user_id
        if (!hasAccess) {
          const deals = await getDocs(
            query(
              query(
                collection(fs, 'ip', docId, 'deals'),
                where('to', '==', user.user_id)
              ),
              orderBy('createdAt', 'desc')
            )
          )
          hasAccess = deals.docs
            .map(
              (doc) =>
                ({
                  ...doc.data(),
                  id: doc.id,
                }) as { expiresAt?: Timestamp }
            )
            .some((deal) => {
              const { expiresAt } = deal
              if (expiresAt) {
                return expiresAt.toDate() > new Date()
              }
              return true
            })
        }
        const casted = castToUIDoc({
          ...docRef.data(),
          id: docRef.id,
          canView: hasAccess,
        } as IPDoc)
        setIdeaData(casted)
      } else {
        setIdeaData(undefined)
      }
    }

    fetchData()
  }, [docId, user])

  return ideaData
}

export function useIPs({
  orderBy: _orderBy = 'createdAt',
  orderDirection: _orderDir = 'desc',
  itemsPerPage: _limit = 16,
  filter,
  currentPage: _page = 1,
}: {
  orderBy?: string
  orderDirection?: OrderByDirection
  itemsPerPage?: number
  filter?: QueryCompositeFilterConstraint
  currentPage?: number
}) {
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
      let qry: Query = collection(fs, 'ip')
      if (filter) {
        qry = query(qry, filter)
      }
      qry = query(qry, orderBy(_orderBy, _orderDir))
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
  }, [_orderBy, _orderDir, _limit, _page, pages[_page], filter])
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
          collection(fs, 'ip', tokenId, 'audit'),
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
      const docRef = await getDoc(doc(fs, 'id', tokenId, 'status', 'status'))
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
