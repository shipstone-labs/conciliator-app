import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as Client from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import * as Proof from "@web3-storage/w3up-client/proof";
import { Signer } from "@web3-storage/w3up-client/principal/ed25519";

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

export async function getStorachaClient() {
  // Load client with specific private key
  const principal = Signer.parse(process.env.STORACHA_KEY || "");
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });
  // Add proof that this agent has been delegated capabilities on the space
  const proof = await Proof.parse(process.env.STORACHA_PROOF || "");
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());
  // READY to go!
  return client;
}
