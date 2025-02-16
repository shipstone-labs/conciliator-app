import fs from "node:fs";
import path, { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

async function resolveSolidityImports(entryFilePath) {
  const sourceFiles = {};

  async function resolveFile(
    filePath,
    basePath = ".",
    originalImportPath = null
  ) {
    let fullPath;

    // Check if the file is in node_modules or a relative path
    try {
      if (filePath.startsWith(".")) {
        // Relative path
        fullPath = path.resolve(basePath, filePath);
      } else {
        // Use require.resolve for node_modules imports
        const resolvedURL = import.meta.resolve(filePath, basePath);
        // Convert the resolved URL to a file path
        fullPath = fileURLToPath(resolvedURL);
      }
    } catch (err) {
      console.error(err);
      throw new Error(`Failed to resolve import: ${filePath} from ${basePath}`);
    }

    // Use the original import path for node_modules files, or the resolved path for relative imports
    const key = originalImportPath || filePath;

    if (sourceFiles[key]) {
      // Skip if already resolved
      return;
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, "utf8");
    sourceFiles[key] = {
      content,
    };

    // Extract import statements
    const importRegex = /import.*?["'](.+?)["'];/g;
    while (true) {
      const match = importRegex.exec(content);
      if (match === null) {
        break;
      }
      let importedPath = match[1];
      if (importedPath.startsWith(".") && fullPath.includes("node_modules")) {
        importedPath = resolve(dirname(fullPath), importedPath).replace(
          /.*node_modules\//,
          ""
        );
      }
      // If it's a node_modules import, preserve the original import path
      const isNodeModule = !importedPath.startsWith(".");
      const preservedImportPath = isNodeModule ? importedPath : null;

      // Recursively resolve the imported file
      await resolveFile(
        importedPath,
        path.dirname(fullPath),
        preservedImportPath
      );
    }
  }

  // Start resolving from the entry file
  await resolveFile(entryFilePath);

  return { sourceFiles };
}

// Example Usage
(async () => {
  try {
    const entryFilePath = "./contracts/erc721.sol"; // Replace with your entry Solidity file
    // const result = await resolveSolidityImports(entryFilePath);

    // Rename the entry file key to "MyContract.sol"
    // const entryFileName = path.basename(entryFilePath);
    // result.sourceFiles[entryFileName] = result.sourceFiles[entryFilePath];
    // delete result.sourceFiles[entryFilePath];
    const data = JSON.parse(
      fs.readFileSync(
        "artifacts/build-info/a3d563c0f4e7056c14c0e46ce5d80146.json",
        "utf8"
      )
    );
    const body = JSON.stringify(
      {
        address: "0x262B5cb19B39a813C3E4366BC9d92573128139ba",
        language: "Solidity",
        compiler: "v0.8.20+commit.a1b79de6",
        optimize: false,
        optimizeRuns: 200,
        optimizerDetails: "",
        license: "MIT",
        evmVersion: "paris",
        viaIR: false,
        libraries: "",
        metadata: "",
        sourceFiles: data.input.sources,
      },
      null,
      2
    );
    console.log(body);
    const results = await fetch(
      "https://calibration.filfox.info//api/v1/tools/verifyContract",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }
    ).then((res) => res.json());
    console.log(results);
  } catch (err) {
    console.error(err.message);
  }
})();
