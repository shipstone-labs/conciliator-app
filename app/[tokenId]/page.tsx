'use client'

import QuestionIP from '@/components/QuestionIP'
import { useParams } from 'next/navigation'

export default function Token() {
  const params = useParams()
  const tokenId = params?.tokenId as string // Retrieve the tokenId from the dynamic route

  const handleCreateNewIP = () => {
    // Redirect to the root page
    window.location.href = '/'
  }
  return <QuestionIP tokenId={tokenId} onNewIP={handleCreateNewIP} />
}
