import {
  collectionGroup,
  getFirestore,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

export type Price = {
  id: string
  price: number
  currency: string
  active: boolean
  billing_schema: string
  description: string | null
  interval: string
  interval_count: number
  metadata: Record<string, unknown>
  product: string
  recurring: string
  tax_behavior: string
  tiers: unknown
  tiers_mode: string | null
  transform_quantity: number | null
  trial_period_days: number | null
  type: string
  unit_amount: number
}
export type Product = {
  id: string
  active: boolean
  name: string | null
  images: string[]
  description: string | null
  metadata: {
    duration: string
  }
  role: string | null
  tax_code: string | null
  prices: Record<string, Price>
}

export function useProducts(): Record<string, Product> {
  const [products, setProducts] = useState<Record<string, Product>>({})
  useEffect(() => {
    const fb = getFirestore()
    const prices = collectionGroup(fb, 'prices')
    const activePrices = query(prices, where('active', '==', true))
    const shutdown: Map<[string, string], () => void> = new Map()
    const close = onSnapshot(activePrices, async (priceSnap) => {
      for (const priceDoc of priceSnap.docs) {
        // We're already listening on the product doc
        const productId = priceDoc.ref.parent?.parent?.id || ''
        if (shutdown.has(['product', productId])) {
          return
        }
        console.log('priceDoc', priceDoc.ref.path, priceDoc.data())
        setProducts((prev) => ({
          ...prev,
          [productId]: {
            ...prev[priceDoc.ref.parent.id],
            id: productId,
            prices: {
              ...(prev[productId]?.prices || {}),
              [priceDoc.id]: {
                id: priceDoc.id,
                ...priceDoc.data(),
              } as Price,
            } as Record<string, Price>,
          } as Product,
        }))
        const parentRef = priceDoc.ref.parent?.parent
        if (!parentRef) {
          return
        }
        const close = onSnapshot(parentRef, (productSnap) => {
          const data = productSnap.data()
          if (!data?.active) {
            return
          }
          console.log('productDoc', productSnap.ref.path, productSnap.data())
          setProducts((prev) => ({
            ...prev,
            [productSnap.id]: {
              id: productSnap.id,
              prices: (prev[productSnap.id]?.prices || {}) as Record<
                string,
                Price
              >,
              ...data,
            } as Product,
          }))
        })
        shutdown.set(['product', productId], close)
      }
    })
    shutdown.set(['prices', ''], close)
    return () => {
      for (const close of shutdown.values()) {
        close()
      }
    }
  }, [])
  console.log('products', products)
  return products
}
