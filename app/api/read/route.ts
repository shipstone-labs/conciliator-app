import type { NextRequest } from 'next/server'
import { getFirestore } from '../firebase'
import { cidAsURL, type IPDocJSON } from '@/lib/internalTypes'
// import { SignableMessage } from "viem";
import { Timestamp } from 'firebase-admin/firestore'
import { getUser } from '../stytch'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const loginNow = Date.now()
    const user = await getUser(req)
    console.log(`login took ${Math.round((Date.now() - loginNow) / 1000)}s`)
    const { id } = (await req.json()) as {
      messages: {
        role: 'user' | 'assistant' | 'system'
        content: string
      }[]
      id: string
    }

    const retrieveNow = Date.now()
    const fs = getFirestore()
    const auditTable = fs.collection('audit').doc(id).collection('details')
    const doc = await fs.collection('ip').doc(id).get()
    const deals =
      doc.exists &&
      (doc.data() as { creator?: string }).creator === user.user.user_id
        ? [{ expiresAt: undefined }]
        : await fs
            .collection('audit')
            .doc(id)
            .collection('deals')
            .where('to', '==', user.user.user_id)
            .orderBy('createdAt', 'desc')
            .get()
            .then((snapshot) =>
              snapshot.docs.map(
                (doc) =>
                  ({
                    ...doc.data(),
                    id: doc.id,
                  }) as { id: string; expiresAt?: Timestamp }
              )
            )
            .catch(() => [])
    const now = new Date()
    const hasAccess = deals.some(
      (deal) => deal.expiresAt === undefined || deal.expiresAt.toDate() > now
    )
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ success: false, error: 'No access' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    console.log(
      `retrieve took ${Math.round((Date.now() - retrieveNow) / 1000)}s`
    )
    const data = doc.data() as IPDocJSON
    if (!data) {
      throw new Error('Document not found')
    }
    const url = cidAsURL(data.encrypted.cid)
    const encrypted: {
      ciphertext: string
      dataToEncryptHash: string
      unifiedAccessControlConditions: unknown
    } = url
      ? await fetch(url).then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch encrypted data')
          }
          return res.json()
        })
      : undefined
    if (
      data.encrypted.acl !==
      JSON.stringify(encrypted.unifiedAccessControlConditions)
    ) {
      throw new Error('Access control conditions do not match')
    }
    if (data.downSampled.hash !== encrypted.dataToEncryptHash) {
      console.log(data.downSampled.hash, encrypted.dataToEncryptHash)
      throw new Error('Hash does not match')
    }

    const dataNow = Date.now()
    await auditTable.add({
      status: `Document retrieved by ${user.user.user_id}`,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      data: {
        userId: user.user.user_id,
      },
    })
    console.log(`audit took ${Math.round((Date.now() - dataNow) / 1000)}s`)
    return new Response(
      JSON.stringify({
        ...data,
        encrypted: {
          ...data.encrypted,
          cit: encrypted.ciphertext,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
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
