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
  collectionGroup,
  doc,
  documentId,
  type DocumentReference,
  getFirestore,
  limit,
  onSnapshot,
  or,
  orderBy,
  type OrderByDirection,
  type Query,
  query,
  type QueryCompositeFilterConstraint,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { bytesToString, numberToBytes } from 'viem'
import { useSession } from './useSession'
import type { IPDealJSON } from '@/lib/internalTypes'

export function useIP(
  docId: string
): (IPDoc & { deals?: IPDeal[]; canView?: boolean }) | undefined {
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
    let deals: Array<IPDeal & { id: string }> = []
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
            const hasAccess = prev?.creator === user.user_id
            deals.filter(
              (doc) =>
                doc.owner === user.user_id &&
                (doc.expiresAt == null ||
                  doc.expiresAt.toDate() > new Date()) &&
                doc.status === 'active'
            ).length > 0
            return {
              ...prev,
              ...casted,
              deals: deals
                .filter((doc) => {
                  if (prev?.creator === user.user_id) {
                    return true
                  }
                  return doc.owner === user.user_id
                })
                .map((doc) => {
                  if (doc.expiresAt && doc.expiresAt.toDate() < new Date()) {
                    return {
                      ...doc,
                      status: 'expired',
                    }
                  }
                  return doc
                }),
              canView: hasAccess || prev?.creator === user.user_id,
            } as IPDoc & { deals?: IPDeal[]; canView?: boolean }
          })
        }
      })
    )
    snapshots.push(
      onSnapshot(
        query(
          query(
            collection(fs, 'ip', actualDocId, 'deals'),
            orderBy('createdAt', 'desc'),
            where('expiresAt', '>', Timestamp.fromDate(new Date()))
          )
        ),
        (docSnaps) => {
          deals = docSnaps.docs.map((doc) => {
            return castDealToUIDoc({
              ...doc.data(),
              id: doc.id,
            } as IPDealJSON & { id: string })
          })
          setIdeaData((prev) => {
            const hasAccess = prev?.creator === user.user_id
            deals.filter(
              (doc) =>
                doc.owner === user.user_id &&
                (doc.expiresAt == null ||
                  doc.expiresAt.toDate() > new Date()) &&
                doc.status === 'active'
            ).length > 0
            const dealsCount = deals.length
            return {
              id: actualDocId,
              ...prev,
              dealsCount,
              deals: deals
                .filter((doc) => {
                  if (prev?.creator === user.user_id) {
                    return true
                  }
                  return doc.owner === user.user_id
                })
                .map((doc) => {
                  if (doc.expiresAt && doc.expiresAt.toDate() < new Date()) {
                    return {
                      ...doc,
                      status: 'expired',
                    }
                  }
                  return doc
                }),
              canView: hasAccess || prev?.creator === user.user_id,
            } as IPDoc
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
  myItems = false,
  currentPage: _page = 1,
}: {
  orderBy?: string
  orderDirection?: OrderByDirection
  itemsPerPage?: number
  myItems?: boolean
  currentPage?: number
}) {
  const { user } = useStytchUser()
  const { owner, creator } = useMemo(() => {
    if (!myItems) {
      return {}
    }
    const creator = where(
      'creator',
      '==',
      user?.user_id
    ) as unknown as QueryCompositeFilterConstraint
    const owner = where(
      'owner',
      '==',
      user?.user_id
    ) as unknown as QueryCompositeFilterConstraint
    return { creator, owner }
  }, [user?.user_id, myItems])
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
  const [additionalDocs, setAdditionalDocs] = useState<string[]>()
  useEffect(() => {
    const fs = getFirestore()
    let qry: Query = collection(fs, 'ip')
    if (additionalDocs) {
      if (creator) {
        qry = query(qry, or(creator, where(documentId(), 'in', additionalDocs)))
      }
    } else if (creator) {
      qry = query(qry, creator)
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
    let last: DocumentReference | undefined = undefined
    const snapshots: (() => void)[] = []
    if (owner) {
      snapshots.push(
        onSnapshot(query(collectionGroup(fs, 'deals'), owner), (docSnap) => {
          const deals = docSnap.docs
            .filter((doc) => doc.ref.parent?.parent?.parent?.id === 'ip')
            .map((doc) => {
              return castDealToUIDoc({
                ipDoc: doc.ref.parent?.parent?.id,
                ...doc.data(),
                id: doc.id,
              } as IPDealJSON & { id: string; ipDoc: string }) as IPDeal & {
                ipDoc: string
                id: string
              }
            })
            .filter((doc) => doc.ipDoc)
          const docIds = deals.map((doc) => doc.ipDoc)
          console.log('DealDocs', docIds)
          setAdditionalDocs((current) => {
            if (
              new Set(docIds).intersection(new Set(current)).size ===
              docIds.length
            ) {
              return current
            }
            return docIds
          })
        })
      )
    }
    snapshots.push(
      onSnapshot(qry, (docsSnap) => {
        last = undefined
        console.log(
          'RetrievedDocs',
          docsSnap.docs.map((doc) => doc.id)
        )
        const data = docsSnap.docs.map((doc) => {
          last = doc.ref
          return castToUIDoc({ ...doc.data(), id: doc.id } as IPDoc)
        })
        const _pages = pages
        if (last && data.length === _limit) {
          _pages[_page + 1] = last
          setPages(_pages)
        }
        setIdeaData({ data, pages: Object.keys(pages).length })
      })
    )
    return () => {
      for (const snapshot of snapshots) {
        snapshot()
      }
    }
  }, [
    _orderBy,
    _orderDir,
    _limit,
    _page,
    pages[_page],
    owner,
    creator,
    additionalDocs,
  ])
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
