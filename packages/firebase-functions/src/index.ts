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
import { createWalletClient, http } from 'viem'
import { writeContract } from 'viem/_types/actions/wallet/writeContract'
import { abi } from './abi'
import { waitForTransactionReceipt } from 'viem/_types/actions/public/waitForTransactionReceipt'

// Export secrets functions
export { loadSecrets } from './secrets'

async function transferToken(
  contract: `0x${string}`,
  tokenId: `0x${string}`,
  to: `0x${string}`,
  signature: `0x${string}`
) {
  const { FILCOIN_PK } = await loadSecrets(['FILCOIN_PK'])
  const account = privateKeyToAccount((FILCOIN_PK as `0x${string}`) || '')
  const wallet = createWalletClient({
    account,
    chain: filecoinCalibration,
    transport: http(),
  })
  await writeContract(wallet, {
    address: contract,
    abi,
    functionName: 'mintWithSignature',
    args: [to, tokenId, 1, signature],
  }).then(async (hash) => {
    await waitForTransactionReceipt(wallet, {
      hash,
    })
    return hash
  })
}
console.log(transferToken)
// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const stripeCheckoutCompleted = onCustomEventPublished(
  'com.stripe.v1.checkout.session.completed',
  (e) => {
    // Handle extension event here.
    debug(JSON.stringify(e))
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
