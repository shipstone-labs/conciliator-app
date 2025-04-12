import type { NextRequest } from 'next/server'
import {
  abi,
  // genSession,
  // getModel,
  // imageAI,
  // pinata,
} from '../utils'
import {
  bytesToHex,
  createWalletClient,
  http,
  padHex,
  parseEventLogs,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { filecoinCalibration } from 'viem/chains'
import { waitForTransactionReceipt } from 'viem/actions'
import { getUser } from '../stytch'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    await getUser(req)
    const body = await req.json()
    const { id } = body
    const tokenId = padHex(bytesToHex(new TextEncoder().encode(id)), {
      size: 32,
      dir: 'right',
    })
    console.log('tokenId', tokenId)
    const account = privateKeyToAccount(
      (process.env.FILCOIN_PK || '') as `0x${string}`
    )
    console.log('account', account.address)
    const wallet = createWalletClient({
      account,
      chain: filecoinCalibration,
      // 'https://filecoin-calibration.chainup.net/rpc/v1'
      transport: http(),
    })
    console.log(filecoinCalibration.rpcUrls)
    const nativeTokenId = await wallet
      .writeContract({
        address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
        abi,
        functionName: 'createId',
        args: [tokenId],
      })
      .then(async (hash) => {
        const { logs } = await waitForTransactionReceipt(wallet, {
          hash,
        })
        console.log('logs', logs)
        const decoded = parseEventLogs({
          logs,
          abi,
          eventName: 'IdCreated',
        })
        return (
          (decoded[0] as unknown as { args: unknown })?.args as {
            tokenId: bigint
          }
        ).tokenId
      })

    return new Response(JSON.stringify({ id, nativeTokenId, tokenId }), {
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
