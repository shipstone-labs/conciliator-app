import type { NextRequest } from "next/server";
import { completionAI, getModel } from "../utils";
// Dynamic import for the template file
import templateFile from "./system.hbs";
const templateText = templateFile.toString();

export const runtime = "nodejs";

// You'll set these in your .env.local file
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "localhost:*")
  .split(",")
  .map((origin) => new RegExp(origin.replace(/\*/g, ".*")));

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || req.headers.get("host") || "";
    const correctDomain = ALLOWED_ORIGINS.find((reg) => reg.test(origin));
    if (!correctDomain) {
      console.error("Invalid domain", origin);
      return new Response("Unauthorized", { status: 403 });
    }

    const { messages: _messages, title, description } = await req.json();

    const messages: {
      role: "assistant" | "user" | "system";
      content: string;
    }[] = _messages;

    if (
      messages.find(
        ({ role, content }) =>
          role === "assistant" && /^(None),\d*/i.test(content)
      )
    ) {
      return new Response(
        JSON.stringify({ success: false, error: "Completed" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const previous: {
      content: string;
      role: "assistant" | "user" | "system";
    }[] = [];
    for (const message of messages) {
      switch (message.role) {
        case "user":
          previous.push({ ...message, role: "assistant" });
          break;
        case "assistant":
          previous.push({
            ...message,
            content: message.content.replace(/^(Yes|No|Stop)/i, "$1"),
            role: "user",
          });
          if (previous.at(-1)?.content === "Stop") {
            return new Response(
              JSON.stringify({ success: false, error: "Completed" }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
          break;
      }
    }
    const _data: Record<string, string> = {
      title,
      description,
    };
    const _content = templateText.replace(
      /\{\{([^}]*)\}\}/g,
      (_match, name) => {
        return _data[name.trim()] || "";
      }
    );
    const completion = await completionAI.chat.completions.create({
      model: getModel("COMPLETION"), // Use the appropriate model
      messages: [
        {
          role: "system",
          content: _content,
        },
      ].concat(previous) as unknown as {
        role: "user" | "assistant" | "system";
        content: string;
      }[],
    });
    const choices = completion.choices as {
      message: { role: string; content: string };
    }[];
    const content = choices
      .flatMap(({ message: { content = "" } = { content: "" } }) =>
        content.split("\n")
      )
      .join("\n");
    console.log("seeker", content);
    messages.push({ content, role: "user" });
    return new Response(JSON.stringify({ success: true, messages }), {
      headers: { "Content-Type": "application/json" },
    });
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
