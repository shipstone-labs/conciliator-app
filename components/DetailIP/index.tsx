'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { handleError, useIP, useIPAudit } from '@/hooks/useIP'
import CachedImage from '@/components/CachedImage'
import { cidAsURL } from '@/lib/internalTypes'
import * as cbor from 'cbor-web'
import { useStytchUser } from '@stytch/nextjs'
import {
  addDoc,
  collection,
  type DocumentSnapshot,
  getFirestore,
  onSnapshot,
} from 'firebase/firestore'
import { type Address, zeroAddress } from 'viem'
import { useSession } from '../AuthLayout'
import { MyAgent } from './MyAgent'
import { ViewStatus } from './ViewDoc'
import { type AmendedProduct, MainCard } from './MainCard'
import { Deals } from './Deals'
import { AuditLog } from './AuditLog'
import { ShowDocument } from './ShowDocument'

const DetailIP = ({
  docId,
  view = false,
}: {
  docId: string
  view?: boolean
}) => {
  const isViewLoading = useRef(false)
  const [viewed, setViewed] = useState<string>()
  const {
    litClient: _litClient,
    delegatedSessionSigs,
    sessionSigs,
    fbUser,
  } = useSession(view ? ['stytchUser', 'fbUser'] : [])
  const ipDoc = useIP(docId)

  const audit = useIPAudit(docId)
  const { user } = useStytchUser()

  const onBuy = useCallback(
    async (options: AmendedProduct) => {
      if (!ipDoc) {
        return
      }
      await fbUser.wait()
      const db = getFirestore()
      let duration = 0
      switch (options.duration) {
        case 'day':
          duration = 24 * 3600 * 1000000 // 1 day
          break
        case 'week':
          duration = 7 * 24 * 3600 * 1000000 // 7 days
          break
        case 'year':
          duration = 365 * 24 * 3600 * 1000000 // 1 year
          break
        case 'month':
          duration = 30 * 24 * 3600 * 1000000 // 30 days
          break
      }
      const { metadata } = ipDoc
      const { tokenId, contract, ...rest } = metadata
      const originalSessionSigs = await sessionSigs.wait()
      const to = (originalSessionSigs?.address || zeroAddress) as Address
      const docMetadata = {
        ...rest,
        contract_address: contract?.address || '',
        contract_name: contract?.name || '',
        duration: options.duration,
        docId,
        tokenId,
      }
      const docRef = await addDoc(
        collection(db, 'customers', user?.user_id || '', 'checkout_sessions'),
        {
          mode: 'payment',
          success_url: window.location.href,
          cancel_url: window.location.href,
          price: options.price.id,
          metadata: {
            ...docMetadata,
            owner: user?.user_id,
            to,
            duration,
            expiration: Date.now() + duration,
          },
        }
      )
      onSnapshot(
        docRef,
        async (doc: DocumentSnapshot) => {
          const { error, url } = doc.data() || {}
          if (error) {
            // Show an error to your customer and
            // inspect your Cloud Function logs in the Firebase console.
            alert(`An error occured: ${error.message}`)
          }
          if (url) {
            // We have a Stripe Checkout URL, let's redirect.
            window.location.assign(url)
          }
        },
        handleError(docRef)
      )
    },
    [user?.user_id, docId, ipDoc, sessionSigs, fbUser]
  )
  useEffect(() => {
    if (isViewLoading.current) {
      return
    }
    if (!ipDoc?.canView || !view) {
      return
    }
    fbUser.value()
    const doFetch = async () => {
      if (
        ipDoc?.canView &&
        !viewed &&
        ipDoc?.encrypted?.cid &&
        delegatedSessionSigs
      ) {
        isViewLoading.current = true
        const url = cidAsURL(ipDoc.encrypted.cid)
        if (!url) {
          console.error('Invalid CID URL')
          return
        }

        const arrayData = url
          ? await fetch(url).then((res) => {
              if (!res.ok) {
                throw new Error('Failed to fetch encrypted data')
              }
              return res.arrayBuffer()
            })
          : undefined

        let data: {
          dataToEncryptHash: string
          unifiedAccessControlConditions: unknown[]
          ciphertext: string
        }
        try {
          if (!arrayData) {
            throw new Error('No data')
          }
          const content = await cbor.decodeAll(new Uint8Array(arrayData))
          const [tag, network] = content
          if (!tag) {
            throw new Error('No tag')
          }
          if (tag !== 'LIT-ENCRYPTED') {
            throw new Error('Invalid tag')
          }
          if (content.length !== 8 && content.length !== 7) {
            throw new Error('Invalid content length')
          }
          if (
            content.length === 8 &&
            network !== 'filecoinCalibrationTestnet'
          ) {
            throw new Error('Invalid network')
          }
          const [
            dataToEncryptHash,
            unifiedAccessControlConditions,
            _ciphertext,
          ] = content.slice(-3)
          data = {
            dataToEncryptHash,
            unifiedAccessControlConditions,
            ciphertext: _ciphertext.toString('base64'),
          }
        } catch {
          data = JSON.parse(
            new TextDecoder().decode(arrayData || new Uint8Array())
          ) as {
            dataToEncryptHash: string
            unifiedAccessControlConditions: unknown[]
            ciphertext: string
          }
        }
        const litClient = await _litClient.wait()
        const { ciphertext, dataToEncryptHash } = data
        const { sessionSigs, capacityDelegationAuthSig } =
          await delegatedSessionSigs.wait(docId)
        const accessControlConditions = JSON.parse(ipDoc?.encrypted?.acl)
        const request = {
          accessControlConditions,
          // pkpPublicKey: sessionSigs?.pkpPublicKey,
          ciphertext,
          dataToEncryptHash,
          chain: 'filecoinCalibrationTestnet',
          sessionSigs,
          capacityDelegationAuthSig,
        } as unknown as Parameters<typeof litClient.decrypt>[0]
        const decrypted = await litClient.decrypt(request).catch((error) => {
          console.error('Error decrypting data:', error)
          // Too bad, but don't retry.
          return null
        })
        if (decrypted) {
          const content = new TextDecoder().decode(decrypted.decryptedData)
          setViewed(content)
        }
      }
    }
    doFetch()
  }, [ipDoc, view, viewed, fbUser, _litClient, delegatedSessionSigs, docId])
  if (!ipDoc) {
    return (
      <Card className="w-full backdrop-blur-lg bg-background/30 border border-border/30 shadow-xl overflow-hidden p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-foreground/70">Loading idea details...</p>
        </div>
      </Card>
    )
  }
  return (
    <div className="w-full py-8" data-testid="ip-item-details">
      <div className="max-w-4xl mx-auto space-y-8 px-4">
        {/* Header with page title and image */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center">
            <CachedImage
              src={
                ipDoc.image?.cid
                  ? `/api/cached-image/${ipDoc.image.cid}` ||
                    '/svg/Black+Yellow.svg'
                  : '/svg/Black+Yellow.svg'
              }
              alt={ipDoc.name || 'Idea Image'}
              width={160}
              height={160}
              className="rounded-xl object-cover shadow-md border border-border/30 hover:border-primary/30 transition-all mb-4"
            />
            <h1 className="text-3xl font-bold text-primary mb-2">
              {ipDoc.name}
            </h1>
            {/* Removed instructional text as per cleanup request */}
          </div>
        </div>

        <ShowDocument viewed={viewed} view={view} />
        <MainCard ipDoc={ipDoc} onBuy={onBuy} />
        <MyAgent ipDoc={ipDoc} />
        <ViewStatus view={view} ipDoc={ipDoc} />
        <Deals ipDoc={ipDoc} />
        <AuditLog audit={audit} ipDoc={ipDoc} />
      </div>
    </div>
  )
}

export default DetailIP
