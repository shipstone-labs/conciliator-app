"use client";

import Authenticated from "@/components/Authenticated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LitClient } from "lit-wrapper";
import { useState, useEffect } from "react";
import type { Web3StorageClient } from "web-storage-wrapper";

export default function DemoPage() {
  const [litStatus, setLitStatus] = useState("Not initialized");
  const [w3Status, setW3Status] = useState("Not initialized");
  const [w3Client, setW3Client] = useState<Web3StorageClient | undefined>();
  const [litClient, setLitClient] = useState<LitClient | undefined>();
  const [email, setEmail] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  useEffect(() => {
    // Import and initialize modules on the client side
    async function initModules() {
      try {
        console.log("Importing lit-wrapper...");
        const litModule = await import("lit-wrapper");
        console.log("Lit wrapper imported successfully");
        setLitStatus("Import successful");

        try {
          // Try initializing the client
          const litClient = await litModule.createLitClient({
            litNetwork: litModule.LitNetworks.Datil,
          });
          await litClient.connect();
          setLitClient(litClient);
          setLitStatus("Client created and connected successfully");
        } catch (initError) {
          console.error("Error initializing Lit client:", initError);
          setLitStatus(
            `Client initialization failed: ${
              (initError as { message: string }).message
            }`
          );
        }
      } catch (error) {
        console.error("Failed to import Lit module:", error);
        setLitStatus(
          `Import failed: ${(error as { message: string }).message}`
        );
      }

      try {
        console.log("Importing web-storage-wrapper...");
        const w3Module = await import("web-storage-wrapper");
        console.log("Web3 Storage wrapper imported successfully");
        setW3Status("Import successful");

        try {
          // Try initializing the client
          const w3Client = await w3Module.createW3Client();
          console.log("default", w3Client.agent.did());
          // await w3Client.login("andy@richtera.org");
          console.log(w3Client);
          setW3Client(w3Client);
          setW3Status("Client created successfully");
        } catch (initError) {
          console.error("Error initializing Web3 Storage client:", initError);
          setW3Status(
            `Client initialization failed: ${
              (initError as { message: string }).message
            }`
          );
        }
      } catch (error) {
        console.error("Failed to import Web3.Storage module:", error);
        setW3Status(`Import failed: ${(error as { message: string }).message}`);
      }
    }
    initModules();
  }, []);

  return (
    <Authenticated>
      <h1 className="text-2xl font-bold mb-4">Isolated Modules Demo</h1>

      <div className="bg-slate-100 p-6 rounded-lg shadow-sm mb-4">
        <h2 className="text-xl font-semibold mb-2">Lit Protocol</h2>

        <p className="mb-2">
          Status:{" "}
          <span
            className={
              !litClient || litStatus.includes("failed")
                ? "text-red-500"
                : "text-green-500"
            }
          >
            {litStatus}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          The Lit Protocol client is isolated in its own module to prevent
          dependency conflicts.
        </p>
      </div>

      <div className="bg-slate-100 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Web3.Storage</h2>
        <Input
          placeholder="someone@sample.com"
          value={email}
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={!w3Client}
        />
        <Button
          onClick={() => {
            console.log("Logging in with email:", email);
            setLoggingIn(true);
            w3Client
              ?.login(email)
              .then((value) => {
                console.log(value);
                setW3Status("Login successful");
              })
              .catch((e) => setW3Status(e.message))
              .finally(() => setLoggingIn(false));
          }}
          variant="ghost"
          disabled={!w3Client || loggingIn}
          size="sm"
          className="text-gray-500 hover:text-gray-700"
        >
          Login
        </Button>
        <p className="mb-2">
          Status:{" "}
          <span
            className={
              w3Status.includes("failed") ? "text-red-500" : "text-green-500"
            }
          >
            {w3Status}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          The Web3.Storage client is isolated in its own module to prevent
          dependency conflicts.
        </p>
      </div>
    </Authenticated>
  );
}
