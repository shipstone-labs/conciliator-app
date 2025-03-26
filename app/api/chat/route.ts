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

export async function POST(req: NextRequest) {
  try {
    const { messages, tokenId } = (await req.json()) as {
      messages: { question: string; answer: string }[];
      tokenId: number;
    };
    const hasQuestion =
      messages.at(-1)?.question && !messages.at(-1)?.answer
        ? messages.at(-1)
        : undefined;
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
has the following description: \`${index.description}\` with the following content:
\`\`\`
${content}
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
      ...(messages.flatMap(({ question, answer }) => {
        const result = [];
        if (question) {
          result.push({ role: "user", content: question });
        }
        if (answer) {
          result.push({ role: "assistant", content: answer });
        }
        return result;
      }) as { role: "user" | "assistant"; content: string }[]),
    ] as { role: "user" | "assistant" | "system"; content: string }[];
    const completion = await completionAI.chat.completions.create({
      model: getModel("COMPLETION"), // Use the appropriate model
      messages: request,
    });
    const items = [];
    if (hasQuestion) {
      for (const { message } of completion.choices) {
        items.push(message.content);
      }
      hasQuestion.answer = items.join("\n");
    }
    return new Response(
      JSON.stringify({
        messages,
        name: index.name,
        description: index.description,
        tokenId,
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
