import type { NextRequest } from 'next/server'
import { getFirestore } from '../firebase'
import { cidAsURL, type IPDocJSON } from '@/lib/internalTypes'
// import { SignableMessage } from "viem";
import { FieldValue, type Timestamp } from 'firebase-admin/firestore'
import { getUser } from '../stytch'
import { initAPIConfig } from '@/lib/apiUtils'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    await initAPIConfig()
    const user = await getUser(req)
    const { id } = (await req.json()) as {
      messages: {
        role: 'user' | 'assistant' | 'system'
        content: string
      }[]
      id: string
    }

    const fs = getFirestore()
    const auditTable = fs.collection('ip').doc(id).collection('audit')
    const doc = await fs.collection('ip').doc(id).get()
    const deals =
      doc.exists &&
      (doc.data() as { creator?: string }).creator === user.user.user_id
        ? [{ expiresAt: undefined }]
        : await fs
            .collection('ip')
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
      throw new Error('Hash does not match')
    }

    await auditTable.add({
      status: `Document retrieved by ${user.user.user_id}`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      data: {
        userId: user.user.user_id,
      },
    })
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
