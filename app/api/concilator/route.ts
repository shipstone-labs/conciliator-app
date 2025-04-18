import type { NextRequest } from 'next/server'
import {
  getCompletionAI,
  genSession,
  getLit,
  /* abi, */ getModel,
} from '../utils'
// import { call, readContract } from "viem/actions";
// import { filecoinCalibration } from "viem/chains";
// import {
//   createWalletClient,
//   decodeAbiParameters,
//   encodeFunctionData,
//   type Hex,
//   http,
// } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
// Dynamic import for the template file
import templateFile from './system.hbs'
import { getFirestore } from '../firebase'
import { cidAsURL, type IPDocJSON } from '@/lib/internalTypes'
import {
  LIT_ABILITY,
  LitAccessControlConditionResource,
  LitActionResource,
} from 'lit-wrapper'
// import { SignableMessage } from "viem";
import { privateKeyToAccount } from 'viem/accounts'
import { FieldValue } from 'firebase-admin/firestore'
import { getUser } from '../stytch'
import { initAPIConfig } from '@/lib/apiUtils'
import { LRUCache } from 'next/dist/server/lib/lru-cache'
import { decodeAll } from 'cbor'
const templateText = templateFile.toString()

export const runtime = 'nodejs'

const contentCache = new LRUCache<Promise<string>>(100)

export async function POST(req: NextRequest) {
  try {
    await initAPIConfig()

    await getUser(req)
    const { messages, id } = (await req.json()) as {
      messages: {
        role: 'user' | 'assistant' | 'system'
        content: string
      }[]
      id: string
    }

    const fs = getFirestore()
    const doc = await fs.collection('ip').doc(id).get()
    const auditTable = fs.collection('ip').doc(id).collection('audit')
    const data = doc.data() as IPDocJSON
    if (!data) {
      throw new Error('Document not found')
    }
    if (messages.length === 0) {
      return new Response(
        JSON.stringify({
          name: data.name,
          description: data.description,
          messages: [
            {
              role: 'assistant',
              content: `Welcome to the ${data.name} session! I am ready to answer questions about this invention with the following description

${data.description}`,
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    const request = [
      {
        role: 'system',
        content: '',
      },
    ] as { role: 'user' | 'assistant' | 'system'; content: string }[]
    const yesItems: boolean[] = []
    for (const message of messages) {
      if (message.role === 'assistant') {
        request.push({
          ...message,
          content: message.content?.replace(/^(Yes|No|Stop)/i, '$1') || '',
        })
        if (/Stop/i.test(request.at(-1)?.content || '')) {
          return new Response(
            JSON.stringify({ success: false, error: 'Completed' }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
        if (/Yes/i.test(request.at(-1)?.content || '')) {
          yesItems.push(true)
        } else {
          yesItems.push(false)
        }
      } else {
        request.push(message)
      }
    }
    const runs: number[] = []
    let acc = 0
    for (const item of yesItems) {
      if (item) {
        acc++
        continue
      }
      if (acc > 0) {
        runs.push(acc)
      }
      acc = 0
    }
    const consecutiveYesCount = Math.max(...runs)
    if (consecutiveYesCount < 5) {
      const account = privateKeyToAccount(
        (process.env.FILCOIN_PK || '') as `0x${string}`
      )
      const litClient = await getLit()
      let contentPromise = contentCache.get(data.downSampled.cid)
      if (!contentPromise) {
        const getContent = async () => {
          const url = cidAsURL()
          const downSampledArray = url
            ? await fetch(url).then((res) => {
                if (!res.ok) {
                  throw new Error('Failed to fetch encrypted data')
                }
                return res.arrayBuffer()
              })
            : undefined
          let downSampled: {
            dataToEncryptHash: string
            unifiedAccessControlConditions: unknown[]
            ciphertext: string
          }
          try {
            if (!downSampledArray) {
              throw new Error('No data')
            }
            const [
              tag,
              ,
              ,
              ,
              dataToEncryptHash,
              unifiedAccessControlConditions,
              _ciphertext,
            ] = await decodeAll(downSampledArray)
            if (tag !== 'LIT-ENCRYPTED') {
              throw new Error('Invalid tag')
            }
            downSampled = {
              dataToEncryptHash,
              unifiedAccessControlConditions,
              ciphertext: _ciphertext.toString('base64'),
            }
          } catch {
            downSampled = JSON.parse(
              new TextDecoder().decode(downSampledArray || new Uint8Array())
            ) as {
              dataToEncryptHash: string
              unifiedAccessControlConditions: unknown[]
              ciphertext: string
            }
          }
          if (
            data.downSampled.acl !==
            JSON.stringify(downSampled.unifiedAccessControlConditions)
          ) {
            throw new Error('Access control conditions do not match')
          }
          if (data.downSampled.hash !== downSampled.dataToEncryptHash) {
            throw new Error('Hash does not match')
          }
          const accsInput =
            await LitAccessControlConditionResource.generateResourceString(
              JSON.parse(data.downSampled.acl),
              data.downSampled.hash
            )

          const sessionSigs = await genSession(account, litClient, [
            {
              resource: new LitActionResource('*'),
              ability: LIT_ABILITY.LitActionExecution,
            },
            {
              resource: new LitAccessControlConditionResource(accsInput),
              ability: LIT_ABILITY.AccessControlConditionDecryption,
            },
          ])

          const _decrypted = await litClient.decrypt({
            accessControlConditions:
              downSampled.unifiedAccessControlConditions as Parameters<
                typeof litClient.decrypt
              >[0]['accessControlConditions'],
            ciphertext: downSampled.ciphertext,
            dataToEncryptHash: downSampled.dataToEncryptHash,
            chain: 'filecoinCalibrationTestnet',
            sessionSigs,
          })

          return new TextDecoder().decode(_decrypted.decryptedData)
        }
        contentPromise = getContent()
        contentCache.set(data.downSampled.cid, contentPromise)
      }
      const content = await contentPromise
      const _data: Record<string, string> = {
        title: data.name,
        description: data.description,
        content,
        consecutiveYesCount: `${consecutiveYesCount}`,
      }
      const _content = templateText.replace(
        /\{\{([^}]*)\}\}/g,
        (_match, name) => {
          return _data[name.trim()] || ''
        }
      )
      request[0].content = _content
      const completion = await getCompletionAI().chat.completions.create({
        model: getModel('COMPLETION'), // Use the appropriate model
        messages: request,
      })
      const answerContent = completion.choices
        .flatMap(
          ({ message: { content = '' } = { content: '' } }) =>
            content?.split('\n') || ''
        )
        .join('\n')
      console.log('conciliator', answerContent)
      messages.push({ content: answerContent, role: 'assistant' })
    } else {
      messages.push({ content: 'Stop', role: 'assistant' })
    }
    await auditTable.add({
      status: 'Conciliator answered',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      data: {
        question: messages.at(-2)?.content,
        answer: messages.at(-1)?.content,
      },
    })
    return new Response(
      JSON.stringify({
        messages,
        name: data.name,
        description: data.description,
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
