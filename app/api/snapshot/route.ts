import type { NextRequest } from "next/server";
// import { ALLOWED_ORIGINS, abi } from "../utils";
// import { createWalletClient, decodeEventLog, http } from "viem";
import { ALLOWED_ORIGINS, pinata } from "../utils";
// import { createWalletClient, http } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
// import { filecoinCalibration } from "viem/chains";
// import { waitForTransactionReceipt } from "viem/actions";
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
    const { name, content, description, messages } = body;
    const blob = new Blob([
      JSON.stringify({ name, content, description, messages }),
    ]);
    const file = new File([blob], "chat.json", { type: "application/json" });
    const upload = await pinata.upload.file(file);

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

    return new Response(JSON.stringify(upload), {
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
