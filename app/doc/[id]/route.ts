import type { NextRequest } from 'next/server'
import { initAPIConfig } from '@/lib/apiUtils'
import { getFirestore } from '@/app/api/firebase'
import { cidAsURL } from '@/lib/internalTypes'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initAPIConfig()

    const { id } = await params

    const fs = getFirestore()

    const tokenId = Number.parseInt(id, 10)
    const doc = await fs.collection('ip').where('tokenId', '==', tokenId).get()
    if (doc.size === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Document no longer found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    const data = doc.docs[0].data()
    if (!data) {
      throw new Error('Document not found')
    }
    const {
      metadata: { cid } = {},
    } = data
    if (!cid) {
      return new Response(
        JSON.stringify({ success: false, error: 'No CID found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    const redirect = cidAsURL(cid)
    if (!redirect) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid CID' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    return Response.redirect(redirect, 302)
  } catch (error) {
    console.error(error)
    const { message, request_id, status, name, headers } = error as {
      message?: string
      request_id?: string
      status?: number
      name?: string
      headers?: Record<string, unknown>
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: message || 'Internal Server Error',
          request_id,
          status,
          name,
          headers,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
