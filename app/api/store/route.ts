import type { NextRequest } from "next/server";
import {
  ALLOWED_ORIGINS,
  abi,
  genSession,
  getModel,
  imageAI,
  pinata,
} from "../utils";
import { createWalletClient, decodeEventLog, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { filecoinCalibration } from "viem/chains";
import { waitForTransactionReceipt } from "viem/actions";
import { createAsAgent } from "web-storage-wrapper";
import {
  createLitClient,
  LIT_ABILITY,
  LIT_NETWORK,
  LitAccessControlConditionResource,
  LitActionResource,
} from "lit-wrapper";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || req.headers.get("host") || "";
    const correctDomain = ALLOWED_ORIGINS.find((reg) => reg.test(origin));
    if (!correctDomain) {
      console.error("Invalid domain", origin);
      return new Response("Unauthorized", { status: 403 });
    }

    const body = await req.json();
    const { name: _name, content, description, encrypted } = body;
    const name = _name || "Untitled";
    const account = privateKeyToAccount(
      (process.env.FILCOIN_PK || "") as `0x${string}`
    );
    console.log("account", account.address);
    const litClient = await createLitClient({
      litNetwork: LIT_NETWORK.Datil,
    });
    global.document = { dispatchEvent: (_event: Event) => true } as Document;
    await litClient.connect();
    const accsInput =
      await LitAccessControlConditionResource.generateResourceString(
        encrypted.unifiedAccessControlConditions,
        encrypted.dataToEncryptHash
      );

    // const { capacityDelegationAuthSig } =
    //   await litClient.createCapacityDelegationAuthSig({
    //     dAppOwnerWallet: {
    //       signMessage: (message: SignableMessage) =>
    //         account.signMessage({ message }),
    //       getAddress: async () => account.address,
    //     },
    //     capacityTokenId: 162391,
    //     delegateeAddresses: [account.address],
    //     uses: "1",
    //     expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    //   });

    const sessionSigs = await genSession(account, litClient, [
      {
        resource: new LitActionResource("*"),
        ability: LIT_ABILITY.LitActionExecution,
      },
      {
        resource: new LitAccessControlConditionResource(accsInput),
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
    ]);
    console.log("encrypted", Object.keys(encrypted), encrypted.ciphertext?.length || 0, LIT_NETWORK);
    const w3Client = await createAsAgent(
      process.env.STORACHA_AGENT_KEY || "",
      process.env.STORACHA_AGENT_PROOF || ""
    );
    const blob = new Blob(
      [new TextEncoder().encode(JSON.stringify(encrypted))],
      {
        type: "application/json",
      }
    );
    const cid = await w3Client.uploadFile(
      // {
      //   async arrayBuffer() {
      //     return new TextEncoder().encode(JSON.stringify(encrypted));
      //   },
      // } as any
      blob
    );
    console.log("cid", cid.toString());
    const decrypted = await litClient.executeJs({
      code: `async function run() {
  try {
    const input = await Lit.Actions.decryptAndCombine({
      accessControlConditions: unifiedAccessControlConditions,
      ciphertext: ciphertext,
      dataToEncryptHash: dataToEncryptHash,
      chain: "filecoin",
    });
    // const configJson = await Lit.Actions.decryptAndCombine({
    //   accessControlConditions: config[2],
    //   ciphertext: config[0],
    //   dataToEncryptHash: config[1],
    //   chain: "filecoin",
    // });
    // const { apiKey, orgId, projectId, pinataJwt } = JSON.parse(configJson);
    // const promptQuery = {
    //   model: "gpt-4o-mini",
    //   messages: [
    //     {
    //       role: "user",
    //       content: \`Create a good looking picture by taking ideas of the following message \\\`\${input}\\\`. Summarize and simplify the text such that it would become a good prompt for image generation. Generate a good looking dark fantasy image. Please return only the prompt text for the image generation. Please describe any well-known characters with your own words for dall-e-3 to use and make sure it doesn't get rejected by the dall-e-safety system.\`,
    //     },
    //   ],
    //   temperature: 0.7,
    // };

    // const promptResponse = await fetch(
    //   "https://api.openai.com/v1/chat/completions",
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: \`Bearer \${apiKey}\`,
    //       "OpenAI-Organization": orgId,
    //       "OpenAI-Project": projectId,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(promptQuery),
    //   }
    // );

    // const promptData = await promptResponse.json();
    // const prompt = promptData.choices[0].message.content.trim();

    // const imageQuery = {
    //   model: "dall-e-3",
    //   prompt: \`Generate an image with the following description: \\\`\${prompt}\\\` and make sure it looks like the scene set in the future. Make sure the image is not too obvious to keep normal humans guessing as what to the image means.\`,
    //   response_format: "url",
    //   size: "1024x1024",
    //   quality: "standard",
    //   n: 1,
    // };

    // const imageResponse = await fetch(
    //   "https://api.openai.com/v1/images/generations",
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: \`Bearer \${apiKey}\`,
    //       "OpenAI-Organization": orgId,
    //       "OpenAI-Project": projectId,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(imageQuery),
    //   }
    // );

    // const imageData = await imageResponse.json();
    // const { url } = imageData.data[0];

    // const { ciphertext: _ciphertext, dataToEncryptHash: _dataToEncryptHash } =
    //   await Lit.Actions.encrypt({
    //     accessControlConditions: data[2].slice(2),
    //     to_encrypt: new TextEncoder().encode(input),
    //   });
    // Lit.Actions.setResponse({
    //   response: JSON.stringify({
    //     message: [_ciphertext, _dataToEncryptHash, data[2].slice(2)],
    //     url,
    //   }),
    // });
    Lit.Actions.setResponse({ response: input });
  } catch (error) {
    console.error("Error during execution:", error);
    Lit.Actions.setResponse({ response: error.message });
  }
}
run();`,
      // cid: CID,
      sessionSigs,
      // chain: LIT_NETWORK.Datil,
      jsParams: {
        ...encrypted,
      },
    });
    // const descrypted = await litClient.decrypt({
    //   sessionSigs,
    //   chain: LIT_NETWORK.Datil,
    //   ...encrypted,
    // });
    console.log("decrypted", decrypted);
//     const wallet = createWalletClient({
//       account,
//       chain: filecoinCalibration,
//       transport: http(),
//     });
//     console.log("minting", name, description, content);
//     const getImage = async () => {
//       const response2 = await imageAI.images.generate({
//         model: getModel("IMAGE"),
//         prompt: `Generate and image which accurately represents a supposed document
// with the title \`${name}\` and the descriptions \`${description}\`. If there are any word flagged as inappropriate,
// then just pick the closest word to it. If there is none, then pick a random word.
// I would like to always get an image, even if it's not 100% accurate.`,
//         response_format: "url",
//         size: "1024x1024",
//         quality: "standard",
//         n: 1,
//       });
//       console.log("response2", response2);
//       const { url } = response2.data[0];
//       let image = "";
//       if (url) {
//         const { IpfsHash } = await pinata.upload.url(url);
//         image = `ipfs://${IpfsHash}`;
//       }
//       return image;
//     };
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
    return new Response(JSON.stringify({cid: cid.toString(),encrypted, decrypted}), {
      headers: { "Content-Type": "application/json" },
    });
} catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
