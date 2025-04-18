import type { NextRequest } from 'next/server'
import { getUser } from '../stytch'
import { getFirebase } from '../firebase'
import { ServerValue } from 'firebase-admin/database'
import { getContractInfo } from '../utils'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    const body = await req.json()
    const { id } = body
    const fb = getFirebase()
    const { contract } = getContractInfo()
    const ref = fb.ref(`tokenIds/${contract}/sequence`)
    const now = Date.now()
    const { snapshot } = await ref.transaction((currentValue) => {
      if (currentValue === null) {
        return {
          tokenId: 1,
          lastUpdated: Date.now(),
        }
      }
      const { tokenId } = currentValue
      return { tokenId: tokenId + 1, lastUpdated: now }
    })
    const { tokenId } = snapshot.val()
    if (!tokenId) {
      throw new Error('Token ID not found')
    }
    fb.ref(`tokenIds/${contract}/tokenIds/${tokenId}`).set({
      created: ServerValue.TIMESTAMP,
      userId: user.user.user_id,
      docId: id,
    })
    return new Response(JSON.stringify({ id, tokenId }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
