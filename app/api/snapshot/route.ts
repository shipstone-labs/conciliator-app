import type { NextRequest } from 'next/server'
import type { IPDocJSON } from '@/lib/internalTypes'
import { getFirestore } from '../firebase'
import { createAsAgent } from '@/packages/web-storage-wrapper/dist'
import { initAPIConfig } from '@/lib/apiUtils'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    await initAPIConfig()

    const body = await req.json()
    const { id, messages } = body
    const fs = getFirestore()
    const doc = await fs.collection('ip').doc(id).get()
    const data = doc.data() as IPDocJSON

    const blob = new Blob([
      new TextEncoder().encode(
        JSON.stringify({
          name: data.name,
          description: data.description,
          messages,
        })
      ),
    ])
    const w3Client = await createAsAgent(
      process.env.STORACHA_AGENT_KEY || '',
      process.env.STORACHA_AGENT_PROOF || ''
    )
    const upload = await w3Client.uploadFile(
      // {
      //   async arrayBuffer() {
      //     return new TextEncoder().encode(JSON.stringify(encrypted));
      //   },
      // } as any
      blob
    )
    return new Response(JSON.stringify(upload.toString()), {
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
