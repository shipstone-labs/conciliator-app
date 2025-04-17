const { task, types } = require("hardhat/config");
const { Wallet } = require('ethers');

task("deploy", "Compiles and deploys a contract")
  .addParam("contract", "The contract name to deploy", undefined, types.string)
  .addOptionalParam("admin", "Admin address (defaults to deployer)", "", types.string)
  .addOptionalParam("pauser", "Pauser address (defaults to deployer)", "", types.string)
  .addOptionalParam("minter", "Minter address (defaults to deployer)", "", types.string)
  .setAction(async (taskArgs, hre) => {
    // Run compilation first
    console.log("Compiling contracts...");
    await hre.run("compile");
    console.log("Compilation complete");
    
    // Then deploy
    await deployContract(taskArgs, hre);
  });

async function deployContract(taskArgs, hre) {
  try {
    // Get the contract name from args
    const contractName = taskArgs.contract;
    console.log(`Deploying contract: ${contractName}`);
    
    // Get the deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deploying from address: ${deployer.address}`);
    
    // Set up role addresses (use deployer as default if not specified)
    const adminAddress = taskArgs.admin || deployer.address;
    const pauserAddress = taskArgs.pauser || deployer.address;
    const minterAddress = taskArgs.minter || deployer.address;
    
    console.log(`Admin address: ${adminAddress}`);
    console.log(`Pauser address: ${pauserAddress}`);
    console.log(`Minter address: ${minterAddress}`);
    
    // Get contract factory and deploy
    const ContractFactory = await hre.ethers.getContractFactory(contractName);
    const contract = await ContractFactory.deploy(adminAddress, pauserAddress, minterAddress);
    
    await contract.deployed();
    console.log(`${contractName} deployed to: ${contract.address}`);
    
    return contract.address;
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

// For backward compatibility
async function main() {
  const defaultContract = "IPDocV8";
  console.log(`Using default contract: ${defaultContract}`);
  
  const wallet = new Wallet(process.env.PRIVATE_KEY);
  console.log(`Deployer address: ${wallet.address}`);
  
  await deployContract({ 
    contract: defaultContract,
    admin: wallet.address,
    pauser: wallet.address,
    minter: wallet.address
  }, require("hardhat"));
}

// Export the main function for backward compatibility
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

// Add a deploy-and-verify task
task("deploy-and-verify", "Compiles, deploys, and verifies a contract")
  .addParam("contract", "The contract name to deploy and verify", undefined, types.string)
  .addOptionalParam("admin", "Admin address (defaults to deployer)", "", types.string)
  .addOptionalParam("pauser", "Pauser address (defaults to deployer)", "", types.string)
  .addOptionalParam("minter", "Minter address (defaults to deployer)", "", types.string)
  .addOptionalParam("compiler", "Compiler version", "v0.8.20+commit.a1b79de6", types.string)
  .addOptionalParam("optimize", "Whether optimization was used", false, types.boolean)
  .addOptionalParam("runs", "Optimization runs", 200, types.int)
  .setAction(async (taskArgs, hre) => {
    try {
      // First compile
      console.log("Compiling contracts...");
      await hre.run("compile");
      console.log("Compilation complete");
      
      // Then deploy
      console.log("Deploying contract...");
      const deployedAddress = await deployContract(taskArgs, hre);
      console.log(`Contract deployed at: ${deployedAddress}`);
      
      // Wait for a few seconds to make sure the contract is available for verification
      console.log("Waiting 5 seconds before verification...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Then verify
      console.log("Verifying contract...");
      await hre.run("verify-contract", {
        contract: taskArgs.contract,
        address: deployedAddress,
        compiler: taskArgs.compiler,
        optimize: taskArgs.optimize,
        runs: taskArgs.runs
      });
      
      console.log("Deployment and verification complete!");
      return deployedAddress;
    } catch (error) {
      console.error("Deploy and verify failed:", error);
      throw error;
    }
  });

module.exports = {};
