/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
import { onCustomEventPublished } from 'firebase-functions/v2/eventarc'
import { debug, info, error } from 'firebase-functions/logger'
import { loadSecrets } from './secrets'
import { privateKeyToAccount } from 'viem/accounts'
import { filecoinCalibration } from 'viem/chains'
import {
  createPublicClient,
  createWalletClient,
  http,
  type WalletClient,
  zeroAddress,
} from 'viem'
import { abi } from './abi'
import { estimateFeesPerGas, waitForTransactionReceipt } from 'viem/actions'
import { cert, deleteApp, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getDatabase } from 'firebase-admin/database'
import Stripe from 'stripe'
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'

// Export secrets functions
export { loadSecrets } from './secrets'

export async function replaceDummyNonce(
  wallet: WalletClient,
  app: ReturnType<typeof initializeApp>,
  address: string,
  nonce: number
) {
  if (!wallet.account) {
    throw new Error('Wallet account is not set')
  }
  const db = getDatabase(app)
  const trans = {
    account: wallet.account,
    from: address,
    to: zeroAddress,
    value: BigInt(0),
    nonce,
    chain: wallet.chain,
    maxFeePerGas: BigInt(2),
  }
  const ref = db.ref(`nonce/${address}`)
  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(
    wallet,
    trans
  )
  await wallet
    .sendTransaction({
      ...trans,
      maxFeePerGas: maxFeePerGas + BigInt(2),
      maxPriorityFeePerGas: maxPriorityFeePerGas + BigInt(2),
    })
    .then(async (hash) => {
      await waitForTransactionReceipt(wallet, {
        hash,
      })
      await ref.update({
        [`pending/${nonce}`]: null,
      })
      return hash
    })
}

export async function runWithNonce<T>(
  wallet: WalletClient,
  app: ReturnType<typeof initializeApp>,
  call: (nonce: number) => Promise<T>
): Promise<T> {
  const client = createPublicClient({
    chain: filecoinCalibration,
    transport: http(),
  })
  const db = getDatabase(app)
  const addresses = await wallet.getAddresses()
  const address = addresses[0]
  const rpcNoncePending = await client.getTransactionCount({
    address,
    blockTag: 'pending',
  })
  const rpcNonce = await client.getTransactionCount({
    address,
    blockTag: 'pending',
  })
  const ref = db.ref(`nonce/${address}`)
  const snap = await ref.once('value')
  const _data = snap.val()
  const now = Date.now()
  const { snapshot: finalSnap } = await ref.transaction(
    (__data: {
      nonce: number
      pending: Record<string, boolean>
      lastUpdated: number
    }) => {
      const {
        nonce: _currentNonce,
        pending: _pending,
        lastUpdated: _lastUpdated,
      } = __data || _data || { nonce: rpcNonce }
      let lastUpdated = _lastUpdated
      let currentNonce = _currentNonce
      const pending = _pending || {}
      if (
        rpcNoncePending > currentNonce &&
        lastUpdated &&
        lastUpdated < now - 1000 * 60 * 5
      ) {
        // We must have missed one (this is unlikely to happen)
        lastUpdated = now
        currentNonce = rpcNonce
      } else if (
        rpcNonce < currentNonce &&
        (!lastUpdated || lastUpdated < now - 1000 * 60)
      ) {
        // We are behind, so we need to update the nonce
        currentNonce = rpcNonce
        lastUpdated = now
      }
      while (pending[currentNonce]) {
        currentNonce += 1
        lastUpdated = now
      }
      const out = {
        nonce: currentNonce + 1,
        pending: { ...pending, [currentNonce]: true },
        current: currentNonce,
        lastUpdated: lastUpdated || now,
      }
      return out
    }
  )
  const nonce = finalSnap.val?.()?.current || rpcNonce
  return (await call(nonce)
    .then(async (result) => {
      await ref.update({
        [`pending/${nonce}`]: null,
      })
      return result
    })
    .catch(async (error) => {
      await replaceDummyNonce(wallet, app, address, nonce)

      return Promise.reject(error)
    })) as T
}

async function transferToken(
  app: ReturnType<typeof initializeApp>,
  contract: `0x${string}`,
  tokenId: number,
  to: `0x${string}`,
  _signature: `0x${string}`,
  expiration = 0
) {
  const { FILCOIN_PK } = await loadSecrets(['FILCOIN_PK'])
  const account = privateKeyToAccount((FILCOIN_PK as `0x${string}`) || '')
  const wallet = createWalletClient({
    account,
    chain: filecoinCalibration,
    transport: http(),
  })
  return await runWithNonce(wallet, app, async (nonce: number) => {
    return await wallet
      .writeContract({
        address: contract,
        nonce,
        abi,
        functionName: 'mintWithExpiration',
        args: [to, tokenId, 1, Math.round(expiration / 1000), '0x'],
      })
      .then(async (hash) => {
        await waitForTransactionReceipt(wallet, {
          hash,
        })
        info('Transaction hash', { hash, to, tokenId, expiration })
        return hash
      })
  })
}

