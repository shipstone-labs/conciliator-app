'use client'

import Authenticated from '@/components/Authenticated'
import CardGrid from '@/components/card-grid'

export default function IdeaShop() {
  return (
    <Authenticated ideaShopMode={true} requireFirebase={false} requireLit={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">
          Idea Shop
        </h1>
        <p className="text-white/80 mb-8 text-center max-w-3xl mx-auto">
          Browse our collection of intellectual property. Sign in to purchase access or add your own ideas to the marketplace.
        </p>
        <CardGrid shopMode={true} />
      </div>
    </Authenticated>
  )
}