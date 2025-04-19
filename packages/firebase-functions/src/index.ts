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

// Export secrets functions
export { loadSecrets } from './secrets'

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
    console.log(e)
  }
)

export const stripeCheckoutSucceeded = onCustomEventPublished(
  'com.stripe.v1.checkout.session.async_payment_succeeded',
  (e) => {
    // Handle extension event here.
    console.log(e)
  }
)

export const stripeCheckoutFailed = onCustomEventPublished(
  'com.stripe.v1.checkout.session.async_payment_failed',
  (e) => {
    // Handle extension event here.
    console.log(e)
  }
)

export const stripeInvoiceSucceeded = onCustomEventPublished(
  'com.stripe.v1.invoice.payment_succeeded',
  (e) => {
    // Handle extension event here.
    console.log(e)
  }
)

export const stripeInvoiceFailed = onCustomEventPublished(
  'com.stripe.v1.invoice.payment_failed',
  (e) => {
    // Handle extension event here.
    console.log(e)
  }
)

export const stripePaymentSucceeded = onCustomEventPublished(
  'com.stripe.v1.payment_intent.succeeded',
  (e) => {
    // Handle extension event here.
    console.log(e)
  }
)

export const stripePaymentFailed = onCustomEventPublished(
  'com.stripe.v1.payment_intent.payment_failed',
  (e) => {
    // Handle extension event here.
    console.log(e)
  }
)
