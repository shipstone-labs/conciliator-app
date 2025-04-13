'use client'

import Authenticated from '@/components/Authenticated'
import CardGrid from '@/components/card-grid'
import { useStytchUser } from '@stytch/nextjs'
import { type QueryCompositeFilterConstraint, where } from 'firebase/firestore'
import { useMemo } from 'react'

export default function Home() {
  const { user } = useStytchUser()
  const filter = useMemo(() => {
    return where(
      'creator',
      '==',
      user?.user_id
    ) as unknown as QueryCompositeFilterConstraint
  }, [user?.user_id])
  return (
    <Authenticated requireFirebase={true}>
      <CardGrid filter={filter} />
    </Authenticated>
  )
}
