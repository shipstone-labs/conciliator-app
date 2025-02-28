import type { NextRequest } from "next/server";
import { openai, abi } from "../utils";
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
          return num2.toFixed(decimals);
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
      messages: { role: "user" | "assistant" | "system"; content: string };
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
    const request = [
      {
        role: "system",
        content: `You are the Matcher in an invention value discovery session.
The innovation you're presenting is named \`${index.name}\` and
has the following description: \`${
          index.description
        }\` with the following content:
\`\`\`
${degraded ? degrade(content) : content}
\`\`\`

Your Goals:
- Demonstrate value while preserving market worth
- Use yes/no answers to control information flow
- Stop when further details would risk devaluing the innovation

Rules:
1. Calculate a RATING from 1 to 10 to rate how close you think the question captures details of the content. Consider both individual answers and cumulative information revealed across all question/answer pairs.
2. If this is the 20th question/answer pair or the RATING is 5 or higher, you must answer "STOP,RATING" (do not include the word "RATING" just the numeric value).
3. For other RATING values answer ONLY with "Yes,RATING", "No,RATING" (do not include the word "RATING" just the numeric value).
4. Balance between showing value and protecting implementation details
5. You can initially return a welcome message to the Seeker`,
      },
      ...messages,
    ];
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use the appropriate model
      messages: request,
    });
    for (const { message } of completion.choices) {
      messages.push(message);
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
