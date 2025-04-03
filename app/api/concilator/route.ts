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
import templateText from "./system.hbs?raw";

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
        content?: string | null;
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

    const _data: Record<string, string> = {
      title: index.name,
      description: index.description,
      content: degraded ? degrade(content) : content,
    };
    const _content = templateText.replace(
      /\{\{([^}]*)\}\}/g,
      (_match, name) => {
        return _data[name.trim()] || "";
      }
    );
    const request = [
      {
        role: "system",
        content: _content,
      },
    ] as { role: "user" | "assistant" | "system"; content?: string }[];
    for (const message of messages) {
      if (message.role === "assistant") {
        request.push({
          ...message,
          content: message.content?.replace(/^(Yes|No|Stop)/i, "$1") || "",
        });
        if (request.at(-1)?.content === "Stop") {
          return new Response(
            JSON.stringify({ success: false, error: "Completed" }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } else {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        request.push(message as any);
      }
    }
    const completion = await completionAI.chat.completions.create({
      model: getModel("COMPLETION"), // Use the appropriate model
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      messages: request as any,
    });
    const answerContent = completion.choices
      .flatMap(
        ({ message: { content = "" } = { content: "" } }) =>
          content?.split("\n") || ""
      )
      .join("\n");
    console.log("conciliator", answerContent);
    messages.push({ content: answerContent, role: "assistant" });
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
