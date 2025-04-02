import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function makeOpenAIRequest(
  messages: Array<{
    role: string;
    content: string;
  }>
) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error(
          "Invalid API key. Please check your key and try again."
        );
      }
      if (response.status === 429) {
        throw new Error(
          "Rate limit exceeded. Please wait a moment and try again."
        );
      }
      if (response.status === 500) {
        throw new Error("OpenAI service error. Please try again later.");
      }
      throw new Error(
        errorData.error?.message ||
          `API error (${response.status}): ${response.statusText}`
      );
    }

    return await response.json();
  } catch (err) {
    if (
      (err as { name: string }).name === "TypeError" &&
      (err as { message: string }).message === "Failed to fetch"
    ) {
      throw new Error(
        "Network error: Unable to reach OpenAI API. Please check your internet connection and try again."
      );
    }
    throw err;
  }
}
