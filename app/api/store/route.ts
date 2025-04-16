import type { NextRequest } from 'next/server'
import { abi, getModel, imageAI, runWithNonce } from '../utils'
import { bytesToHex, createWalletClient, http, padHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { filecoinCalibration } from 'viem/chains'
import { waitForTransactionReceipt } from 'viem/actions'
import { createAsAgent } from 'web-storage-wrapper'
import { getUser } from '../stytch'
import { getFirestore } from '../firebase'
import { fetch } from 'undici'
import { cidAsURL, type IPDocJSON } from '@/lib/internalTypes'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

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

async function cleanupTable() {
  const fs = getFirestore()
  const batch = fs.batch()
  let count = 0

  const nullContracts = await fs
    .collection('ip')
    .where('metadata.contract', '==', null)
    .get()

  nullContracts.docs.map((doc) => {
    batch.update(doc.ref, {
      // HARDCODED during upgrade. Will delete it once we migrated.
      // This is not secret information.
      'metadata.contract': '0x79665408484fFf9dC7b0BC6b0d42CB18866b9311',
      'metadata.version': 'IPDocV8',
    })
  })
  const invalidDates = await fs
    .collection('ip')
    .where('createdAt._seconds', '!=', null)
    .get()

  invalidDates.docs.map((doc) => {
    let hasUpdate = false
    const update: Record<string, FieldValue> = {}
    {
      const { _seconds, _nanoseconds } = doc.data().createdAt as {
        _seconds: number
        _nanoseconds: number
      }
      update.createdAt = new Timestamp(_seconds, _nanoseconds)
      hasUpdate = true
    }
    {
      const { _seconds, _nanoseconds } = doc.data().updatedAt as {
        _seconds: number
        _nanoseconds: number
      }
      update.updatedAt = new Timestamp(_seconds, _nanoseconds)
    }
    if (!hasUpdate) {
      return
    }
    batch.update(doc.ref, update)
    count++
  })
  if (count) {
    await batch.commit()
    return true
  }
  return false
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)

    await cleanupTable()

    const body = await req.json()
    const {
      to,
      id,
      encrypted,
      downSampledEncrypted,
      name: _name,
      description,
      ...rest
    } = body
    const firestore = getFirestore()
    const checkDoc = await firestore.collection('id').doc(id).get()
    const tokenId = BigInt(
      padHex(bytesToHex(new TextEncoder().encode(id)), {
        size: 32,
        dir: 'left',
      })
    )
    if (checkDoc.exists) {
      if (
        (checkDoc.data()?.creator &&
          checkDoc.data()?.creator !== user.user.user_id) ||
        checkDoc.data()?.metadata?.tokenId != null
      ) {
        return new Response(JSON.stringify({ error: 'ID already exists' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
    const account = privateKeyToAccount(
      (process.env.FILCOIN_PK || '') as `0x${string}`
    )
    const wallet = createWalletClient({
      account,
      chain: filecoinCalibration,
      transport: http(),
    })
    const w3Client = await createAsAgent(
      process.env.STORACHA_AGENT_KEY || '',
      process.env.STORACHA_AGENT_PROOF || ''
    )
    const status = firestore.collection('audit').doc(id)
    const auditTable = firestore
      .collection('audit')
      .doc(id)
      .collection('details')
    await status.set({
      status: 'Storing encrypted document in storacha',
      creator: user.user.user_id,
      address: to,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    await auditTable.add({
      status: 'Storing encrypted document in storacha',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    async function setStatus(message: string, extra?: Record<string, unknown>) {
      await status.update({
        status: message,
        updatedAt: FieldValue.serverTimestamp(),
      })
      await auditTable.add({
        status: message,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        ...extra,
      })
    }
    const encryptedBlob = new Blob(
      [new TextEncoder().encode(JSON.stringify(encrypted))],
      {
        type: 'application/json',
      }
    )
    const encryptedCid = await w3Client.uploadFile(encryptedBlob)
    await setStatus('Storing downsampled encrypted document in storacha')
    const downSampledEncryptedBlob = new Blob(
      [new TextEncoder().encode(JSON.stringify(downSampledEncrypted))],
      {
        type: 'application/json',
      }
    )
    const downSampledEncryptedCid = await w3Client.uploadFile(
      downSampledEncryptedBlob
    )
    await setStatus('AI generating token image from name and description')
    await auditTable.add({
      status: 'Generating token image',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
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
          await setStatus('Storing AI generated token image')
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
        cid: '',
        contract: process.env.FILCOIN_CONTRACT || '0x',
        version: process.env.FILCOIN_CONTRACT_NAME || 'Unknown',
      },
      encrypted: {
        cid: encryptedCid.toString(),
        acl: JSON.stringify(encrypted.unifiedAccessControlConditions),
        hash: encrypted.dataToEncryptHash,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      downSampled: {
        cid: downSampledEncryptedCid.toString(),
        acl: JSON.stringify(
          downSampledEncrypted.unifiedAccessControlConditions
        ),
        hash: downSampledEncrypted.dataToEncryptHash,
      },
    }) as IPDocJSON
    const doc = firestore.collection('ip').doc(id)
    await setStatus(
      `Minting ${process.env.FILCOIN_CONTRACT_NAME || 'Unknown'} token for you ${to}`
    )
    const mint = (await runWithNonce(account.address, async (nonce) => {
      return await wallet
        .writeContract({
          functionName: 'mint',
          abi,
          address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
          args: [to, tokenId, 1, '0x'],
          nonce,
        })
        .then(async (hash) => {
          await waitForTransactionReceipt(wallet, {
            hash,
          })
          return hash
        })
    })) as `0x${string}`
    await setStatus(
      `Storing ${process.env.FILCOIN_CONTRACT_NAME || 'Unknown'} token metadata for token ID ${tokenId}`
    )
    const metadata = {
      name: _name,
      description,
      ...(data.image?.cid ? { image: cidAsURL(data.image.cid) } : {}),
      properties: {
        properties: {
          ...rest,
          tokenId: `${tokenId}`,
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
    await setStatus(`Setting token metadata URI on token ID ${tokenId}`)
    const update = await runWithNonce(account.address, async (nonce) => {
      return await wallet
        .writeContract({
          functionName: 'setTokenURI',
          abi,
          address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
          args: [tokenId, cidAsURL(metadataCid.toString())],
          nonce,
        })
        .then(async (hash) => {
          await waitForTransactionReceipt(wallet, {
            hash,
          })
          return hash
        })
    })
    await setStatus('Updating database record with token information')
    const updateData = {
      ...data,
      metadata: {
        cid: metadataCid.toString(),
        tokenId: `${tokenId}`,
        mint,
        update,
      },
    }
    await setStatus('Finished')
    console.log(JSON.stringify(updateData, null, 2))
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
