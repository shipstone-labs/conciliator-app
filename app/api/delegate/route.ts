import type { NextRequest } from 'next/server'
import { getFirestore } from '../firebase'
// import { SignableMessage } from "viem";
import { getUser } from '../stytch'
import { filecoinCalibration } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { getLit } from '../utils'
import type { Timestamp } from 'firebase-admin/firestore'
import {
  createWalletClient,
  getAddress,
  http,
  type SignableMessage,
} from 'viem'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const loginNow = Date.now()
    const user = await getUser(req)
    console.log(`login took ${Math.round((Date.now() - loginNow) / 1000)}s`)
    const { id, pkp } = (await req.json()) as {
      id: string
      pkp: `0x${string}`
    }
    const fs = getFirestore()
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
    const account = privateKeyToAccount(
      (process.env.FILCOIN_PK || '') as `0x${string}`
    )
    const wallet = createWalletClient({
      account,
      chain: filecoinCalibration,
      // 'https://filecoin-calibration.chainup.net/rpc/v1'
      transport: http(),
    })

    const litClient = await getLit()
    const { capacityDelegationAuthSig } =
      await litClient.createCapacityDelegationAuthSig({
        uses: '1',
        dAppOwnerWallet: {
          signMessage: (message: SignableMessage) =>
            wallet.signMessage({ message }),
          getAddress: async () => account.address,
        },
        capacityTokenId: process.env.LIT_CAPACITY_TOKEN_ID || '0',
        delegateeAddresses: [getAddress(pkp)],
      })
    return new Response(
      JSON.stringify({
        capacityDelegationAuthSig,
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
