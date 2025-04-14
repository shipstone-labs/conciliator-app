'use client'

import Authenticated from '@/components/Authenticated'
import QuestionIP from '@/components/QuestionIP'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'

export default function Token() {
  const params = useParams()
  const docId = params?.id as string // Retrieve the tokenId from the dynamic route

  useEffect(() => {
    console.log('%c ===== DISCOVERY PAGE UPDATED (PR-63) =====', 'background: #ffff00; color: #000000; font-size: 20px; padding: 10px;')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Document ID:', docId)
  }, [docId])

  const handleCreateNewIP = () => {
    // Redirect to the root page
    window.location.href = '/'
  }
  return (
    <Authenticated>
      {/* Verification banner that this is the updated version */}
      <div style={{ 
        background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)', 
        color: '#000', 
        padding: '10px', 
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: '10px'
      }}>
        PR-63 Updated Version - {new Date().toISOString().split('T')[0]}
      </div>
      <QuestionIP docId={docId} onNewIP={handleCreateNewIP} />
    </Authenticated>
  )
}
