import type { NextRequest } from 'next/server'
import {
  abi,
  runWithNonce,
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
import { readContract, waitForTransactionReceipt } from 'viem/actions'
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
    const account = privateKeyToAccount(
      (process.env.FILCOIN_PK || '') as `0x${string}`
    )
    const wallet = createWalletClient({
      account,
      chain: filecoinCalibration,
      // 'https://filecoin-calibration.chainup.net/rpc/v1'
      transport: http(),
    })

    let nativeTokenId: bigint | undefined = (await readContract(wallet, {
      address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
      abi,
      functionName: 'getId',
      args: [tokenId],
    })) as bigint
    if (!nativeTokenId) {
      nativeTokenId = (await runWithNonce(account.address, async (nonce) => {
        return await wallet
          .writeContract({
            address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
            abi,
            functionName: 'createId',
            args: [tokenId],
            nonce,
          })
          .then(async (hash) => {
            const { logs } = await waitForTransactionReceipt(wallet, {
              hash,
            })
            const decoded = parseEventLogs({
              logs,
              abi,
              eventName: 'IdCreated',
            })
            if (!decoded[0]) {
              // Try again, someone else might have created the ID
              return 0n
            }
            return (
              (decoded[0] as unknown as { args: unknown })?.args as {
                tokenId: bigint
              }
            ).tokenId
          })
      })) as bigint

      if (!nativeTokenId) {
        nativeTokenId = (await readContract(wallet, {
          address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
          abi,
          functionName: 'getId',
          args: [tokenId],
        })) as bigint
      }
    }
    if (!nativeTokenId) {
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(
      JSON.stringify({ id, nativeTokenId: nativeTokenId.toString(), tokenId }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
