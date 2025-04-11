import type { NextRequest } from "next/server";
import { completionAI, genSession, /* abi, */ getModel } from "../utils";
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
import templateFile from "./system.hbs";
import { getFirestore } from "../firebase";
import { cidAsURL, type IPDoc } from "@/lib/types";
import {
  createLitClient,
  LIT_ABILITY,
  LIT_NETWORK,
  LitAccessControlConditionResource,
  LitActionResource,
} from "lit-wrapper";
// import { SignableMessage } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const templateText = templateFile.toString();

export const runtime = "nodejs";

// You'll set these in your .env.local file
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "localhost:*")
  .split(",")
  .map((origin) => new RegExp(origin.replace(/\*/g, ".*")));

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || "";
    const correctDomain = ALLOWED_ORIGINS.find((reg) => reg.test(origin));
    if (!correctDomain) {
      console.error("Invalid domain", origin);
      return new Response("Unauthorized", { status: 403 });
    }

    const { messages, tokenId } = (await req.json()) as {
      messages: {
        role: "user" | "assistant" | "system";
        content: string;
      }[];
      tokenId: string;
    };

    const fs = await getFirestore();
    const doc = await fs.collection("ip").doc(tokenId).get();
    const data = doc.data() as IPDoc;

    // const wallet = createWalletClient({
    //   account: privateKeyToAccount(
    //     (process.env.FILCOIN_PK || "") as `0x${string}`
    //   ),
    //   // chain: {
    //   //   ...filecoinCalibration,
    //   //   rpcUrls: {
    //   //     default: { http: ["https://api.calibration.node.glif.io"] },
    //   //   },
    //   // },
    //   chain: filecoinCalibration,
    //   transport: http(),
    // });
    // const data = encodeFunctionData({
    //   abi,
    //   functionName: "getDocument",
    //   args: [tokenId],
    // });
    // const { data: results } = await call(wallet, {
    //   to: (process.env.FILCOIN_CONTRACT || "0x") as `0x${string}`,
    //   data,
    // });
    // const content = decodeAbiParameters(
    //   [{ type: "string" }],
    //   results as Hex
    // )[0];
    // const index = (await readContract(wallet, {
    //   address: (process.env.FILCOIN_CONTRACT || "0x") as `0x${string}`,
    //   functionName: "getDocumentMetadata",
    //   abi,
    //   args: [tokenId],
    // })) as { name: string; description: string };

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({
          name: data.name,
          description: data.description,
          messages: [
            {
              role: "assistant",
              content: `Welcome to the ${data.name} session! I am ready to answer questions about this invention with the following description

${data.description}`,
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const request = [
      {
        role: "system",
        content: "",
      },
    ] as { role: "user" | "assistant" | "system"; content: string }[];
    const yesItems: boolean[] = [];
    for (const message of messages) {
      if (message.role === "assistant") {
        request.push({
          ...message,
          content: message.content?.replace(/^(Yes|No|Stop)/i, "$1") || "",
        });
        if (/Stop/i.test(request.at(-1)?.content || "")) {
          return new Response(
            JSON.stringify({ success: false, error: "Completed" }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        if (/Yes/i.test(request.at(-1)?.content || "")) {
          yesItems.push(true);
        } else {
          yesItems.push(false);
        }
      } else {
        request.push(message);
      }
    }
    const runs: number[] = [];
    let acc = 0;
    for (const item of yesItems) {
      if (item) {
        acc++;
        continue;
      }
      if (acc > 0) {
        runs.push(acc);
      }
      acc = 0;
    }
    const consecutiveYesCount = Math.max(...runs);
    if (consecutiveYesCount < 5) {
      const account = privateKeyToAccount(
        (process.env.FILCOIN_PK || "") as `0x${string}`
      );
      const litClient = await createLitClient({
        litNetwork: LIT_NETWORK.Datil,
        debug: false,
      });
      global.document = { dispatchEvent: (_event: Event) => true } as Document;
      await litClient.connect();
      const accsInput =
        await LitAccessControlConditionResource.generateResourceString(
          JSON.parse(data.encrypted.acl),
          data.encrypted.hash
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
      const encrypted = await fetch(cidAsURL(data.downSampled.cid))
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch encrypted data");
          }
          return res.json();
        })
        .then((res) => res.ciphertext);

      const _decrypted = await litClient.decrypt({
        accessControlConditions: JSON.parse(data.downSampled.acl),
        ciphertext: encrypted,
        dataToEncryptHash: data.downSampled.hash,
        chain: "filecoin",
        sessionSigs,
      });

      console.log("raw decrypted", _decrypted);
      console.log(
        "raw decrypted",
        new TextDecoder().decode(_decrypted.decryptedData)
      );

      const content = new TextDecoder().decode(_decrypted.decryptedData);

      const _data: Record<string, string> = {
        title: data.name,
        description: data.description,
        content,
        consecutiveYesCount: `${consecutiveYesCount}`,
      };
      const _content = templateText.replace(
        /\{\{([^}]*)\}\}/g,
        (_match, name) => {
          return _data[name.trim()] || "";
        }
      );
      request[0].content = _content;
      const completion = await completionAI.chat.completions.create({
        model: getModel("COMPLETION"), // Use the appropriate model
        messages: request,
      });
      const answerContent = completion.choices
        .flatMap(
          ({ message: { content = "" } = { content: "" } }) =>
            content?.split("\n") || ""
        )
        .join("\n");
      console.log("conciliator", consecutiveYesCount, yesItems, answerContent);
      messages.push({ content: answerContent, role: "assistant" });
    } else {
      messages.push({ content: "Stop", role: "assistant" });
    }
    return new Response(
      JSON.stringify({
        messages,
        name: data.name,
        description: data.description,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    const { message, request_id, status, name, headers } = error as {
      message?: string;
      request_id?: string;
      status?: number;
      name?: string;
      headers?: Record<string, unknown>;
    };
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: message || "Internal Server Error",
          request_id,
          status,
          name,
          headers,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
