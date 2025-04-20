'use client'

import Authenticated from '@/components/Authenticated'
import DetailIP from '@/components/DetailIP'
import { useParams } from 'next/navigation'

export default function ShopDetail() {
  const params = useParams()
  const docId = params?.id as string

  return (
    <Authenticated ideaShopMode={true} requireLit={false} requireFirebase={false}>
      <DetailIP docId={docId} shopMode={true} />
    </Authenticated>
  )
}