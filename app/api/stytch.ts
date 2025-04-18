import type { NextRequest } from 'next/server'
import { Client, envs } from 'stytch'
// Or as an ES6 module:
// import * as stytch from "stytch";

let client: Client | undefined

export async function getUser(req: NextRequest) {
  if (!client) {
    client = new Client({
      project_id: process.env.STYTCH_APP_ID || 'sample',
      secret: process.env.STYTCH_APP_SECRET || 'sample',
      env: process.env.STYTCH_ENV === 'test' ? envs.test : envs.live,
    })
  }
  const authorization = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = await client.sessions.authenticate({
    session_jwt: authorization,
  })
  return user
}