const pathTemplate = 'cutomers/{customerId}/checkout_sessions/{sessionId}'
export const stripeStarted = onDocumentUpdated(
  pathTemplate,
  async (snapshot) => {
    // Handle extension event here.
    const record = snapshot.data?.after?.data?.() || {}
    if ('url' in record && 'price' in record) {
      const { FIREBASE_SA, STRIPE_RK, FIREBASE_DB } = await loadSecrets([
        'FIREBASE_SA',
        'STRIPE_RK',
        'FIREBASE_DB',
      ])
      const credential = cert(JSON.parse(FIREBASE_SA))
      const app = initializeApp(
        {
          credential,
          databaseURL: FIREBASE_DB,
        },
        `checkout${Date.now()}`
      )
      try {
        const apiVersion = '2022-11-15'
        const stripe = new Stripe(STRIPE_RK || '', {
          apiVersion,
          // Register extension as a Stripe plugin
          // https://stripe.com/docs/building-plugins#setappinfo
          appInfo: {
            name: 'Firebase Invertase firestore-stripe-payments',
            version: '0.3.5',
          },
        })
        const fs = getFirestore(app)
        const { metadata, price: priceId } = record
        const price = priceId
          ? await stripe.prices.retrieve(priceId as string)
          : undefined
        if (!price) {
          error('No price found in event', priceId)
          throw new Error('No price found')
        }
        const { product: product_id } = price
        const product = await stripe.products.retrieve(product_id as string)
        if (!product) {
          error('No product found', product_id)
          throw new Error(`No product found ${product_id}`)
        }
        const {
          metadata: { duration: _duration } = {},
        } = product
        const durations:
          | Record<'day' | 'week' | 'month', number>
          | { [key: string]: number } = {
          day: 60 * 60 * 24 * 1000000, // Times in ms.
          week: 60 * 60 * 24 * 7 * 1000000,
          month: 60 * 60 * 24 * 30 * 1000000,
        }
        if (!_duration || !(_duration in durations)) {
          error('No or invalid duration found', _duration)
          throw new Error('No or invalid duration found')
        }
        const duration = _duration as 'day' | 'week' | 'month'
        const {
          contract_name: __contract_name,
          contract_address: __contract_address,
          contract: { address: _contract_address, name: _contract_name } = {},
          docId,
          to,
          tokenId,
          expiration: _expiration,
          owner,
        } = metadata || {}
        const ipDoc = await fs.collection('ip').doc(docId).get()
        const { creator, from } = ipDoc.data() || {}
        if (!creator && !from) {
          error('No creator or from found', metadata)
          throw new Error('No creator or from found')
        }
        const contract_name = __contract_name || _contract_name
        const contract_address = __contract_address || _contract_address
        const expiration = durations[duration] + Date.now()
        if (!contract_address || !contract_name || !tokenId) {
          error('No contract name or address found', metadata)
          throw new Error('No contract name or address found')
        }
        const now = new Date()
        const deal = {
          status: 'pending',
          metadata: {
            tokenId,
            ...(from ? { from } : {}),
            creator,
            contract: {
              address: contract_address,
              name: contract_name,
            },
          },
          to,
          owner,
          ...(expiration
            ? { expiresAt: Timestamp.fromMillis(expiration) }
            : {}),
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        }
        await fs.runTransaction(async () => {
          const docRef = fs
            .collection('ip')
            .doc(docId)
            .collection('deals')
            .doc(snapshot.id)
          const docSnap = await docRef.get()
          if (docSnap.exists) {
            const previous = docSnap.data() || {}
            if (previous.status && previous.status !== 'pending') {
              return
            }
          }
          await docRef.set(deal)
        })
      } finally {
        await deleteApp(app)
      }
    }
  }
)

export const cron = onSchedule('every 12 hours', async () => {
  // Handle extension event here.
  const { FIREBASE_SA } = await loadSecrets(['FIREBASE_SA'])
  const credential = cert(JSON.parse(FIREBASE_SA))
  const app = initializeApp(
    {
      credential,
    },
    `checkout${Date.now()}`
  )
  try {
    const fs = getFirestore(app)
    const docsSnap = await fs
      .collectionGroup('deals')
      .where('expiresAt', '<=', Timestamp.fromDate(new Date()))
      .get()
    let batch = fs.batch()
    let count = 0
    for (const docSnap of docsSnap.docs) {
      batch.update(docSnap.ref, {
        status: 'expired',
      })
      count++
      if (count > 200) {
        await batch.commit()
        count = 0
        batch = fs.batch()
      }
    }
    if (count > 0) {
      await batch.commit()
    }
  } finally {
    await deleteApp(app)
  }
})

