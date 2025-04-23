'use client'

import Authenticated from '@/components/Authenticated'
import CardGrid from '@/components/card-grid'

export default function Home() {
  return (
    <Authenticated requireFirebase={true}>
      <CardGrid myItems />
    </Authenticated>
  )
}
