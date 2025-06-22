import { createAsAgent, DID } from 'web-storage-wrapper'
import { type NextRequest, NextResponse } from 'next/server'
import { withAPITracing } from '@/lib/apiWithTracing'
import { initAPIConfig } from '@/lib/apiUtils'
import { getUser } from '../stytch'
import { getFirestore } from '../firebase'

export const POST = withAPITracing(async function POST(req: NextRequest) {
  await initAPIConfig()

  const user = await getUser(req)

  const body: {
    id: string
    did: string
  } = await req.json()
  const { id, did } = body

  const firestore = getFirestore()
  const checkDoc = await firestore.collection('id').doc(id).get()
  if (checkDoc.exists) {
    if (
      (checkDoc.data()?.creator &&
        checkDoc.data()?.creator !== user.user.user_id) ||
      checkDoc.data()?.metadata?.tokenId != null
    ) {
      return new NextResponse(JSON.stringify({ error: 'ID already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  const client = await createAsAgent(
    process.env.STORACHA_AGENT_KEY || '',
    process.env.STORACHA_AGENT_PROOF || ''
  )

  // Create a delegation for a specific DID
  const audience = DID.parse(did)
  const abilities: Parameters<typeof client.createDelegation>[1] = [
    'space/blob/add',
    'space/index/add',
    'filecoin/offer',
    'upload/add',
  ]

  const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours from now
  const delegation = await client.createDelegation(audience, abilities, {
    expiration,
  })

  // Serialize the delegation and send it to the client
  const archive = await delegation.archive()
  if (!archive.ok) {
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
  return new NextResponse(archive.ok, {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream',
    },
  })
})
