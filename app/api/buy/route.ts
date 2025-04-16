// import Stripe from 'stripe'
import { getFirestore } from '../firebase'
import { initAPIConfig } from '@/lib/apiUtils'
import { NextResponse, type NextRequest } from 'next/server'
import { getUser } from '../stytch'

// const apiVersion = '2022-11-15'
// const stripe = new Stripe(process.env.STIPE_RK || '', {
//   apiVersion,
//   // Register extension as a Stripe plugin
//   // https://stripe.com/docs/building-plugins#setappinfo
//   appInfo: {
//     name: 'Firebase Invertase firestore-stripe-payments',
//     version: '0.3.5',
//   },
// })

// interface CustomerData {
//   metadata: {
//     firebaseUID: string
//   }
//   email?: string
//   phone?: string
// }

/**
 * Create a customer object in Stripe when a user is created.
 */
// async function createCustomerRecord({
//   email,
//   uid,
//   phone,
// }: {
//   email?: string
//   phone?: string
//   uid: string
// }) {
//   try {
//     const firestore = getFirestore()
//     const customerData: CustomerData = {
//       metadata: {
//         firebaseUID: uid,
//       },
//     }
//     if (email) customerData.email = email
//     if (phone) customerData.phone = phone
//     const customer = await stripe.customers.create(customerData)

//     // Add a mapping record in Cloud Firestore.
//     const customerRecord = {
//       email: customer.email,
//       stripeId: customer.id,
//       stripeLink: `https://dashboard.stripe.com${
//         customer.livemode ? '' : '/test'
//       }/customers/${customer.id}`,
//     }
//     if (phone) (customerRecord as any).phone = phone
//     await firestore
//       .collection('customers')
//       .doc(uid)
//       .set(customerRecord, { merge: true })
//     return customerRecord
//   } catch {
//     return null
//   }
// }

// async function createProduct(name: string, description: string) {
//   const firestore = getFirestore()
//   const product = await stripe.products.create({
//     name,
//     description,
//   })
//   const productRecord = {
//     name,
//     description,
//   }
//   await firestore.collection('products').add(productRecord)
// }

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  await initAPIConfig()
  const user = await getUser(req)
  console.log(user)
  const fb = getFirestore()
  console.log(fb)
  return NextResponse.json(
    { success: true, message: 'ok' },
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
