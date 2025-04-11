import type { NextRequest } from 'next/server'
import { abi, getModel, imageAI, pinata } from '../utils'
import { readContract } from 'viem/actions'
import { filecoinCalibration } from 'viem/chains'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { getFirestore } from '../firebase'
import { getUser } from '../stytch'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    await getUser(req)

    const { start: _start, limit: _limit } = await req.json()
    let tokenId = BigInt(_start || 1)
    tokenId += 22n
    let limit = _limit || 12
    if (limit > 100) {
      limit = 100
    }
    const wallet = createWalletClient({
      account: privateKeyToAccount(
        (process.env.FILCOIN_PK || '') as `0x${string}`
      ),
      chain: filecoinCalibration,
      transport: http(),
    })
    const tokens: Array<Record<string, unknown>> = []
    const fb = await getFirestore()
    const doc = await fb.collection('ip').orderBy('createdBy', 'desc').get()
    const docs = doc.docs.map((d) => {
      const data = d.data()
      return [data.tokenId, data]
    }) as [number, Record<string, unknown>][]
    const seenTokenIds = new Map<number, Record<string, unknown>>(docs)
    while (true) {
      try {
        if (seenTokenIds.has(Number(tokenId))) {
          const token = seenTokenIds.get(Number(tokenId)) as Record<
            string,
            unknown
          >
          tokens.push(token)
          tokenId++
          continue
        }
        const index = (await readContract(wallet, {
          address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
          functionName: 'getDocumentMetadata',
          abi,
          args: [tokenId],
        })) as { name: string; description: string }
        let url = await readContract(wallet, {
          address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
          functionName: 'tokenURI',
          abi,
          args: [tokenId],
        }).catch((error) => {
          console.log(error, process.env.FILECOIN_CONTRACT)
          return null
        })
        if (!url) {
          const response2 = await imageAI.images.generate({
            model: getModel('IMAGE'),
            prompt: `Generate and image which accurately represents a supposed document
        with the title \`${index.name}\` and the descriptions \`${index.description}\`. If there are any word flagged as inappropriate,
        then just pick the closest word to it. If there is none, then pick a random word.
        I would like to always get an image, even if it's not 100% accurate.`,
            response_format: 'url',
            size: '1024x1024',
            quality: 'standard',
            n: 1,
          })

          const { url: _url } = response2.data[0]
          if (_url) {
            const { IpfsHash } = await pinata.upload.url(_url)
            url = `ipfs://${IpfsHash}`
            await wallet.writeContract({
              functionName: 'setTokenURI',
              abi,
              address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
              args: [tokenId, url],
            })
          }
        }
        const token = { ...index, tokenId: Number(tokenId), url }
        tokens.push(token)
        await fb.collection('tokens').add(token)
        tokenId++
      } catch {
        break
      }
      if (tokens.length >= limit) {
        break
      }
    }

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
