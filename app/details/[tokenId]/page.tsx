'use client'

import Authenticated from '@/components/Authenticated'
import DetailIP from '@/components/DetailIP'
import { useParams } from 'next/navigation'

export default function Token() {
  const params = useParams()
  const tokenId = params?.tokenId as string // Retrieve the tokenId from the dynamic route

  const handleCreateNewIP = () => {
    // Redirect to the root page
    window.location.href = '/'
  }
  return (
    <Authenticated>
      <DetailIP tokenId={tokenId} onNewIP={handleCreateNewIP} />
    </Authenticated>
  )
}
