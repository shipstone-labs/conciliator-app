export default async function DemoPage() {
  const { createLitClient, LitNetworks } = await import("lit-wrapper");
  const { createW3Client } = await import("web-storage-wrapper");
  // Example of using both wrapper modules together
  let litStatus = "Not initialized";
  let w3Status = "Not initialized";

  try {
    // Initialize Lit client
    const litClient = await createLitClient({
      litNetwork: LitNetworks.Datil,
    });
    litClient.connect();
    litStatus = "Connected successfully";
    console.log("Lit client initialized successfully");
  } catch (error) {
    litStatus = "Connection failed";
    console.error("Failed to initialize Lit client:", error);
  }

  try {
    // Initialize Web3.Storage client
    const w3Client = await createW3Client();
    w3Status = "Created successfully";
    w3Client.login("andy@richtera.org");
    console.log("Web3.Storage client created successfully");
  } catch (error) {
    w3Status = "Creation failed";
    console.error("Failed to create Web3.Storage client:", error);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-2xl font-bold mb-4">Isolated Modules Demo</h1>

        <div className="bg-slate-100 p-6 rounded-lg shadow-sm mb-4">
          <h2 className="text-xl font-semibold mb-2">Lit Protocol</h2>
          <p className="mb-2">
            Status:{" "}
            <span
              className={
                litStatus.includes("failed") ? "text-red-500" : "text-green-500"
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
      </div>
    </main>
  );
}
