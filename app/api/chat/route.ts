import type { NextRequest } from "next/server";

// You'll set these in your .env.local file
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_ORGANIZATION_ID = process.env.OPENAI_ORGANIZATION_ID || "";
const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID || "";
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

    const body = await req.json();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Organization": OPENAI_ORGANIZATION_ID,
        "X-Project-ID": OPENAI_PROJECT_ID,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return new Response(JSON.stringify(error), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
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