export const stripeCheckoutCompleted = onCustomEventPublished(
  {
    eventType: 'com.stripe.v1.checkout.session.completed',
    secrets: ['SECRET_PROJECT', 'SECRET_NAME', 'SECRET_VERSION'],
  },
  async (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
    const { FIREBASE_SA, STRIPE_RK, FIREBASE_DB } = await loadSecrets([
      'FIREBASE_SA',
      'STRIPE_RK',
      'FIREBASE_DB',
    ])
    const credential = cert(JSON.parse(FIREBASE_SA))
    const app = initializeApp(
      {
        credential,
        databaseURL: FIREBASE_DB,
      },
      `checkout${Date.now()}`
    )
    const apiVersion = '2022-11-15'
    const stripe = new Stripe(STRIPE_RK || '', {
      apiVersion,
      // Register extension as a Stripe plugin
      // https://stripe.com/docs/building-plugins#setappinfo
      appInfo: {
        name: 'Firebase Invertase firestore-stripe-payments',
        version: '0.3.5',
      },
    })
    const fs = getFirestore(app)
    const records = await fs
      .collectionGroup('checkout_sessions')
      .where('sessionId', '==', e.data.id)
      .get()
    if (records.empty) {
      error('No id found in event', e)
      throw new Error('No id found')
    }
    debug('Found records', records.docs.length, records.docs[0].ref.path)
    const record = { ...records.docs[0].data(), id: records.docs[0].id } as {
      metadata: {
        contract_name?: string
        contract_address?: string
        contract?: { address: string; name: string }
        docId: string
        to: `0x${string}`
        tokenId: number
        expiration: number
        owner: string
      }
      price: string
      id: string
    }
    debug('Found record', Object.keys(record), JSON.stringify(record))
    const { metadata, price: priceId } = record
    debug('Found metadata', JSON.stringify(metadata))
    const price = priceId
      ? await stripe.prices.retrieve(priceId as string)
      : undefined
    if (!price) {
      error('No price found in event', priceId, e)
      throw new Error('No price found')
    }
    const { product: product_id } = price
    const product = await stripe.products.retrieve(product_id as string)
    if (!product) {
      error('No product found', product_id, e)
      throw new Error(`No product found ${product_id}`)
    }
    const {
      metadata: { duration: _duration } = {},
    } = product
    const durations:
      | Record<'day' | 'week' | 'month', number>
      | { [key: string]: number } = {
      day: 60 * 60 * 24 * 1000, // Times in ms.
      week: 60 * 60 * 24 * 7 * 1000,
      month: 60 * 60 * 24 * 30 * 1000,
    }
    if (!_duration || !(_duration in durations)) {
      error('No or invalid duration found', _duration, e)
      throw new Error('No or invalid duration found')
    }
    const duration = _duration as 'day' | 'week' | 'month'
    const {
      contract_name: __contract_name,
      contract_address: __contract_address,
      contract: { address: _contract_address, name: _contract_name } = {},
      docId,
      to,
      tokenId,
      expiration: _expiration,
      owner,
    } = metadata || {}
    const contract_name = __contract_name || _contract_name
    const contract_address = __contract_address || _contract_address
    const expiration = durations[duration] + Date.now()
    if (!contract_address || !contract_name || !tokenId) {
      error('No contract name or address found', metadata)
      throw new Error('No contract name or address found')
    }
    info('Transfer token', JSON.stringify({ contract_address, tokenId, to }))
    await transferToken(
      app,
      contract_address as `0x${string}`,
      tokenId,
      to as `0x${string}`,
      '0x' as `0x${string}`,
      expiration // expiration in ms
    ).then(async (hash) => {
      const db = getFirestore(app)
      const now = new Date()
      const docRef = db.collection('ip').doc(docId)
      const doc = await docRef.get()
      const { creator, from } = doc.data() || {}
      const deal = {
        status: 'completed',
        metadata: {
          tokenId,
          ...(from ? { from } : {}),
          creator,
          transfer: hash,
          contract: {
            address: contract_address,
            name: contract_name,
          },
        },
        to,
        owner,
        ...(expiration ? { expiresAt: Timestamp.fromMillis(expiration) } : {}),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      }
      await docRef.collection('deals').doc(record.id).set(deal)
      if (creator) {
        await db
          .collection('users')
          .doc(owner)
          .collection('deals')
          .doc(record.id)
          .set(deal)
      }
      return hash
    })
    await deleteApp(app)
  }
)

export const stripeCheckoutSucceeded = onCustomEventPublished(
  {
    eventType: 'com.stripe.v1.checkout.session.async_payment_succeeded',
    secrets: [],
  },
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
  }
)

export const stripeCheckoutFailed = onCustomEventPublished(
  {
    eventType: 'com.stripe.v1.checkout.session.async_payment_failed',
    secrets: [],
  },
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
  }
)

export const stripeInvoiceSucceeded = onCustomEventPublished(
  {
    eventType: 'com.stripe.v1.invoice.payment_succeeded',
    secrets: [],
  },
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
  }
)

export const stripeInvoiceFailed = onCustomEventPublished(
  {
    eventType: 'com.stripe.v1.invoice.payment_failed',
    secrets: [],
  },
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
  }
)

export const stripePaymentSucceeded = onCustomEventPublished(
  {
    eventType: 'com.stripe.v1.payment_intent.succeeded',
    secrets: [],
  },
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
  }
)

export const stripePaymentFailed = onCustomEventPublished(
  {
    eventType: 'com.stripe.v1.payment_intent.payment_failed',
    secrets: [],
  },
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
  }
)
