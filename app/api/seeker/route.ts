import type { NextRequest } from "next/server";
import { completionAI, getModel } from "../utils";
import templateText from "./system.hbs?raw";

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
      console.error("Invalid domain", origin);
      return new Response("Unauthorized", { status: 403 });
    }

    const { messages: _messages, title, description } = await req.json();

    const messages: { role: string; content: string }[] = _messages;

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
    const previous: { question: string; answer: string }[] = [];
    let item = { question: "", answer: "" };
    for (const message of messages) {
      switch (message.role) {
        case "user":
          item.question = message.content;
          break;
        case "assistant":
          item.answer = message.content.replace(
            /^Question #\d*: (Yes|No|Stop)/i,
            "$1"
          );
          previous.push(item);
          item = { question: "", answer: "" };
          break;
      }
    }
    const _data: Record<string, string> = {
      title,
      description,
      messages: previous
        .map(({ question, answer }) => {
          return `<question>${question}</question><answer>${answer}</answer>`;
        })
        .join(""),
    };
    const _content = templateText.replace(
      /\{\{([^}]*)\}\}/g,
      (_match, name) => {
        return _data[name.trim()] || "";
      }
    );
    console.log("System content", _content, _data);
    const completion = await completionAI.chat.completions.create({
      model: getModel("COMPLETION"), // Use the appropriate model
      messages: [
        {
          role: "system",
          content: _content,
        },
      ],
    });
    const choices = completion.choices as {
      message: { role: string; content: string };
    }[];
    const content = choices
      .flatMap(({ message: { content = "" } = { content: "" } }) =>
        content.split("\n")
      )
      .join("\n");
    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: "No question generated" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    messages.push({ content, role: "user" });
    return new Response(JSON.stringify({ success: true, messages }), {
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
