import {
  castAuditDetailsToUIDoc,
  castAuditToUIDoc,
  castToUIDoc,
  type IPAuditDetails,
  type IPAudit,
  type IPDoc,
  castDealToUIDoc,
  type IPDeal,
} from '@/lib/types'
import { useStytchUser } from '@stytch/nextjs'
import {
  collection,
  doc,
  type DocumentReference,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  type OrderByDirection,
  type Query,
  query,
  type QueryCompositeFilterConstraint,
  startAfter,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { bytesToString, numberToBytes } from 'viem'
import { useSession } from './useSession'
import type { IPDealJSON } from '@/lib/internalTypes'

export function useIP(
  docId: string
):
  | (IPDoc & { deals?: IPDeal[]; checkouts?: IPDeal[]; canView?: boolean })
  | undefined {
  const { fbPromise, fbUser } = useSession()
  if (!fbUser && fbPromise) {
    throw fbPromise
  }
  const [ideaData, setIdeaData] = useState<
    (IPDoc & { deals?: IPDeal[]; canView?: boolean }) | undefined
  >()
  const { user } = useStytchUser()
  useEffect(() => {
    if (!user) {
      setIdeaData(undefined)
      return
    }
    const snapshots: (() => void)[] = []
    const fs = getFirestore()
    const actualDocId =
      docId.startsWith('0x') || /^\d+$/.test(docId)
        ? bytesToString(numberToBytes(BigInt(docId)))
        : docId
    snapshots.push(
      onSnapshot(doc(fs, 'ip', actualDocId), (docSnap) => {
        if (docSnap.exists()) {
          const casted = castToUIDoc({
            ...docSnap.data(),
            id: docSnap.id,
          } as IPDoc)

          setIdeaData((prev) => {
            const hasAccess = (prev?.deals || [])
              .map((doc) => doc.expiresAt)
              .some((expiresAt) => {
                if (expiresAt) {
                  return expiresAt.toDate() > new Date()
                }
                return true
              })
            return {
              ...prev,
              ...casted,
              canView: hasAccess || prev?.creator === user.user_id,
            } as IPDoc & { deals?: IPDeal[]; canView?: boolean }
          })
        }
      })
    )
    snapshots.push(
      onSnapshot(
        query(
          collection(fs, 'customers', user.user_id, 'checkout_sessions'),
          where('metadata.docId', '==', actualDocId)
        ),
        (docsSnap) => {
          const checkouts = docsSnap.docs.map((doc) => {
            return castDealToUIDoc({
              ...doc.data(),
              id: doc.id,
            } as IPDealJSON & { id: string })
          })
          setIdeaData((prev) => {
            return {
              ...prev,
              checkouts: checkouts.filter((doc) => {
                doc.error !== undefined || !('url' in doc)
              }),
            } as IPDoc & { checkouts?: IPDeal[] }
          })
        }
      )
    )
    snapshots.push(
      onSnapshot(
        query(
          query(
            collection(fs, 'ip', actualDocId, 'deals'),
            where('owner', '==', user.user_id)
          ),
          orderBy('createdAt', 'desc')
        ),
        (docSnaps) => {
          const deals = docSnaps.docs.map((doc) => {
            return castDealToUIDoc({
              ...doc.data(),
              id: doc.id,
            } as IPDealJSON & { id: string })
          })

          setIdeaData((prev) => {
            const hasAccess = deals
              .map((doc) => doc.expiresAt)
              .some((expiresAt) => {
                if (expiresAt) {
                  return expiresAt.toDate() > new Date()
                }
                return true
              })
            return {
              id: actualDocId,
              ...prev,
              deals,
              canView: hasAccess || prev?.creator === user.user_id,
            } as IPDoc & { deals?: IPDeal[]; canView?: boolean }
          })
        }
      )
    )
    return () => {
      for (const snapshot of snapshots) {
        snapshot()
      }
    }
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
  const { fbPromise, fbUser } = useSession()
  if (!fbUser && fbPromise) {
    throw fbPromise
  }
  const [ideaData, setIdeaData] = useState<{
    data: IPDoc[] | undefined
    pages: number
  }>()
  const [pages, setPages] = useState<
    Record<number, DocumentReference | undefined>
  >({ 1: undefined })
  useEffect(() => {
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
    const snapshot = onSnapshot(qry, (docsSnap) => {
      const data = docsSnap.docs.map((doc) => {
        last = doc.ref
        return castToUIDoc({ ...doc.data(), id: doc.id } as IPDoc)
      })
      let last: DocumentReference | undefined = undefined
      const _pages = pages
      if (last) {
        _pages[_page + 1] = last
        setPages(_pages)
      }
      setIdeaData({ data, pages: Object.keys(pages).length })
    })
    return snapshot
  }, [_orderBy, _orderDir, _limit, _page, pages[_page], filter])
  return ideaData
}

export function useIPAudit(tokenId: string) {
  const { fbPromise, fbUser } = useSession()
  if (!fbUser && fbPromise) {
    throw fbPromise
  }
  const [ideaData, setIdeaData] = useState<IPAudit | undefined>()
  useEffect(() => {
    const snapshots: (() => void)[] = []
    const fetchData = async () => {
      const fs = getFirestore()
      snapshots.push(
        onSnapshot(
          query(
            collection(fs, 'ip', tokenId, 'audit'),
            orderBy('createdAt', 'desc')
          ),
          (doc) => {
            const details = doc.docs.map((doc) => {
              return castAuditDetailsToUIDoc({
                ...doc.data(),
                id: doc.id,
              } as IPAuditDetails)
            })
            setIdeaData((prev) => {
              return { ...prev, details } as IPAudit
            })
          }
        )
      )
      snapshots.push(
        onSnapshot(doc(fs, 'ip', tokenId, 'status', 'status'), (docRef) => {
          setIdeaData((prev) => {
            return {
              ...prev,
              ...castAuditToUIDoc((docRef.data() || {}) as IPAudit),
            }
          })
        })
      )
    }
    fetchData()
    return () => {
      for (const snapshot of snapshots) {
        snapshot()
      }
    }
  }, [tokenId])

  return ideaData
}
