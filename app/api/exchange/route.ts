import type { NextRequest } from 'next/server'

import { getUser } from '@/app/api/stytch'
import { getToken } from '../firebase'
import { initAPIConfig } from '@/lib/apiUtils'
import { LRUCache } from 'typescript-lru-cache'

export const runtime = 'nodejs'

const validated = new LRUCache<string, Promise<string>>({
  maxSize: 100,
  entryExpirationTimeInMS: 1000 * 60 * 30,
})

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers
      .get('authorization')
      ?.replace('Bearer ', '')
    if (!authorization) {
      throw new Error('Missing authorization header')
    }
    let promise = validated.get(authorization)
    if (!promise) {
      promise = (async () => {
        await initAPIConfig()

        const user = await getUser(req)
        return await getToken(user)
      })()
    }
    const token = await promise
    return new Response(JSON.stringify({ token }), {
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
