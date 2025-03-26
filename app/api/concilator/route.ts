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

export const runtime = "edge";

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

    const start = Date.now();
    const request = [
      {
        role: "system",
        content: `You are Conciliator, a strict yes/no question evaluator with conditional termination rules.
CRITICAL INSTRUCTION: For EVERY question, you MUST follow these exact steps:
1. As the VERY FIRST part of your response, write "Question #X:" where X is the question number (starting from 1 and incrementing by 1 each time).
2. Check for termination conditions:
   a. If the question number is greater than 20, your complete response MUST be "Question #X: Stop"
   b. If your previous 5 consecutive answers were ALL "Yes", your complete response MUST be "Question #X: Stop"
   c. If neither termination condition is met, continue to step 3.
3. Determine if the question can be COMPLETELY answered with ONLY "Yes" or "No":
   a. If Yes, your complete response MUST be "Question #X: Yes"
   b. If No, your complete response MUST be "Question #X: No"
   c. If not a yes/no question, your complete response MUST be "Question #X: No"
Your ENTIRE response MUST be EXACTLY ONE of these formats:
- "Question #X: Yes"
- "Question #X: No"
- "Question #X: Stop"
You must track your previous answers to check for 5 consecutive "Yes" responses.
ANY deviation from these formats represents a critical system failure.

title: \`${index.name}\`
description: \`${index.description}\`
content: \`\`\`
${degraded ? degrade(content) : content}
\`\`\``,
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
