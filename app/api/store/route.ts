import type { NextRequest } from "next/server";
import { ALLOWED_ORIGINS, abi, imageAI, pinata } from "../utils";
import { createWalletClient, decodeEventLog, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { filecoinCalibration } from "viem/chains";
import { waitForTransactionReceipt } from "viem/actions";

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
    const { name: _name, content, description } = body;
    const name = _name || "Untitled";
    console.log("body", body);
    const wallet = createWalletClient({
      account: privateKeyToAccount(
        (process.env.FILCOIN_PK || "") as `0x${string}`
      ),
      chain: filecoinCalibration,
      transport: http(),
    });
    console.log("minting", name, description, content);
    const getImage = async () => {
      const response2 = await imageAI.images.generate({
        model: "dall-e-3",
        prompt: `Generate and image which accurately represents a supposed document
with the title \`${name}\` and the descriptions \`${description}\`. If there are any word flagged as inappropriate,
then just pick the closest word to it. If there is none, then pick a random word.
I would like to always get an image, even if it's not 100% accurate.`,
        response_format: "url",
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });
      console.log("response2", response2);
      const { url } = response2.data[0];
      let image = "";
      if (url) {
        const { IpfsHash } = await pinata.upload.url(url);
        image = `ipfs://${IpfsHash}`;
      }
      return image;
    };
    const [image, receipt] = await Promise.all([
      getImage(),
      wallet
        .writeContract({
          functionName: "tokenizeDocument",
          abi,
          address: (process.env.FILCOIN_CONTRACT || "0x") as `0x${string}`,
          args: [name, description, content],
        })
        .then((hash) => {
          return waitForTransactionReceipt(wallet, {
            hash,
          });
        }),
    ]);
    console.log("receipt", receipt);
    let embedding = {
      name: "",
      image: "",
      description: "",
      tokenId: "",
    };
    for (const log of receipt.logs) {
      if (
        log.topics[0] !==
        "0x94b88a21917056f1cb32f00265c75326b787b843e5c328981cbdd22def0c099d"
      ) {
        continue;
      }
      console.log("log", log);
      const info = decodeEventLog({
        abi,
        ...log,
      });
      console.log("info", info);
      const { name, description, tokenId } = info.args as unknown as {
        name: string;
        description: string;
        tokenId: bigint;
      };
      console.log("image", image);
      await wallet.writeContract({
        functionName: "setTokenURI",
        abi,
        address: (process.env.FILCOIN_CONTRACT || "0x") as `0x${string}`,
        args: [tokenId, image],
      });
      embedding = {
        name,
        image,
        description,
        tokenId: `${tokenId || 0n}`,
      };
      console.log("embedding", embedding);
      return new Response(JSON.stringify(embedding), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
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
