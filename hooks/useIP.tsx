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
  type CollectionReference,
  doc,
  documentId,
  type DocumentReference,
  type DocumentSnapshot,
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
import type { IPDealJSON } from '@/lib/internalTypes'
import { useSession } from '@/components/AuthLayout'
import { useDebounce } from 'use-debounce'

export function handleError(
  docRef: DocumentReference | CollectionReference | string
): (error: Error) => void {
  return (error) => {
    console.warn(
      'Error fetching document:',
      typeof docRef === 'string' ? docRef : docRef.path,
      error
    )
  }
}

export function useIP(
  docId: string
): (IPDoc & { deals?: IPDeal[]; canView?: boolean }) | undefined {
  const [ideaData, setIdeaData] = useState<
    (IPDoc & { deals?: IPDeal[]; canView?: boolean }) | undefined
  >()
  const { user } = useStytchUser()
  const session = useSession()
  if (user != null) {
    session.fbUser.value()
  }
  useEffect(() => {
    const snapshots: (() => void)[] = []
    let deals: Array<IPDeal & { id: string }> = []
    const fs = getFirestore()
    const actualDocId =
      docId.startsWith('0x') || /^\d+$/.test(docId)
        ? bytesToString(numberToBytes(BigInt(docId)))
        : docId
    snapshots.push(
      onSnapshot(
        doc(fs, 'ip', actualDocId),
        (docSnap) => {
          if (docSnap.exists()) {
            const casted = castToUIDoc({
              ...docSnap.data(),
              id: docSnap.id,
            } as IPDoc)

            setIdeaData((prev) => {
              const hasAccess =
                prev?.creator === user?.user_id ||
                deals.filter(
                  (doc) =>
                    doc.owner === user?.user_id &&
                    (doc.expiresAt == null ||
                      doc.expiresAt.toDate() > new Date()) &&
                    doc.status === 'completed'
                ).length > 0
              return {
                ...prev,
                ...casted,
                deals: deals
                  .filter((doc) => {
                    if (prev?.creator === user?.user_id) {
                      return true
                    }
                    return doc.owner === user?.user_id
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
                canView: hasAccess,
              } as IPDoc & { deals?: IPDeal[]; canView?: boolean }
            })
          }
        },
        handleError(doc(fs, 'ip', actualDocId))
      )
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
            const hasAccess =
              prev?.creator === user?.user_id ||
              deals.filter(
                (doc) =>
                  doc.owner === user?.user_id &&
                  (doc.expiresAt == null ||
                    doc.expiresAt.toDate() > new Date()) &&
                  doc.status === 'completed'
              ).length > 0
            const dealsCount = deals.length
            return {
              id: actualDocId,
              ...prev,
              dealsCount,
              deals: deals
                .filter((doc) => {
                  if (prev?.creator === user?.user_id) {
                    return true
                  }
                  return doc.owner === user?.user_id
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
              canView: hasAccess,
            } as IPDoc
          })
        },
        handleError(collection(fs, 'ip', actualDocId, 'deals'))
      )
    )
    return () => {
      for (const snapshot of snapshots) {
        snapshot()
      }
    }
  }, [docId, user])
  return useDebounce(ideaData, 500)[0]
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
  console.log('[useIPs] Hook called with:', {
    myItems,
    currentPage: _page,
    _limit,
  })
  const { user } = useStytchUser()
  console.log('[useIPs] Stytch user:', user?.user_id)
  const { owner, creator } = useMemo(() => {
    if (!myItems) {
      return {}
    }
    const creator = user?.user_id
      ? (where(
          'creator',
          '==',
          user?.user_id
        ) as unknown as QueryCompositeFilterConstraint)
      : undefined
    const owner = user?.user_id
      ? (where(
          'owner',
          '==',
          user?.user_id
        ) as unknown as QueryCompositeFilterConstraint)
      : undefined
    return { creator, owner }
  }, [user?.user_id, myItems])
  const sessionResult = useSession()
  console.log('[useIPs] useSession result type:', typeof sessionResult)
  console.log('[useIPs] Session state:', sessionResult?.state)
  console.log(
    '[useIPs] Session properties:',
    Object.keys(sessionResult || {}).slice(0, 10)
  )
  const { fbPromise, fbUser } = sessionResult as any
  console.log(
    '[useIPs] Destructured values - fbPromise:',
    fbPromise,
    'fbUser:',
    fbUser
  )
  if (!fbUser && fbPromise) {
    console.log('[useIPs] Would throw fbPromise but it is:', fbPromise)
    throw fbPromise
  }
  const [ideaData, setIdeaData] = useState<{
    data: IPDoc[] | undefined
    pages: number
  }>()
  const [pages, setPages] = useState<
    Record<number, DocumentSnapshot | undefined>
  >({ 1: undefined })
  const [additionalDocs, setAdditionalDocs] = useState<string[]>()
  useEffect(() => {
    console.log(
      '[useIPs] useEffect running with additionalDocs:',
      additionalDocs,
      'creator:',
      creator,
      'owner:',
      owner
    )
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
    let last: DocumentSnapshot | undefined = undefined
    const snapshots: (() => void)[] = []
    if (owner) {
      snapshots.push(
        onSnapshot(
          query(collectionGroup(fs, 'deals'), owner),
          (docSnap) => {
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
              .filter(
                (doc) =>
                  doc.expiresAt == null || doc.expiresAt.toDate() > new Date()
              )
            const docIds = new Set(deals.map((doc) => doc.ipDoc))
            console.log('DealDocs', docIds)
            setAdditionalDocs((current) => {
              if (docIds.intersection(new Set(current)).size === docIds.size) {
                return current
              }
              return Array.from(docIds.values())
            })
          },
          handleError('collectionGroup deals')
        )
      )
    }
    snapshots.push(
      onSnapshot(
        qry,
        (docsSnap) => {
          last = undefined
          const data = docsSnap.docs.map((doc) => {
            last = doc
            return castToUIDoc({ ...doc.data(), id: doc.id } as IPDoc)
          })
          const _pages = pages
          if (last && data.length === _limit) {
            _pages[_page + 1] = last
            setPages(_pages)
          }
          setIdeaData({ data, pages: Object.keys(pages).length })
        },
        handleError(collection(fs, 'ip'))
      )
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
  console.log('[useIPAudit] Hook called with tokenId:', tokenId)
  const sessionResult = useSession()
  console.log('[useIPAudit] useSession result type:', typeof sessionResult)
  const { fbPromise, fbUser } = sessionResult as any
  console.log(
    '[useIPAudit] Destructured values - fbPromise:',
    fbPromise,
    'fbUser:',
    fbUser
  )
  if (!fbUser && fbPromise) {
    console.log('[useIPAudit] Would throw fbPromise but it is:', fbPromise)
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
          },
          handleError(collection(fs, 'ip', tokenId, 'audit'))
        )
      )
      snapshots.push(
        onSnapshot(
          doc(fs, 'ip', tokenId, 'status', 'status'),
          (docRef) => {
            setIdeaData((prev) => {
              return {
                ...prev,
                ...castAuditToUIDoc((docRef.data() || {}) as IPAudit),
              }
            })
          },
          handleError(doc(fs, 'ip', tokenId, 'status', 'status'))
        )
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
