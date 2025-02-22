import type { NextRequest } from "next/server";
import { abi, openai, pinata } from "../utils";
import { readContract } from "viem/actions";
import { filecoinCalibration } from "viem/chains";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const runtime = "edge";

// You'll set these in your .env.local file
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "localhost:*")
  .split(",")
  .map((origin) => new RegExp(origin.replace(/\*/g, ".*")));

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || req.headers.get("host") || "";
    const correctDomain = ALLOWED_ORIGINS.find((reg) => reg.test(origin));
    if (!correctDomain) {
      console.error("Invalid domain", origin, ALLOWED_ORIGINS);
      return new Response("Unauthorized", { status: 403 });
    }

    const { start: _start, limit: _limit } = await req.json();
    let tokenId = BigInt(_start || 1);
    tokenId += 22n;
    let limit = _limit || 12;
    if (limit > 100) {
      limit = 100;
    }
    const wallet = createWalletClient({
      account: privateKeyToAccount(
        (process.env.FILCOIN_PK || "") as `0x${string}`
      ),
      chain: filecoinCalibration,
      transport: http(),
    });
    const tokens = [];
    while (true) {
      try {
        console.log("getting", tokenId);
        const index = (await readContract(wallet, {
          address: (process.env.FILCOIN_CONTRACT || "0x") as `0x${string}`,
          functionName: "getDocumentMetadata",
          abi,
          args: [tokenId],
        })) as { name: string; description: string };
        let url = await readContract(wallet, {
          address: (process.env.FILCOIN_CONTRACT || "0x") as `0x${string}`,
          functionName: "tokenURI",
          abi,
          args: [tokenId],
        }).catch((error) => {
          console.log(error, process.env.FILECOIN_CONTRACT);
          return null;
        });
        if (!url) {
          const response2 = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Generate and image which accurately represents a supposed document
        with the title \`${index.name}\` and the descriptions \`${index.description}\`. If there are any word flagged as inappropriate,
        then just pick the closest word to it. If there is none, then pick a random word.
        I would like to always get an image, even if it's not 100% accurate.`,
            response_format: "url",
            size: "1024x1024",
            quality: "standard",
            n: 1,
          });

          const { url: _url } = response2.data[0];
          if (_url) {
            const { IpfsHash } = await pinata.upload.url(_url);
            url = `ipfs://${IpfsHash}`;
            await wallet.writeContract({
              functionName: "setTokenURI",
              abi,
              address: (process.env.FILCOIN_CONTRACT || "0x") as `0x${string}`,
              args: [tokenId, url],
            });
          }
        }
        console.log("url", url);
        tokens.push({ ...index, tokenId: Number(tokenId), url });
        tokenId++;
      } catch {
        break;
      }
      if (tokens.length >= limit) {
        break;
      }
    }
    return new Response(JSON.stringify(tokens), {
      status: 200,
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
