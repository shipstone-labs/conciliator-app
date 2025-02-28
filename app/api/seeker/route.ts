import type { NextRequest } from "next/server";
import { openai } from "../utils";

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

    const { messages: _messages } = await req.json();

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
          item.answer = message.content.replace(/^(Yes|No|None),\s*\d*/i, "$1");
          previous.push(item);
          item = { question: "", answer: "" };
          break;
      }
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use the appropriate model
      messages: [
        {
          role: "system",
          content: `You are the Seeker in an invention value discovery session. You represent potential users/buyers of innovations, seeking to understand their value and applicability.
  Context:
  - The Matcher requires yes/no questions to control information flow
  - Your goal is to understand the innovation's value and applicability
  - Craft questions strategically to build understanding within the yes/no format
  - When you receive the Y/N answer, ask the next one. Every three questions, use the answers to make a detailed guess what the IP could be.

  Previous exchanges: \`${JSON.stringify(previous)}\`,

  
`,
        },
      ],
    });
    const choices = completion.choices as {
      message: { role: string; content: string };
    }[];
    const [_question, ...rest] =
      choices[0].message.content
        .split("\n")
        .map((item) => item.replace(/^-\s*/, "")) || [];
    while (rest.length) {
      if (rest[0].trim() === "") {
        rest.shift();
      } else {
        break;
      }
    }
    if (!_question) {
      return new Response(
        JSON.stringify({ success: false, error: "No question generated" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    messages.push({ ...choices[0].message, content: _question, role: "user" });
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
