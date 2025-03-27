import type { NextRequest } from "next/server";
import { completionAI, abi, getModel } from "../utils";
import { call, readContract } from "viem/actions";
import { filecoinCalibration } from "viem/chains";
import {
  createWalletClient,
  decodeAbiParameters,
  encodeFunctionData,
  type Hex,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import Handlebars from "handlebars";
import templateText from "./system.hbs?raw";

export const runtime = "edge";

const template = Handlebars.compile(templateText);
// You'll set these in your .env.local file
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "localhost:*")
  .split(",")
  .map((origin) => new RegExp(origin.replace(/\*/g, ".*")));

function degrade(content: string) {
  return content.replace(/([\d,.]+)/g, (_match, number) => {
    try {
      const num = Number.parseFloat(number);
      if (num === 0) {
        return number;
      }
      if (Number.isNaN(num)) return number;
      const min = Math.round(num) * 0.9;
      const max = Math.round(num) * 1.1;
      const decimals = /\.(\d+)/.exec(number)?.[1]?.length || 0;
      while (true) {
        const num2 = Math.random() * (max - min) + min;
        if (Math.abs((num2 - num) / num) > 0.05) {
          const output = num2.toFixed(decimals);
          return `${output}`;
        }
      }
    } catch {
      return number;
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || "";
    const correctDomain = ALLOWED_ORIGINS.find((reg) => reg.test(origin));
    if (!correctDomain) {
      console.error("Invalid domain", origin);
      return new Response("Unauthorized", { status: 403 });
    }

    const { messages, tokenId, degraded } = (await req.json()) as {
      messages: {
        role: "user" | "assistant" | "system";
        content: string | null;
      }[];
      degraded?: boolean;
      tokenId: number;
    };

    const wallet = createWalletClient({
      account: privateKeyToAccount(
        (process.env.FILCOIN_PK || "") as `0x${string}`
      ),
      // chain: {
      //   ...filecoinCalibration,
      //   rpcUrls: {
      //     default: { http: ["https://api.calibration.node.glif.io"] },
      //   },
      // },
      chain: filecoinCalibration,
      transport: http(),
    });
    const data = encodeFunctionData({
      abi,
      functionName: "getDocument",
      args: [tokenId],
    });
    const { data: results } = await call(wallet, {
      to: (process.env.FILCOIN_CONTRACT || "0x") as `0x${string}`,
      data,
    });
    const content = decodeAbiParameters(
      [{ type: "string" }],
      results as Hex
    )[0];
    const index = (await readContract(wallet, {
      address: (process.env.FILCOIN_CONTRACT || "0x") as `0x${string}`,
      functionName: "getDocumentMetadata",
      abi,
      args: [tokenId],
    })) as { name: string; description: string };

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({
          name: index.name,
          description: index.description,
          messages: [
            {
              role: "assistant",
              content: `Welcome to the ${index.name} session! I am ready to answer questions about this invention with the following description

${index.description}`,
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const _content = template({
      name: index.name,
      description: index.description,
      content: degraded ? degrade(content) : content,
    });
    console.log(_content);
    const request = [
      {
        role: "system",
        content: _content,
      },
      ...messages,
    ] as { role: "user" | "assistant" | "system"; content: string }[];
    const all_msg = request.slice();
    const completion = await completionAI.chat.completions.create({
      model: getModel("COMPLETION"), // Use the appropriate model
      messages: request,
    });
    for (const { message } of completion.choices) {
      messages.push(message);
      all_msg.push(
        message as { role: "user" | "assistant" | "system"; content: string }
      );
    }
    return new Response(
      JSON.stringify({
        messages,
        name: index.name,
        description: index.description,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
