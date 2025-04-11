import type { NextRequest } from "next/server";
// import { abi } from "../utils";
// import { createWalletClient, decodeEventLog, http } from "viem";
import type { IPDoc } from "@/lib/types";
import { getFirestore } from "../firebase";
import { createAsAgent } from "@/packages/web-storage-wrapper/dist";
// import { createWalletClient, http } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
// import { filecoinCalibration } from "viem/chains";
// import { waitForTransactionReceipt } from "viem/actions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, messages } = body;
    const fs = await getFirestore();
    const doc = await fs.collection("ip").doc(id).get();
    const data = doc.data() as IPDoc;

    const blob = new Blob([
      new TextEncoder().encode(
        JSON.stringify({
          name: data.name,
          description: data.description,
          messages,
        })
      ),
    ]);
    const w3Client = await createAsAgent(
      process.env.STORACHA_AGENT_KEY || "",
      process.env.STORACHA_AGENT_PROOF || ""
    );
    const upload = await w3Client.uploadFile(
      // {
      //   async arrayBuffer() {
      //     return new TextEncoder().encode(JSON.stringify(encrypted));
      //   },
      // } as any
      blob
    );

    // const wallet = createWalletClient({
    //   account: privateKeyToAccount(
    //     (process.env.FILCOIN_PK || "") as `0x${string}`
    //   ),
    //   chain: filecoinCalibration,
    //   transport: http(),
    // });
    // const hash = await wallet.writeContract({
    //   functionName: "tokenizeDocument",
    //   abi,
    //   address: (process.env.FILCOIN_CONTRACT || "0x") as `0x${string}`,
    //   args: [name, description, content],
    // });
    // const receipt = await waitForTransactionReceipt(wallet, {
    //   hash,
    // });
    // let embedding = {
    //   name: "",
    //   description: "",
    //   tokenId: "",
    // };
    // for (const log of receipt.logs) {
    //   if (
    //     log.topics[0] !==
    //     "0x94b88a21917056f1cb32f00265c75326b787b843e5c328981cbdd22def0c099d"
    //   ) {
    //     continue;
    //   }
    //   const info = decodeEventLog({
    //     abi,
    //     ...log,
    //   });
    //   const { name, description, tokenId } = info.args as unknown as {
    //     name: string;
    //     description: string;
    //     tokenId: bigint;
    //   };
    //   embedding = {
    //     name,
    //     description,
    //     tokenId: `${tokenId || 0n}`,
    //   };
    // }

    return new Response(JSON.stringify(upload.toString()), {
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
