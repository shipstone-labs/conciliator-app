import type { NextRequest } from 'next/server'
// import { abi, getModel, imageAI, pinata } from "../utils";
// import { readContract } from "viem/actions";
// import { filecoinCalibration } from "viem/chains";
// import { createWalletClient, http } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
import { getFirestore } from '../firebase'
import { getUser } from '../stytch'
import { initAPIConfig } from '@/lib/apiUtils'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    await initAPIConfig()

    await getUser(req)

    // const { start: _start, limit: _limit } = await req.json();
    // let tokenId = BigInt(_start || 1);
    // tokenId += 22n;
    // let limit = _limit || 12;
    // if (limit > 100) {
    //   limit = 100;
    // }
    // const wallet = createWalletClient({
    //   account: privateKeyToAccount(
    //     (process.env.FILCOIN_PK || "") as `0x${string}`
    //   ),
    //   chain: filecoinCalibration,
    //   transport: http(),
    // });
    const fb = getFirestore()
    const doc = await fb.collection('ip').orderBy('createdAt', 'desc').get()
    const docs = doc.docs.map((d) => {
      const data = d.data()
      const key = [data.tokenId || d.id, data]
      return key
    }) as [number, Record<string, unknown>][]
    const seenTokenIds = new Map<number, Record<string, unknown>>(docs)
    const tokens = Array.from(seenTokenIds.values())
    return new Response(JSON.stringify(tokens), {
      status: 200,
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
