import type { NextRequest } from 'next/server'
import {
  abi,
  // genSession,
  getModel,
  imageAI,
  // getModel,
  // imageAI,
  // pinata,
} from '../utils'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { filecoinCalibration } from 'viem/chains'
import { waitForTransactionReceipt } from 'viem/actions'
import { createAsAgent } from 'web-storage-wrapper'
import // createLitClient,
// LIT_ABILITY,
// LIT_NETWORK,
// LitAccessControlConditionResource,
// LitActionResource,
'lit-wrapper'
import { getUser } from '../stytch'
import { getFirestore } from '../firebase'
import { fetch } from 'undici'
import { cidAsURL, type IPDocJSON } from '@/lib/internalTypes'
import { Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

function clean(obj: unknown): unknown {
  if (obj == null) {
    return undefined
  }
  if (obj && Array.isArray(obj)) {
    return obj.map(clean)
  }
  if (obj && typeof obj === 'object') {
    const cleanedObj: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const item = clean(value)
        if (item) {
          cleanedObj[key] = item
        }
      }
    }
    if (Object.keys(cleanedObj).length === 0) {
      return undefined
    }
    return cleanedObj
  }
  return obj
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)

    const body = await req.json()
    const {
      to,
      id,
      metadata: { tokenId } = {},
      encrypted,
      downSampledEncrypted,
      name: _name,
      description,
      ...rest
    } = body
    console.log('body', { to, id, name: _name, description, ...rest })
    const account = privateKeyToAccount(
      (process.env.FILCOIN_PK || '') as `0x${string}`
    )
    console.log('account', account.address)
    const w3Client = await createAsAgent(
      process.env.STORACHA_AGENT_KEY || '',
      process.env.STORACHA_AGENT_PROOF || ''
    )
    const firestore = await getFirestore()
    const status = firestore.collection('audit').doc(id)
    const auditTable = firestore
      .collection('audit')
      .doc(id)
      .collection('details')
    await status.set({
      status: 'Storing document',
      creator: user.user.user_id,
      address: to,
      tokenId,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    })
    await auditTable.add({
      status: 'Storing document',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    })
    const encryptedBlob = new Blob(
      [new TextEncoder().encode(JSON.stringify(encrypted))],
      {
        type: 'application/json',
      }
    )
    const encryptedCid = await w3Client.uploadFile(encryptedBlob)
    await status.update({
      status: 'Storing downsampled document',
      updatedAt: Timestamp.fromDate(new Date()),
    })
    const downSampledEncryptedBlob = new Blob(
      [new TextEncoder().encode(JSON.stringify(downSampledEncrypted))],
      {
        type: 'application/json',
      }
    )
    const downSampledEncryptedCid = await w3Client.uploadFile(
      downSampledEncryptedBlob
    )
    await status.update({
      status: 'Generating token image',
      updatedAt: Timestamp.fromDate(new Date()),
    })
    await auditTable.add({
      status: 'Generating token image',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    })
    const imageCid = await imageAI.images
      .generate({
        model: getModel('IMAGE'),
        prompt: `Generate and image which accurately represents a supposed document
    with the title \`${_name}\` and the descriptions \`${description}\`. If there are any word flagged as inappropriate,
    then just pick the closest word to it. If there is none, then pick a random word.
    I would like to always get an image, even if it's not 100% accurate.`,
        response_format: 'url',
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      })
      .then(async (response) => {
        const { url } = response.data[0]
        if (url) {
          const buffer = await fetch(url).then((res) => {
            if (!res.ok) {
              throw new Error('Bad')
            }
            return res.arrayBuffer()
          })
          await status.update({
            status: 'Storing token image',
            updatedAt: Timestamp.fromDate(new Date()),
          })
          const blob = new Blob([buffer])
          return await w3Client.uploadFile(blob)
        }
      })
      .catch((error) => {
        console.error('Errornect generating image:', error)
      })
    const now = new Date()
    const data: IPDocJSON = clean({
      ...rest,
      name: _name,
      description,
      ...(imageCid
        ? {
            image: {
              cid: imageCid?.toString(),
              width: 1024,
              height: 1024,
              mimeType: 'image/png',
            },
          }
        : {}),
      creator: user.user.user_id,
      metadata: {
        tokenId,
        cid: '',
      },
      encrypted: {
        cid: encryptedCid.toString(),
        acl: JSON.stringify(encrypted.unifiedAccessControlConditions),
        hash: encrypted.dataToEncryptHash,
      },
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      downSampled: {
        cid: downSampledEncryptedCid.toString(),
        acl: JSON.stringify(
          downSampledEncrypted.unifiedAccessControlConditions
        ),
        hash: downSampledEncrypted.dataToEncryptHash,
      },
    }) as IPDocJSON
    const doc = firestore.collection('ip').doc(id)
    const wallet = createWalletClient({
      account,
      chain: filecoinCalibration,
      transport: http(),
    })
    await status.update({
      status: 'Minting IPDocV2 token',
      updatedAt: Timestamp.fromDate(new Date()),
    })
    await auditTable.add({
      status: 'Minting IPDocV2 token',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    })
    const mint = await wallet
      .writeContract({
        functionName: 'mint',
        abi,
        address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
        args: [account.address, tokenId, 1, '0x'],
      })
      .then(async (hash) => {
        await waitForTransactionReceipt(wallet, {
          hash,
        })
        return hash
      })
    await status.update({
      status: `Transferring token to you ${to}`,
      updatedAt: Timestamp.fromDate(new Date()),
    })
    await auditTable.add({
      status: `Transferring token to you ${to}`,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    })
    const transfer = await wallet
      .writeContract({
        functionName: 'safeTransferFrom',
        abi,
        address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
        args: [account.address, to, tokenId, 1, '0x'],
      })
      .then(async (hash) => {
        await waitForTransactionReceipt(wallet, {
          hash,
        })
        return hash
      })
    await status.update({
      status: 'Storing token metadata',
      updatedAt: Timestamp.fromDate(new Date()),
    })
    await auditTable.add({
      status: 'Storing token metadata',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    })
    const metadata = {
      name: _name,
      description,
      ...(data.image?.cid ? { image: cidAsURL(data.image.cid) } : {}),
      properties: {
        properties: {
          ...rest,
          encrypted: data.encrypted,
          downSampled: data.downSampled,
          createdAt: now.toISOString(),
          creator: to,
        },
      },
    }
    const metadataBlob = new Blob(
      [new TextEncoder().encode(JSON.stringify(metadata))],
      {
        type: 'application/json',
      }
    )
    const metadataCid = await w3Client.uploadFile(metadataBlob)
    await status.update({
      status: 'Setting token metadata URI',
      updatedAt: Timestamp.fromDate(new Date()),
    })
    await auditTable.add({
      status: 'Setting token metadata URI',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    })
    const update = await wallet
      .writeContract({
        functionName: 'setTokenURI',
        abi,
        address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
        args: [tokenId, cidAsURL(metadataCid.toString())],
      })
      .then(async (hash) => {
        await waitForTransactionReceipt(wallet, {
          hash,
        })
        return hash
      })
    await status.update({
      status: 'Updating database',
      updatedAt: Timestamp.fromDate(new Date()),
    })
    await auditTable.add({
      status: 'Updating database',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    })
    const updateData = {
      ...data,
      metadata: {
        cid: metadataCid.toString(),
        tokenId,
        mint,
        transfer,
        update,
      },
    }
    await status.update({
      status: 'Finished',
      updatedAt: Timestamp.fromDate(new Date()),
    })
    await auditTable.add({
      status: 'Create Finished',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    })
    console.log('update', updateData)
    await doc.set(updateData)
    return new Response(JSON.stringify({ ...data, id: doc.id }), {
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
