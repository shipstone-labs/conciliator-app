'use client'

import DetailIP from '@/components/DetailIP'
import { useParams } from 'next/navigation'

export default function Token() {
  const params = useParams()
  const docId = params?.id as string // Retrieve the tokenId from the dynamic route

  // Require lit for now (in the future this can be on another page)
  return <DetailIP docId={docId} />
}
