const fs = require('fs');
const path = require('path');
const { resolve, dirname } = path;
const { task, types } = require("hardhat/config");
const fetch = require('node-fetch'); // Make sure to install: npm install node-fetch@2

task("verify-contract", "Compiles and verifies a contract on Filfox explorer")
  .addParam("contract", "The contract name to verify", undefined, types.string)
  .addParam("address", "The deployed contract address", undefined, types.string)
  .addOptionalParam("compiler", "Compiler version", "v0.8.20+commit.a1b79de6", types.string)
  .addOptionalParam("optimize", "Whether optimization was used", false, types.boolean)
  .addOptionalParam("runs", "Optimization runs", 200, types.int)
  .setAction(async (taskArgs, hre) => {
    // Run compilation first to ensure build artifacts are up-to-date
    console.log("Compiling contracts...");
    await hre.run("compile");
    console.log("Compilation complete");
    
    // Then verify
    await verifyContract(taskArgs, hre);
  });

async function resolveSolidityImports(entryFilePath) {
  const sourceFiles = {}

  async function resolveFile(
    filePath,
    basePath = '.',
    originalImportPath = null
  ) {
    let fullPath

    // Check if the file is in node_modules or a relative path
    try {
      if (filePath.startsWith('.')) {
        // Relative path
        fullPath = path.resolve(basePath, filePath)
      } else {
        // Use require.resolve for node_modules imports
        const resolvedURL = require.resolve(filePath, basePath)
        // Convert the resolved URL to a file path
        fullPath = fileURLToPath(resolvedURL)
      }
    } catch (err) {
      console.error(err)
      throw new Error(`Failed to resolve import: ${filePath} from ${basePath}`)
    }

    // Use the original import path for node_modules files, or the resolved path for relative imports
    const key = originalImportPath || filePath

    if (sourceFiles[key]) {
      // Skip if already resolved
      return
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`)
    }

    const content = fs.readFileSync(fullPath, 'utf8')
    sourceFiles[key] = {
      content,
    }

    // Extract import statements
    const importRegex = /import.*?["'](.+?)["'];/g
    while (true) {
      const match = importRegex.exec(content)
      if (match === null) {
        break
      }
      let importedPath = match[1]
      if (importedPath.startsWith('.') && fullPath.includes('node_modules')) {
        importedPath = resolve(dirname(fullPath), importedPath).replace(
          /.*node_modules\//,
          ''
        )
      }
      // If it's a node_modules import, preserve the original import path
      const isNodeModule = !importedPath.startsWith('.')
      const preservedImportPath = isNodeModule ? importedPath : null

      // Recursively resolve the imported file
      await resolveFile(
        importedPath,
        path.dirname(fullPath),
        preservedImportPath
      )
    }
  }

  // Start resolving from the entry file
  await resolveFile(entryFilePath)

  return { sourceFiles }
}

async function verifyContract(taskArgs, hre) {
  try {
    const contractName = taskArgs.contract;
    const contractAddress = taskArgs.address;
    const entryFilePath = `./contracts/${contractName}.sol`;
    
    console.log(`Verifying contract: ${contractName} at address: ${contractAddress}`);
    
    // Find build-info files that contain our contract
    const buildInfoDir = path.resolve('./artifacts/build-info');
    const allBuildInfoFiles = fs.readdirSync(buildInfoDir)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(buildInfoDir, file),
        mtime: fs.statSync(path.join(buildInfoDir, file)).mtime.getTime()
      }));
    
    if (allBuildInfoFiles.length === 0) {
      throw new Error('No build-info files found. Make sure you have compiled your contracts.');
    }
    
    // Filter build-info files to those containing our contract
    console.log(`Looking for build info containing contract: ${contractName}`);
    const matchingBuildInfoFiles = [];
    
    for (const file of allBuildInfoFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(file.path, 'utf8'));
        const contractPath = `contracts/${contractName}.sol`;
        
        // Check if this build-info file contains our contract
        let contractExists = false;
        
        // Check in output.contracts
        if (data.output && data.output.contracts) {
          contractExists = Object.keys(data.output.contracts).some(path => 
            path.includes(contractName + '.sol') || path.endsWith(contractPath)
          );
        }
        
        // Also check in input.sources as a fallback
        if (!contractExists && data.input && data.input.sources) {
          contractExists = Object.keys(data.input.sources).some(path => 
            path.includes(contractName + '.sol') || path.endsWith(contractPath)
          );
        }
        
        if (contractExists) {
          matchingBuildInfoFiles.push(file);
          console.log(`Found match in: ${file.name}`);
        }
      } catch (err) {
        console.warn(`Couldn't parse ${file.name}: ${err.message}`);
      }
    }
    
    if (matchingBuildInfoFiles.length === 0) {
      throw new Error(`No build-info files found containing contract ${contractName}. Make sure you have compiled the contract.`);
    }
    
    // Sort by modification time and get the newest
    matchingBuildInfoFiles.sort((a, b) => b.mtime - a.mtime);
    const latestBuildInfo = matchingBuildInfoFiles[0].path;
    console.log(`Using build-info file: ${latestBuildInfo} (${new Date(matchingBuildInfoFiles[0].mtime).toLocaleString()})`);
    
    const data = JSON.parse(
      fs.readFileSync(latestBuildInfo, 'utf8')
    );
    
    // Clean up source file paths
    for (const [key, value] of Object.entries(data.input.sources)) {
      const [_, name] = /contracts\/([^/]*?.sol)/.exec(key) || [];
      if (name) {
        data.input.sources[name] = value;
        delete data.input.sources[key];
      }
    }
    
    const body = JSON.stringify(
      {
        address: contractAddress,
        language: 'Solidity',
        compiler: taskArgs.compiler,
        optimize: taskArgs.optimize,
        optimizeRuns: taskArgs.runs,
        optimizerDetails: '',
        license: 'MIT',
        evmVersion: 'paris',
        viaIR: false,
        libraries: '',
        metadata: '',
        sourceFiles: data.input.sources,
      },
      null,
      2
    );
    
    console.log('Submitting verification request...');
    const results = await fetch(
      'https://calibration.filfox.info/api/v1/tools/verifyContract',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      }
    ).then((res) => res.json());
    
    console.log('Verification result:', results);
    return results;
  } catch (err) {
    console.error('Verification failed:', err.message);
    throw err;
  }
}

// Export the module
module.exports = {};
