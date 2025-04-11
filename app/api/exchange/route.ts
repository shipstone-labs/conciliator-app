import type { NextRequest } from 'next/server'

import { getUser } from '@/app/api/stytch'
import { getToken } from '../firebase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    const token = await getToken(user)
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
