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
import type { IPDoc } from '@/lib/types'
import { Timestamp } from 'firebase-admin/firestore'
import { bytesToHex, padBytes } from 'viem'

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
      encrypted,
      downSampledEncrypted,
      name: _name,
      description,
      ...rest
    } = body
    const account = privateKeyToAccount(
      (process.env.FILCOIN_PK || '') as `0x${string}`
    )
    console.log('account', account.address)
    const w3Client = await createAsAgent(
      process.env.STORACHA_AGENT_KEY || '',
      process.env.STORACHA_AGENT_PROOF || ''
    )
    const encryptedBlob = new Blob(
      [new TextEncoder().encode(JSON.stringify(encrypted))],
      {
        type: 'application/json',
      }
    )
    const encryptedCid = await w3Client.uploadFile(
      // {
      //   async arrayBuffer() {
      //     return new TextEncoder().encode(JSON.stringify(encrypted));
      //   },
      // } as any
      encryptedBlob
    )
    const downSampledEncryptedBlob = new Blob(
      [new TextEncoder().encode(JSON.stringify(downSampledEncrypted))],
      {
        type: 'application/json',
      }
    )
    const downSampledEncryptedCid = await w3Client.uploadFile(
      // {
      //   async arrayBuffer() {
      //     return new TextEncoder().encode(JSON.stringify(encrypted));
      //   },
      // } as any
      downSampledEncryptedBlob
    )
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
          const blob = new Blob([buffer])
          return await w3Client.uploadFile(blob)
        }
      })
      .catch((error) => {
        console.error('Errornect generating image:', error)
      })
    const firestore = await getFirestore()
    const data: IPDoc = clean({
      ...rest,
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
      tokenId: '',
      encrypted: {
        cid: encryptedCid.toString(),
        acl: JSON.stringify(encrypted.unifiedAccessControlConditions),
        hash: encrypted.dataToEncryptHash,
      },
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      name: _name,
      description,
      tags: rest.tags || [],
      creator: user.user.user_id,
      downSampled: {
        cid: downSampledEncryptedCid.toString(),
        acl: JSON.stringify(
          downSampledEncrypted.unifiedAccessControlConditions
        ),
        hash: downSampledEncrypted.dataToEncryptHash,
      },
    }) as IPDoc
    const doc = await firestore.collection('ip').add(data)
    const tokenId = bytesToHex(
      padBytes(new TextEncoder().encode('371l4vRJJV6uoWTONUqS'), {
        dir: 'left',
        size: 32,
      })
    )
    const wallet = createWalletClient({
      account,
      chain: filecoinCalibration,
      transport: http(),
    })
    wallet
      .writeContract({
        functionName: 'mint',
        abi,
        address: (process.env.FILCOIN_CONTRACT || '0x') as `0x${string}`,
        args: [name, description, content],
      })
      .then((hash) => {
        return waitForTransactionReceipt(wallet, {
          hash,
        })
      })
    await doc.update({
      tokenId,
    })

    // const _decrypted = await litClient.decrypt({
    //   accessControlConditions: encrypted.unifiedAccessControlConditions,
    //   ciphertext: encrypted.ciphertext,
    //   dataToEncryptHash: encrypted.dataToEncryptHash,
    //   chain: "filecoin",
    //   sessionSigs,
    // });
    // console.log("raw decrypted", _decrypted);
    // console.log(
    //   "raw decrypted",
    //   new TextDecoder().decode(_decrypted.decryptedData)
    // );
    //     const decrypted = await litClient.executeJs({
    //       code: `async function run() {
    //   try {
    //     const input = await Lit.Actions.decryptAndCombine({
    //       accessControlConditions: unifiedAccessControlConditions,
    //       ciphertext: ciphertext,
    //       dataToEncryptHash: dataToEncryptHash,
    //       chain: "filecoin",
    //     });
    //     // const configJson = await Lit.Actions.decryptAndCombine({
    //     //   accessControlConditions: config[2],
    //     //   ciphertext: config[0],
    //     //   dataToEncryptHash: config[1],
    //     //   chain: "filecoin",
    //     // });
    //     // const { apiKey, orgId, projectId, pinataJwt } = JSON.parse(configJson);
    //     // const promptQuery = {
    //     //   model: "gpt-4o-mini",
    //     //   messages: [
    //     //     {
    //     //       role: "user",
    //     //       content: \`Create a good looking picture by taking ideas of the following message \\\`\${input}\\\`. Summarize and simplify the text such that it would become a good prompt for image generation. Generate a good looking dark fantasy image. Please return only the prompt text for the image generation. Please describe any well-known characters with your own words for dall-e-3 to use and make sure it doesn't get rejected by the dall-e-safety system.\`,
    //     //     },
    //     //   ],
    //     //   temperature: 0.7,
    //     // };

    //     // const promptResponse = await fetch(
    //     //   "https://api.openai.com/v1/chat/completions",
    //     //   {
    //     //     method: "POST",
    //     //     headers: {
    //     //       Authorization: \`Bearer \${apiKey}\`,
    //     //       "OpenAI-Organization": orgId,
    //     //       "OpenAI-Project": projectId,
    //     //       "Content-Type": "application/json",
    //     //     },
    //     //     body: JSON.stringify(promptQuery),
    //     //   }
    //     // );

    //     // const promptData = await promptResponse.json();
    //     // const prompt = promptData.choices[0].message.content.trim();

    //     // const imageQuery = {
    //     //   model: "dall-e-3",
    //     //   prompt: \`Generate an image with the following description: \\\`\${prompt}\\\` and make sure it looks like the scene set in the future. Make sure the image is not too obvious to keep normal humans guessing as what to the image means.\`,
    //     //   response_format: "url",
    //     //   size: "1024x1024",
    //     //   quality: "standard",
    //     //   n: 1,
    //     // };

    //     // const imageResponse = await fetch(
    //     //   "https://api.openai.com/v1/images/generations",
    //     //   {
    //     //     method: "POST",
    //     //     headers: {
    //     //       Authorization: \`Bearer \${apiKey}\`,
    //     //       "OpenAI-Organization": orgId,
    //     //       "OpenAI-Project": projectId,
    //     //       "Content-Type": "application/json",
    //     //     },
    //     //     body: JSON.stringify(imageQuery),
    //     //   }
    //     // );

    //     // const imageData = await imageResponse.json();
    //     // const { url } = imageData.data[0];

    //     // const { ciphertext: _ciphertext, dataToEncryptHash: _dataToEncryptHash } =
    //     //   await Lit.Actions.encrypt({
    //     //     accessControlConditions: data[2].slice(2),
    //     //     to_encrypt: new TextEncoder().encode(input),
    //     //   });
    //     // Lit.Actions.setResponse({
    //     //   response: JSON.stringify({
    //     //     message: [_ciphertext, _dataToEncryptHash, data[2].slice(2)],
    //     //     url,
    //     //   }),
    //     // });
    //     Lit.Actions.setResponse({ response: input });
    //   } catch (error) {
    //     console.error("Error during execution:", error);
    //     Lit.Actions.setResponse({ response: error.message });
    //   }
    // }
    // run();`,
    //       // cid: CID,
    //       sessionSigs,
    //       // chain: LIT_NETWORK.Datil,
    //       jsParams: {
    //         ...encrypted,
    //       },
    //     });
    // const descrypted = await litClient.decrypt({
    //   sessionSigs,
    //   chain: LIT_NETWORK.Datil,
    //   ...encrypted,
    // });
    // console.log("decrypted", decrypted);
    //     const wallet = createWalletClient({
    //       account,
    //       chain: filecoinCalibration,
    //       transport: http(),
    //     });
    //     console.log("minting", name, description, content);

    //     const [image, receipt] = await Promise.all([
    //       getImage(),
    //       wallet
    //         .writeContract({
    //           functionName: "tokenizeDocument",
    //           abi,
    //           address: (process.env.FILCOIN_CONTRACT || "0x") as `0x${string}`,
    //           args: [name, description, content],
    //         })
    //         .then((hash) => {
    //           return waitForTransactionReceipt(wallet, {
    //             hash,
    //           });
    //         }),
    //     ]);
    //     console.log("receipt", receipt);
    //     let embedding = {
    //       name: "",
    //       image: "",
    //       description: "",
    //       tokenId: "",
    //     };
    //     for (const log of receipt.logs) {
    //       if (
    //         log.topics[0] !==
    //         "0x94b88a21917056f1cb32f00265c75326b787b843e5c328981cbdd22def0c099d"
    //       ) {
    //         continue;
    //       }
    //       console.log("log", log);
    //       const info = decodeEventLog({
    //         abi,
    //         ...log,
    //       });
    //       console.log("info", info);
    //       const { name, description, tokenId } = info.args as unknown as {
    //         name: string;
    //         description: string;
    //         tokenId: bigint;
    //       };
    //       console.log("image", image);
    //       await wallet.writeContract({
    //         functionName: "setTokenURI",
    //         abi,
    //         address: (process.env.FILCOIN_CONTRACT || "0x") as `0x${string}`,
    //         args: [tokenId, image],
    //       });
    //       embedding = {
    //         name,
    //         image,
    //         description,
    //         tokenId: `${tokenId || 0n}`,
    //       };
    //       console.log("embedding", embedding);
    //       return new Response(JSON.stringify(embedding), {
    //         headers: { "Content-Type": "application/json" },
    //       });
    //     }
    //     return new Response(JSON.stringify({ error: "Internal Server Error" }), {
    //       status: 500,
    //       headers: { "Content-Type": "application/json" },
    //     });
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
