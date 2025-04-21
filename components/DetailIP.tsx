'use client'

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useIP, useIPAudit } from '@/hooks/useIP'
import { formatDate, formatNumber } from '@/lib/types'
import { enhancedCidAsURL } from '@/lib/ipfsImageLoader'
import CachedImage from '@/components/CachedImage'
import { cidAsURL } from '@/lib/internalTypes'
import { useSession } from '@/hooks/useSession'
import Markdown from 'react-markdown'
import Loading from './Loading'
import { useRouter } from 'next/navigation'
import { useConfig } from '@/app/authLayout'
import * as cbor from 'cbor-web'
import { useStytchUser } from '@stytch/nextjs'
import {
  addDoc,
  collection,
  type DocumentSnapshot,
  getFirestore,
  onSnapshot,
} from 'firebase/firestore'
import { type Address, encodePacked, hexToBytes, zeroAddress } from 'viem'
import { PKPEthersWallet } from '@/packages/lit-wrapper/dist'
import { type Price, type Product, useProducts } from '@/hooks/useProducts'

const DetailIP = ({
  docId,
  view = false,
}: {
  docId: string
  view?: boolean
}) => {
  const [ndaChecked, setNdaChecked] = useState(false)
  const isViewLoading = useRef(false)
  const [viewed, setViewed] = useState<string>()
  const products = useProducts()
  const {
    litClient,
    litPromise,
    delegatedSessionSigs,
    sessionSigs: originalSessionSigs,
  } = useSession()
  const config = useConfig()
  const router = useRouter()
  const ideaData = useIP(docId)
  const prices = useMemo(() => {
    const {
      terms: { pricing } = {},
    } = ideaData || {}
    const orders = ['day', 'week', 'month']
    const prices = []
    for (const product of Object.values(products)) {
      if (product) {
        const order = orders.indexOf(product.metadata?.duration)
        if (order === -1) {
          continue
        }
        let price = product.prices?.[pricing?.[product.id] || '']
        if (!price) {
          const sortedPrices = Object.values(product.prices).sort(
            (a, b) => a.unit_amount - b.unit_amount
          )
          price = sortedPrices[0]
        }
        if (price) {
          prices.push({ ...product, price, order })
        }
      }
    }
    return prices.sort((a, b) => a.order - b.order)
  }, [products, ideaData])
  const audit = useIPAudit(docId)
  const { user } = useStytchUser()

  const buy = useCallback(
    async (
      options: Record<string, unknown> & {
        metadata: Record<string, unknown>
        price: Price
      }
    ) => {
      await litPromise
      if (!litClient) {
        throw new Error('No litClient')
      }
      const db = getFirestore()
      let duration = 0
      switch (options.duration) {
        case 'day':
          duration = 24 * 3600 * 1000 // 1 day
          break
        case 'week':
          duration = 7 * 24 * 3600 * 1000 // 7 days
          break
        case 'year':
          duration = 365 * 24 * 3600 * 1000 // 1 year
          break
        case 'month':
          duration = 30 * 24 * 3600 * 1000 // 30 days
          break
      }
      const {
        metadata: {
          tokenId,
          contract: { address: contractAddress } = {},
        } = {},
      } = ideaData || {}
      const to = (originalSessionSigs?.address || zeroAddress) as Address
      const params = [
        to,
        BigInt(tokenId || '0'),
        1n,
        contractAddress || zeroAddress,
      ] as [Address, bigint, bigint, Address]
      const message = hexToBytes(
        encodePacked(['address', 'uint256', 'uint256', 'address'], params)
      )
      const { sessionSigs } = (await delegatedSessionSigs?.(docId)) || {}
      if (!sessionSigs || !originalSessionSigs?.pkpPublicKey) {
        throw new Error('No sessionSigs')
      }
      if (!ideaData?.metadata?.contract) {
        throw new Error('No contract address')
      }
      const wallet = new PKPEthersWallet({
        litNodeClient: litClient,
        pkpPubKey: originalSessionSigs?.pkpPublicKey,
        controllerSessionSigs: sessionSigs,
      })
      const signature = (await wallet.signMessage(message)) as `0x${string}`
      if (!signature) {
        throw new Error('No signature')
      }
      const { contract, ...docMetadata } = options.metadata
      const docRef = await addDoc(
        collection(db, 'customers', user?.user_id || '', 'checkout_sessions'),
        {
          mode: 'payment',
          success_url: window.location.href,
          cancel_url: window.location.href,
          ...options,
          price: options.price.id,
          metadata: {
            ...docMetadata,
            owner: user?.user_id,
            tokenId,
            to,
            contract_name: ideaData?.metadata?.contract?.name || '',
            contract_address: ideaData?.metadata?.contract?.address || '',
            docId,
            signature: signature,
            duration,
            expiration: Date.now() + duration,
          },
        }
      )
      onSnapshot(docRef, async (doc: DocumentSnapshot) => {
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
      })
    },
    [
      user?.user_id,
      docId,
      ideaData,
      litClient,
      originalSessionSigs,
      litPromise,
      delegatedSessionSigs,
    ]
  )
  useEffect(() => {
    if (isViewLoading.current) {
      return
    }
    const doFetch = async () => {
      if (
        litClient &&
        ideaData?.canView &&
        !viewed &&
        !isViewLoading.current &&
        view &&
        ideaData?.encrypted?.cid &&
        delegatedSessionSigs
      ) {
        isViewLoading.current = true
        const url = cidAsURL(ideaData.encrypted.cid)
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

        const { ciphertext, dataToEncryptHash } = data
        const { sessionSigs, capacityDelegationAuthSig } =
          await delegatedSessionSigs(docId)
        const accessControlConditions = JSON.parse(ideaData?.encrypted?.acl)
        console.log({
          sessionSigs,
          capacityDelegationAuthSig,
          accessControlConditions,
          data,
          ciphertext: data.ciphertext.slice(0, 100),
        })
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
  }, [ideaData, view, viewed, litClient, delegatedSessionSigs, docId])
  const onKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === 'Enter') {
      router.push(`/discovery/${docId}`)
    }
  }
  if (!ideaData) {
    return (
      <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-white/70">Loading idea details...</p>
        </div>
      </Card>
    )
  }
  return (
    <div className="w-full py-8">
      <div className="max-w-4xl mx-auto space-y-8 px-4">
        {/* Header with page title and image */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center">
            <CachedImage
              src={
                ideaData.image?.cid
                  ? enhancedCidAsURL(ideaData.image.cid) ||
                    '/svg/Black+Yellow.svg'
                  : '/svg/Black+Yellow.svg'
              }
              alt={ideaData.name || 'Idea Image'}
              width={160}
              height={160}
              className="rounded-xl object-cover shadow-md border border-white/10 hover:border-primary/30 transition-all mb-4"
            />
            <h1 className="text-3xl font-bold text-primary mb-2">
              {ideaData.name}
            </h1>
            {/* Removed instructional text as per cleanup request */}
          </div>
        </div>

        {view ? (
          <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-white/10">
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 text-xs font-medium bg-white/10 text-white/60 rounded-full">
                  Intellectual Property
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {viewed ? (
                <Markdown>{viewed}</Markdown>
              ) : (
                <Loading text="Decrypting Content" />
              )}
            </CardContent>
          </Card>
        ) : null}
        {/* Main idea card - only show when not loading and no error */}
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-white/10">
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.isArray(ideaData.tags) && ideaData.tags.length > 0 ? (
                ideaData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs font-medium bg-white/10 text-white/80 rounded-full"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="px-3 py-1 text-xs font-medium bg-white/10 text-white/60 rounded-full">
                  Intellectual Property
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">
                Description
              </h3>
              <p className="text-white/90 leading-relaxed">
                {ideaData.description || 'No description available.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-1">
                  Created On
                </h3>
                <p className="text-white/90">
                  {formatDate(ideaData.createdAt)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-1">
                  Category
                </h3>
                <p className="text-white/90">
                  {ideaData.category || 'Intellectual Property'}
                </p>
              </div>
            </div>

            {/* Access Terms Section - Show if terms information exists */}
            {ideaData.terms && !ideaData.deals?.length && (
              <div className="border-t border-white/10 pt-5 mt-5">
                <h3 className="text-lg font-medium text-primary mb-3">
                  Access Terms
                </h3>

                <div className="space-y-4">
                  {/* Business Model */}
                  <div className="flex items-start gap-2">
                    <div className="bg-primary/20 p-3 rounded-full shrink-0 flex items-center justify-center">
                      <Image
                        src="/secure.svg"
                        alt="Business Model Icon"
                        width={32}
                        height={32}
                        priority
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white/70">
                        Business Model:
                      </h4>
                      <p className="text-white/90">
                        {ideaData.terms.businessModel ||
                          ideaData.category ||
                          'Protected Evaluation'}
                      </p>
                    </div>
                  </div>

                  {/* Evaluation Period */}
                  <div className="flex items-start gap-2">
                    <div className="bg-primary/20 p-3 rounded-full shrink-0 flex items-center justify-center">
                      <Image
                        src="/clock.svg"
                        alt="Evaluation Period Icon"
                        width={32}
                        height={32}
                        priority
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white/70">
                        Evaluation Period:
                      </h4>
                      <p className="text-white/90">
                        {ideaData.terms.evaluationPeriod ||
                          (Array.isArray(ideaData.tags) &&
                          ideaData.tags.length > 1
                            ? ideaData.tags[1]
                            : 'Standard')}
                      </p>
                    </div>
                  </div>

                  {/* Access Options - Show if pricing information exists */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-white/70 mb-2">
                      Access Options:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {prices?.map((item: Product & { price: Price }) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`p-3 border rounded-xl transition-all ${
                            ndaChecked
                              ? 'border-primary/30 bg-muted/30 cursor-pointer hover:bg-muted/40 hover:scale-[1.02] hover:border-primary/50'
                              : 'border-white/10 bg-muted/20 opacity-50'
                          }`}
                          disabled={!ndaChecked}
                          onClick={() =>
                            ndaChecked &&
                            buy({
                              metadata: {
                                ...ideaData.metadata,
                                contract_address:
                                  ideaData.metadata?.contract?.address || '',
                                contract_name:
                                  ideaData.metadata?.contract?.name || '',
                                duration: item.metadata?.duration,
                              },
                              price: item.price,
                            })
                          }
                          role={ndaChecked ? 'button' : ''}
                          tabIndex={ndaChecked ? 0 : -1}
                        >
                          <p className="text-white/70 text-xs">One Day</p>
                          <p className="text-primary font-medium mt-1">
                            {item.price != null && item.price?.id !== ''
                              ? formatNumber(
                                  item.price.unit_amount / 100,
                                  'currency',
                                  item.price.currency
                                )
                              : 'Not available'}
                          </p>
                        </button>
                      )) || null}
                    </div>
                  </div>

                  {/* NDA Information */}
                  {ideaData.terms.ndaRequired !== undefined && (
                    <div className="mt-4 p-3 border border-white/20 rounded-xl bg-muted/20">
                      <div className="flex items-start gap-2">
                        <div className="bg-primary/20 p-3 rounded-full shrink-0 flex items-center justify-center">
                          <Image
                            src="/patent-law.svg"
                            alt="Document Icon"
                            width={32}
                            height={32}
                            priority
                          />
                        </div>
                        <div>
                          <p className="text-white/90 mb-2">
                            {ideaData.terms.ndaRequired
                              ? 'NDA Required: Access to this idea requires a signed Non-Disclosure Agreement.'
                              : 'NDA Not Required: This idea can be accessed without a signed NDA.'}
                          </p>
                          {ideaData.terms.ndaRequired && (
                            <div className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                id="nda-confirmation"
                                checked={ndaChecked}
                                onChange={(e) =>
                                  setNdaChecked(e.target.checked)
                                }
                                className="mr-2 rounded border-white/20 bg-muted/30 text-primary"
                              />
                              <label
                                htmlFor="nda-confirmation"
                                className="text-white/80 text-sm"
                              >
                                I have signed the required Non-Disclosure
                                Agreement (NDA).
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          {/* Footer buttons removed */}
        </Card>

        {/* Clickable My Agent card */}
        <a
          href={`/discovery/${docId}`}
          className="cursor-pointer transform transition-transform hover:scale-[1.01] active:scale-[0.99]"
          aria-label="Go to My Agent"
          onKeyDown={onKeyDown}
        >
          <Card className="w-full backdrop-blur-lg bg-background/30 border border-primary/20 shadow-xl hover:border-primary hover:shadow-primary/20 transition-all mt-8">
            <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-center">
              <div className="bg-primary/20 p-3 rounded-full shrink-0 flex items-center justify-center">
                <Image
                  src="/chatbot.svg"
                  alt="My Agent Icon"
                  width={32}
                  height={32}
                  priority
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-primary mb-1 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                  My Agent{' '}
                  <ArrowRight
                    className="w-4 h-4 inline-block"
                    aria-hidden="true"
                  />
                </h3>
                <p className="text-white/80 text-sm">
                  With My Agent, you can see how your AI agent works on your
                  behalf to best represent your idea on the web.
                </p>
              </div>
            </CardContent>
          </Card>
        </a>

        {ideaData.canView && !view ? (
          <div
            onClick={() => router.push(`/view/${docId}`)}
            className="cursor-pointer transform transition-transform hover:scale-[1.01] active:scale-[0.99]"
            aria-label="Go to View Mode"
          >
            <Card className="w-full backdrop-blur-lg bg-background/30 border border-primary/20 shadow-xl hover:border-primary hover:shadow-primary/20 transition-all">
              <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-center">
                <div className="bg-primary/20 p-3 rounded-full shrink-0 flex items-center justify-center">
                  <Image
                    src="/view.svg"
                    alt="View Mode Icon"
                    width={32}
                    height={32}
                    priority
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-primary mb-1 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                    View Encrypted Idea{' '}
                    <ArrowRight
                      className="w-4 h-4 inline-block"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="text-white/80 text-sm">
                    Since you either own or have purchased the content you can
                    now view it.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {ideaData.deals?.length ? (
          <Card className="w-full backdrop-blur-lg bg-background/30 border border-primary/20 shadow-xl hover:border-primary hover:shadow-primary/20 transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-primary mb-1 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                Active Deals{' '}
                {ideaData.dealsCount ? `(${ideaData.dealsCount})` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-row gap-4 items-center">
              {ideaData.deals?.map((deal) => (
                <Fragment key={deal.id}>
                  <div
                    className="p-3 border border-white/10 rounded-xl bg-muted/20 grid gap-3"
                    style={{ gridTemplateColumns: '12em 1fr' }}
                  >
                    <div className="text-white font-bold text-sm">
                      Expires On
                    </div>
                    <div className="text-white/80 text-sm">
                      {formatDate(deal.expiresAt)}
                    </div>
                    <div className="text-white font-bold text-sm">Status</div>
                    <div className="text-white/80 text-sm">
                      {deal.status}
                    </div>{' '}
                  </div>

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    disabled={!deal.metadata?.transfer}
                    className="px-3 py-1 h-auto text-sm font-bold bg-primary/40 hover:bg-primary/60 border-primary/50"
                  >
                    <a
                      className="px-3 py-1 h-auto text-sm font-bold bg-primary/40 hover:bg-primary/60 border-primary/50"
                      href={`https://calibration.filfox.info/en/message/${deal.metadata?.transfer}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {deal.metadata?.transfer
                        ? '✓ Confirm Purchase Mint'
                        : '⚠ Transaction Unavailable'}{' '}
                    </a>
                  </Button>
                </Fragment>
              ))}
            </CardContent>
          </Card>
        ) : null}
        {ideaData.checkouts?.length ? (
          <Card className="w-full backdrop-blur-lg bg-background/30 border border-primary/20 shadow-xl hover:border-primary hover:shadow-primary/20 transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-primary mb-1 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                Checkouts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-center">
              {ideaData.checkouts?.map((deal) => (
                <Fragment key={deal.id}>
                  <div
                    className="p-3 border border-white/10 rounded-xl bg-muted/20 grid gap-3"
                    style={{ gridTemplateColumns: '12em 1fr' }}
                  >
                    <div className="text-white font-bold text-sm">DealID</div>
                    <div className="text-white/80 text-sm">{deal.id}</div>
                    <div className="text-white font-bold text-sm">
                      {deal.error?.message ? 'Error' : 'Pending'}
                    </div>
                    <div className="text-white/80 text-sm">
                      {deal.error?.message || ''}
                    </div>
                  </div>
                </Fragment>
              ))}
            </CardContent>
          </Card>
        ) : null}
        {audit ? (
          <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-white/10">
              <CardTitle className="text-2xl font-bold text-primary">
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div
                className="p-3 border border-white/10 rounded-xl bg-muted/20 grid gap-3"
                style={{ gridTemplateColumns: '12em 1fr' }}
              >
                <div className="text-white font-bold text-sm">Created On</div>
                <div className="text-white/80 text-sm">
                  {formatDate(audit.createdAt)}
                </div>
                <div className="text-white font-bold text-sm">Status</div>
                <div className="text-white/80 text-sm">{audit.status}</div>
                <div className="text-white font-bold text-sm">Creator</div>
                <div className="text-white/80 text-sm">
                  id={audit.creator}
                  <br />
                  address={audit.address}
                </div>
                <div className="text-white font-bold text-sm">Token ID</div>
                <div className="text-white/80 text-sm">
                  {ideaData.metadata?.tokenId}
                </div>
                <div className="text-white font-bold text-sm">
                  IPDocV2 Contract
                </div>
                <div className="text-white/80 text-sm">
                  name={config.CONTRACT_NAME as string}
                  <br />
                  address={config.CONTRACT as string}
                </div>
                <div className="text-white font-bold text-sm">
                  Mint Transaction
                </div>
                <div className="text-white/80 text-sm">
                  {ideaData.metadata?.mint || 'Not available'}
                  <br />
                  <Button
                    asChild
                    size="sm"
                    disabled={!ideaData.metadata?.mint}
                    variant="outline"
                    className="px-3 py-1 h-auto text-sm font-bold bg-primary/40 hover:bg-primary/60 border-primary/50"
                  >
                    <a
                      className="px-3 py-1 h-auto text-sm font-bold bg-primary/40 hover:bg-primary/60 border-primary/50"
                      href={`https://calibration.filfox.info/en/message/${ideaData.metadata?.mint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {ideaData.metadata?.mint
                        ? '✓ Confirm Creation Mint'
                        : '⚠ Transaction Unavailable'}{' '}
                    </a>
                  </Button>
                </div>
              </div>
              {audit.details?.map((detail) => (
                <div
                  key={detail.id}
                  className="p-3 border border-white/10 rounded-xl bg-muted/20 grid gap-3"
                  style={{ gridTemplateColumns: '12em 1fr' }}
                >
                  <div className="text-white font-bold text-sm">Created On</div>
                  <div className="text-white/80 text-sm">
                    {formatDate(detail.createdAt)}
                  </div>

                  <div className="text-white font-bold text-sm">Status</div>
                  <div className="text-white/80 text-sm">{detail.status}</div>
                </div>
              )) || null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

export default DetailIP
