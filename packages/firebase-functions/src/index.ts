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
import { debug } from 'firebase-functions/logger'
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
import { writeContract } from 'viem/_types/actions/wallet/writeContract'
import { abi } from './abi'
import { waitForTransactionReceipt } from 'viem/_types/actions/public/waitForTransactionReceipt'
import { deleteApp, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getDatabase } from 'firebase-admin/database'
import { estimateFeesPerGas } from 'viem/_types/actions/public/estimateFeesPerGas'

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
  tokenId: `0x${string}`,
  to: `0x${string}`,
  signature: `0x${string}`,
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
    return await writeContract(wallet, {
      address: contract,
      nonce,
      abi,
      functionName: 'mintWithSignature',
      args: [to, tokenId, 1, Math.round(expiration / 1000), signature],
    }).then(async (hash) => {
      await waitForTransactionReceipt(wallet, {
        hash,
      })
      console.info('Transaction hash', { hash, to, tokenId, expiration })
      return hash
    })
  })
}

export const stripeCheckoutCompleted = onCustomEventPublished(
  'com.stripe.v1.checkout.session.completed',
  async (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
    const { FIREBASE_SA } = await loadSecrets(['FIREBASE_SA'])
    const config = JSON.parse(FIREBASE_SA)
    const app = initializeApp(config, 'checkout')
    const {
      data: {
        object: { metadata },
      },
    } = e
    const {
      contract: { name, address } = {},
      docId,
      signature,
      to,
      tokenId,
      expiration,
      owner,
    } = metadata
    await transferToken(app, address, tokenId, to, signature).then(
      async (hash) => {
        const db = getFirestore(app)
        const now = new Date()
        const docRef = db.collection('ip').doc(docId)
        const doc = await docRef.get()
        const { creator, from } = doc.data() || {}
        const deal = {
          status: 'completed',
          metadata: {
            tokenId,
            to,
            owner,
            ...(from ? { from } : {}),
            creator,
            transfer: hash,
            contract: {
              address,
              name,
            },
            ...(expiration ? { end: Timestamp.fromMillis(expiration) } : {}),
            start: Timestamp.fromDate(now),
          },
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        }
        const dealDoc = await docRef.collection('deals').add(deal)
        if (creator) {
          await db
            .collection('users')
            .doc(owner)
            .collection('deals')
            .doc(dealDoc.id)
            .set(deal)
        }
        return hash
      }
    )
    await deleteApp(app)
  }
)

export const stripeCheckoutSucceeded = onCustomEventPublished(
  'com.stripe.v1.checkout.session.async_payment_succeeded',
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
  }
)

export const stripeCheckoutFailed = onCustomEventPublished(
  'com.stripe.v1.checkout.session.async_payment_failed',
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
  }
)

export const stripeInvoiceSucceeded = onCustomEventPublished(
  'com.stripe.v1.invoice.payment_succeeded',
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
  }
)

export const stripeInvoiceFailed = onCustomEventPublished(
  'com.stripe.v1.invoice.payment_failed',
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
  }
)

export const stripePaymentSucceeded = onCustomEventPublished(
  'com.stripe.v1.payment_intent.succeeded',
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
  }
)

export const stripePaymentFailed = onCustomEventPublished(
  'com.stripe.v1.payment_intent.payment_failed',
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
  }
)
