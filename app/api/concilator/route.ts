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

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || "";
    const correctDomain = ALLOWED_ORIGINS.find((reg) => reg.test(origin));
    if (!correctDomain) {
      console.error("Invalid domain", origin);
      return new Response("Unauthorized", { status: 403 });
    }

    const { messages, tokenId } = await req.json();

    const wallet = createWalletClient({
      account: privateKeyToAccount(
        (process.env.FILCOIN_PK || "") as `0x${string}`
      ),
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
1. Answer ONLY with "Yes,RATING", "No,RATING", or "STOP,RATING" where RATING is a number from 0 to 10 measuring how much of the information was revealed inside of the question. A rating of 10 is all, 5 is too much (i.e. STOP,5 through STOP,10)
2. Consider both individual answers and cumulative information revealed
3. Balance between showing value and protecting implementation details
4. You can initially return a welcome message to the Seeker`,
      },
      ...messages,
    ];
    console.log({ content, index, request });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use the appropriate model
      messages: request,
    });
    console.log(JSON.stringify(completion, null, "  "));
    for (const { message } of completion.choices) {
      messages.push(message);
    }
    console.log(messages);
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
