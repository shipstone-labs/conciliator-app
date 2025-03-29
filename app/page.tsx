"use client";

// import { createLitClient, LitNetworks } from "lit-wrapper";
import HomeApp from "@/components/home-app";

export default async function Home() {
  // Example of using the lit-wrapper
  // try {
  //   // Initialize the Lit client - this won't conflict with web3-storage
  //   const litClient = await createLitClient({
  //     litNetwork: LitNetworks.Datil,
  //   });
  //   console.log("Lit client connected successfully");
  // } catch (error) {
  //   console.error("Failed to initialize Lit client:", error);
  // }

  return (
    <main>
      <HomeApp />
    </main>
  );
}
